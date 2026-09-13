# Changelog

## 1.0.0 — 2026-09-06

Initial public GitHub release of OmniFocus Command Center for Raycast, expanding the field-tested OmniFocus Project Jump workflow into a full-featured, local-only command center.

### Features & Commands

- **Open Project**: Fuzzy-search active projects and jump straight to the selected project in OmniFocus (preserves the proven macOS JXA workflow; works with OmniFocus Standard & Pro).
- **Open OmniFocus**: Open built-in areas (Inbox, Forecast, Flagged, Projects, Tags, Review) and custom perspectives.
- **Show Tasks**: Browse task hierarchies and nested subtasks by project.
- **Search Tasks**: Global multi-filter search across all open tasks and Inbox.
- **Add Task**: Full task capture with project, tags, dates (Planned, Defer, Due), flag, and note.
- **Add Multiple Tasks**: Quick multi-line task creation (one task per line) in a project or Inbox.
- **Quick Add to Inbox**: Fast zero-view task capture directly from the Raycast argument field.
- **Browse by Tag**: Filter and browse open tasks by tag with nested tag paths.
- **Inbox**: Process, edit, and triage Inbox tasks directly in Raycast.
- **Create Project**: Create parallel, sequential, or single-action projects with folder, tags, dates, and initial tasks.
- **Review Projects**: Browse and triage projects due for review.
- **Action Personalization**:
  - Configurable primary action (`Enter`) for tasks (`Open in OmniFocus`, `View Details`, `Edit Task`; plus `Complete / Reopen` exclusively for Inbox) and projects (`Open in OmniFocus`, `Show Tasks`, `Edit Project`). Default across all commands: `Open in OmniFocus`.
  - Dynamic secondary action (`⌘ Enter`) derived automatically (`Open` ↔ `Details` for tasks, `Open` ↔ `Show Tasks` for projects).
  - Nested project task browsing (`Show Tasks` in `Open Project` or `Review Projects`) automatically honors the command's configured `taskPrimaryAction`.
  - Extension-wide modifier profile (`Option`, `Cmd + Shift`, `Ctrl + Option`, or `Off`) for domain actions (Dates, Tags, Move, Subtask, Flag).
  - Direct keyboard shortcuts for common actions (`⌘ E` Edit, `⌘ D` Duplicate, `⌘ N` Add Task, `⌘ ⇧ N` Add Multiple Tasks, `⌘ T` Show Tasks, `⌘ O` Open, `⌘ I` Details, `⌘ ⇧ Enter` Complete).
  - Fast in-view access to preferences via `⌘ ⇧ ,` and `Configure Actions…` in the action panel.

### Architecture & Security Hardening

- **Local-Only & Zero Telemetry**: 100% local communication via macOS Automation (JXA) and Omni Automation (`evaluateJavascript`). No external network requests, third-party APIs, telemetry, or analytics.
- **Privacy-Preserving Caching**: Fast list re-opening uses Raycast's local metadata cache; full task notes are never stored on disk and are always loaded live on demand.
- **Remote Image Blocking**: Markdown sanitizer strips `<img>` tags and neutralizes every potential image start (`![`) as a catch-all, preventing tracking pixels or remote leaks from task notes.
- **Safe Editing Contract**: Task and project edit forms require a successful live fetch before allowing edits, preventing accidental note overwriting.
- **Planned Date Compatibility**: Dynamic capability detection for OmniFocus 4.7+ Planned Dates. Older and unmigrated databases gracefully degrade while Due and Defer dates remain fully functional.
- **Batch Creation Guardrails**: Creating more than 50 tasks in one action triggers an explicit confirmation dialog; batches over 200 tasks are safely rejected.
- **Normalized Error Architecture**: Technical errors are classified into clear, actionable UI messages (distinguishing permissions, OmniFocus Pro requirements, missing items, and timeouts) without leaking scripts or personal data.
- **Distribution & Installation**: Prebuilt distribution archive (`OmniFocus-Command-Center.zip`) available on GitHub Releases for direct import into Raycast via `Import Extension` without building the extension from source.
- **Defensive Deep Link Hardening**: Automatic URL encoding (`encodeURIComponent`) on task and folder identifiers in OmniFocus deep links.
- **Cross-Platform macOS Support**: Platform-safe optional dependencies supporting both Apple Silicon and Intel Macs.
- **Automated Test Suite**: 140 unit tests across 11 test suites covering escaping, date codegen, sanitization, batch limits, error normalization, action preferences, deep link encoding, and regression contracts.
