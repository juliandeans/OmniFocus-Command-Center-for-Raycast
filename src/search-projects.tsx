import { Icon, List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { ProjectActions } from "./components/project-actions";
import { listActiveProjects } from "./lib/omnifocus/queries";
import { OmniFocusEmptyView } from "./lib/omnifocus/requirements";

export default function Command() {
  const {
    data: projects = [],
    error,
    isLoading,
    revalidate,
  } = useCachedPromise(listActiveProjects, [], {
    initialData: [],
    failureToastOptions: { title: "Could not load OmniFocus projects" },
  });
  return (
    <List
      isLoading={isLoading}
      navigationTitle="OmniFocus Projects"
      searchBarPlaceholder="Search active projects…"
    >
      {error && projects.length === 0 ? (
        <OmniFocusEmptyView error={error} onRetry={revalidate} />
      ) : !isLoading && projects.length === 0 ? (
        <List.EmptyView icon={Icon.Folder} title="No active projects" />
      ) : (
        projects.map((project) => (
          <List.Item
            key={project.id}
            title={project.name}
            subtitle={project.folder ?? "Top Level"}
            keywords={project.folder ? [project.folder] : ["top level"]}
            icon={Icon.Folder}
            actions={<ProjectActions project={project} onUpdated={revalidate} />}
          />
        ))
      )}
    </List>
  );
}
