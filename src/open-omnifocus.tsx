import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { listPerspectives } from "./lib/omnifocus/queries";
import { OmniFocusEmptyView } from "./lib/omnifocus/requirements";

export default function Command() {
  const {
    data: perspectives = [],
    isLoading,
    error,
    revalidate,
  } = useCachedPromise(listPerspectives, [], { initialData: [] });
  return (
    <List
      isLoading={isLoading}
      navigationTitle="Open OmniFocus"
      searchBarPlaceholder="Search areas and perspectives…"
    >
      {error && perspectives.length === 0 ? (
        <OmniFocusEmptyView error={error} onRetry={revalidate} />
      ) : (
        <>
          <List.Section title="Built-in">
            {perspectives
              .filter((p) => p.kind === "built-in")
              .map((p) => (
                <List.Item
                  key={p.id}
                  title={p.name}
                  icon={Icon.AppWindow}
                  actions={
                    <ActionPanel>
                      <Action.Open title="Open in OmniFocus" target={p.url} application="OmniFocus" />
                    </ActionPanel>
                  }
                />
              ))}
          </List.Section>
          <List.Section title="Custom Perspectives">
            {perspectives
              .filter((p) => p.kind === "custom")
              .map((p) => (
                <List.Item
                  key={p.id}
                  title={p.name}
                  icon={Icon.Eye}
                  actions={
                    <ActionPanel>
                      <Action.Open title="Open Perspective" target={p.url} application="OmniFocus" />
                    </ActionPanel>
                  }
                />
              ))}
          </List.Section>
        </>
      )}
    </List>
  );
}
