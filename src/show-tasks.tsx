import { ProjectPicker } from "./components/project-picker";
import { ProjectTasksView } from "./views/project-tasks-view";

export default function Command() {
  return (
    <ProjectPicker
      title="Show Tasks"
      onSelect={(project) => <ProjectTasksView projectId={project.id} projectName={project.name} />}
    />
  );
}
