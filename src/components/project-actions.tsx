import {
  Action,
  ActionPanel,
  Alert,
  Form,
  Icon,
  Keyboard,
  List,
  confirmAlert,
  openCommandPreferences,
  useNavigation,
} from "@raycast/api";
import {
  ActionShortcutStyle,
  ProjectPrimaryAction,
  ProjectSecondaryAction,
  getProjectDomainShortcut,
  getProjectSecondaryAction,
  resolveProjectActionPreferences,
} from "../lib/action-preferences";
import { useCachedPromise, usePromise } from "@raycast/utils";
import { useState } from "react";
import type { OmniFocusProject, ProjectStatus } from "../types";
import { AddMultipleTasksForm } from "./add-multiple-tasks-form";
import { AddTaskForm } from "./add-task-form";
import { ProjectTasksView } from "../views/project-tasks-view";
import { projectUrl } from "../lib/omnifocus/links";
import { getProject, listFolders, listTags } from "../lib/omnifocus/queries";
import { getPlannedDateCapability } from "../lib/omnifocus/capabilities";
import {
  deleteProject,
  duplicateProject,
  moveProject,
  setProjectDates,
  setProjectFlagged,
  setProjectStatus,
  setProjectTag,
  updateProject,
} from "../lib/omnifocus/mutations";
import { runMutation } from "../lib/ui";
import { OmniFocusEmptyView } from "../lib/omnifocus/requirements";
import { normalizeOmniFocusError } from "../lib/omnifocus/errors";
import { PlannedDateSupportNotice } from "./planned-date-support-notice";

