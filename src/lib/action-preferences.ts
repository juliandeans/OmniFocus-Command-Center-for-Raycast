import { Keyboard, getPreferenceValues } from "@raycast/api";

export type TaskPrimaryAction = "open" | "details" | "edit" | "complete";
export type TaskSecondaryAction = "open" | "details";

export type ProjectPrimaryAction = "open" | "showTasks" | "edit";
export type ProjectSecondaryAction = "open" | "showTasks";

export type ActionShortcutStyle = "option" | "cmd_shift" | "ctrl_opt" | "off";

export type TaskDomainAction = "setDates" | "manageTags" | "moveTask" | "addSubtask" | "toggleFlag";
export type ProjectDomainAction = "setDates" | "manageTags" | "moveFolder" | "toggleFlag";

export interface ResolvedTaskActionPreferences {
  primary: TaskPrimaryAction;
  secondary: TaskSecondaryAction;
  shortcutStyle: ActionShortcutStyle;
}

export interface ResolvedProjectActionPreferences {
  primary: ProjectPrimaryAction;
  secondary: ProjectSecondaryAction;
  shortcutStyle: ActionShortcutStyle;
}

/**
 * Normalizes a raw preference value into a valid TaskPrimaryAction.
 * Non-allowed or invalid values always fall back safely to "open".
 * "complete" is only allowed if allowComplete is explicitly true (e.g. Inbox).
 */
export function normalizeTaskPrimaryAction(value: unknown, allowComplete = false): TaskPrimaryAction {
  if (value === "details") return "details";
  if (value === "edit") return "edit";
  if (value === "complete" && allowComplete) return "complete";
  return "open";
}

/**
 * Derives the secondary task action based on the primary action contract:
 * - open -> details
 * - details -> open
 * - edit -> open
 * - complete -> details
 */
export function getTaskSecondaryAction(primary: TaskPrimaryAction): TaskSecondaryAction {
  switch (primary) {
    case "open":
      return "details";
    case "details":
    case "edit":
      return "open";
    case "complete":
      return "details";
    default:
      return "details";
  }
}

/**
 * Normalizes a raw preference value into a valid ProjectPrimaryAction.
 * Non-allowed or invalid values always fall back safely to "open".
 * Destructive/status operations (delete, drop, complete, onHold) are never allowed.
 */
export function normalizeProjectPrimaryAction(value: unknown): ProjectPrimaryAction {
  if (value === "showTasks") return "showTasks";
  if (value === "edit") return "edit";
  return "open";
}

/**
 * Derives the secondary project action based on the primary action contract:
 * - open -> showTasks
 * - showTasks -> open
 * - edit -> open
 */
export function getProjectSecondaryAction(primary: ProjectPrimaryAction): ProjectSecondaryAction {
  switch (primary) {
    case "open":
      return "showTasks";
    case "showTasks":
      return "open";
    case "edit":
      return "open";
    default:
      return "showTasks";
  }
}

/**
 * Normalizes the extension-wide Action Shortcut Style preference.
 * Defaults safely to "option".
 */
export function normalizeActionShortcutStyle(value: unknown): ActionShortcutStyle {
  if (value === "cmd_shift" || value === "ctrl_opt" || value === "off") {
    return value;
  }
  return "option";
}

/**
 * Generates the domain keyboard shortcut for a task action and style.
 * Returns undefined if the style is "off".
 */
export function getDomainShortcut(
  action: TaskDomainAction,
  style: ActionShortcutStyle = "option",
): Keyboard.Shortcut | undefined {
  if (style === "off") {
    return undefined;
  }

  const keyMap: Record<TaskDomainAction, Keyboard.KeyEquivalent> = {
    setDates: "d",
    manageTags: "t",
    moveTask: "m",
    addSubtask: "n",
    toggleFlag: "f",
  };

  const key = keyMap[action];
  if (!key) return undefined;

  let modifiers: Keyboard.KeyModifier[];
  switch (style) {
    case "cmd_shift":
      modifiers = ["cmd", "shift"];
      break;
    case "ctrl_opt":
      modifiers = ["ctrl", "opt"];
      break;
    case "option":
    default:
      modifiers = ["opt"];
      break;
  }

  return { modifiers, key };
}

/**
 * Generates the domain keyboard shortcut for a project action and style.
 * Shares the exact same Action Shortcut Style profile as task actions.
 * Returns undefined if the style is "off".
 */
export function getProjectDomainShortcut(
  action: ProjectDomainAction,
  style: ActionShortcutStyle = "option",
): Keyboard.Shortcut | undefined {
  if (style === "off") {
    return undefined;
  }

  const keyMap: Record<ProjectDomainAction, Keyboard.KeyEquivalent> = {
    setDates: "d",
    manageTags: "t",
    moveFolder: "m",
    toggleFlag: "f",
  };

  const key = keyMap[action];
  if (!key) return undefined;

  let modifiers: Keyboard.KeyModifier[];
  switch (style) {
    case "cmd_shift":
      modifiers = ["cmd", "shift"];
      break;
    case "ctrl_opt":
      modifiers = ["ctrl", "opt"];
      break;
    case "option":
    default:
      modifiers = ["opt"];
      break;
  }

  return { modifiers, key };
}

/**
 * Resolves current task action preferences with fallback safety.
 * Handles environments where getPreferenceValues() is not available or throws.
 */
export function resolveTaskActionPreferences(allowComplete = false): ResolvedTaskActionPreferences {
  try {
    const prefs = getPreferenceValues<Record<string, unknown>>();
    const primary = normalizeTaskPrimaryAction(prefs?.taskPrimaryAction, allowComplete);
    const secondary = getTaskSecondaryAction(primary);
    const shortcutStyle = normalizeActionShortcutStyle(prefs?.actionShortcutStyle);
    return { primary, secondary, shortcutStyle };
  } catch {
    return {
      primary: "open",
      secondary: "details",
      shortcutStyle: "option",
    };
  }
}

/**
 * Resolves current project action preferences with fallback safety.
 * Handles environments where getPreferenceValues() is not available or throws.
 */
export function resolveProjectActionPreferences(): ResolvedProjectActionPreferences {
  try {
    const prefs = getPreferenceValues<Record<string, unknown>>();
    const primary = normalizeProjectPrimaryAction(prefs?.projectPrimaryAction);
    const secondary = getProjectSecondaryAction(primary);
    const shortcutStyle = normalizeActionShortcutStyle(prefs?.actionShortcutStyle);
    return { primary, secondary, shortcutStyle };
  } catch {
    return {
      primary: "open",
      secondary: "showTasks",
      shortcutStyle: "option",
    };
  }
}
