import { Action, ActionPanel, Alert, Form, Icon, confirmAlert, useNavigation } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState } from "react";
import { createMultipleTasks } from "../lib/omnifocus/mutations";
import { listActiveProjects } from "../lib/omnifocus/queries";
import { parseTaskLines } from "../lib/parse";
import { batchConfirmationMessage, evaluateBatchSize } from "../lib/batch";
import { runMutation } from "../lib/ui";

type Props = { defaultProjectId?: string; onCreated?: () => void | Promise<void> };
type Values = { projectId: string; tasks: string };

export function AddMultipleTasksForm({ defaultProjectId, onCreated }: Props) {
  const { pop } = useNavigation();
  const { data: projects = [], isLoading } = useCachedPromise(listActiveProjects);
  const [error, setError] = useState<string>();

  async function submit(values: Values) {
    const names = parseTaskLines(values.tasks);
    if (!names.length) {
      setError("Enter at least one task, one per line");
      return;
    }
    const decision = evaluateBatchSize(names.length);
    if (!decision.allowed) {
      setError(decision.reason);
      return;
    }
    if (decision.requiresConfirmation) {
      const confirmed = await confirmAlert({
        title: `Create ${names.length} tasks?`,
        message: batchConfirmationMessage(names.length),
        primaryAction: { title: "Create Tasks" },
        dismissAction: { title: "Cancel", style: Alert.ActionStyle.Cancel },
      });
      if (!confirmed) return;
    }
    const success = await runMutation(
      `Creating ${names.length} tasks…`,
      async () => {
        await createMultipleTasks(values.projectId === "__inbox__" ? undefined : values.projectId, names);
      },
      {
        successTitle: `Created ${names.length} tasks`,
      },
    );
    if (success) {
      await onCreated?.();
      pop();
    }
  }

  return (
    <Form
      isLoading={isLoading}
      navigationTitle="Add Multiple Tasks"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Tasks" icon={Icon.Plus} onSubmit={submit} />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="projectId" title="Destination" defaultValue={defaultProjectId ?? "__inbox__"}>
        <Form.Dropdown.Item value="__inbox__" title="Inbox" icon={Icon.Tray} />
        {projects.map((project) => (
          <Form.Dropdown.Item key={project.id} value={project.id} title={project.name} />
        ))}
      </Form.Dropdown>
      <Form.TextArea
        id="tasks"
        title="Tasks"
        placeholder={"Hero überarbeiten\nMobile Navigation testen\nImpressum aktualisieren"}
        info="Every non-empty line becomes one separate OmniFocus task."
        error={error}
        onChange={() => setError(undefined)}
        autoFocus
      />
    </Form>
  );
}
