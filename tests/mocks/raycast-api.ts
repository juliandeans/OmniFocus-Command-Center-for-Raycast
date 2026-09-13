export const Toast = {
  Style: {
    Animated: "Animated",
    Success: "Success",
    Failure: "Failure",
  },
};

export async function showToast() {
  return {
    style: Toast.Style.Animated,
    title: "",
    message: "",
  };
}

export async function getApplications() {
  return [{ name: "OmniFocus" }];
}

export const Icon = {
  Warning: "warning",
  CheckCircle: "check-circle",
  Circle: "circle",
  Trash: "trash",
  Folder: "folder",
  Tag: "tag",
  Link: "link",
  ArrowRight: "arrow-right",
  Eye: "eye",
  Flag: "flag",
  Pencil: "pencil",
  Calendar: "calendar",
  Plus: "plus",
  PlusCircle: "plus-circle",
  Duplicate: "duplicate",
  Tray: "tray",
  Download: "download",
  Lock: "lock",
  ExclamationMark: "exclamation-mark",
  Clock: "clock",
  MagnifyingGlass: "magnifying-glass",
  Gear: "gear",
  ArrowClockwise: "arrow-clockwise",
  AppWindow: "app-window",
};

export const Color = {
  Blue: "blue",
  Red: "red",
  Orange: "orange",
};

export const Keyboard = {
  Shortcut: {
    Common: {
      Open: { modifiers: ["cmd"], key: "o" },
      Edit: { modifiers: ["cmd"], key: "e" },
      Duplicate: { modifiers: ["cmd"], key: "d" },
    },
  },
};

export function getPreferenceValues() {
  return {};
}

export async function openCommandPreferences() {}
