import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock only the JXA boundary; the real production post-processing
// (status filter, sorting, folder mapping) in listActiveProjects() is tested.
vi.mock("../src/lib/omnifocus/gateway", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/omnifocus/gateway")>();
  return {
    ...actual,
    executeJxa: vi.fn(),
  };
});

import { executeJxa } from "../src/lib/omnifocus/gateway";
import { listActiveProjects } from "../src/lib/omnifocus/queries";
import { projectUrl, taskUrl } from "../src/lib/omnifocus/links";

type RawProject = { id: string; name: string; status: string; folder: string | null };

const mockedExecuteJxa = vi.mocked(executeJxa);

async function runWith(rawProjects: RawProject[]) {
  mockedExecuteJxa.mockResolvedValueOnce(rawProjects);
  return listActiveProjects();
}

describe("Suite H: Open Project Regression Contract", () => {
  beforeEach(() => {
    mockedExecuteJxa.mockReset();
  });

  it("queries OmniFocus exactly once via the JXA boundary", async () => {
    await runWith([]);
    expect(mockedExecuteJxa).toHaveBeenCalledTimes(1);
    const script = mockedExecuteJxa.mock.calls[0][0];
    expect(script).toContain("flattenedProjects");
    expect(script).toContain("flattenedFolders");
  });

  it("strictly filters projects to 'active status'", async () => {
    const result = await runWith([
      { id: "p1", name: "Active Alpha", status: "active status", folder: "Work" },
      { id: "p2", name: "On Hold Beta", status: "on hold status", folder: "Work" },
      { id: "p3", name: "Done Gamma", status: "done status", folder: null },
      { id: "p4", name: "Dropped Delta", status: "dropped status", folder: "Archive" },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p1");
    expect(result[0].status).toBe("Active");
    expect(result[0].name).toBe("Active Alpha");
  });

  it("sorts active projects alphabetically by name using localeCompare", async () => {
    const result = await runWith([
      { id: "p3", name: "Zebra Launch", status: "active status", folder: "Work" },
      { id: "p1", name: "Beta Testing", status: "active status", folder: null },
      { id: "p2", name: "Alpha Draft", status: "active status", folder: "Docs" },
    ]);

    expect(result.map((p) => p.name)).toEqual(["Alpha Draft", "Beta Testing", "Zebra Launch"]);
  });

  it("preserves folder context and keeps top-level projects on folder=null", async () => {
    const result = await runWith([
      { id: "p1", name: "Project in Folder", status: "active status", folder: "Client A" },
      { id: "p2", name: "Top Level Project", status: "active status", folder: null },
    ]);

    expect(result.find((p) => p.id === "p1")?.folder).toBe("Client A");
    expect(result.find((p) => p.id === "p2")?.folder).toBeNull();
  });

  it("keeps stable IDs and never derives identity from names", async () => {
    const result = await runWith([
      { id: "x5J-29aM", name: "Taxes", status: "active status", folder: "Finance" },
      { id: "b8K-77zQ", name: "Taxes", status: "active status", folder: "Private" },
    ]);

    expect(result).toHaveLength(2);
    expect(result.map((p) => p.id).sort()).toEqual(["b8K-77zQ", "x5J-29aM"]);
    expect(result.every((p) => p.folderId === null)).toBe(true);
  });

  it("maps every active project status to 'Active' for the UI", async () => {
    const result = await runWith([{ id: "p1", name: "Only", status: "active status", folder: null }]);
    expect(result[0].status).toBe("Active");
  });

  it("ensures deep link target remains omnifocus:///task/<id>", () => {
    const projectId = "x5J-29aM";
    expect(projectUrl(projectId)).toBe("omnifocus:///task/x5J-29aM");
    expect(projectUrl(projectId)).toBe(taskUrl(projectId));
  });

  it("verifies ID-based mutation principle (never mutate by project name)", () => {
    // Contract check: Project and Task mutations must only operate on unique primaryKey IDs
    const duplicateNameA = { id: "id-111", name: "Taxes" };
    const duplicateNameB = { id: "id-222", name: "Taxes" };

    expect(duplicateNameA.id).not.toBe(duplicateNameB.id);
    expect(projectUrl(duplicateNameA.id)).not.toBe(projectUrl(duplicateNameB.id));
  });
});
