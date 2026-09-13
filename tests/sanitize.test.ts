import { describe, expect, it } from "vitest";
import { BLOCKED_IMAGE_PLACEHOLDER, sanitizeMarkdown } from "../src/lib/sanitize";

describe("Suite D: Markdown Sanitizer", () => {
  it("preserves standard markdown formatting", () => {
    const note = `## Summary
This is **bold** text and *italic* text.
- List item 1
- List item 2

\`\`\`ts
const x = 42;
\`\`\`
> Blockquote text`;
    expect(sanitizeMarkdown(note)).toBe(note);
  });

  it("blocks HTTPS remote images and replaces them with placeholder", () => {
    const input = "Look at this screenshot: ![Screenshot](https://example.com/image.png)";
    expect(sanitizeMarkdown(input)).toBe(`Look at this screenshot: ${BLOCKED_IMAGE_PLACEHOLDER}`);
  });

  it("blocks HTTP remote images", () => {
    const input = "Insecure image: ![Banner](http://insecure.example.com/banner.jpg)";
    expect(sanitizeMarkdown(input)).toBe(`Insecure image: ${BLOCKED_IMAGE_PLACEHOLDER}`);
  });

  it("blocks reference-style images with their definition present", () => {
    const input = "![tracking][foo]\n\n[foo]: https://example.com/pixel.png";
    const output = sanitizeMarkdown(input);
    expect(output).toContain(BLOCKED_IMAGE_PLACEHOLDER);
    expect(output).not.toContain("![tracking][foo]");
  });

  it("blocks collapsed reference images", () => {
    const input = "![pixel][]\n\n[pixel]: https://example.com/pixel.png";
    const output = sanitizeMarkdown(input);
    expect(output).toContain(BLOCKED_IMAGE_PLACEHOLDER);
    expect(output).not.toContain("![pixel][]");
  });

  it("blocks shortcut reference images when a matching definition exists", () => {
    const input = "Hello ![tracking]\n\n[tracking]: https://example.com/pixel.png";
    const output = sanitizeMarkdown(input);
    expect(output).toContain(BLOCKED_IMAGE_PLACEHOLDER);
    expect(output).not.toContain("![tracking]");
  });

  it("matches reference labels case-insensitively and with collapsed whitespace", () => {
    const input = "![Tracking  Pixel]\n\n[tracking pixel]: https://example.com/pixel.png";
    const output = sanitizeMarkdown(input);
    expect(output).toContain(BLOCKED_IMAGE_PLACEHOLDER);
  });

  it("leaves regular link reference definitions (not images) untouched", () => {
    const input = "See [the docs][docs] for details.\n\n[docs]: https://developers.raycast.com";
    expect(sanitizeMarkdown(input)).toBe(input);
  });

  it("blocks images with escaped brackets in the alt text (regex bypass attempt)", () => {
    const input = "![a\\]b](https://example.com/pixel.png)";
    const output = sanitizeMarkdown(input);
    expect(output).not.toContain("![");
    expect(output).toContain(BLOCKED_IMAGE_PLACEHOLDER);
  });

  it("blocks images with nested brackets in the alt text (regex bypass attempt)", () => {
    const input = "![a [b] c](https://example.com/pixel.png)";
    const output = sanitizeMarkdown(input);
    expect(output).not.toContain("![");
    expect(output).toContain(BLOCKED_IMAGE_PLACEHOLDER);
  });

  it("neutralizes every leftover potential image start, even without a valid form", () => {
    const input = "That is ![notAnImage] and it stays.";
    expect(sanitizeMarkdown(input)).toBe(`That is ${BLOCKED_IMAGE_PLACEHOLDER}notAnImage] and it stays.`);
  });

  it("keeps regular links untouched while neutralizing adjacent image starts", () => {
    const input = "Check ![not an image] syntax and [a real link](https://example.com).";
    expect(sanitizeMarkdown(input)).toBe(
      `Check ${BLOCKED_IMAGE_PLACEHOLDER}not an image] syntax and [a real link](https://example.com).`,
    );
  });

  it("blocks HTML img tags", () => {
    const input = 'Here is an html image: <img src="https://example.com/pic.jpg" alt="test" /> in note.';
    expect(sanitizeMarkdown(input)).toBe(`Here is an html image: ${BLOCKED_IMAGE_PLACEHOLDER} in note.`);
  });

  it("blocks uppercase HTML img tags spanning lines", () => {
    const input = '<IMG\n  src="https://example.com/pic.jpg"\n  alt="tracking">';
    expect(sanitizeMarkdown(input)).toBe(BLOCKED_IMAGE_PLACEHOLDER);
  });

  it("blocks multiple images of different forms in the same note", () => {
    const input = [
      "First ![One](https://img1.com/a.png)",
      'then ![Two](http://img2.com/b.png "Title").',
      "Reference ![three][ref] and shortcut ![four].",
      "<img src='https://img3.com/c.png'>",
      "",
      "[ref]: https://img4.com/d.png",
      "[four]: https://img5.com/e.png",
    ].join("\n");
    const output = sanitizeMarkdown(input);
    expect(output).not.toContain("![");
    expect(output).not.toContain("<img");
    const placeholderCount = output.split(BLOCKED_IMAGE_PLACEHOLDER).length - 1;
    expect(placeholderCount).toBe(5);
  });

  it("preserves regular HTTPS hyperlinks untouched", () => {
    const input =
      "Read the documentation at [Raycast Docs](https://developers.raycast.com) or [GitHub](https://github.com).";
    expect(sanitizeMarkdown(input)).toBe(input);
  });

  it("neutralizes image markdown inside arbitrary note text (e.g. pasted task titles)", () => {
    const input = "Meeting ![x](https://example.com/pixel.png) at 10am";
    expect(sanitizeMarkdown(input)).toBe(`Meeting ${BLOCKED_IMAGE_PLACEHOLDER} at 10am`);
  });

  it("leaves names and metadata with markdown special characters readable (plain text context)", () => {
    const input = "Project: Research & Entwicklung [2026] *beta* `v2` #planning";
    expect(sanitizeMarkdown(input)).toBe(input);
  });

  it("handles empty and null inputs safely", () => {
    expect(sanitizeMarkdown("")).toBe("");
    expect(sanitizeMarkdown(null)).toBe("");
    expect(sanitizeMarkdown(undefined)).toBe("");
  });
});
