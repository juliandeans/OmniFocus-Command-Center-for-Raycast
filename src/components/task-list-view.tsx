import {
  Action,
  ActionPanel,
  Alert,
  Color,
  Detail,
  Form,
  Icon,
  Keyboard,
  List,
  confirmAlert,
  openCommandPreferences,
  useNavigation,
} from "@raycast/api";
import { useCachedPromise, usePromise } from "@raycast/utils";
import { useState } from "react";
import type { OmniFocusTask } from "../types";
import {
  ActionShortcutStyle,
  TaskPrimaryAction,
  TaskSecondaryAction,
  getDomainShortcut,
  getTaskSecondaryAction,
  resolveTaskActionPreferences,
} from "../lib/action-preferences";
import {
  addSubtask,
  deleteTask,
  duplicateTask,
  moveTask,
  setTaskCompleted,
  setTaskDates,
  setTaskFlagged,
  setTaskTag,
  updateTask,
} from "../lib/omnifocus/mutations";
import { getPlannedDateCapability } from "../lib/omnifocus/capabilities";
import { getTask, listActiveProjects, listTags } from "../lib/omnifocus/queries";
import { taskUrl } from "../lib/omnifocus/links";
import { formatDate, runMutation } from "../lib/ui";
import { sanitizeMarkdown } from "../lib/sanitize";
import { OmniFocusEmptyView } from "../lib/omnifocus/requirements";
import { normalizeOmniFocusError } from "../lib/omnifocus/errors";
import { PlannedDateSupportNotice } from "./planned-date-support-notice";

export type TaskListViewProps = {
  title: string;
  tasks: OmniFocusTask[];
  isLoading?: boolean;
  error?: Error;
  onRefresh?: () => void | Promise<void>;
  emptyTitle?: string;
  showProject?: boolean;
  searchBarAccessory?: List.Props["searchBarAccessory"];
  allowComplete?: boolean;
  primaryAction?: TaskPrimaryAction;
  shortcutStyle?: ActionShortcutStyle;
};

function TaskDetail({ task, onUpdated }: { task: OmniFocusTask; onUpdated?: () => void | Promise<void> }) {
  const { data: fullTask, isLoading, error, revalidate } = usePromise(getTask, [task.id]);

  // Never claim the note state when the full task could not be loaded — the
  // reduced list DTO intentionally carries no note.
  if (error) {
    const normalized = normalizeOmniFocusError(error);
    return (
      <Detail
        navigationTitle={task.name}
        markdown={normalized.userMessage}
        actions={
          <ActionPanel>
            <Action.Open
              title="Open in OmniFocus"
              target={taskUrl(task.id)}
              application="OmniFocus"
              icon={Icon.ArrowRight}
            />
            <Action title="Retry" icon={Icon.ArrowClockwise} onAction={revalidate} />
          </ActionPanel>
        }
      />
    );
  }

  // Base metadata may fall back to the reduced list DTO while loading; the
  // note itself is only ever rendered from the full task.
  const base = fullTask ?? task;
  const noteMarkdown = fullTask ? sanitizeMarkdown(fullTask.note) || "_No note_" : "_Loading note…_";

  const metadata = (
    <Detail.Metadata>
      {base.projectName && <Detail.Metadata.Label title="Project" text={base.projectName} />}
      <Detail.Metadata.Label title="Status" text={base.status} />
      {base.tags.length > 0 && (
        <Detail.Metadata.TagList title="Tags">
          {base.tags.map((tag) => (
            <Detail.Metadata.TagList.Item key={tag.id} text={tag.name} />
          ))}
        </Detail.Metadata.TagList>
      )}
      {base.plannedDate && <Detail.Metadata.Label title="Planned" text={formatDate(base.plannedDate)} />}
      {base.deferDate && <Detail.Metadata.Label title="Defer" text={formatDate(base.deferDate)} />}
      {base.dueDate && <Detail.Metadata.Label title="Due" text={formatDate(base.dueDate)} />}
    </Detail.Metadata>
  );

  return (
    <Detail
      isLoading={isLoading}
      navigationTitle={task.name}
      markdown={noteMarkdown}
      metadata={metadata}
      actions={
        <ActionPanel>
          <Action.Open
            title="Open in OmniFocus"
            target={taskUrl(task.id)}
            application="OmniFocus"
            icon={Icon.ArrowRight}
          />
          <Action.Push
            title="Edit Task"
            icon={Icon.Pencil}
            target={
              <EditTaskForm
                task={task}
                onUpdated={async () => {
                  await revalidate();
                  await onUpdated?.();
                }}
              />
            }
          />
          {fullTask?.note ? (
            <Action.CopyToClipboard title="Copy Note" content={fullTask.note} icon={Icon.CopyClipboard} />
          ) : null}
          <Action.CopyToClipboard title="Copy OmniFocus Link" content={taskUrl(task.id)} icon={Icon.Link} />
        </ActionPanel>
      }
    />
  );
}

