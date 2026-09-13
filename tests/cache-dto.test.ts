import { describe, expect, it } from "vitest";
import { OMNI_SERIALIZERS } from "../src/lib/omnifocus/serialize";

describe("Suite G: Cache DTO & Note Privacy", () => {
  const evalSerializers = () => {
    const fn = new Function(`
      const Task = {
        Status: {
          Available: 0,
          Blocked: 1,
          Completed: 2,
          Dropped: 3,
          DueSoon: 4,
          Next: 5,
          Overdue: 6,
        },
      };
      const Project = {
        Status: {
          Active: 0,
          OnHold: 1,
          Done: 2,
          Dropped: 3,
        },
      };
      ${OMNI_SERIALIZERS}
      return { serializeTask, serializeProject };
    `);
    return fn() as {
      serializeTask: (task: unknown, options?: unknown) => Record<string, unknown>;
      serializeProject: (project: unknown, options?: unknown) => Record<string, unknown>;
    };
  };

  const sampleTask = {
    id: { primaryKey: "task-abc" },
    name: "Confidential Strategy",
    note: "Secret client meeting notes and passwords that must NOT be written to disk cache.",
    flagged: false,
    completed: false,
    dropDate: null,
    taskStatus: 0,
    dueDate: null,
    deferDate: null,
    plannedDate: null,
    added: null,
    modified: null,
    containingProject: null,
    parent: null,
    inInbox: true,
    tags: [],
  };

  it("omits note from list task DTO while preserving hasNote flag", () => {
    const { serializeTask } = evalSerializers();
    const listDto = serializeTask(sampleTask);

    // note MUST be undefined in the list DTO
    expect(listDto.note).toBeUndefined();
    expect(listDto.hasNote).toBe(true);

    // When serialized to JSON (as useCachedPromise does to disk), the note property must not exist
    const jsonString = JSON.stringify(listDto);
    const parsedJson = JSON.parse(jsonString);

    expect(parsedJson).not.toHaveProperty("note");
    expect(parsedJson.hasNote).toBe(true);
    expect(jsonString).not.toContain("Secret client meeting notes");
  });

  it("includes note in full task DTO when explicitly requested for single-item live fetch", () => {
    const { serializeTask } = evalSerializers();
    const detailDto = serializeTask(sampleTask, { includeNote: true });

    expect(detailDto.note).toBe(sampleTask.note);
    expect(detailDto.hasNote).toBe(true);

    const jsonString = JSON.stringify(detailDto);
    expect(jsonString).toContain("Secret client meeting notes");
  });

  it("correctly sets hasNote: false when task note is empty or whitespace", () => {
    const { serializeTask } = evalSerializers();
    const emptyNoteTask = { ...sampleTask, note: "   " };
    const listDto = serializeTask(emptyNoteTask);

    expect(listDto.note).toBeUndefined();
    expect(listDto.hasNote).toBe(false);
  });

  it("omits note from project list DTO while including it for single-item fetch", () => {
    const { serializeProject } = evalSerializers();
    const sampleProject = {
      id: { primaryKey: "proj-1" },
      name: "Confidential Project",
      status: 0,
      parentFolder: null,
      task: {
        note: "Project secret note",
        flagged: false,
        dueDate: null,
        deferDate: null,
        plannedDate: null,
      },
      nextReviewDate: null,
      lastReviewDate: null,
      sequential: false,
      containsSingletonActions: false,
      tags: [],
    };

    const listDto = serializeProject(sampleProject);
    expect(listDto.note).toBeUndefined();
    expect(listDto.hasNote).toBe(true);
    expect(JSON.stringify(listDto)).not.toContain("Project secret note");

    const fullDto = serializeProject(sampleProject, { includeNote: true });
    expect(fullDto.note).toBe("Project secret note");
    expect(fullDto.hasNote).toBe(true);
  });
});
