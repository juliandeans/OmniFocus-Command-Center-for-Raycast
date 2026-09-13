import { describe, expect, it } from "vitest";
import { j } from "../src/lib/omnifocus/gateway";

describe("Suite A: Input / JXA Escaping", () => {
  const testCases = [
    { name: "double quotes", value: 'A task with "double quotes"' },
    { name: "single quotes", value: "A task with 'single quotes'" },
    { name: "backticks", value: "A task with `backticks` and `code`" },
    { name: "template literal interpolation", value: "Task with ${malicious_code} and ${process.exit()}" },
    { name: "backslashes", value: "Path with C:\\Users\\Name\\Documents and \\\\escapes" },
    { name: "line breaks LF", value: "First line\nSecond line\nThird line" },
    { name: "line breaks CRLF", value: "Windows line\r\nSecond line\r\nThird line" },
    { name: "Unicode line separator U+2028", value: "Separated by \u2028 line separator" },
    { name: "Unicode paragraph separator U+2029", value: "Separated by \u2029 paragraph separator" },
    { name: "NUL character", value: "Text with \0 null byte inside" },
    { name: "emoji characters", value: "Task with 🚀 🎯 📝 ✨ 💡 emojis" },
    {
      name: "CJK and multilingual Unicode",
      value: "日本語タスク / 任务标题 / العربية / עִברִית / Übergrößenträger",
    },
    { name: "very long string (100,000 chars)", value: "x".repeat(100_000) },
  ];

  for (const tc of testCases) {
    it(`correctly encodes and roundtrips ${tc.name}`, () => {
      const encoded = j(tc.value);

      // Verify JSON roundtrip
      const parsed = JSON.parse(encoded);
      expect(parsed).toBe(tc.value);

      // Verify JS evaluation roundtrip as safe string literal expression
      const evalFn = new Function(`return ${encoded};`);
      expect(evalFn()).toBe(tc.value);
    });
  }

  it("handles null, undefined, numbers, and boolean values safely", () => {
    expect(j(null)).toBe("null");
    expect(j(undefined)).toBe(undefined);
    expect(j(42)).toBe("42");
    expect(j(true)).toBe("true");
    expect(j(false)).toBe("false");
    expect(j(["a", "b"])).toBe('["a","b"]');
    expect(j({ a: 1 })).toBe('{"a":1}');
  });
});
