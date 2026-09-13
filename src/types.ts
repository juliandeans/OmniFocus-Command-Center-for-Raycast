export type ProjectStatus = "Active" | "OnHold" | "Done" | "Dropped" | "Unknown";
export type TaskStatus =
  "Available" | "Blocked" | "Completed" | "Dropped" | "DueSoon" | "Next" | "Overdue" | "Unknown";

export type OmniFocusProject = {
  id: string;
  name: string;
  status: ProjectStatus;
  folder: string | null;
  folderId: string | null;
  note?: string;
  hasNote?: boolean;
  flagged?: boolean;
  dueDate?: string | null;
  deferDate?: string | null;
  plannedDate?: string | null;
  nextReviewDate?: string | null;
  lastReviewDate?: string | null;
  sequential?: boolean;
  singleton?: boolean;
  tags?: { id: string; name: string }[];
};

export type OmniFocusTask = {
  id: string;
  name: string;
  note?: string;
  hasNote?: boolean;
  flagged: boolean;
  completed: boolean;
  dropped: boolean;
  status: TaskStatus;
  dueDate: string | null;
  deferDate: string | null;
  plannedDate: string | null;
  added: string | null;
  modified: string | null;
  projectId: string | null;
  projectName: string | null;
  parentId: string | null;
  parentName: string | null;
  inInbox: boolean;
  depth: number;
  tags: { id: string; name: string }[];
};

export type OmniFocusTag = { id: string; name: string; path: string; active: boolean };
export type OmniFocusFolder = { id: string; name: string; path: string };
export type OmniFocusPerspective = { id: string; name: string; kind: "built-in" | "custom"; url: string };

export type CreateTaskInput = {
  name: string;
  projectId?: string;
  parentTaskId?: string;
  tagIds?: string[];
  note?: string;
  flagged?: boolean;
  dueDate?: Date | null;
  deferDate?: Date | null;
  plannedDate?: Date | null;
};

export type CreateProjectInput = {
  name: string;
  folderId?: string;
  type: "parallel" | "sequential" | "single-actions";
  note?: string;
  flagged?: boolean;
  tagIds?: string[];
  dueDate?: Date | null;
  deferDate?: Date | null;
  plannedDate?: Date | null;
  initialTasks?: string[];
};
