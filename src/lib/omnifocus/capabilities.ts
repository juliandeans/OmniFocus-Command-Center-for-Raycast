import { capabilityProbeInconclusiveError } from "./errors";
import { executeOmniAutomation } from "./gateway";

/**
 * Probe outcomes:
 * - "supported"     → OmniFocus exposes plannedDate, a sample task exists, and
 *                     reading it succeeds (database migrated).
 * - "unsupported"   → plannedDate is not exposed, or reading it fails
 *                     (database not migrated to the 4.7+ schema).
 * - "inconclusive"  → plannedDate exists but there is no sample task to test
 *                     against (empty database). Never treated as supported.
 */
const PROBE_SCRIPT = `
  try {
    if (typeof Task === "undefined") return "unsupported";
    if (!("plannedDate" in Task.prototype)) return "unsupported";
    const sample = flattenedTasks[0] || (inbox.length > 0 ? inbox[0] : null);
    if (!sample) return "inconclusive";
    sample.plannedDate;
    return "supported";
  } catch (_) {
    return "unsupported";
  }
`;

/**
 * Cache holds only successfully determined results:
 * - resolved `true`  → verified supported (cached for process lifetime)
 * - resolved `false` → definitively unsupported (cached for process lifetime)
 * An inconclusive probe (empty database) or a failed probe (permissions,
 * timeouts, communication errors) is never cached — the next call probes
 * again.
 */
let cachedCapability: Promise<boolean> | null = null;

async function probePlannedDateSupport(): Promise<boolean> {
  const result = await executeOmniAutomation<string>(PROBE_SCRIPT);
  if (result === "supported") return true;
  if (result === "unsupported") return false;
  throw capabilityProbeInconclusiveError();
}

/**
 * Checks whether OmniFocus supports Planned Dates.
 * Returns true only if OmniFocus exposes plannedDate, a sample task proves
 * the current database was migrated to the 4.7+ schema, and reading it works.
 *
 * Throws when support cannot be verified: an empty database yields a
 * normalized `capability_probe_inconclusive` error, communication failures
 * surface their own normalized error. Neither is cached, so a later call
 * retries instead of the result sticking until the extension process ends.
 */
export function getPlannedDateCapability(): Promise<boolean> {
  if (cachedCapability) {
    return cachedCapability;
  }

  const attempt = probePlannedDateSupport();
  cachedCapability = attempt;
  // Evict failed/inconclusive probes so the next call retries instead of the
  // outcome being cached for the process lifetime. The rejection still
  // propagates to the original caller.
  attempt.catch(() => {
    if (cachedCapability === attempt) {
      cachedCapability = null;
    }
  });
  return attempt;
}

/**
 * Reset capability cache (used primarily for testing).
 */
export function resetCapabilityCache(): void {
  cachedCapability = null;
}
