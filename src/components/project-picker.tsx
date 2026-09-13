import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import type { OmniFocusProject } from "../types";
import { listActiveProjects } from "../lib/omnifocus/queries";
import { OmniFocusEmptyView } from "../lib/omnifocus/requirements";

type Props = {
  title: string;
  onSelect: (project: OmniFocusProject) => React.ReactNode;
  includeInbox?: boolean;
  onInbox?: () => React.ReactNode;
};

export function ProjectPicker({ title, onSelect, includeInbox, onInbox }: Props) {
  const {
    data: projects = [],
    isLoading,
    error,
    revalidate,
  } = useCachedPromise(listActiveProjects, [], { initialData: [] });
  return (
    <List isLoading={isLoading} navigationTitle={title} searchBarPlaceholder="Search projects…">
      {includeInbox && onInbox && (
        <List.Item
          title="Inbox"
          icon={Icon.Tray}
          actions={
            <ActionPanel>
              <Action.Push title="Select Inbox" target={onInbox()} />
            </ActionPanel>
          }
        />
      )}
      {error && projects.length === 0 ? (
        <OmniFocusEmptyView error={error} onRetry={revalidate} />
      ) : (
        projects.map((project) => (
          <List.Item
            key={project.id}
            title={project.name}
            subtitle={project.folder ?? "Top Level"}
            keywords={project.folder ? [project.folder] : ["top level"]}
            icon={Icon.Folder}
            actions={
              <ActionPanel>
                <Action.Push title="Select Project" target={onSelect(project)} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