function EditProjectForm({
  projectId,
  onUpdated,
}: {
  projectId: string;
  onUpdated?: () => void | Promise<void>;
}) {
  const { pop } = useNavigation();
  const { data: project, isLoading, error, revalidate } = usePromise(getProject, [projectId]);

  // The project (including its note) MUST be loaded live before the form
  // becomes editable — a fetch failure must never offer saving an empty note
  // over the real OmniFocus note.
  if (error) {
    const normalized = normalizeOmniFocusError(error);
    return (
      <Form
        navigationTitle="Edit Project"
        actions={
          <ActionPanel>
            <Action title="Retry" icon={Icon.ArrowClockwise} onAction={revalidate} />
          </ActionPanel>
        }
      >
        <Form.Description title="Could Not Load Project" text={normalized.userMessage} />
        <Form.Description text="Name and note can only be edited after the project was loaded from OmniFocus." />
      </Form>
    );
  }

  if (!project) return <Form isLoading={isLoading} navigationTitle="Edit Project" />;
  return (
    <Form
      navigationTitle="Edit Project"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Save Project"
            onSubmit={async (values: { name: string; note: string }) => {
              if (!values.name.trim()) return;
              if (
                await runMutation(
                  "Saving project…",
                  () =>
                    updateProject(projectId, {
                      name: values.name.trim(),
                      note: values.note,
                    }),
                  onUpdated,
                )
              ) {
                pop();
              }
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Project" defaultValue={project.name} autoFocus />
      <Form.TextArea id="note" title="Note" defaultValue={project.note ?? ""} />
    </Form>
  );
}

function ProjectDatesForm({
  projectId,
  onUpdated,
}: {
  projectId: string;
  onUpdated?: () => void | Promise<void>;
}) {
  const { pop } = useNavigation();
  const { data: project, isLoading, error, revalidate } = usePromise(getProject, [projectId]);
  const {
    data: plannedDateSupported,
    isLoading: checkingCapability,
    error: capabilityError,
    revalidate: recheckCapability,
  } = usePromise(getPlannedDateCapability, []);

  // Saving dates against an unloaded project could wipe existing values, so
  // the pickers only render after the live fetch succeeded.
  if (error) {
    const normalized = normalizeOmniFocusError(error);
    return (
      <Form
        navigationTitle="Project Dates"
        actions={
          <ActionPanel>
            <Action title="Retry" icon={Icon.ArrowClockwise} onAction={revalidate} />
          </ActionPanel>
        }
      >
        <Form.Description title="Could Not Load Project" text={normalized.userMessage} />
        <Form.Description text="Dates can only be edited after the project was loaded from OmniFocus." />
      </Form>
    );
  }

  if (!project) return <Form isLoading={isLoading || checkingCapability} navigationTitle="Project Dates" />;
  return (
    <Form
      navigationTitle="Project Dates"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Save Dates"
            onSubmit={async (values: {
              plannedDate: Date | null;
              deferDate: Date | null;
              dueDate: Date | null;
            }) => {
              if (
                await runMutation(
                  "Saving dates…",
                  () =>
                    setProjectDates(projectId, {
                      plannedDate: plannedDateSupported ? values.plannedDate : undefined,
                      deferDate: values.deferDate,
                      dueDate: values.dueDate,
                    }),
                  onUpdated,
                )
              ) {
                pop();
              }
            }}
          />
          {capabilityError ? (
            <Action
              title="Retry Planned Date Check"
              icon={Icon.ArrowClockwise}
              onAction={recheckCapability}
            />
          ) : null}
        </ActionPanel>
      }
    >
      {plannedDateSupported ? (
        <Form.DatePicker
          id="plannedDate"
          title="Planned"
          type={Form.DatePicker.Type.Date}
          defaultValue={project.plannedDate ? new Date(project.plannedDate) : undefined}
        />
      ) : (
        <PlannedDateSupportNotice supported={plannedDateSupported} error={capabilityError} />
      )}
      <Form.DatePicker
        id="deferDate"
        title="Defer"
        type={Form.DatePicker.Type.Date}
        defaultValue={project.deferDate ? new Date(project.deferDate) : undefined}
      />
      <Form.DatePicker
        id="dueDate"
        title="Due"
        type={Form.DatePicker.Type.Date}
        defaultValue={project.dueDate ? new Date(project.dueDate) : undefined}
      />
    </Form>
  );
}

function ManageProjectTagsInner({
  project,
  onUpdated,
}: {
  project: OmniFocusProject;
  onUpdated?: () => void | Promise<void>;
}) {
  const { data: tags = [], isLoading } = useCachedPromise(listTags);
  const [selectedTagIds, setSelectedTagIds] = useState(
    () => new Set((project.tags ?? []).map((tag) => tag.id)),
  );
  return (
    <List isLoading={isLoading} navigationTitle="Manage Tags" searchBarPlaceholder="Search tags…">
      {tags.map((tag) => {
        const enabled = selectedTagIds.has(tag.id);
        return (
          <List.Item
            key={tag.id}
            title={tag.path}
            icon={enabled ? Icon.CheckCircle : Icon.Circle}
            actions={
              <ActionPanel>
                <Action
                  title={enabled ? "Remove Tag" : "Add Tag"}
                  onAction={async () => {
                    const nextEnabled = !enabled;
                    const succeeded = await runMutation(
                      enabled ? "Removing tag…" : "Adding tag…",
                      () => setProjectTag(project.id, tag.id, nextEnabled),
                      onUpdated,
                    );
                    if (succeeded) {
                      setSelectedTagIds((previous) => {
                        const next = new Set(previous);
                        if (nextEnabled) next.add(tag.id);
                        else next.delete(tag.id);
                        return next;
                      });
                    }
                  }}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}

function ManageProjectTagsView({
  projectId,
  onUpdated,
}: {
  projectId: string;
  onUpdated?: () => void | Promise<void>;
}) {
  const { data: project, isLoading, error } = usePromise(getProject, [projectId]);
  if (error) {
    return (
      <List>
        <OmniFocusEmptyView error={error} />
      </List>
    );
  }
  if (!project) return <List isLoading={isLoading} navigationTitle="Manage Project Tags" />;
  return <ManageProjectTagsInner project={project} onUpdated={onUpdated} />;
}

function MoveProjectView({
  projectId,
  onUpdated,
}: {
  projectId: string;
  onUpdated?: () => void | Promise<void>;
}) {
  const { pop } = useNavigation();
  const { data: folders = [], isLoading } = useCachedPromise(listFolders);
  const doMove = async (folderId?: string) => {
    if (await runMutation("Moving project…", () => moveProject(projectId, folderId), onUpdated)) {
      pop();
    }
  };
  return (
    <List isLoading={isLoading} navigationTitle="Move Project" searchBarPlaceholder="Search folders…">
      <List.Item
        title="Top Level"
        icon={Icon.Folder}
        actions={
          <ActionPanel>
            <Action title="Move to Top Level" onAction={() => doMove()} />
          </ActionPanel>
        }
      />
      {folders.map((folder) => (
        <List.Item
          key={folder.id}
          title={folder.path}
          actions={
            <ActionPanel>
              <Action title="Move Here" onAction={() => doMove(folder.id)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

export function ProjectActions({
  project,
  onUpdated,
  primaryAction: explicitPrimary,
  shortcutStyle: explicitShortcutStyle,
}: {
  project: OmniFocusProject;
  onUpdated?: () => void | Promise<void>;
  primaryAction?: ProjectPrimaryAction;
  shortcutStyle?: ActionShortcutStyle;
}) {
  const preferences = resolveProjectActionPreferences();
  const primary = explicitPrimary ?? preferences.primary;
  const secondary = getProjectSecondaryAction(primary);
  const shortcutStyle = explicitShortcutStyle ?? preferences.shortcutStyle;

  const setStatus = async (status: ProjectStatus) => {
    if (status === "Done" || status === "Dropped") {
      const confirmed = await confirmAlert({
        title: `Set “${project.name}” to ${status}?`,
        message:
          status === "Done"
            ? "This marks the project complete."
            : "This drops the project from your active workflows.",
        primaryAction: {
          title: status === "Done" ? "Complete" : "Drop",
          style: Alert.ActionStyle.Destructive,
        },
      });
      if (!confirmed) return;
    }
    await runMutation(`Setting status to ${status}…`, () => setProjectStatus(project.id, status), onUpdated);
  };

  const renderOpenAction = (isPrimary: boolean, isSecondary: boolean) => (
    <Action.Open
      key="open"
      title="Open in OmniFocus"
      target={projectUrl(project.id)}
      application="OmniFocus"
      icon={Icon.ArrowRight}
      shortcut={isPrimary || isSecondary ? undefined : Keyboard.Shortcut.Common.Open}
    />
  );

  const renderShowTasksAction = (isPrimary: boolean, isSecondary: boolean) => (
    <Action.Push
      key="showTasks"
      title="Show Tasks"
      icon={Icon.List}
      target={<ProjectTasksView projectId={project.id} projectName={project.name} />}
      shortcut={isPrimary || isSecondary ? undefined : { modifiers: ["cmd"], key: "t" }}
    />
  );

  const renderEditAction = (isPrimary: boolean) => (
    <Action.Push
      key="edit"
      title="Edit Project"
      icon={Icon.Pencil}
      target={<EditProjectForm projectId={project.id} onUpdated={onUpdated} />}
      shortcut={isPrimary ? undefined : Keyboard.Shortcut.Common.Edit}
    />
  );

  const renderTopSlot = (
    actionId: ProjectPrimaryAction | ProjectSecondaryAction,
    role: "primary" | "secondary",
  ) => {
    const isPrimary = role === "primary";
    const isSecondary = role === "secondary";
    switch (actionId) {
      case "open":
        return renderOpenAction(isPrimary, isSecondary);
      case "showTasks":
        return renderShowTasksAction(isPrimary, isSecondary);
      case "edit":
        return renderEditAction(isPrimary);
    }
  };

  return (
    <ActionPanel>
      {/* Primary Action (Slot 1 -> Enter) */}
      {renderTopSlot(primary, "primary")}

      {/* Secondary Action (Slot 2 -> Cmd+Enter) */}
      {renderTopSlot(secondary, "secondary")}

      {/* Remaining top frequent action if not already rendered as Primary or Secondary */}
      {primary !== "open" && secondary !== "open" && renderOpenAction(false, false)}
      {primary !== "showTasks" && secondary !== "showTasks" && renderShowTasksAction(false, false)}

      <ActionPanel.Section title="Capture">
        <Action.Push
          title="Add Task"
          icon={Icon.Plus}
          shortcut={Keyboard.Shortcut.Common.New}
          target={<AddTaskForm defaultProjectId={project.id} onCreated={onUpdated} />}
        />
        <Action.Push
          title="Add Multiple Tasks"
          icon={Icon.PlusCircle}
          shortcut={{ modifiers: ["cmd", "shift"], key: "n" }}
          target={<AddMultipleTasksForm defaultProjectId={project.id} onCreated={onUpdated} />}
        />
      </ActionPanel.Section>

      <ActionPanel.Section title="Edit">
        {primary !== "edit" && renderEditAction(false)}
        <Action.Push
          title="Set Dates"
          icon={Icon.Calendar}
          shortcut={getProjectDomainShortcut("setDates", shortcutStyle)}
          target={<ProjectDatesForm projectId={project.id} onUpdated={onUpdated} />}
        />
        <Action.Push
          title="Manage Tags"
          icon={Icon.Tag}
          shortcut={getProjectDomainShortcut("manageTags", shortcutStyle)}
          target={<ManageProjectTagsView projectId={project.id} onUpdated={onUpdated} />}
        />
        <Action.Push
          title="Move to Folder"
          icon={Icon.Folder}
          shortcut={getProjectDomainShortcut("moveFolder", shortcutStyle)}
          target={<MoveProjectView projectId={project.id} onUpdated={onUpdated} />}
        />
        <Action
          title={project.flagged ? "Unflag" : "Flag"}
          icon={Icon.Flag}
          shortcut={getProjectDomainShortcut("toggleFlag", shortcutStyle)}
          onAction={() =>
            runMutation(
              project.flagged ? "Removing flag…" : "Flagging project…",
              () => setProjectFlagged(project.id, !project.flagged),
              onUpdated,
            )
          }
        />
        <Action
          title="Duplicate Project"
          icon={Icon.Duplicate}
          shortcut={Keyboard.Shortcut.Common.Duplicate}
          onAction={() => runMutation("Duplicating project…", () => duplicateProject(project.id), onUpdated)}
        />
      </ActionPanel.Section>

      <ActionPanel.Section title="Status">
        {project.status !== "Active" && <Action title="Set Active" onAction={() => setStatus("Active")} />}
        {project.status !== "OnHold" && <Action title="Put on Hold" onAction={() => setStatus("OnHold")} />}
        {project.status !== "Done" && (
          <Action title="Complete Project" icon={Icon.CheckCircle} onAction={() => setStatus("Done")} />
        )}
        {project.status !== "Dropped" && (
          <Action
            title="Drop Project"
            icon={Icon.XMarkCircle}
            style={Action.Style.Destructive}
            onAction={() => setStatus("Dropped")}
          />
        )}
      </ActionPanel.Section>

      <ActionPanel.Section title="Copy">
        <Action.CopyToClipboard
          title="Copy OmniFocus Link"
          content={projectUrl(project.id)}
          icon={Icon.Link}
        />
        <Action.CopyToClipboard title="Copy Name" content={project.name} />
      </ActionPanel.Section>

      <ActionPanel.Section>
        <Action
          title="Delete Project"
          icon={Icon.Trash}
          style={Action.Style.Destructive}
          onAction={async () => {
            const confirmed = await confirmAlert({
              title: `Delete “${project.name}”?`,
              message: "This removes the project and all of its tasks from OmniFocus.",
              primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
            });
            if (confirmed) await runMutation("Deleting project…", () => deleteProject(project.id), onUpdated);
          }}
        />
      </ActionPanel.Section>

      <ActionPanel.Section>
        <Action
          title="Configure Project Actions…"
          icon={Icon.Gear}
          shortcut={{ modifiers: ["cmd", "shift"], key: "," }}
          onAction={openCommandPreferences}
        />
      </ActionPanel.Section>
    </ActionPanel>
  );
}
