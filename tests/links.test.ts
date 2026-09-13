import { describe, expect, it } from "vitest";
import { customPerspectiveUrl, folderUrl, projectUrl, taskUrl } from "../src/lib/omnifocus/links";

describe("Suite B: Deep Links", () => {
  it("generates stable task deep links", () => {
    expect(taskUrl("b2wT7d9Qp-1")).toBe("omnifocus:///task/b2wT7d9Qp-1");
  });

  it("generates stable project deep links using task URL scheme", () => {
    expect(projectUrl("p100A")).toBe("omnifocus:///task/p100A");
  });

  it("generates folder deep links", () => {
    expect(folderUrl("f456")).toBe("omnifocus:///folder/f456");
  });

  it("encodes special characters in task and folder IDs defensively", () => {
    // ID with hash
    expect(taskUrl("id#123")).toBe("omnifocus:///task/id%23123");
    expect(projectUrl("p#123")).toBe("omnifocus:///task/p%23123");
    expect(folderUrl("f#123")).toBe("omnifocus:///folder/f%23123");

    // ID with question mark
    expect(taskUrl("id?filter=all")).toBe("omnifocus:///task/id%3Ffilter%3Dall");
    expect(folderUrl("f?name=test")).toBe("omnifocus:///folder/f%3Fname%3Dtest");

    // ID with spaces
    expect(taskUrl("task id with spaces")).toBe("omnifocus:///task/task%20id%20with%20spaces");
    expect(folderUrl("folder id space")).toBe("omnifocus:///folder/folder%20id%20space");

    // ID with percent sign
    expect(taskUrl("id%100")).toBe("omnifocus:///task/id%25100");
    expect(folderUrl("f%50")).toBe("omnifocus:///folder/f%2550");

    // ID with Unicode
    expect(taskUrl("projekt-🎯-01")).toBe("omnifocus:///task/projekt-%F0%9F%8E%AF-01");
    expect(folderUrl("ordner-über")).toBe("omnifocus:///folder/ordner-%C3%BCber");
  });

  it("encodes custom perspective names with spaces", () => {
    expect(customPerspectiveUrl("Today Focus")).toBe("omnifocus:///perspective/Today%20Focus");
  });

  it("encodes custom perspective names with Unicode and emojis", () => {
    expect(customPerspectiveUrl("🎯 Wichtig & Dringend")).toBe(
      "omnifocus:///perspective/%F0%9F%8E%AF%20Wichtig%20%26%20Dringend",
    );
    expect(customPerspectiveUrl("Überblick / Projects")).toBe(
      "omnifocus:///perspective/%C3%9Cberblick%20%2F%20Projects",
    );
  });

  it("handles special characters in perspective names", () => {
    expect(customPerspectiveUrl("Focus #1 (Next?)")).toBe(
      "omnifocus:///perspective/Focus%20%231%20(Next%3F)",
    );
  });
});
