export const OMNI_SERIALIZERS = String.raw`
function isoOrNull(value) { return value ? value.toISOString() : null; }
function safePlannedDate(item) {
  try {
    return isoOrNull(item.plannedDate);
  } catch (_) {
    return null;
  }
}
function safeProjectPlannedDate(project) {
  try {
    return isoOrNull(project.task.plannedDate);
  } catch (_) {
    return null;
  }
}
function projectStatusName(status) {
  if (status === Project.Status.Active) return "Active";
  if (status === Project.Status.OnHold) return "OnHold";
  if (status === Project.Status.Done) return "Done";
  if (status === Project.Status.Dropped) return "Dropped";
  return "Unknown";
}
function taskStatusName(status) {
  if (status === Task.Status.Available) return "Available";
  if (status === Task.Status.Blocked) return "Blocked";
  if (status === Task.Status.Completed) return "Completed";
  if (status === Task.Status.Dropped) return "Dropped";
  if (status === Task.Status.DueSoon) return "DueSoon";
  if (status === Task.Status.Next) return "Next";
  if (status === Task.Status.Overdue) return "Overdue";
  return "Unknown";
}
function folderPath(folder) {
  if (!folder) return null;
  const names = [];
  let current = folder;
  while (current) {
    names.unshift(current.name);
    current = current.parent;
  }
  return names.join(" / ");
}
function tagPath(tag) {
  const names = [];
  let current = tag;
  while (current) {
    names.unshift(current.name);
    current = current.parent;
  }
  return names.join(" / ");
}
function taskDepth(task) {
  let depth = 0;
  let current = task.parent;
  while (current && !current.project) { depth += 1; current = current.parent; }
  return depth;
}
function serializeTask(task, options) {
  const includeNote = options && options.includeNote;
  const project = task.containingProject;
  const parent = task.parent;
  const result = {
    id: task.id.primaryKey,
    name: task.name,
    hasNote: !!(task.note && task.note.trim().length > 0),
    flagged: !!task.flagged,
    completed: !!task.completed,
    dropped: !!task.dropDate,
    status: taskStatusName(task.taskStatus),
    dueDate: isoOrNull(task.dueDate),
    deferDate: isoOrNull(task.deferDate),
    plannedDate: safePlannedDate(task),
    added: isoOrNull(task.added),
    modified: isoOrNull(task.modified),
    projectId: project ? project.id.primaryKey : null,
    projectName: project ? project.name : null,
    parentId: parent && !parent.project ? parent.id.primaryKey : null,
    parentName: parent && !parent.project ? parent.name : null,
    inInbox: !!task.inInbox,
    depth: taskDepth(task),
    tags: task.tags.map(tag => ({ id: tag.id.primaryKey, name: tag.name }))
  };
  if (includeNote) {
    result.note = task.note || "";
  }
  return result;
}
function serializeProject(project, options) {
  const includeNote = options && options.includeNote;
  const folder = project.parentFolder;
  const result = {
    id: project.id.primaryKey,
    name: project.name,
    status: projectStatusName(project.status),
    folder: folderPath(folder),
    folderId: folder ? folder.id.primaryKey : null,
    hasNote: !!(project.task.note && project.task.note.trim().length > 0),
    flagged: !!project.task.flagged,
    dueDate: isoOrNull(project.task.dueDate),
    deferDate: isoOrNull(project.task.deferDate),
    plannedDate: safeProjectPlannedDate(project),
    nextReviewDate: isoOrNull(project.nextReviewDate),
    lastReviewDate: isoOrNull(project.lastReviewDate),
    sequential: !!project.sequential,
    singleton: !!project.containsSingletonActions,
    tags: project.tags.map(tag => ({ id: tag.id.primaryKey, name: tag.name }))
  };
  if (includeNote) {
    result.note = project.task.note || "";
  }
  return result;
}
`;
