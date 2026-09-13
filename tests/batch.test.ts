import { describe, expect, it } from "vitest";
import {
  BATCH_HARD_LIMIT,
  BATCH_SOFT_LIMIT,
  batchConfirmationMessage,
  batchHardLimitMessage,
  evaluateBatchSize,
} from "../src/lib/batch";
import { parseTaskLines } from "../src/lib/parse";

describe("Suite J: Batch Creation Guardrails", () => {
  it("exposes the agreed limits", () => {
    expect(BATCH_SOFT_LIMIT).toBe(50);
    expect(BATCH_HARD_LIMIT).toBe(200);
  });

  it("allows 1–50 tasks without confirmation", () => {
    for (const count of [1, 25, 50]) {
      const decision = evaluateBatchSize(count);
      expect(decision).toEqual({ allowed: true, requiresConfirmation: false });
    }
  });

  it("exactly 50 is allowed without confirmation (boundary)", () => {
    expect(evaluateBatchSize(50)).toEqual({ allowed: true, requiresConfirmation: false });
  });

  it("51 requires confirmation (boundary)", () => {
    const decision = evaluateBatchSize(51);
    expect(decision.allowed).toBe(true);
    expect(decision.requiresConfirmation).toBe(true);
  });

  it("200 still requires confirmation but is allowed (boundary)", () => {
    const decision = evaluateBatchSize(200);
    expect(decision.allowed).toBe(true);
    expect(decision.requiresConfirmation).toBe(true);
  });

  it("201 is blocked outright (boundary)", () => {
    const decision = evaluateBatchSize(201);
    expect(decision.allowed).toBe(false);
    expect(decision.requiresConfirmation).toBe(false);
    expect(decision.reason).toContain("201");
    expect(decision.reason).toContain("200");
  });

  it("rejects far-too-large batches", () => {
    expect(evaluateBatchSize(10_000).allowed).toBe(false);
  });

  it("hard limit message states the limit and the rejected count without user data", () => {
    const message = batchHardLimitMessage(750);
    expect(message).toContain("750");
    expect(message).toContain("200");
  });

  it("confirmation message contains the task count", () => {
    expect(batchConfirmationMessage(73)).toContain("73");
  });

  it("empty lines do not count towards the batch size", () => {
    const fiftyRealLines = Array.from({ length: 50 }, (_, i) => `Task ${i + 1}`);
    const input = ["", "   ", ...fiftyRealLines, "", "\t"].join("\n");
    const names = parseTaskLines(input);
    expect(names).toHaveLength(50);
    expect(evaluateBatchSize(names.length).requiresConfirmation).toBe(false);

    const fiftyOne = [...fiftyRealLines, "One more"].join("\n");
    expect(evaluateBatchSize(parseTaskLines(fiftyOne).length).requiresConfirmation).toBe(true);
  });
});
