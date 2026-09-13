import { useCachedPromise } from "@raycast/utils";
import { TaskListView } from "./components/task-list-view";
import { listInboxTasks } from "./lib/omnifocus/queries";

export default function Command() {
  const {
    data: tasks = [],
    isLoading,
    error,
    revalidate,
  } = useCachedPromise(listInboxTasks, [], { initialData: [] });
  return (
    <TaskListView
      title="Inbox"
      tasks={tasks}
      isLoading={isLoading}
      error={error}
      onRefresh={revalidate}
      emptyTitle="Inbox is empty"
      showProject={false}
      allowComplete
    />
  );
}
