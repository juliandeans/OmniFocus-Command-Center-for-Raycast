import { beforeEach, describe, expect, it, vi } from "vitest";

// Keep the real j()/iso() helpers; only intercept the Omni Automation boundary
// so the actual production script builder is under test.
vi.mock("../src/lib/omnifocus/gateway", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/omnifocus/gateway")>();
  return {
    ...actual,
    executeOmniAutomation: vi.fn(async () => ({ id: "t1", name: "Test Task" })),
  };
});

import { executeOmniAutomation } from "../src/lib/omnifocus/gateway";
import {
  createMultipleTasks,
  createProject,
  createTask,
  setProjectDates,
  setTaskDates,
} from "../src/lib/omnifocus/mutations";

const mockedExecute = vi.mocked(executeOmniAutomation);

function lastScript(): string {
  const call = mockedExecute.mock.calls.at(-1);
  if (!call) throw new Error("executeOmniAutomation was not called");
  return call[0];
}

describe("Suite I: Optional Date Assignment Contract (mutations)", () => {
  beforeEach(() => {
    mockedExecute.mockClear();
  });

  it("createTask({ name }) touches no date properties at all (Quick Add to Inbox)", async () => {
    await createTask({ name: "Inbox capture" });
    const script = lastScript();
    expect(script).not.toContain(".plannedDate");
    expect(script).not.toContain(".dueDate");
    expect(script).not.toContain(".deferDate");
    expect(script).not.toContain("planned_date_unsupported");
  });

  it("plannedDate: undefined → no .plannedDate assignment code", async () => {
    await createTask({ name: "Task", plannedDate: undefined });
    expect(lastScript()).not.toContain(".plannedDate");
  });

  it("plannedDate: null → explicit task.plannedDate = null", async () => {
    await createTask({ name: "Task", plannedDate: null });
    const script = lastScript();
    expect(script).toContain("task.plannedDate = null;");
    expect(script).toContain("planned_date_unsupported");
  });

  it("plannedDate: Date → correct date assignment", async () => {
    const date = new Date("2026-03-01T12:00:00.000Z");
    await createTask({ name: "Task", plannedDate: date });
    const script = lastScript();
    expect(script).toContain('task.plannedDate = new Date("2026-03-01T12:00:00.000Z");');
    expect(script).not.toContain("task.plannedDate = null;");
  });

  it("dueDate: undefined → no .dueDate assignment; null → explicit reset", async () => {
    await createTask({ name: "Task", dueDate: undefined });
    expect(lastScript()).not.toContain(".dueDate");

    mockedExecute.mockClear();
    await createTask({ name: "Task", dueDate: null });
    expect(lastScript()).toContain("task.dueDate = null;");
  });

  it("createProject without planned date → no .plannedDate token in script", async () => {
    await createProject({ name: "Project", type: "parallel" });
    const script = lastScript();
    expect(script).not.toContain(".plannedDate");
    expect(script).not.toContain(".dueDate");
    expect(script).not.toContain(".deferDate");
  });

  it("createProject with planned date → project.task.plannedDate assignment", async () => {
    const date = new Date("2026-04-15T09:30:00.000Z");
    await createProject({ name: "Project", type: "parallel", plannedDate: date });
    expect(lastScript()).toContain('project.task.plannedDate = new Date("2026-04-15T09:30:00.000Z");');

    mockedExecute.mockClear();
    await createProject({ name: "Project", type: "parallel", plannedDate: null });
    expect(lastScript()).toContain("project.task.plannedDate = null;");
  });

  it("setTaskDates({}) → no date assignment code", async () => {
    await setTaskDates("t1", {});
    const script = lastScript();
    expect(script).not.toContain(".plannedDate");
    expect(script).not.toContain(".dueDate");
    expect(script).not.toContain(".deferDate");
  });

  it("setTaskDates resets dueDate only, leaves planned/defer untouched", async () => {
    await setTaskDates("t1", { dueDate: null });
    const script = lastScript();
    expect(script).toContain("task.dueDate = null;");
    expect(script).not.toContain(".plannedDate");
    expect(script).not.toContain(".deferDate");
  });

  it("setTaskDates assigns a planned date when explicitly set", async () => {
    await setTaskDates("t1", { plannedDate: new Date("2026-05-01T00:00:00.000Z") });
    const script = lastScript();
    expect(script).toContain('task.plannedDate = new Date("2026-05-01T00:00:00.000Z");');
    expect(script).not.toContain("task.deferDate");
    expect(script).not.toContain("task.dueDate");
  });

  it("setProjectDates follows the same contract on project.task", async () => {
    await setProjectDates("p1", {});
    expect(lastScript()).not.toContain(".plannedDate");

    mockedExecute.mockClear();
    await setProjectDates("p1", { plannedDate: null, deferDate: new Date("2026-06-01T00:00:00.000Z") });
    const script = lastScript();
    expect(script).toContain("project.task.plannedDate = null;");
    expect(script).toContain('project.task.deferDate = new Date("2026-06-01T00:00:00.000Z");');
    expect(script).not.toContain("project.task.dueDate");
  });

  it("createMultipleTasks with more than the hard limit rejects without any Omni Automation call", async () => {
    const names = Array.from({ length: 201 }, (_, i) => `Task ${i + 1}`);
    await expect(createMultipleTasks(undefined, names)).rejects.toMatchObject({ code: "invalid_input" });
    expect(mockedExecute).not.toHaveBeenCalled();
  });

  it("createMultipleTasks at the hard limit is allowed", async () => {
    const names = Array.from({ length: 200 }, (_, i) => `Task ${i + 1}`);
    await expect(createMultipleTasks(undefined, names)).resolves.toBeDefined();
    expect(mockedExecute).toHaveBeenCalledTimes(1);
  });

  it("createProject with more than the hard limit of initial tasks rejects without any write", async () => {
    const initialTasks = Array.from({ length: 201 }, (_, i) => `Task ${i + 1}`);
    await expect(
      createProject({ name: "Big Project", type: "parallel", initialTasks }),
    ).rejects.toMatchObject({
      code: "invalid_input",
    });
    expect(mockedExecute).not.toHaveBeenCalled();
  });
});
