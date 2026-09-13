import type { CreateProjectInput, CreateTaskInput, ProjectStatus } from "../../types";
import { BATCH_HARD_LIMIT, batchHardLimitMessage } from "../batch";
import { OmniFocusNormalizedError } from "./errors";
import { executeOmniAutomation, iso, j } from "./gateway";

/**
 * Builds the assignment code for an optional date property.
 *
 * Contract:
 * - `undefined` → the property is not touched at all (empty code)
 * - `null` → the property is explicitly reset (`= null`)
 * - `Date` → the property is set to that date
 *
 * Planned-date assignments additionally throw `planned_date_unsupported` when
 * the target OmniFocus database does not support them. Callers pass
 * `undefined` for planned dates whenever the capability probe did not confirm
 * support, so the generated script must not contain a `.plannedDate` token.
 */
function dateAssignment(object: string, property: string, date?: Date | null, isPlannedDate = false): string {
  if (date === undefined) return "";
  const value = iso(date);
  const assignCode =
    value === null ? `${object}.${property} = null;` : `${object}.${property} = new Date(${j(value)});`;
  if (isPlannedDate) {
    return `try { ${assignCode} } catch (_) { throw new Error("planned_date_unsupported"); }`;
  }
  return assignCode;
}

function assertBatchLimit(count: number): void {
  if (count > BATCH_HARD_LIMIT) {
    throw new OmniFocusNormalizedError("invalid_input", batchHardLimitMessage(count));
  }
}

export async function createTask(input: CreateTaskInput): Promise<{ id: string; name: string }> {
  return executeOmniAutomation(`
    const projectId = ${j(input.projectId ?? null)};
    const parentTaskId = ${j(input.parentTaskId ?? null)};
    const parent = parentTaskId ? Task.byIdentifier(parentTaskId) : null;
    const project = projectId ? Project.byIdentifier(projectId) : null;
    if (parentTaskId && !parent) throw new Error("parent_task_not_found");
    if (projectId && !project) throw new Error("project_not_found");
    const position = parent ? parent.ending : (project ? project.ending : null);
    const task = position ? new Task(${j(input.name)}, position) : new Task(${j(input.name)});
    task.note = ${j(input.note ?? "")};
    task.flagged = ${input.flagged ? "true" : "false"};
    ${dateAssignment("task", "dueDate", input.dueDate)}
    ${dateAssignment("task", "deferDate", input.deferDate)}
    ${dateAssignment("task", "plannedDate", input.plannedDate, true)}
    const tagIds = ${j(input.tagIds ?? [])};
    tagIds.forEach(id => { const tag = Tag.byIdentifier(id); if (tag) task.addTag(tag); });
    return { id: task.id.primaryKey, name: task.name };
  `);
}

export async function createMultipleTasks(
  projectId: string | undefined,
  names: string[],
): Promise<{ ids: string[]; count: number }> {
  assertBatchLimit(names.length);
  return executeOmniAutomation(`
    const projectId = ${j(projectId ?? null)};
    const project = projectId ? Project.byIdentifier(projectId) : null;
    if (projectId && !project) throw new Error("project_not_found");
    const names = ${j(names)};
    const created = [];
    names.forEach(name => {
      const task = project ? new Task(name, project.ending) : new Task(name);
      created.push(task.id.primaryKey);
    });
    return { ids: created, count: created.length };
  `);
}

