import { LaunchProps, Toast, showHUD, showToast } from "@raycast/api";
import { createTask } from "./lib/omnifocus/mutations";
import { normalizeOmniFocusError } from "./lib/omnifocus/errors";

type Arguments = { todo: string };

export default async function Command(props: LaunchProps<{ arguments: Arguments }>) {
  const name = props.arguments.todo.trim();
  if (!name) {
    await showHUD("Task title is empty");
    return;
  }
  try {
    await createTask({ name });
    await showHUD(`Added to OmniFocus Inbox: ${name}`);
  } catch (error) {
    const normalized = normalizeOmniFocusError(error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Could not add task",
      message: normalized.userMessage,
    });
  }
}
