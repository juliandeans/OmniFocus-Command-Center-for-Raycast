import { describe, expect, it } from "vitest";
import {
  getDomainShortcut,
  getProjectDomainShortcut,
  getProjectSecondaryAction,
  getTaskSecondaryAction,
  normalizeActionShortcutStyle,
  normalizeProjectPrimaryAction,
  normalizeTaskPrimaryAction,
  resolveProjectActionPreferences,
  resolveTaskActionPreferences,
  type ProjectPrimaryAction,
  type TaskPrimaryAction,
} from "../src/lib/action-preferences";

describe("action-preferences", () => {
  describe("normalizeTaskPrimaryAction", () => {
    it("returns 'open' when preference is missing (undefined or null)", () => {
      expect(normalizeTaskPrimaryAction(undefined)).toBe("open");
      expect(normalizeTaskPrimaryAction(null)).toBe("open");
      expect(normalizeTaskPrimaryAction("")).toBe("open");
    });

    it("returns 'open' when preference is explicitly 'open'", () => {
      expect(normalizeTaskPrimaryAction("open")).toBe("open");
    });

    it("returns 'details' when preference is 'details'", () => {
      expect(normalizeTaskPrimaryAction("details")).toBe("details");
    });

    it("returns 'edit' when preference is 'edit'", () => {
      expect(normalizeTaskPrimaryAction("edit")).toBe("edit");
    });

    it("falls back safely to 'open' when preference is invalid or unknown", () => {
      expect(normalizeTaskPrimaryAction("random")).toBe("open");
      expect(normalizeTaskPrimaryAction(123)).toBe("open");
      expect(normalizeTaskPrimaryAction({})).toBe("open");
      expect(normalizeTaskPrimaryAction("delete")).toBe("open");
    });

    it("never allows 'delete' or destructive actions as primary action", () => {
      expect(normalizeTaskPrimaryAction("delete")).toBe("open");
      expect(normalizeTaskPrimaryAction("trash")).toBe("open");
      expect(normalizeTaskPrimaryAction("destroy")).toBe("open");
    });

    it("rejects 'complete' as primary action when allowComplete is false", () => {
      expect(normalizeTaskPrimaryAction("complete", false)).toBe("open");
      expect(normalizeTaskPrimaryAction("complete")).toBe("open");
    });

    it("allows 'complete' as primary action only when allowComplete is true (e.g. Inbox)", () => {
      expect(normalizeTaskPrimaryAction("complete", true)).toBe("complete");
    });
  });

  describe("getTaskSecondaryAction", () => {
    it("returns 'details' when primary is 'open'", () => {
      expect(getTaskSecondaryAction("open")).toBe("details");
    });

    it("returns 'open' when primary is 'details'", () => {
      expect(getTaskSecondaryAction("details")).toBe("open");
    });

    it("returns 'open' when primary is 'edit'", () => {
      expect(getTaskSecondaryAction("edit")).toBe("open");
    });

    it("returns 'details' when primary is 'complete'", () => {
      expect(getTaskSecondaryAction("complete")).toBe("details");
    });

    it("returns 'details' for unknown fallback", () => {
      expect(getTaskSecondaryAction("unknown" as TaskPrimaryAction)).toBe("details");
    });
  });

  describe("normalizeProjectPrimaryAction", () => {
    it("returns 'open' when preference is missing (undefined or null)", () => {
      expect(normalizeProjectPrimaryAction(undefined)).toBe("open");
      expect(normalizeProjectPrimaryAction(null)).toBe("open");
      expect(normalizeProjectPrimaryAction("")).toBe("open");
    });

    it("returns 'open' when preference is explicitly 'open'", () => {
      expect(normalizeProjectPrimaryAction("open")).toBe("open");
    });

    it("returns 'showTasks' when preference is 'showTasks'", () => {
      expect(normalizeProjectPrimaryAction("showTasks")).toBe("showTasks");
    });

    it("returns 'edit' when preference is 'edit'", () => {
      expect(normalizeProjectPrimaryAction("edit")).toBe("edit");
    });

    it("falls back safely to 'open' when preference is invalid or unknown", () => {
      expect(normalizeProjectPrimaryAction("random")).toBe("open");
      expect(normalizeProjectPrimaryAction(123)).toBe("open");
      expect(normalizeProjectPrimaryAction({})).toBe("open");
    });

    it("never allows destructive, status-changing or secondary actions as primary", () => {
      expect(normalizeProjectPrimaryAction("delete")).toBe("open");
      expect(normalizeProjectPrimaryAction("drop")).toBe("open");
      expect(normalizeProjectPrimaryAction("complete")).toBe("open");
      expect(normalizeProjectPrimaryAction("onHold")).toBe("open");
      expect(normalizeProjectPrimaryAction("active")).toBe("open");
    });
  });

  describe("getProjectSecondaryAction", () => {
    it("returns 'showTasks' when primary is 'open'", () => {
      expect(getProjectSecondaryAction("open")).toBe("showTasks");
    });

    it("returns 'open' when primary is 'showTasks'", () => {
      expect(getProjectSecondaryAction("showTasks")).toBe("open");
    });

    it("returns 'open' when primary is 'edit'", () => {
      expect(getProjectSecondaryAction("edit")).toBe("open");
    });

    it("returns 'showTasks' for unknown fallback", () => {
      expect(getProjectSecondaryAction("unknown" as ProjectPrimaryAction)).toBe("showTasks");
    });
  });

  describe("normalizeActionShortcutStyle", () => {
    it("normalizes known styles", () => {
      expect(normalizeActionShortcutStyle("option")).toBe("option");
      expect(normalizeActionShortcutStyle("cmd_shift")).toBe("cmd_shift");
      expect(normalizeActionShortcutStyle("ctrl_opt")).toBe("ctrl_opt");
      expect(normalizeActionShortcutStyle("off")).toBe("off");
    });

    it("defaults unknown or missing values safely to 'option'", () => {
      expect(normalizeActionShortcutStyle(undefined)).toBe("option");
      expect(normalizeActionShortcutStyle(null)).toBe("option");
      expect(normalizeActionShortcutStyle("")).toBe("option");
      expect(normalizeActionShortcutStyle("custom")).toBe("option");
    });
  });

  describe("getDomainShortcut (Tasks)", () => {
    it("generates correct shortcuts for 'option' style (default)", () => {
      expect(getDomainShortcut("setDates", "option")).toEqual({ modifiers: ["opt"], key: "d" });
      expect(getDomainShortcut("manageTags", "option")).toEqual({ modifiers: ["opt"], key: "t" });
      expect(getDomainShortcut("moveTask", "option")).toEqual({ modifiers: ["opt"], key: "m" });
      expect(getDomainShortcut("addSubtask", "option")).toEqual({ modifiers: ["opt"], key: "n" });
      expect(getDomainShortcut("toggleFlag", "option")).toEqual({ modifiers: ["opt"], key: "f" });
    });

    it("generates correct shortcuts for 'cmd_shift' style", () => {
      expect(getDomainShortcut("setDates", "cmd_shift")).toEqual({ modifiers: ["cmd", "shift"], key: "d" });
      expect(getDomainShortcut("manageTags", "cmd_shift")).toEqual({ modifiers: ["cmd", "shift"], key: "t" });
      expect(getDomainShortcut("moveTask", "cmd_shift")).toEqual({ modifiers: ["cmd", "shift"], key: "m" });
      expect(getDomainShortcut("addSubtask", "cmd_shift")).toEqual({ modifiers: ["cmd", "shift"], key: "n" });
      expect(getDomainShortcut("toggleFlag", "cmd_shift")).toEqual({ modifiers: ["cmd", "shift"], key: "f" });
    });

    it("generates correct shortcuts for 'ctrl_opt' style", () => {
      expect(getDomainShortcut("setDates", "ctrl_opt")).toEqual({ modifiers: ["ctrl", "opt"], key: "d" });
      expect(getDomainShortcut("manageTags", "ctrl_opt")).toEqual({ modifiers: ["ctrl", "opt"], key: "t" });
      expect(getDomainShortcut("moveTask", "ctrl_opt")).toEqual({ modifiers: ["ctrl", "opt"], key: "m" });
      expect(getDomainShortcut("addSubtask", "ctrl_opt")).toEqual({ modifiers: ["ctrl", "opt"], key: "n" });
      expect(getDomainShortcut("toggleFlag", "ctrl_opt")).toEqual({ modifiers: ["ctrl", "opt"], key: "f" });
    });

    it("returns undefined when style is 'off'", () => {
      expect(getDomainShortcut("setDates", "off")).toBeUndefined();
      expect(getDomainShortcut("manageTags", "off")).toBeUndefined();
      expect(getDomainShortcut("moveTask", "off")).toBeUndefined();
      expect(getDomainShortcut("addSubtask", "off")).toBeUndefined();
      expect(getDomainShortcut("toggleFlag", "off")).toBeUndefined();
    });

    it("does not mutate common shortcuts", () => {
      const actions = ["setDates", "manageTags", "moveTask", "addSubtask", "toggleFlag"] as const;
      for (const action of actions) {
        const sc = getDomainShortcut(action, "option");
        expect(sc?.modifiers).toEqual(["opt"]);
      }
    });
  });

  describe("getProjectDomainShortcut", () => {
    it("generates correct shortcuts for 'option' style (default)", () => {
      expect(getProjectDomainShortcut("setDates", "option")).toEqual({ modifiers: ["opt"], key: "d" });
      expect(getProjectDomainShortcut("manageTags", "option")).toEqual({ modifiers: ["opt"], key: "t" });
      expect(getProjectDomainShortcut("moveFolder", "option")).toEqual({ modifiers: ["opt"], key: "m" });
      expect(getProjectDomainShortcut("toggleFlag", "option")).toEqual({ modifiers: ["opt"], key: "f" });
    });

    it("generates correct shortcuts for 'cmd_shift' style", () => {
      expect(getProjectDomainShortcut("setDates", "cmd_shift")).toEqual({
        modifiers: ["cmd", "shift"],
        key: "d",
      });
      expect(getProjectDomainShortcut("manageTags", "cmd_shift")).toEqual({
        modifiers: ["cmd", "shift"],
        key: "t",
      });
      expect(getProjectDomainShortcut("moveFolder", "cmd_shift")).toEqual({
        modifiers: ["cmd", "shift"],
        key: "m",
      });
      expect(getProjectDomainShortcut("toggleFlag", "cmd_shift")).toEqual({
        modifiers: ["cmd", "shift"],
        key: "f",
      });
    });

    it("generates correct shortcuts for 'ctrl_opt' style", () => {
      expect(getProjectDomainShortcut("setDates", "ctrl_opt")).toEqual({
        modifiers: ["ctrl", "opt"],
        key: "d",
      });
      expect(getProjectDomainShortcut("manageTags", "ctrl_opt")).toEqual({
        modifiers: ["ctrl", "opt"],
        key: "t",
      });
      expect(getProjectDomainShortcut("moveFolder", "ctrl_opt")).toEqual({
        modifiers: ["ctrl", "opt"],
        key: "m",
      });
      expect(getProjectDomainShortcut("toggleFlag", "ctrl_opt")).toEqual({
        modifiers: ["ctrl", "opt"],
        key: "f",
      });
    });

    it("returns undefined when style is 'off'", () => {
      expect(getProjectDomainShortcut("setDates", "off")).toBeUndefined();
      expect(getProjectDomainShortcut("manageTags", "off")).toBeUndefined();
      expect(getProjectDomainShortcut("moveFolder", "off")).toBeUndefined();
      expect(getProjectDomainShortcut("toggleFlag", "off")).toBeUndefined();
    });
  });

  describe("resolveTaskActionPreferences & resolveProjectActionPreferences", () => {
    it("returns safe defaults when environment throws or preferences are empty", () => {
      const resolvedTask = resolveTaskActionPreferences();
      expect(resolvedTask).toEqual({
        primary: "open",
        secondary: "details",
        shortcutStyle: "option",
      });

      const resolvedProject = resolveProjectActionPreferences();
      expect(resolvedProject).toEqual({
        primary: "open",
        secondary: "showTasks",
        shortcutStyle: "option",
      });
    });
  });
});
