import { Form } from "@raycast/api";
import { normalizeOmniFocusError } from "../lib/omnifocus/errors";

/**
 * Renders the "Planned" field feedback for forms whenever Planned Date input
 * is not available:
 * - probe failed or was inconclusive (e.g. empty database, communication
 *   failure) → "Could not check Planned Date support" plus the normalized
 *   reason; forms should also offer a Retry action in this case.
 * - definitively unsupported → the 4.7+/migration requirement.
 * Renders nothing while checking or when support is confirmed.
 */
export function PlannedDateSupportNotice({
  supported,
  error,
}: {
  supported: boolean | undefined;
  error: Error | undefined;
}) {
  if (error) {
    const normalized = normalizeOmniFocusError(error);
    return (
      <Form.Description
        title="Planned"
        text={`Could not check Planned Date support: ${normalized.userMessage}`}
      />
    );
  }
  if (!supported) {
    return (
      <Form.Description
        title="Planned"
        text="Requires OmniFocus 4.7+ with a database migrated for Planned Dates."
      />
    );
  }
  return null;
}
