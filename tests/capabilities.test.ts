import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/omnifocus/gateway", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/omnifocus/gateway")>();
  return {
    ...actual,
    executeOmniAutomation: vi.fn(),
  };
});

import { executeOmniAutomation } from "../src/lib/omnifocus/gateway";
import { getPlannedDateCapability, resetCapabilityCache } from "../src/lib/omnifocus/capabilities";

const mockedExecute = vi.mocked(executeOmniAutomation);

describe("Suite K: Planned-Date Capability Cache", () => {
  beforeEach(() => {
    resetCapabilityCache();
    mockedExecute.mockReset();
  });

  afterEach(() => {
    resetCapabilityCache();
  });

  it("caches a verified 'supported' result", async () => {
    mockedExecute.mockResolvedValue("supported");

    await expect(getPlannedDateCapability()).resolves.toBe(true);
    await expect(getPlannedDateCapability()).resolves.toBe(true);
    expect(mockedExecute).toHaveBeenCalledTimes(1);
  });

  it("caches a verified 'unsupported' result", async () => {
    mockedExecute.mockResolvedValue("unsupported");

    await expect(getPlannedDateCapability()).resolves.toBe(false);
    await expect(getPlannedDateCapability()).resolves.toBe(false);
    expect(mockedExecute).toHaveBeenCalledTimes(1);
  });

  it("treats an inconclusive probe (empty database) as NOT supported and does not cache it", async () => {
    mockedExecute.mockResolvedValue("inconclusive");

    await expect(getPlannedDateCapability()).rejects.toMatchObject({
      code: "capability_probe_inconclusive",
    });
    // Never optimistically true, and the inconclusive outcome is evicted so
    // the next call probes again.
    expect(mockedExecute).toHaveBeenCalledTimes(1);
  });

  it("verifies support once the database has content after an inconclusive probe", async () => {
    mockedExecute.mockResolvedValueOnce("inconclusive");
    mockedExecute.mockResolvedValueOnce("supported");

    await expect(getPlannedDateCapability()).rejects.toMatchObject({
      code: "capability_probe_inconclusive",
    });
    await expect(getPlannedDateCapability()).resolves.toBe(true);
    expect(mockedExecute).toHaveBeenCalledTimes(2);

    // Verified support is cached.
    await expect(getPlannedDateCapability()).resolves.toBe(true);
    expect(mockedExecute).toHaveBeenCalledTimes(2);
  });

  it("treats unexpected probe output conservatively as inconclusive", async () => {
    mockedExecute.mockResolvedValue(undefined as unknown as string);

    await expect(getPlannedDateCapability()).rejects.toMatchObject({
      code: "capability_probe_inconclusive",
    });
  });

  it("does NOT cache a transient failure and rejects the caller", async () => {
    mockedExecute.mockRejectedValueOnce(new Error("AppleScript timed out"));

    await expect(getPlannedDateCapability()).rejects.toThrow("timed out");
    // The failed probe must be evicted so the next call retries.
    expect(mockedExecute).toHaveBeenCalledTimes(1);
  });

  it("retries after a transient failure and can then return true", async () => {
    mockedExecute.mockRejectedValueOnce(new Error("automation permission prompt"));
    mockedExecute.mockResolvedValueOnce("supported");

    await expect(getPlannedDateCapability()).rejects.toThrow();
    await expect(getPlannedDateCapability()).resolves.toBe(true);
    expect(mockedExecute).toHaveBeenCalledTimes(2);

    // Now supported is cached.
    await expect(getPlannedDateCapability()).resolves.toBe(true);
    expect(mockedExecute).toHaveBeenCalledTimes(2);
  });

  it("a single glitch never permanently hides planned dates (unsupported after failure is cached)", async () => {
    mockedExecute.mockRejectedValueOnce(new Error("OmniFocus is busy"));
    mockedExecute.mockResolvedValue("unsupported");

    await expect(getPlannedDateCapability()).rejects.toThrow();
    await expect(getPlannedDateCapability()).resolves.toBe(false);
    await expect(getPlannedDateCapability()).resolves.toBe(false);
    expect(mockedExecute).toHaveBeenCalledTimes(2);
  });

  it("shares one concurrent probe between parallel callers", async () => {
    mockedExecute.mockImplementation(
      () => new Promise<string>((resolve) => setTimeout(() => resolve("supported"), 5)),
    );

    const [a, b] = await Promise.all([getPlannedDateCapability(), getPlannedDateCapability()]);
    expect(a).toBe(true);
    expect(b).toBe(true);
    expect(mockedExecute).toHaveBeenCalledTimes(1);
  });
});
