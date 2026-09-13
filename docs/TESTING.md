# Testing and Acceptance Checklist

Run tests on the target Mac with Raycast and OmniFocus installed. For destructive/write tests, create disposable projects/tasks first.

## Automated validation

```bash
npm install
npm run validate
```

Expected:

- TypeScript: 0 errors
- Raycast lint: 0 blocking errors
- Raycast build: succeeds

The archive was also syntactically transpiled with TypeScript 5.8.3 before packaging; that check does not replace the full local dependency-aware validation above.

## Regression gate — Open Project

This is the highest-priority regression because the original implementation was already field-tested.

1. Launch **Open Project**.
2. Confirm only active projects appear.
3. Search by a partial project title.
4. Search by its parent folder name.
5. Press Return.
6. Confirm OmniFocus opens exactly that project.
7. Test two similarly named projects and, if available, duplicate names in different folders.

Pass criterion: behavior is at least as reliable as the original Project Jump extension.

## Open OmniFocus

Verify each built-in destination:

- Inbox
- Vorausschau / Forecast
- Markiert / Flagged
- Projekte / Projects
- Tags
- Review

If custom perspectives exist, open at least two, including one whose name contains a space or non-ASCII character.

## Show Tasks

Using a disposable project containing direct tasks and nested subtasks:

1. choose the project;
2. verify database order;
3. verify nested tasks are represented as nested;
4. verify task details and project context are correct;
5. open a task in OmniFocus.

## Search Tasks

Create sample tasks covering Available, Next, Due Soon, Overdue and Flagged where possible. Verify each dropdown filter and global native title/tag/project search.

## Add Task

Test separately:

- Inbox destination;
- project destination;
- tags;
- note;
- flag;
- Planned, Defer and Due dates;
- same-name projects are safe because the selected project ID is used;
- on a database without Planned Date support, the Planned field shows the migration requirement and Due/Defer still save — no planned-date code must be generated (covered by `tests/mutations.test.ts`).

## Add Multiple Tasks

Use input such as:

```text
First

Second
  Third with intentional leading spaces
Fourth
```

Expected 4 tasks, in that order, with surrounding whitespace trimmed. Version 1.0 does not interpret indentation as hierarchy.

Also test 20–50 disposable lines once to detect UI/Automation timing problems.

Batch guardrails (disposable data only):

1. Enter 51+ non-empty lines (empty lines don't count) — a confirmation dialog "Create N tasks?" appears; cancelling it must not create anything.
2. Enter exactly 50 non-empty lines — no extra confirmation appears.
3. Enter more than 200 non-empty lines — the form shows an error and no OmniFocus write occurs.

## Quick Add to Inbox

Launch the no-view command with a title. Confirm exactly one Inbox task is created and Raycast shows the HUD confirmation.

## Tags

1. Browse by a nested tag.
2. Verify only open tagged tasks are shown.
3. On a disposable task, add then remove a tag from **Manage Tags**.
4. Confirm the check icon updates immediately and the parent view revalidates.

## Inbox triage

On disposable Inbox tasks test:

- complete/reopen;
- flag/unflag;
- edit title/note;
- date changes;
- tag changes;
- move to project;
- add subtask;
- duplicate;
- delete confirmation.

## Create Project

Test all three project types:

- Parallel
- Sequential
- Single Actions

Also test:

- top level;
- nested existing folder;
- tag assignment;
- dates and flag;
- note;
- multiline initial tasks.

## Project actions

Using a disposable project test:

- edit name/note;
- dates;
- add/remove tag;
- move folder/top-level;
- flag/unflag;
- On Hold → Active;
- Complete confirmation and reactivation;
- Drop confirmation and reactivation if OmniFocus allows it through the exposed status contract;
- duplicate;
- delete confirmation.

## Review Projects

Set a disposable project's review date so it is due, if convenient through OmniFocus UI. Verify it appears and sorting is earliest due first. Confirm no action in this command silently changes the review timestamp.

## Failure cases

Test at least once if practical:

- revoke Raycast → OmniFocus Automation permission and confirm an actionable failure is displayed;
- choose an item, delete it directly in OmniFocus, then attempt a cached action in Raycast — expected: `*_not_found`, never an action against a different item;
- test Planned Date on an unmigrated database only if such a database is available — expected: native failure, no fallback mutation;
- with an empty OmniFocus database (or before adding any task), open a date form — expected: "Could not check Planned Date support" with a retry, never a Planned Date picker; Due and Defer keep working.
