import { Icon, List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { ProjectActions } from "./components/project-actions";
import { listReviewProjects } from "./lib/omnifocus/queries";
import { formatDate } from "./lib/ui";
import { OmniFocusEmptyView } from "./lib/omnifocus/requirements";

export default function Command() {
  const {
    data: projects = [],
    isLoading,
    error,
    revalidate,
  } = useCachedPromise(listReviewProjects, [], { initialData: [] });
  return (
    <List
      isLoading={isLoading}
      navigationTitle="Review Projects"
      searchBarPlaceholder="Search review-due projects…"
    >
      {error && projects.length === 0 ? (
        <OmniFocusEmptyView error={error} onRetry={revalidate} />
      ) : projects.length === 0 && !isLoading ? (
        <List.EmptyView
          title="No projects need review"
          description="No active or on-hold project has a review date due right now."
        />
      ) : (
        projects.map((project) => (
          <List.Item
            key={project.id}
            title={project.name}
            subtitle={project.folder ?? "Top Level"}
            icon={Icon.ArrowClockwise}
            accessories={
              project.nextReviewDate ? [{ tag: `Review ${formatDate(project.nextReviewDate)}` }] : []
            }
            actions={<ProjectActions project={project} onUpdated={revalidate} />}
          />
        ))
      )}
    </List>
  );
}
