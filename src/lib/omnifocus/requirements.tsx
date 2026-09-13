import { Action, ActionPanel, Icon, List, open } from "@raycast/api";
import { normalizeOmniFocusError } from "./errors";

/**
 * Unified EmptyView for displaying normalized OmniFocus errors across all commands.
 *
 * Every command's data fetch goes through the gateway, whose failures are
 * normalized into stable error codes before reaching this view. That single
 * path already distinguishes "not installed", "permission denied",
 * "Omni Automation / Pro unavailable", and timeouts — no separate requirement
 * probe is run alongside queries (a probe would only duplicate the same
 * failing call).
 */
export function OmniFocusEmptyView({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void | Promise<void>;
}) {
  const normalized = normalizeOmniFocusError(error);

  let title = "Could Not Connect to OmniFocus";
  let icon = Icon.Warning;

  switch (normalized.code) {
    case "omnifocus_not_installed":
      title = "OmniFocus Not Installed";
      icon = Icon.Download;
      break;
    case "automation_permission_denied":
      title = "Automation Permission Denied";
      icon = Icon.Lock;
      break;
    case "automation_unavailable":
      title = "OmniFocus Pro Required";
      icon = Icon.ExclamationMark;
      break;
    case "planned_date_unsupported":
      title = "Planned Dates Unsupported";
      icon = Icon.Calendar;
      break;
    case "timeout":
      title = "Request Timed Out";
      icon = Icon.Clock;
      break;
    case "task_not_found":
    case "project_not_found":
    case "tag_not_found":
    case "folder_not_found":
      title = "Item Not Found";
      icon = Icon.MagnifyingGlass;
      break;
  }

  return (
    <List.EmptyView
      title={title}
      description={normalized.userMessage}
      icon={icon}
      actions={
        <ActionPanel>
          {normalized.code === "automation_permission_denied" && (
            <Action
              title="Open macOS Automation Settings"
              icon={Icon.Gear}
              onAction={() =>
                open("x-apple.systempreferences:com.apple.preference.security?Privacy_Automation")
              }
            />
          )}
          {normalized.code === "omnifocus_not_installed" && (
            <Action.OpenInBrowser title="Download OmniFocus" url="https://www.omnigroup.com/omnifocus" />
          )}
          {onRetry && <Action title="Retry" icon={Icon.ArrowClockwise} onAction={onRetry} />}
        </ActionPanel>
      }
    />
  );
}
