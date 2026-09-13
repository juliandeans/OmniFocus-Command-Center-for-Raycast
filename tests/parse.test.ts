import { describe, expect, it } from "vitest";
import { parseTaskLines } from "../src/lib/parse";

describe("Suite C: parseTaskLines", () => {
  it("parses newline LF separated lines", () => {
    const input = "First task\nSecond task\nThird task";
    expect(parseTaskLines(input)).toEqual(["First task", "Second task", "Third task"]);
  });

  it("parses CRLF separated lines", () => {
    const input = "Task A\r\nTask B\r\nTask C";
    expect(parseTaskLines(input)).toEqual(["Task A", "Task B", "Task C"]);
  });

  it("trims surrounding whitespace and tabs", () => {
    const input = "  \t Task with leading tabs\t \n   Task with spaces   \n\tTask with tab\t";
    expect(parseTaskLines(input)).toEqual(["Task with leading tabs", "Task with spaces", "Task with tab"]);
  });

  it("filters out empty and whitespace-only lines", () => {
    const input = "\n\n   \nTask 1\n\n   \t  \nTask 2\n\n\n";
    expect(parseTaskLines(input)).toEqual(["Task 1", "Task 2"]);
  });

  it("preserves original input order strictly", () => {
    const input = "Zebra\nAlpha\nCharlie\nBeta";
    expect(parseTaskLines(input)).toEqual(["Zebra", "Alpha", "Charlie", "Beta"]);
  });

  it("handles very long lines without truncation", () => {
    const longLine = "Task " + "x".repeat(5000);
    expect(parseTaskLines(longLine)).toEqual([longLine]);
  });

  it("returns empty array for empty or whitespace-only input", () => {
    expect(parseTaskLines("")).toEqual([]);
    expect(parseTaskLines("   \n\t\n  ")).toEqual([]);
  });
});
