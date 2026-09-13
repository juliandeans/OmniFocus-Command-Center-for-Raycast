export type OmniFocusErrorCode =
  | "omnifocus_not_installed"
  | "automation_permission_denied"
  | "automation_unavailable"
  | "capability_probe_inconclusive"
  | "planned_date_unsupported"
  | "task_not_found"
  | "project_not_found"
  | "tag_not_found"
  | "folder_not_found"
  | "perspective_not_found"
  | "invalid_input"
  | "timeout"
  | "unknown";

export class OmniFocusNormalizedError extends Error {
  readonly code: OmniFocusErrorCode;
  readonly userMessage: string;
  readonly technicalDetail?: string;

  constructor(code: OmniFocusErrorCode, userMessage: string, technicalDetail?: string) {
    super(userMessage);
    this.name = "OmniFocusNormalizedError";
    this.code = code;
    this.userMessage = userMessage;
    this.technicalDetail = technicalDetail;
  }
}

const ERROR_MESSAGES: Record<OmniFocusErrorCode, string> = {
  omnifocus_not_installed:
    "OmniFocus is not installed on this Mac. Please install OmniFocus 4 to use this extension.",
  automation_permission_denied:
    "Raycast does not have permission to automate OmniFocus. Please grant Automation permission in System Settings → Privacy & Security → Automation.",
  automation_unavailable: "Omni Automation is not available. OmniFocus Pro is required for this feature.",
  capability_probe_inconclusive:
    "The OmniFocus database appears to be empty, so Planned Date support cannot be verified yet. Due and Defer dates remain fully functional.",
  planned_date_unsupported: "Requires OmniFocus 4.7+ with a database migrated for Planned Dates.",
  task_not_found: "The selected task was not found in OmniFocus. It may have been deleted or moved.",
  project_not_found: "The selected project was not found in OmniFocus. It may have been deleted or moved.",
  tag_not_found: "The selected tag was not found in OmniFocus.",
  folder_not_found: "The selected folder was not found in OmniFocus.",
  perspective_not_found: "The selected perspective was not found in OmniFocus.",
  invalid_input: "Invalid input provided.",
  timeout:
    "The operation timed out while communicating with OmniFocus. OmniFocus may be busy or unresponsive.",
  unknown: "An unexpected error occurred while communicating with OmniFocus.",
};

/**
 * Thrown by the Planned Date capability probe when support cannot be verified
 * (e.g. an empty database offers no sample task to test against). Never
 * treated as "supported" and never cached.
 */
export function capabilityProbeInconclusiveError(): OmniFocusNormalizedError {
  return new OmniFocusNormalizedError(
    "capability_probe_inconclusive",
    ERROR_MESSAGES.capability_probe_inconclusive,
  );
}

/**
 * Sanitizes technical error details to ensure no JXA script fragments,
 * user-entered strings, or excessively long payloads leak into logs or UI.
 */
export function sanitizeTechnicalDetail(raw: string): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;

  // Remove script closures and evaluateJavascript payloads
  let sanitized = raw
    .replace(/\(function\(\)\s*\{[\s\S]*?\}\)\(\)/g, "[script]")
    .replace(/evaluateJavascript\([\s\S]*?\)/g, "evaluateJavascript([script])")
    .replace(/execution error:\s*/gi, "")
    .trim();

  // Strip obvious stack traces or internal line dumps
  sanitized = sanitized.split("\n")[0].trim();

  // Truncate to a safe maximum length
  if (sanitized.length > 120) {
    sanitized = sanitized.slice(0, 117) + "…";
  }

  return sanitized.length > 0 ? sanitized : undefined;
}