function EditTaskForm({ task, onUpdated }: { task: OmniFocusTask; onUpdated?: () => void | Promise<void> }) {
  const { pop } = useNavigation();
  const { data: fullTask, isLoading, error, revalidate } = usePromise(getTask, [task.id]);

  // The full task (including its note) MUST be loaded live before the form
  // becomes editable. Falling back to the reduced list DTO would present an
  // empty note that a save would then persist over the real OmniFocus note.
  if (error) {
    const normalized = normalizeOmniFocusError(error);
    return (
      <Form
        navigationTitle="Edit Task"
        actions={
          <ActionPanel>
            <Action title="Retry" icon={Icon.ArrowClockwise} onAction={revalidate} />
          </ActionPanel>
        }
      >
        <Form.Description title="Could Not Load Task" text={normalized.userMessage} />
        <Form.Description text="Name and note can only be edited after the task was loaded from OmniFocus." />
      </Form>
    );
  }

  if (!fullTask) {
    return <Form isLoading={isLoading} navigationTitle="Edit Task" />;
  }

  return (
    <Form
      navigationTitle="Edit Task"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Save Task"
            onSubmit={async (values: { name: string; note: string }) => {
              if (!values.name.trim()) return;
              if (
                await runMutation(
                  "Saving task…",
                  () => updateTask(task.id, { name: values.name.trim(), note: values.note }),
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
      <Form.TextField id="name" title="Task" defaultValue={fullTask.name} autoFocus />
      <Form.TextArea id="note" title="Note" defaultValue={fullTask.note ?? ""} />
    </Form>
  );
}

function TaskDatesForm({ task, onUpdated }: { task: OmniFocusTask; onUpdated?: () => void | Promise<void> }) {
  const { pop } = useNavigation();
  const {
    data: plannedDateSupported,
    isLoading: checkingCapability,
    error: capabilityError,
    revalidate: recheckCapability,
  } = usePromise(getPlannedDateCapability, []);

  return (
    <Form
      isLoading={checkingCapability}
      navigationTitle="Task Dates"
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
                    setTaskDates(task.id, {
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
          defaultValue={task.plannedDate ? new Date(task.plannedDate) : undefined}
        />
      ) : (
        <PlannedDateSupportNotice supported={plannedDateSupported} error={capabilityError} />
      )}
      <Form.DatePicker
        id="deferDate"
        title="Defer"
        type={Form.DatePicker.Type.Date}
        defaultValue={task.deferDate ? new Date(task.deferDate) : undefined}
      />
      <Form.DatePicker
        id="dueDate"
        title="Due"
        type={Form.DatePicker.Type.Date}
        defaultValue={task.dueDate ? new Date(task.dueDate) : undefined}
      />
    </Form>
  );
}

function AddSubtaskForm({
  task,
  onUpdated,
}: {
  task: OmniFocusTask;
  onUpdated?: () => void | Promise<void>;
}) {
  const { pop } = useNavigation();
  return (
    <Form
      navigationTitle="Add Subtask"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Add Subtask"
            onSubmit={async (values: { name: string }) => {
              const name = values.name.trim();
              if (!name) return;
              if (await runMutation("Creating subtask…", () => addSubtask(task.id, name), onUpdated)) {
                pop();
              }
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextField id="name" title="Subtask" placeholder="New subtask" autoFocus />
    </Form>
  );
}

function MoveTaskView({ task, onUpdated }: { task: OmniFocusTask; onUpdated?: () => void | Promise<void> }) {
  const { pop } = useNavigation();
  const { data: projects = [], isLoading } = useCachedPromise(listActiveProjects);
  const doMove = async (projectId?: string) => {
    if (await runMutation("Moving task…", () => moveTask(task.id, projectId), onUpdated)) {
      pop();
    }
  };
  return (
    <List isLoading={isLoading} navigationTitle="Move Task" searchBarPlaceholder="Search destination…">
      <List.Item
        title="Inbox"
        icon={Icon.Tray}
        actions={
          <ActionPanel>
            <Action title="Move to Inbox" onAction={() => doMove()} />
          </ActionPanel>
        }
      />
      {projects.map((project) => (
        <List.Item
          key={project.id}
          title={project.name}
          subtitle={project.folder ?? "Top Level"}
          actions={
            <ActionPanel>
              <Action title="Move Here" onAction={() => doMove(project.id)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

function ManageTaskTagsView({
  task,
  onUpdated,
}: {
  task: OmniFocusTask;
  onUpdated?: () => void | Promise<void>;
}) {
  const { data: tags = [], isLoading } = useCachedPromise(listTags);
  const [selectedTagIds, setSelectedTagIds] = useState(() => new Set(task.tags.map((tag) => tag.id)));
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
                      () => setTaskTag(task.id, tag.id, nextEnabled),
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

function taskAccessories(task: OmniFocusTask): List.Item.Accessory[] {
  const accessories: List.Item.Accessory[] = [];
  if (task.flagged) accessories.push({ icon: Icon.Flag });
  if (task.plannedDate)
    accessories.push({ tag: { value: `Plan ${formatDate(task.plannedDate)}`, color: Color.Blue } });
  if (task.dueDate)
    accessories.push({
      tag: {
        value: `Due ${formatDate(task.dueDate)}`,
        color: task.status === "Overdue" ? Color.Red : Color.Orange,
      },
    });
  if (task.tags.length) accessories.push(...task.tags.slice(0, 2).map((tag) => ({ tag: tag.name })));
  return accessories;
}

function TaskActions({
  task,
  onUpdated,
  allowComplete = false,
  primaryAction: explicitPrimary,
  shortcutStyle: explicitShortcutStyle,
}: {
  task: OmniFocusTask;
  onUpdated?: () => void | Promise<void>;
  allowComplete?: boolean;
  primaryAction?: TaskPrimaryAction;
  shortcutStyle?: ActionShortcutStyle;
}) {
  const preferences = resolveTaskActionPreferences(allowComplete);
  const primary = explicitPrimary ?? preferences.primary;
  const secondary = getTaskSecondaryAction(primary);
  const shortcutStyle = explicitShortcutStyle ?? preferences.shortcutStyle;

  const renderOpenAction = (isPrimary: boolean, isSecondary: boolean) => (
    <Action.Open
      key="open"
      title="Open in OmniFocus"
      target={taskUrl(task.id)}
      application="OmniFocus"
      icon={Icon.ArrowRight}
      shortcut={isPrimary || isSecondary ? undefined : Keyboard.Shortcut.Common.Open}
    />
  );

  const renderDetailsAction = (isPrimary: boolean, isSecondary: boolean) => (
    <Action.Push
      key="details"
      title="View Details"
      icon={Icon.Eye}
      target={<TaskDetail task={task} onUpdated={onUpdated} />}
      shortcut={isPrimary || isSecondary ? undefined : { modifiers: ["cmd"], key: "i" }}
    />
  );

  const renderEditAction = (isPrimary: boolean) => (
    <Action.Push
      key="edit"
      title="Edit Task"
      icon={Icon.Pencil}
      target={<EditTaskForm task={task} onUpdated={onUpdated} />}
      shortcut={isPrimary ? undefined : Keyboard.Shortcut.Common.Edit}
    />
  );

  const renderCompleteAction = (isPrimary: boolean) => (
    <Action
      key="complete"
      title={task.completed ? "Mark Incomplete" : "Complete"}
      icon={Icon.CheckCircle}
      shortcut={isPrimary ? undefined : { modifiers: ["cmd", "shift"], key: "enter" }}
      onAction={() =>
        runMutation(
          task.completed ? "Reopening task…" : "Completing task…",
          () => setTaskCompleted(task.id, !task.completed),
          onUpdated,
        )
      }
    />
  );

  const renderFlagAction = () => (
    <Action
      key="flag"
      title={task.flagged ? "Unflag" : "Flag"}
      icon={Icon.Flag}
      shortcut={getDomainShortcut("toggleFlag", shortcutStyle)}
      onAction={() =>
        runMutation(
          task.flagged ? "Removing flag…" : "Flagging task…",
          () => setTaskFlagged(task.id, !task.flagged),
          onUpdated,
        )
      }
    />
  );

  const renderSetDatesAction = () => (
    <Action.Push
      key="setDates"
      title="Set Dates"
      icon={Icon.Calendar}
      shortcut={getDomainShortcut("setDates", shortcutStyle)}
      target={<TaskDatesForm task={task} onUpdated={onUpdated} />}
    />
  );

  const renderManageTagsAction = () => (
    <Action.Push
      key="manageTags"
      title="Manage Tags"
      icon={Icon.Tag}
      shortcut={getDomainShortcut("manageTags", shortcutStyle)}
      target={<ManageTaskTagsView task={task} onUpdated={onUpdated} />}
    />
  );

  const renderMoveTaskAction = () => (
    <Action.Push
      key="moveTask"
      title="Move to Project"
      icon={Icon.ArrowRight}
      shortcut={getDomainShortcut("moveTask", shortcutStyle)}
      target={<MoveTaskView task={task} onUpdated={onUpdated} />}
    />
  );

  const renderAddSubtaskAction = () => (
    <Action.Push
      key="addSubtask"
      title="Add Subtask"
      icon={Icon.PlusCircle}
      shortcut={getDomainShortcut("addSubtask", shortcutStyle)}
      target={<AddSubtaskForm task={task} onUpdated={onUpdated} />}
    />
  );

  const renderDuplicateAction = () => (
    <Action
      key="duplicate"
      title="Duplicate Task"
      icon={Icon.Duplicate}
      shortcut={Keyboard.Shortcut.Common.Duplicate}
      onAction={() => runMutation("Duplicating task…", () => duplicateTask(task.id), onUpdated)}
    />
  );

  const renderDeleteAction = () => (
    <Action
      key="delete"
      title="Delete Task"
      icon={Icon.Trash}
      style={Action.Style.Destructive}
      onAction={async () => {
        const confirmed = await confirmAlert({
          title: `Delete “${task.name}”?`,
          message: "This removes the task from OmniFocus.",
          primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
        });
        if (confirmed) await runMutation("Deleting task…", () => deleteTask(task.id), onUpdated);
      }}
    />
  );

  const renderConfigureAction = () => (
    <Action
      key="configure"
      title="Configure Task Actions…"
      icon={Icon.Gear}
      shortcut={{ modifiers: ["cmd", "shift"], key: "," }}
      onAction={openCommandPreferences}
    />
  );

  const renderTopSlot = (
    actionId: TaskPrimaryAction | TaskSecondaryAction,
    role: "primary" | "secondary",
  ) => {
    const isPrimary = role === "primary";
    const isSecondary = role === "secondary";
    switch (actionId) {
      case "open":
        return renderOpenAction(isPrimary, isSecondary);
      case "details":
        return renderDetailsAction(isPrimary, isSecondary);
      case "edit":
        return renderEditAction(isPrimary);
      case "complete":
        return renderCompleteAction(isPrimary);
    }
  };

  return (
    <ActionPanel>
      {/* Primary Action (Slot 1 -> Enter) */}
      {renderTopSlot(primary, "primary")}

      {/* Secondary Action (Slot 2 -> Cmd+Enter) */}
      {renderTopSlot(secondary, "secondary")}

      {/* Remaining top frequent actions if not already rendered as Primary or Secondary */}
      {primary !== "open" && secondary !== "open" && renderOpenAction(false, false)}
      {primary !== "details" && secondary !== "details" && renderDetailsAction(false, false)}
      {primary !== "complete" && renderCompleteAction(false)}
      {renderFlagAction()}

      <ActionPanel.Section title="Edit">
        {primary !== "edit" && renderEditAction(false)}
        {renderSetDatesAction()}
        {renderManageTagsAction()}
        {renderMoveTaskAction()}
        {renderAddSubtaskAction()}
        {renderDuplicateAction()}
      </ActionPanel.Section>

      <ActionPanel.Section title="Copy">
        <Action.CopyToClipboard title="Copy OmniFocus Link" content={taskUrl(task.id)} icon={Icon.Link} />
        <Action.CopyToClipboard title="Copy Title" content={task.name} />
      </ActionPanel.Section>

      <ActionPanel.Section>{renderDeleteAction()}</ActionPanel.Section>

      <ActionPanel.Section>{renderConfigureAction()}</ActionPanel.Section>
    </ActionPanel>
  );
}

export function TaskListView({
  title,
  tasks,
  isLoading,
  error,
  onRefresh,
  emptyTitle = "No tasks found",
  showProject,
  searchBarAccessory,
  allowComplete,
  primaryAction,
  shortcutStyle,
}: TaskListViewProps) {
  return (
    <List
      isLoading={isLoading}
      navigationTitle={title}
      searchBarPlaceholder="Search tasks…"
      searchBarAccessory={searchBarAccessory}
    >
      {error && tasks.length === 0 ? (
        <OmniFocusEmptyView error={error} onRetry={onRefresh} />
      ) : tasks.length === 0 && !isLoading ? (
        <List.EmptyView title={emptyTitle} />
      ) : (
        tasks.map((task) => (
          <List.Item
            key={task.id}
            title={`${task.depth > 0 ? "› ".repeat(Math.min(task.depth, 3)) : ""}${task.name}`}
            subtitle={showProject ? (task.projectName ?? "Inbox") : (task.parentName ?? undefined)}
            icon={
              task.completed
                ? Icon.CheckCircle
                : task.status === "Overdue"
                  ? Icon.ExclamationMark
                  : Icon.Circle
            }
            accessories={taskAccessories(task)}
            keywords={[task.projectName ?? "Inbox", ...task.tags.map((tag) => tag.name)]}
            actions={
              <TaskActions
                task={task}
                onUpdated={onRefresh}
                allowComplete={allowComplete}
                primaryAction={primaryAction}
                shortcutStyle={shortcutStyle}
              />
            }
          />
        ))
      )}
    </List>
  );
}
