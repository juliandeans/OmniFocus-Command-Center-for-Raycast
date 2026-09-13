export const BLOCKED_IMAGE_PLACEHOLDER = "[Remote image blocked]";

/**
 * Sanitizes markdown content so that rendering it in a Raycast `Detail` can
 * never load a remote image from note content alone:
 *
 * - HTML images are removed entirely (`<img src="…">`).
 * - The common image forms are replaced cleanly with a placeholder:
 *   inline `![alt](url)`, full `![alt][label]`, collapsed `![alt][]`.
 * - Every remaining potential markdown image start `![` is neutralized as a
 *   catch-all. Regexes cannot fully model markdown's alt-text grammar
 *   (escaped or nested brackets, e.g. `![a\]b](url)` or `![a [b] c](url)`),
 *   so no attempt is made to parse them: `![` can only ever begin an image or
 *   literal text — never a hyperlink — and once it is gone, no markdown
 *   parser can render a remote image from the note.
 *
 * Trade-off (accepted, privacy over convenience): literal text or code spans
 * containing `![` are also neutralized. Regular text, formatting, link
 * reference definitions, and clickable hyperlinks (`[text](https://…)`) are
 * preserved. Blocked images degrade to the neutral placeholder plus leftover
 * literal text; no network request can be triggered by note content.
 */
export function sanitizeMarkdown(content?: string | null): string {
  if (!content) return "";

  // 1. Block HTML <img> tags (matched attributes may span lines).
  let result = content.replace(/<img\b[^>]*>/gi, BLOCKED_IMAGE_PLACEHOLDER);

  // 2. Block the common inline image form cleanly: ![alt](url "title").
  result = result.replace(/!\[[^\]]*\]\([^)]*\)/g, BLOCKED_IMAGE_PLACEHOLDER);

  // 3. Block full and collapsed reference forms cleanly (brackets adjacent,
  //    matching CommonMark): ![alt][label] / ![alt][].
  result = result.replace(/!\[[^\]]*\]\[[^\]]*\]/g, BLOCKED_IMAGE_PLACEHOLDER);

  // 4. Catch-all: neutralize every remaining potential image start. Exotic but
  //    valid alt-texts (escaped/nested brackets) fall through rules 2–3 and
  //    are blocked here rather than parsed.
  result = result.replaceAll("![", BLOCKED_IMAGE_PLACEHOLDER);

  return result;
}
