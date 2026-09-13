import { describe, expect, it } from "vitest";
import {
  OmniFocusNormalizedError,
  normalizeOmniFocusError,
  sanitizeTechnicalDetail,
} from "../src/lib/omnifocus/errors";

describe("Suite E: Error Normalization", () => {
  it("normalizes macOS Automation permission denied errors", () => {
    const error1 = new Error(
      "execution error: Error: An error occurred. (-1743) Not authorized to send Apple events to OmniFocus.",
    );
    const normalized1 = normalizeOmniFocusError(error1);
    expect(normalized1.code).toBe("automation_permission_denied");
    expect(normalized1.userMessage).toContain("System Settings → Privacy & Security → Automation");

    const error2 = new Error("errAEEventNotPermitted: not authorized");
    expect(normalizeOmniFocusError(error2).code).toBe("automation_permission_denied");
  });

  it("normalizes task_not_found error", () => {
    const error = new Error("Error: task_not_found");
    const normalized = normalizeOmniFocusError(error);
    expect(normalized.code).toBe("task_not_found");
    expect(normalized.userMessage).toBe(
      "The selected task was not found in OmniFocus. It may have been deleted or moved.",
    );
  });

  it("normalizes project_not_found error", () => {
    const error = new Error("Error: project_not_found");
    const normalized = normalizeOmniFocusError(error);
    expect(normalized.code).toBe("project_not_found");
    expect(normalized.userMessage).toBe(
      "The selected project was not found in OmniFocus. It may have been deleted or moved.",
    );
  });

  it("normalizes tag_not_found, folder_not_found, and perspective_not_found", () => {
    expect(normalizeOmniFocusError(new Error("tag_not_found")).code).toBe("tag_not_found");
    expect(normalizeOmniFocusError(new Error("folder_not_found")).code).toBe("folder_not_found");
    expect(normalizeOmniFocusError(new Error("perspective_not_found")).code).toBe("perspective_not_found");
  });

  it("normalizes planned_date_unsupported error", () => {
    const error = new Error("Error: planned_date_unsupported");
    const normalized = normalizeOmniFocusError(error);
    expect(normalized.code).toBe("planned_date_unsupported");
    expect(normalized.userMessage).toBe(
      "Requires OmniFocus 4.7+ with a database migrated for Planned Dates.",
    );

    const errorFromDb = new Error("TypeError: cannot set plannedDate because database has not been migrated");
    expect(normalizeOmniFocusError(errorFromDb).code).toBe("planned_date_unsupported");
  });

  it("normalizes timeout errors", () => {
    const error1 = new Error("AppleScript execution timed out after 20000ms");
    const normalized1 = normalizeOmniFocusError(error1);
    expect(normalized1.code).toBe("timeout");
    expect(normalized1.userMessage).toContain("timed out");

    const error2 = new Error("execution error: Error: (-1712)");
    expect(normalizeOmniFocusError(error2).code).toBe("timeout");
  });

  it("normalizes omnifocus_not_installed error", () => {
    const error = new Error("Application can't be found: OmniFocus");
    const normalized = normalizeOmniFocusError(error);
    expect(normalized.code).toBe("omnifocus_not_installed");
    expect(normalized.userMessage).toContain("OmniFocus is not installed");
  });

  it("normalizes automation_unavailable (no Pro license)", () => {
    const error = new Error("TypeError: omnifocus.evaluateJavascript is not a function");
    const normalized = normalizeOmniFocusError(error);
    expect(normalized.code).toBe("automation_unavailable");
    expect(normalized.userMessage).toContain("OmniFocus Pro is required");
  });

  it("normalizes OmniFocus Standard JXA 'doesn't understand' errors as automation_unavailable", () => {
    const straightApostrophe = new Error(
      'execution error: OmniFocus got an error: OmniFocus doesn\'t understand the "evaluateJavascript" message. (-1708)',
    );
    expect(normalizeOmniFocusError(straightApostrophe).code).toBe("automation_unavailable");

    const typographicApostrophe = new Error(
      "execution error: OmniFocus got an error: OmniFocus doesn’t understand the “evaluateJavascript” message.",
    );
    expect(normalizeOmniFocusError(typographicApostrophe).code).toBe("automation_unavailable");
  });

  it("does not misclassify a denied automation permission as 'Pro required'", () => {
    const error = new Error(
      "execution error: Not authorized to send Apple events (-1743) while calling evaluateJavascript",
    );
    const normalized = normalizeOmniFocusError(error);
    expect(normalized.code).toBe("automation_permission_denied");
  });

  it("classifies a timed-out evaluateJavascript call as timeout, not as Pro-missing", () => {
    const error = new Error("AppleScript execution timed out while calling evaluateJavascript");
    expect(normalizeOmniFocusError(error).code).toBe("timeout");
  });

  it("strips script fragments and user payloads from UI userMessage and technicalDetail", () => {
    const userSecret = "Confidential Project Budget 2026";
    const rawJxaError = `execution error: Error in (function(){ const task = Task.byIdentifier("id123"); task.name = "${userSecret}"; return evaluateJavascript("code"); })(): Something crashed (-2700)`;

    const normalized = normalizeOmniFocusError(new Error(rawJxaError));

    // userMessage must be completely neutral and not contain user secret or script code
    expect(normalized.userMessage).not.toContain(userSecret);
    expect(normalized.userMessage).not.toContain("function()");
    expect(normalized.userMessage).not.toContain("evaluateJavascript");

    // technicalDetail must also sanitize out script closures and user data
    const sanitized = sanitizeTechnicalDetail(rawJxaError);
    expect(sanitized).not.toContain("function()");
    expect(sanitized).not.toContain("evaluateJavascript(");
    expect(sanitized).not.toContain(userSecret);
    if (normalized.technicalDetail) {
      expect(normalized.technicalDetail).not.toContain("function()");
      expect(normalized.technicalDetail).not.toContain("evaluateJavascript(");
    }
  });

  it("returns idempotent result if already an OmniFocusNormalizedError", () => {
    const initial = new OmniFocusNormalizedError("task_not_found", "Task missing");
    const normalized = normalizeOmniFocusError(initial);
    expect(normalized).toBe(initial);
  });
});
