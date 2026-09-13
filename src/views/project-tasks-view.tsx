import { useCachedPromise } from "@raycast/utils";
import { listProjectTasks } from "../lib/omnifocus/queries";
import { TaskListView } from "../components/task-list-view";

export function ProjectTasksView({ projectId, projectName }: { projectId: string; projectName: string }) {
  const {
    data: tasks = [],
    isLoading,
    error,
    revalidate,
  } = useCachedPromise(listProjectTasks, [projectId], { initialData: [] });
  return (
    <TaskListView
      title={projectName}
      tasks={tasks}
      isLoading={isLoading}
      error={error}
      onRefresh={revalidate}
      emptyTitle={`No tasks in ${projectName}`}
      showProject={false}
    />
  );
}