export async function createProject(input: CreateProjectInput): Promise<{ id: string; name: string }> {
  assertBatchLimit((input.initialTasks ?? []).length);
  return executeOmniAutomation(`
    const folderId = ${j(input.folderId ?? null)};
    const folder = folderId ? Folder.byIdentifier(folderId) : null;
    if (folderId && !folder) throw new Error("folder_not_found");
    const project = folder ? new Project(${j(input.name)}, folder) : new Project(${j(input.name)});
    project.sequential = ${input.type === "sequential" ? "true" : "false"};
    project.containsSingletonActions = ${input.type === "single-actions" ? "true" : "false"};
    project.task.note = ${j(input.note ?? "")};
    project.task.flagged = ${input.flagged ? "true" : "false"};
    ${dateAssignment("project.task", "dueDate", input.dueDate)}
    ${dateAssignment("project.task", "deferDate", input.deferDate)}
    ${dateAssignment("project.task", "plannedDate", input.plannedDate, true)}
    const tagIds = ${j(input.tagIds ?? [])};
    tagIds.forEach(id => { const tag = Tag.byIdentifier(id); if (tag) project.task.addTag(tag); });
    const initialTasks = ${j(input.initialTasks ?? [])};
    initialTasks.forEach(name => new Task(name, project.ending));
    return { id: project.id.primaryKey, name: project.name };
  `);
}

export async function setTaskCompleted(taskId: string, completed: boolean): Promise<void> {
  await executeOmniAutomation(`
    const task = Task.byIdentifier(${j(taskId)});
    if (!task) throw new Error("task_not_found");
    if (${completed ? "true" : "false"}) task.markComplete(); else task.markIncomplete();
    return true;
  `);
}

export async function setTaskFlagged(taskId: string, flagged: boolean): Promise<void> {
  await executeOmniAutomation(`
    const task = Task.byIdentifier(${j(taskId)});
    if (!task) throw new Error("task_not_found");
    task.flagged = ${flagged ? "true" : "false"};
    return true;
  `);
}

export async function updateTask(taskId: string, fields: { name?: string; note?: string }): Promise<void> {
  await executeOmniAutomation(`
    const task = Task.byIdentifier(${j(taskId)});
    if (!task) throw new Error("task_not_found");
    ${fields.name !== undefined ? `task.name = ${j(fields.name)};` : ""}
    ${fields.note !== undefined ? `task.note = ${j(fields.note)};` : ""}
    return true;
  `);
}

export async function setTaskDates(
  taskId: string,
  dates: { dueDate?: Date | null; deferDate?: Date | null; plannedDate?: Date | null },
): Promise<void> {
  await executeOmniAutomation(`
    const task = Task.byIdentifier(${j(taskId)});
    if (!task) throw new Error("task_not_found");
    ${dateAssignment("task", "dueDate", dates.dueDate)}
    ${dateAssignment("task", "deferDate", dates.deferDate)}
    ${dateAssignment("task", "plannedDate", dates.plannedDate, true)}
    return true;
  `);
}

export async function moveTask(taskId: string, projectId?: string): Promise<void> {
  await executeOmniAutomation(`
    const task = Task.byIdentifier(${j(taskId)});
    if (!task) throw new Error("task_not_found");
    const projectId = ${j(projectId ?? null)};
    const project = projectId ? Project.byIdentifier(projectId) : null;
    if (projectId && !project) throw new Error("project_not_found");
    moveTasks([task], project ? project.ending : inbox.ending);
    return true;
  `);
}

export async function duplicateTask(taskId: string): Promise<string> {
  return executeOmniAutomation<string>(`
    const task = Task.byIdentifier(${j(taskId)});
    if (!task) throw new Error("task_not_found");
    const copies = duplicateTasks([task], task.after);
    return copies[0].id.primaryKey;
  `);
}

export async function addSubtask(taskId: string, name: string): Promise<string> {
  return executeOmniAutomation<string>(`
    const task = Task.byIdentifier(${j(taskId)});
    if (!task) throw new Error("task_not_found");
    const child = new Task(${j(name)}, task.ending);
    return child.id.primaryKey;
  `);
}

export async function setTaskTag(taskId: string, tagId: string, enabled: boolean): Promise<void> {
  await executeOmniAutomation(`
    const task = Task.byIdentifier(${j(taskId)});
    if (!task) throw new Error("task_not_found");
    const tag = Tag.byIdentifier(${j(tagId)});
    if (!tag) throw new Error("tag_not_found");
    if (${enabled ? "true" : "false"}) {
      task.addTag(tag);
    } else {
      task.removeTag(tag);
    }
    return true;
  `);
}