export function normalizeOmniFocusError(error: unknown): OmniFocusNormalizedError {
  if (error instanceof OmniFocusNormalizedError) {
    return error;
  }

  const rawMessage = error instanceof Error ? error.message : String(error ?? "");
  const technicalDetail = sanitizeTechnicalDetail(rawMessage);

  // 1. OmniFocus not installed
  if (
    rawMessage.includes("OmniFocus is not installed") ||
    rawMessage.includes("omnifocus_not_installed") ||
    rawMessage.includes("Application can't be found") ||
    rawMessage.includes("-43")
  ) {
    return new OmniFocusNormalizedError(
      "omnifocus_not_installed",
      ERROR_MESSAGES.omnifocus_not_installed,
      technicalDetail,
    );
  }

  // 2. macOS Automation permission denied
  if (
    rawMessage.includes("-1743") ||
    rawMessage.includes("Not authorized to send Apple events") ||
    rawMessage.includes("errAEEventNotPermitted") ||
    rawMessage.includes("automation_permission_denied") ||
    rawMessage.includes("not authorized")
  ) {
    return new OmniFocusNormalizedError(
      "automation_permission_denied",
      ERROR_MESSAGES.automation_permission_denied,
      technicalDetail,
    );
  }

  // 3. Timeout
  if (rawMessage.includes("-1712") || rawMessage.includes("timed out") || rawMessage.includes("timeout")) {
    return new OmniFocusNormalizedError("timeout", ERROR_MESSAGES.timeout, technicalDetail);
  }

  // 4. Planned dates unsupported
  if (
    rawMessage.includes("planned_date_unsupported") ||
    (rawMessage.includes("plannedDate") &&
      (rawMessage.includes("database") ||
        rawMessage.includes("migrate") ||
        rawMessage.includes("undefined") ||
        rawMessage.includes("unsupported") ||
        rawMessage.includes("not supported")))
  ) {
    return new OmniFocusNormalizedError(
      "planned_date_unsupported",
      ERROR_MESSAGES.planned_date_unsupported,
      technicalDetail,
    );
  }

  // 5. Automation / Pro unavailable
  const lowerMessage = rawMessage.toLowerCase();
  const reportsUnhandledEvaluateJavascript =
    (lowerMessage.includes("doesn't understand") ||
      lowerMessage.includes("doesn’t understand") ||
      lowerMessage.includes("message not understood")) &&
    lowerMessage.includes("evaluatejavascript");
  if (
    rawMessage.includes("automation_unavailable") ||
    rawMessage.includes("evaluateJavascript is not a function") ||
    rawMessage.includes("evaluateJavascript is undefined") ||
    rawMessage.includes("Omni Automation is not available") ||
    rawMessage.includes("OmniFocus Pro") ||
    // OmniFocus without Pro lacks the evaluateJavascript Apple event; JXA then
    // reports that the application "doesn't understand" that message. This is
    // only reached after the permission-denied check above, so a denied
    // automation permission can never be misclassified as "Pro required".
    reportsUnhandledEvaluateJavascript
  ) {
    return new OmniFocusNormalizedError(
      "automation_unavailable",
      ERROR_MESSAGES.automation_unavailable,
      technicalDetail,
    );
  }

  // 6. Object not found patterns (thrown by mutations / queries)
  if (rawMessage.includes("task_not_found") || rawMessage.includes("parent_task_not_found")) {
    return new OmniFocusNormalizedError("task_not_found", ERROR_MESSAGES.task_not_found, technicalDetail);
  }

  if (rawMessage.includes("project_not_found")) {
    return new OmniFocusNormalizedError(
      "project_not_found",
      ERROR_MESSAGES.project_not_found,
      technicalDetail,
    );
  }

  if (rawMessage.includes("tag_not_found")) {
    return new OmniFocusNormalizedError("tag_not_found", ERROR_MESSAGES.tag_not_found, technicalDetail);
  }

  if (rawMessage.includes("folder_not_found")) {
    return new OmniFocusNormalizedError("folder_not_found", ERROR_MESSAGES.folder_not_found, technicalDetail);
  }

  if (rawMessage.includes("perspective_not_found")) {
    return new OmniFocusNormalizedError(
      "perspective_not_found",
      ERROR_MESSAGES.perspective_not_found,
      technicalDetail,
    );
  }

  // 7. Invalid input
  if (rawMessage.includes("invalid_input")) {
    return new OmniFocusNormalizedError("invalid_input", ERROR_MESSAGES.invalid_input, technicalDetail);
  }

  // Fallback: unknown error
  return new OmniFocusNormalizedError("unknown", ERROR_MESSAGES.unknown, technicalDetail);
}
