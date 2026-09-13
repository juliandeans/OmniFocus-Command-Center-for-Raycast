import { Action, ActionPanel, Form, Icon, useNavigation } from "@raycast/api";
import { useCachedPromise, usePromise } from "@raycast/utils";
import { useState } from "react";
import { createTask } from "../lib/omnifocus/mutations";
import { listActiveProjects, listTags } from "../lib/omnifocus/queries";
import { getPlannedDateCapability } from "../lib/omnifocus/capabilities";
import { runMutation } from "../lib/ui";
import { PlannedDateSupportNotice } from "./planned-date-support-notice";

type Props = { defaultProjectId?: string; parentTaskId?: string; onCreated?: () => void | Promise<void> };

type Values = {
  name: string;
  projectId: string;
  tagIds: string[];
  note: string;
  flagged: boolean;
  dueDate: Date | null;
  deferDate: Date | null;
  plannedDate: Date | null;
};

export function AddTaskForm({ defaultProjectId, parentTaskId, onCreated }: Props) {
  const { pop } = useNavigation();
  const { data: projects = [], isLoading: projectsLoading } = useCachedPromise(listActiveProjects);
  const { data: tags = [], isLoading: tagsLoading } = useCachedPromise(listTags);
  const {
    data: plannedDateSupported,
    isLoading: checkingCapability,
    error: capabilityError,
    revalidate: recheckCapability,
  } = usePromise(getPlannedDateCapability, []);
  const [nameError, setNameError] = useState<string>();

  async function submit(values: Values) {
    const name = values.name.trim();
    if (!name) {
      setNameError("Task title is required");
      return;
    }
    const success = await runMutation(
      "Creating task…",
      () =>
        createTask({
          name,
          parentTaskId,
          projectId: parentTaskId
            ? undefined
            : values.projectId === "__inbox__"
              ? undefined
              : values.projectId,
          tagIds: values.tagIds,
          note: values.note,
          flagged: values.flagged,
          dueDate: values.dueDate,
          deferDate: values.deferDate,
          plannedDate: plannedDateSupported ? values.plannedDate : undefined,
        }),
      {
        successTitle: "Task created",
      },
    );
    if (success) {
      await onCreated?.();
      pop();
    }
  }

  return (
    <Form
      isLoading={projectsLoading || tagsLoading || checkingCapability}
      navigationTitle={parentTaskId ? "Add Subtask" : "Add Task"}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Task" icon={Icon.Plus} onSubmit={submit} />
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
      <Form.TextField
        id="name"
        title="Task"
        placeholder="What needs to be done?"
        autoFocus
        error={nameError}
        onChange={() => setNameError(undefined)}
      />
      {!parentTaskId && (
        <Form.Dropdown id="projectId" title="Destination" defaultValue={defaultProjectId ?? "__inbox__"}>
          <Form.Dropdown.Item value="__inbox__" title="Inbox" icon={Icon.Tray} />
          {projects.map((project) => (
            <Form.Dropdown.Item key={project.id} value={project.id} title={project.name} />
          ))}
        </Form.Dropdown>
      )}
      <Form.TagPicker id="tagIds" title="Tags">
        {tags.map((tag) => (
          <Form.TagPicker.Item key={tag.id} value={tag.id} title={tag.path} />
        ))}
      </Form.TagPicker>
      {plannedDateSupported ? (
        <Form.DatePicker id="plannedDate" title="Planned" type={Form.DatePicker.Type.Date} />
      ) : (
        <PlannedDateSupportNotice supported={plannedDateSupported} error={capabilityError} />
      )}
      <Form.DatePicker id="deferDate" title="Defer" type={Form.DatePicker.Type.Date} />
      <Form.DatePicker id="dueDate" title="Due" type={Form.DatePicker.Type.Date} />
      <Form.Checkbox id="flagged" label="Flag task" />
      <Form.TextArea id="note" title="Note" placeholder="Optional note" />
    </Form>
  );
}