export async function deleteTask(taskId: string): Promise<void> {
  await executeOmniAutomation(`
    const task = Task.byIdentifier(${j(taskId)});
    if (!task) throw new Error("task_not_found");
    deleteObject(task);
    return true;
  `);
}

export async function updateProject(
  projectId: string,
  fields: { name?: string; note?: string },
): Promise<void> {
  await executeOmniAutomation(`
    const project = Project.byIdentifier(${j(projectId)});
    if (!project) throw new Error("project_not_found");
    ${fields.name !== undefined ? `project.name = ${j(fields.name)};` : ""}
    ${fields.note !== undefined ? `project.task.note = ${j(fields.note)};` : ""}
    return true;
  `);
}

export async function setProjectFlagged(projectId: string, flagged: boolean): Promise<void> {
  await executeOmniAutomation(`
    const project = Project.byIdentifier(${j(projectId)});
    if (!project) throw new Error("project_not_found");
    project.task.flagged = ${flagged ? "true" : "false"};
    return true;
  `);
}

export async function setProjectDates(
  projectId: string,
  dates: { dueDate?: Date | null; deferDate?: Date | null; plannedDate?: Date | null },
): Promise<void> {
  await executeOmniAutomation(`
    const project = Project.byIdentifier(${j(projectId)});
    if (!project) throw new Error("project_not_found");
    ${dateAssignment("project.task", "dueDate", dates.dueDate)}
    ${dateAssignment("project.task", "deferDate", dates.deferDate)}
    ${dateAssignment("project.task", "plannedDate", dates.plannedDate, true)}
    return true;
  `);
}

export async function setProjectTag(projectId: string, tagId: string, enabled: boolean): Promise<void> {
  await executeOmniAutomation(`
    const project = Project.byIdentifier(${j(projectId)});
    const tag = Tag.byIdentifier(${j(tagId)});
    if (!project) throw new Error("project_not_found");
    if (!tag) throw new Error("tag_not_found");
    if (${enabled ? "true" : "false"}) {
      project.task.addTag(tag);
    } else {
      project.task.removeTag(tag);
    }
    return true;
  `);
}

export async function setProjectStatus(projectId: string, status: ProjectStatus): Promise<void> {
  const statusCode: Record<ProjectStatus, string> = {
    Active: "Project.Status.Active",
    OnHold: "Project.Status.OnHold",
    Done: "Project.Status.Done",
    Dropped: "Project.Status.Dropped",
    Unknown: "Project.Status.Active",
  };
  await executeOmniAutomation(`
    const project = Project.byIdentifier(${j(projectId)});
    if (!project) throw new Error("project_not_found");
    ${status === "Done" ? "project.markComplete();" : status === "Active" ? "project.markIncomplete(); project.status = Project.Status.Active;" : `project.status = ${statusCode[status]};`}
    return true;
  `);
}

export async function moveProject(projectId: string, folderId?: string): Promise<void> {
  await executeOmniAutomation(`
    const project = Project.byIdentifier(${j(projectId)});
    if (!project) throw new Error("project_not_found");
    const folderId = ${j(folderId ?? null)};
    const folder = folderId ? Folder.byIdentifier(folderId) : null;
    if (folderId && !folder) throw new Error("folder_not_found");
    moveSections([project], folder ? folder.ending : library.ending);
    return true;
  `);
}

export async function duplicateProject(projectId: string): Promise<string> {
  return executeOmniAutomation<string>(`
    const project = Project.byIdentifier(${j(projectId)});
    if (!project) throw new Error("project_not_found");
    const copies = duplicateSections([project], project.after);
    return copies[0].id.primaryKey;
  `);
}

export async function deleteProject(projectId: string): Promise<void> {
  await executeOmniAutomation(`
    const project = Project.byIdentifier(${j(projectId)});
    if (!project) throw new Error("project_not_found");
    deleteObject(project);
    return true;
  `);
}
