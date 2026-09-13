import { getApplications } from "@raycast/api";
import { runAppleScript } from "@raycast/utils";
import { type OmniFocusErrorCode, OmniFocusNormalizedError, normalizeOmniFocusError } from "./errors";

export class OmniFocusError extends OmniFocusNormalizedError {
  constructor(message: string, code: OmniFocusErrorCode = "unknown", technicalDetail?: string) {
    super(code, message, technicalDetail);
    this.name = "OmniFocusError";
  }
}

export async function ensureOmniFocusInstalled(): Promise<void> {
  const applications = await getApplications();
  if (!applications.some((application) => application.name.toLowerCase() === "omnifocus")) {
    throw normalizeOmniFocusError(new Error("omnifocus_not_installed"));
  }
}

export async function executeJxa<T = unknown>(source: string): Promise<T> {
  await ensureOmniFocusInstalled();
  try {
    const raw = await runAppleScript<string>(`(function(){${source}})()`, {
      humanReadableOutput: false,
      language: "JavaScript",
      timeout: 20_000,
    });
    return JSON.parse(raw) as T;
  } catch (error) {
    throw normalizeOmniFocusError(error);
  }
}

export async function executeOmniAutomation<T = unknown>(source: string): Promise<T> {
  const inner = `JSON.stringify((function(){${source}})())`;
  const encoded = JSON.stringify(inner);
  try {
    const result = await executeJxa<string>(`
      const omnifocus = Application("OmniFocus");
      return omnifocus.evaluateJavascript(${encoded});
    `);
    return JSON.parse(result) as T;
  } catch (error) {
    throw normalizeOmniFocusError(error);
  }
}

export function j(value: unknown): string {
  return JSON.stringify(value);
}

export function iso(date?: Date | null): string | null {
  return date ? date.toISOString() : null;
}
