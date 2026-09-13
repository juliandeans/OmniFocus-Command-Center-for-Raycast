import { Action, ActionPanel, Alert, Form, Icon, Toast, confirmAlert, open, showToast } from "@raycast/api";
import { useCachedPromise, usePromise } from "@raycast/utils";
import { useState } from "react";
import { createProject } from "./lib/omnifocus/mutations";
import { listFolders, listTags } from "./lib/omnifocus/queries";
import { getPlannedDateCapability } from "./lib/omnifocus/capabilities";
import { parseTaskLines } from "./lib/parse";
import { BATCH_HARD_LIMIT, BATCH_SOFT_LIMIT, batchConfirmationMessage, evaluateBatchSize } from "./lib/batch";
import { projectUrl } from "./lib/omnifocus/links";
import { normalizeOmniFocusError } from "./lib/omnifocus/errors";
import { PlannedDateSupportNotice } from "./components/planned-date-support-notice";

type Values = {
  name: string;
  folderId: string;
  type: "parallel" | "sequential" | "single-actions";
  tagIds: string[];
  plannedDate: Date | null;
  deferDate: Date | null;
  dueDate: Date | null;
  flagged: boolean;
  note: string;
  initialTasks: string;
};

export default function Command() {
  const { data: folders = [], isLoading: foldersLoading } = useCachedPromise(listFolders);
  const { data: tags = [], isLoading: tagsLoading } = useCachedPromise(listTags);
  const {
    data: plannedDateSupported,
    isLoading: checkingCapability,
    error: capabilityError,
    revalidate: recheckCapability,
  } = usePromise(getPlannedDateCapability, []);
  const [nameError, setNameError] = useState<string>();
  const [initialTasksError, setInitialTasksError] = useState<string>();

  async function submit(values: Values) {
    const name = values.name.trim();
    if (!name) {
      setNameError("Project name is required");
      return;
    }
    const initialTasks = parseTaskLines(values.initialTasks);
    const batchDecision = evaluateBatchSize(initialTasks.length);
    if (!batchDecision.allowed) {
      setInitialTasksError(batchDecision.reason);
      return;
    }
    if (batchDecision.requiresConfirmation) {
      const confirmed = await confirmAlert({
        title: `Create project with ${initialTasks.length} tasks?`,
        message: batchConfirmationMessage(initialTasks.length),
        primaryAction: { title: "Create Project" },
        dismissAction: { title: "Cancel", style: Alert.ActionStyle.Cancel },
      });
      if (!confirmed) return;
    }
    const toast = await showToast({ style: Toast.Style.Animated, title: "Creating project…" });
    try {
      const project = await createProject({
        name,
        folderId: values.folderId === "__top__" ? undefined : values.folderId,
        type: values.type,
        tagIds: values.tagIds,
        plannedDate: plannedDateSupported ? values.plannedDate : undefined,
        deferDate: values.deferDate,
        dueDate: values.dueDate,
        flagged: values.flagged,
        note: values.note,
        initialTasks,
      });
      toast.style = Toast.Style.Success;
      toast.title = "Project created";
      toast.primaryAction = {
        title: "Open in OmniFocus",
        onAction: () => open(projectUrl(project.id), "OmniFocus"),
      };
    } catch (error) {
      const normalized = normalizeOmniFocusError(error);
      toast.style = Toast.Style.Failure;
      toast.title = "Could not create project";
      toast.message = normalized.userMessage;
    }
  }

  return (
    <Form
      isLoading={foldersLoading || tagsLoading || checkingCapability}
      navigationTitle="Create Project"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Project" icon={Icon.Plus} onSubmit={submit} />
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
        title="Project"
        placeholder="Project name"
        autoFocus
        error={nameError}
        onChange={() => setNameError(undefined)}
      />
      <Form.Dropdown id="folderId" title="Folder" defaultValue="__top__">
        <Form.Dropdown.Item value="__top__" title="Top Level" />
        {folders.map((folder) => (
          <Form.Dropdown.Item key={folder.id} value={folder.id} title={folder.path} />
        ))}
      </Form.Dropdown>
      <Form.Dropdown id="type" title="Type" defaultValue="parallel">
        <Form.Dropdown.Item value="parallel" title="Parallel" />
        <Form.Dropdown.Item value="sequential" title="Sequential" />
        <Form.Dropdown.Item value="single-actions" title="Single Actions" />
      </Form.Dropdown>
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
      <Form.Checkbox id="flagged" label="Flag project" />
      <Form.TextArea id="note" title="Note" placeholder="Optional project note" />
      <Form.TextArea
        id="initialTasks"
        title="Initial Tasks"
        placeholder={"Research\nDraft\nReview\nRelease"}
        info={`Optional. Every non-empty line becomes a separate task. More than ${BATCH_HARD_LIMIT} tasks are rejected; more than ${BATCH_SOFT_LIMIT} require confirmation.`}
        error={initialTasksError}
        onChange={() => setInitialTasksError(undefined)}
      />
    </Form>
  );
}
