import { Toast, showToast } from "@raycast/api";
import { normalizeOmniFocusError } from "./omnifocus/errors";

export type MutationOptions = {
  loadingTitle?: string;
  successTitle?: string;
  onSuccess?: () => void | Promise<void>;
};

export async function runMutation(
  actionTitle: string,
  action: () => Promise<unknown>,
  onDoneOrOptions?: (() => void | Promise<void>) | MutationOptions,
): Promise<boolean> {
  const options: MutationOptions =
    typeof onDoneOrOptions === "function" ? { onSuccess: onDoneOrOptions } : (onDoneOrOptions ?? {});

  const loadingTitle = options.loadingTitle ?? actionTitle;
  const successTitle = options.successTitle ?? actionTitle.replace(/…$/, "");

  const toast = await showToast({ style: Toast.Style.Animated, title: loadingTitle });
  try {
    await action();
    toast.style = Toast.Style.Success;
    toast.title = successTitle;
    await options.onSuccess?.();
    return true;
  } catch (error) {
    const normalized = normalizeOmniFocusError(error);
    toast.style = Toast.Style.Failure;
    toast.title = "OmniFocus action failed";
    toast.message = normalized.userMessage;
    return false;
  }
}

export function formatDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString();
}
