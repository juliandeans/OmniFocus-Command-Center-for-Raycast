import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { TaskListView } from "./components/task-list-view";
import { listTags, listTasksForTag } from "./lib/omnifocus/queries";
import { OmniFocusEmptyView } from "./lib/omnifocus/requirements";

function TagTasks({ tagId, tagName }: { tagId: string; tagName: string }) {
  const {
    data: tasks = [],
    isLoading,
    error,
    revalidate,
  } = useCachedPromise(listTasksForTag, [tagId], { initialData: [] });
  return (
    <TaskListView
      title={tagName}
      tasks={tasks}
      isLoading={isLoading}
      error={error}
      onRefresh={revalidate}
      emptyTitle={`No open tasks tagged ${tagName}`}
    />
  );
}

export default function Command() {
  const { data: tags = [], isLoading, error } = useCachedPromise(listTags, [], { initialData: [] });
  return (
    <List isLoading={isLoading} navigationTitle="Browse by Tag" searchBarPlaceholder="Search tags…">
      {error && tags.length === 0 ? (
        <OmniFocusEmptyView error={error} />
      ) : (
        tags.map((tag) => (
          <List.Item
            key={tag.id}
            title={tag.path}
            icon={Icon.Tag}
            actions={
              <ActionPanel>
                <Action.Push title="Show Tasks" target={<TagTasks tagId={tag.id} tagName={tag.path} />} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
