import { List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useMemo, useState } from "react";
import { TaskListView } from "./components/task-list-view";
import { listOpenTasks } from "./lib/omnifocus/queries";

type Filter =
  "all" | "available" | "next" | "due-soon" | "overdue" | "flagged" | "recently-added" | "recently-modified";

export default function Command() {
  const [filter, setFilter] = useState<Filter>("all");
  const {
    data: tasks = [],
    isLoading,
    error,
    revalidate,
  } = useCachedPromise(listOpenTasks, [], { initialData: [] });
  const filtered = useMemo(() => {
    const sevenDays = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const selected = tasks.filter((task) => {
      if (filter === "all") return true;
      if (filter === "available") return ["Available", "DueSoon", "Next", "Overdue"].includes(task.status);
      if (filter === "next") return task.status === "Next";
      if (filter === "due-soon") return task.status === "DueSoon";
      if (filter === "overdue") return task.status === "Overdue";
      if (filter === "flagged") return task.flagged;
      if (filter === "recently-added") return !!task.added && new Date(task.added).getTime() >= sevenDays;
      return !!task.modified && new Date(task.modified).getTime() >= sevenDays;
    });
    if (filter === "recently-added")
      return selected.sort((a, b) => (b.added ?? "").localeCompare(a.added ?? ""));
    if (filter === "recently-modified")
      return selected.sort((a, b) => (b.modified ?? "").localeCompare(a.modified ?? ""));
    return selected;
  }, [tasks, filter]);

  const dropdown = (
    <List.Dropdown tooltip="Task Filter" value={filter} onChange={(value) => setFilter(value as Filter)}>
      <List.Dropdown.Item title="All Open" value="all" />
      <List.Dropdown.Item title="Available" value="available" />
      <List.Dropdown.Item title="Next" value="next" />
      <List.Dropdown.Item title="Due Soon" value="due-soon" />
      <List.Dropdown.Item title="Overdue" value="overdue" />
      <List.Dropdown.Item title="Flagged" value="flagged" />
      <List.Dropdown.Item title="Recently Added (7 days)" value="recently-added" />
      <List.Dropdown.Item title="Recently Modified (7 days)" value="recently-modified" />
    </List.Dropdown>
  );
  return (
    <TaskListView
      title="Search Tasks"
      tasks={filtered}
      isLoading={isLoading}
      error={error}
      onRefresh={revalidate}
      searchBarAccessory={dropdown}
    />
  );
}
