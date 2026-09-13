import type {
  OmniFocusFolder,
  OmniFocusPerspective,
  OmniFocusProject,
  OmniFocusTag,
  OmniFocusTask,
} from "../../types";
import { customPerspectiveUrl } from "./links";
import { executeOmniAutomation, executeJxa, j } from "./gateway";
import { OMNI_SERIALIZERS } from "./serialize";

const ACTIVE_JXA_STATUS = "active status";

// Kept deliberately close to the original, already field-tested Project Jump implementation.
export async function listActiveProjects(): Promise<OmniFocusProject[]> {
  const projects = await executeJxa<
    Array<{ id: string; name: string; status: string; folder: string | null }>
  >(`
    const omnifocus = Application("OmniFocus");
    const document = omnifocus.defaultDocument();
    const folderByProjectId = {};
    document.flattenedFolders().forEach((folder) => {
      try {
        const folderName = folder.name();
        folder.projects().forEach((project) => { folderByProjectId[project.id()] = folderName; });
      } catch (_) {}
    });
    return document.flattenedProjects().map((project) => ({
      id: project.id(), name: project.name(), status: project.status(), folder: folderByProjectId[project.id()] || null
    }));
  `);
  return projects
    .filter((p) => p.status === ACTIVE_JXA_STATUS)
    .map((p) => ({ ...p, status: "Active" as const, folderId: null }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listProjects(includeInactive = false): Promise<OmniFocusProject[]> {
  return executeOmniAutomation<OmniFocusProject[]>(`
    ${OMNI_SERIALIZERS}
    return flattenedProjects
      .filter(project => ${includeInactive ? "true" : "project.status === Project.Status.Active || project.status === Project.Status.OnHold"})
      .map(p => serializeProject(p))
      .sort((a,b) => a.name.localeCompare(b.name));
  `);
}

export async function listProjectTasks(projectId: string): Promise<OmniFocusTask[]> {
  return executeOmniAutomation<OmniFocusTask[]>(`
    ${OMNI_SERIALIZERS}
    const project = Project.byIdentifier(${j(projectId)});
    if (!project) throw new Error("project_not_found");
    return project.flattenedTasks.filter(task => !task.project).map(t => serializeTask(t));
  `);
}

export async function listOpenTasks(): Promise<OmniFocusTask[]> {
  return executeOmniAutomation<OmniFocusTask[]>(`
    ${OMNI_SERIALIZERS}
    return flattenedTasks
      .filter(task => !task.project && !task.completed && !task.dropDate)
      .map(t => serializeTask(t));
  `);
}

export async function listInboxTasks(): Promise<OmniFocusTask[]> {
  return executeOmniAutomation<OmniFocusTask[]>(`
    ${OMNI_SERIALIZERS}
    return inbox.filter(task => !task.completed && !task.dropDate).map(t => serializeTask(t));
  `);
}

export async function listTags(): Promise<OmniFocusTag[]> {
  return executeOmniAutomation<OmniFocusTag[]>(`
    ${OMNI_SERIALIZERS}
    return flattenedTags.map(tag => ({
      id: tag.id.primaryKey,
      name: tag.name,
      path: tagPath(tag),
      active: tag.status === Tag.Status.Active
    })).sort((a,b) => a.path.localeCompare(b.path));
  `);
}

export async function listTasksForTag(tagId: string): Promise<OmniFocusTask[]> {
  return executeOmniAutomation<OmniFocusTask[]>(`
    ${OMNI_SERIALIZERS}
    const tag = Tag.byIdentifier(${j(tagId)});
    if (!tag) throw new Error("tag_not_found");
    return flattenedTasks
      .filter(task => !task.project && !task.completed && !task.dropDate && task.tags.some(t => t.id.primaryKey === tag.id.primaryKey))
      .map(t => serializeTask(t));
  `);
}

export async function listFolders(): Promise<OmniFocusFolder[]> {
  return executeOmniAutomation<OmniFocusFolder[]>(`
    ${OMNI_SERIALIZERS}
    return flattenedFolders.map(folder => ({
      id: folder.id.primaryKey,
      name: folder.name,
      path: folderPath(folder)
    })).sort((a,b) => a.path.localeCompare(b.path));
  `);
}

export async function listPerspectives(): Promise<OmniFocusPerspective[]> {
  const custom = await executeOmniAutomation<Array<{ id: string; name: string }>>(`
    return Perspective.Custom.all.map(p => ({ id: p.identifier, name: p.name }));
  `);
  const builtIns: OmniFocusPerspective[] = [
    { id: "inbox", name: "Inbox", kind: "built-in", url: "omnifocus:///inbox" },
    { id: "forecast", name: "Vorausschau / Forecast", kind: "built-in", url: "omnifocus:///forecast" },
    { id: "flagged", name: "Markiert / Flagged", kind: "built-in", url: "omnifocus:///flagged" },
    { id: "projects", name: "Projekte / Projects", kind: "built-in", url: "omnifocus:///projects" },
    { id: "tags", name: "Tags", kind: "built-in", url: "omnifocus:///tags" },
    { id: "review", name: "Review", kind: "built-in", url: "omnifocus:///review" },
  ];
  return [
    ...builtIns,
    ...custom.map((p) => ({
      id: p.id,
      name: p.name,
      kind: "custom" as const,
      url: customPerspectiveUrl(p.name),
    })),
  ];
}

export async function listReviewProjects(): Promise<OmniFocusProject[]> {
  return executeOmniAutomation<OmniFocusProject[]>(`
    ${OMNI_SERIALIZERS}
    const now = new Date();
    return flattenedProjects
      .filter(project => (project.status === Project.Status.Active || project.status === Project.Status.OnHold) && project.nextReviewDate && project.nextReviewDate <= now)
      .map(p => serializeProject(p))
      .sort((a,b) => (a.nextReviewDate || "").localeCompare(b.nextReviewDate || ""));
  `);
}

export async function getProject(projectId: string): Promise<OmniFocusProject> {
  return executeOmniAutomation<OmniFocusProject>(`
    ${OMNI_SERIALIZERS}
    const project = Project.byIdentifier(${j(projectId)});
    if (!project) throw new Error("project_not_found");
    return serializeProject(project, { includeNote: true });
  `);
}

export async function getTask(taskId: string): Promise<OmniFocusTask> {
  return executeOmniAutomation<OmniFocusTask>(`
    ${OMNI_SERIALIZERS}
    const task = Task.byIdentifier(${j(taskId)});
    if (!task) throw new Error("task_not_found");
    return serializeTask(task, { includeNote: true });
  `);
}

export async function getTaskNote(taskId: string): Promise<string> {
  return executeOmniAutomation<string>(`
    const task = Task.byIdentifier(${j(taskId)});
    if (!task) throw new Error("task_not_found");
    return task.note || "";
  `);
}
