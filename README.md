# OmniFocus Command Center for Raycast

A keyboard-first OmniFocus command center for Raycast.

OmniFocus Command Center is an unofficial community extension for Raycast that lets you search, open, capture, triage, and manage OmniFocus tasks and projects directly from Raycast.

Open projects, search tasks, process your Inbox, manage tags and dates, capture new tasks, and create projects without navigating through OmniFocus's sidebar.

> [!NOTE]
> Unofficial community project. Not affiliated with or endorsed by The Omni Group or Raycast.

<!--
Screenshots placeholder (media assets defined in media/README.md):
![Open Project](media/open-project.png)
*Jump to any active OmniFocus project directly from Raycast.*

![Search Tasks](media/search-tasks.png)
*Search open tasks across projects and Inbox.*

![Add Task](media/add-task.png)
*Create tasks with project, tags, dates, flags, and notes.*

![Inbox](media/inbox.png)
*Triage OmniFocus Inbox items without opening the sidebar.*
-->

---

## Quick Install

This extension is hosted on GitHub and installed locally into Raycast.

### Recommended — Prebuilt Release

The prebuilt release is designed to be imported directly into Raycast without building the extension from source.

1. Go to the [Latest GitHub Release](https://github.com/juliandeans/OmniFocus-Command-Center-for-Raycast/releases/latest).
2. Download the prebuilt asset: [OmniFocus-Command-Center.zip](https://github.com/juliandeans/OmniFocus-Command-Center-for-Raycast/releases/latest/download/OmniFocus-Command-Center.zip).
   > [!IMPORTANT]
   > Be sure to download `OmniFocus-Command-Center.zip` under **Assets**. Do **not** use GitHub's automatically generated `Source code (zip)`.
   >
   > - `OmniFocus-Command-Center.zip` = ready-to-run prebuilt extension bundle for Raycast.
   > - GitHub `Source code (zip)` = raw uncompiled source code (requires Node/npm to build).
3. Extract `OmniFocus-Command-Center.zip` on your Mac (producing an `OmniFocus-Command-Center` folder).
4. Open **Raycast**.
5. Type and run the command: **`Import Extension`**.
6. Select the extracted `OmniFocus-Command-Center` folder.
7. The extension is immediately available in Raycast!
8. When running your first command, allow macOS Automation permissions when prompted.

---

### Install from Source (For Developers)

If you prefer building directly from source or contributing changes:

#### Option A — Download Source ZIP

1. On GitHub, click **Code** → **Download ZIP**.
2. Extract the archive on your Mac.
3. Open **Terminal** in the extracted directory.
4. Run:

   ```bash
   npm ci
   npm run dev
   ```

5. Raycast detects and registers the extension locally.
6. Press `Ctrl + C` in the Terminal to stop the development runner. The extension stays registered in Raycast.

#### Option B — Git Clone

```bash
git clone https://github.com/juliandeans/OmniFocus-Command-Center-for-Raycast.git
cd OmniFocus-Command-Center-for-Raycast
npm ci
npm run dev
```

Once Raycast compiles and registers the extension, press `Ctrl + C` to exit the development runner. The extension remains registered and available in Raycast.

For full installation instructions, hotkey setup, and troubleshooting, see the [Installation Guide](docs/INSTALL.md).

---

## Features

### Highlights

- **Fast project jumping**: Jump instantly to any active OmniFocus project using fuzzy search.
- **Global task search**: Find open tasks across all projects and the Inbox with real-time filters.
- **Inbox triage**: Process, re-assign, reschedule, or complete Inbox tasks directly from Raycast.
- **Quick capture**: Add individual tasks or send thoughts to your Inbox with global hotkeys.
- **Tags and dates**: View nested tags, assign tags, and set Due, Defer, or Planned dates.
- **Project creation**: Set up sequential, parallel, or single-action projects with folders, dates, and initial tasks.
- **Batch task creation**: Create multiple tasks simultaneously (one task per line).
- **Safe destructive actions**: Confirmation dialogs for deletions and status changes; guardrails for large batches.
- **Local-only architecture**: Zero cloud dependencies, zero telemetry, and on-demand note loading.

### Commands

| Command                | What it does                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Open Project**       | Fuzzy-search active projects and jump straight to the selected project in OmniFocus.                        |
| **Open OmniFocus**     | Open built-in areas (Inbox, Forecast, Flagged, Projects, Tags, Review) and custom perspectives.             |
| **Show Tasks**         | Choose an active project and browse all of its tasks, including nested hierarchies.                         |
| **Search Tasks**       | Search open tasks across all projects and the Inbox, with quick filters.                                    |
| **Add Task**           | Create a task in Inbox or a project with tags, dates (Planned, Defer, Due), flag, and note.                 |
| **Add Multiple Tasks** | Select a project or Inbox and paste/type multiple lines to create one task per line.                        |
| **Quick Add to Inbox** | Fast zero-view capture: type a task title in Raycast and send it directly to the OmniFocus Inbox.           |
| **Browse by Tag**      | Pick a tag and browse its open tasks, showing nested tag paths.                                             |
| **Inbox**              | Process and triage OmniFocus Inbox tasks directly from Raycast.                                             |
| **Create Project**     | Create a parallel, sequential, or single-actions project with folder, tags, dates, note, and initial tasks. |
| **Review Projects**    | Browse active and on-hold projects whose review date is due.                                                |

---

## Personalizing Actions

OmniFocus Command Center lets you customize the keyboard behavior of task and project list commands to fit your exact personal workflow.

### Command Hotkeys vs. Action Preferences

- **Global Command Hotkeys** (e.g., `⌥ P` for Open Project, `⌥ T` for Search Tasks) launch the command from anywhere in macOS. You configure these in **Raycast Settings → Extensions → OmniFocus Command Center**.
- **Action Preferences** control what happens _inside_ a list view when you highlight an item and press `Enter`, `⌘ Enter`, or a direct shortcut.

### Primary Action (`Enter`)

You can configure what pressing `Enter` executes for each major command view:

| Command             | Available Primary Actions                                                     | Default               |
| ------------------- | ----------------------------------------------------------------------------- | --------------------- |
| **Search Tasks**    | **Open in OmniFocus**, **View Details**, **Edit Task**                        | **Open in OmniFocus** |
| **Show Tasks**      | **Open in OmniFocus**, **View Details**, **Edit Task**                        | **Open in OmniFocus** |
| **Browse by Tag**   | **Open in OmniFocus**, **View Details**, **Edit Task**                        | **Open in OmniFocus** |
| **Inbox**           | **Open in OmniFocus**, **View Details**, **Edit Task**, **Complete / Reopen** | **Open in OmniFocus** |
| **Open Project**    | **Open in OmniFocus**, **Show Tasks**, **Edit Project**                       | **Open in OmniFocus** |
| **Review Projects** | **Open in OmniFocus**, **Show Tasks**, **Edit Project**                       | **Open in OmniFocus** |

> [!NOTE]
> **Complete / Reopen** is available as a primary action exclusively for the **Inbox** command to support rapid inbox zero processing. In other task views, completion is triggered via `⌘ ⇧ Enter`.

> [!TIP]
> When browsing a project's tasks via **Show Tasks** inside **Open Project** or **Review Projects**, the nested task view automatically honors the `Primary Task Action` configured for that project command.

### Automatic Secondary Action (`⌘ Enter`)

The secondary action is automatically derived based on your primary selection so complementary workflows remain instant:

- **Tasks**:
  - Primary `Open in OmniFocus` → Secondary `View Details`
  - Primary `View Details` → Secondary `Open in OmniFocus`
  - Primary `Edit Task` → Secondary `Open in OmniFocus`
  - Primary `Complete / Reopen` (Inbox) → Secondary `View Details`
- **Projects**:
  - Primary `Open in OmniFocus` → Secondary `Show Tasks`
  - Primary `Show Tasks` → Secondary `Open in OmniFocus`
  - Primary `Edit Project` → Secondary `Open in OmniFocus`

### Direct Action Shortcuts

Keyboard-first shortcuts let you trigger frequent actions without opening the action menu:

- **Tasks**:
  - Primary Action: `Enter`
  - Secondary Action: `⌘ Enter`
  - Open in OmniFocus: `⌘ O` _(when not primary or secondary)_
  - View Details: `⌘ I` _(when not primary or secondary)_
  - Edit Task: `⌘ E`
  - Duplicate Task: `⌘ D`
  - Complete / Reopen: `⌘ ⇧ Enter` _(when not primary)_
  - Domain Actions: Dates (`D`), Tags (`T`), Move (`M`), Add Subtask (`N`), Flag (`F`) _(see modifier profiles below)_
  - Configure Actions…: `⌘ ⇧ ,`
  - Delete Task: Action menu only _(requires confirmation)_
- **Projects**:
  - Primary Action: `Enter`
  - Secondary Action: `⌘ Enter`
  - Open in OmniFocus: `⌘ O` _(when not primary or secondary)_
  - Show Tasks: `⌘ T` _(when not primary or secondary)_
  - Edit Project: `⌘ E`
  - Duplicate Project: `⌘ D`
  - Add Task: `⌘ N`
  - Add Multiple Tasks: `⌘ ⇧ N`
  - Domain Actions: Dates (`D`), Tags (`T`), Move (`M`), Flag (`F`) _(see modifier profiles below)_
  - Configure Actions…: `⌘ ⇧ ,`
  - Status & Deletion: Action menu only _(status changes and project deletion are protected)_

### Shortcut Style Profiles

For domain actions that manage dates, tags, moves, subtasks, or flags, choose your preferred modifier profile under **Extension Preferences → Action Shortcut Style**:

| Action                    | Option Style _(Default)_ | Cmd + Shift Style | Ctrl + Option Style | Off       |
| ------------------------- | ------------------------ | ----------------- | ------------------- | --------- |
| **Set Dates**             | `⌥ D`                    | `⌘ ⇧ D`           | `⌃ ⌥ D`             | Menu only |
| **Manage Tags**           | `⌥ T`                    | `⌘ ⇧ T`           | `⌃ ⌥ T`             | Menu only |
| **Move Task / Folder**    | `⌥ M`                    | `⌘ ⇧ M`           | `⌃ ⌥ M`             | Menu only |
| **Add Subtask** _(Tasks)_ | `⌥ N`                    | `⌘ ⇧ N`           | `⌃ ⌥ N`             | Menu only |
| **Flag / Unflag**         | `⌥ F`                    | `⌘ ⇧ F`           | `⌃ ⌥ F`             | Menu only |

### Full Action Panel (`⌘ K`)

Pressing `⌘ K` opens the complete action menu, cleanly organized into **Capture**, **Edit**, **Status**, and **Copy** sections. Destructive actions and project status changes are protected without accidental hotkey triggers.

To customize action preferences directly from any list view, press `⌘ ⇧ ,` or choose **Configure Actions…** at the bottom of the `⌘ K` menu.

---

## Requirements

### Recommended & Tested

- **Raycast**: Current Raycast v2 (officially released, replacing v1)
- **macOS**: Tahoe
- **Architecture**: Apple Silicon

### Platform & Automation Details

- **OmniFocus 4** for Mac
- **OmniFocus Pro**: Required for commands using Omni Automation (Show Tasks, Search Tasks, Add Task, Inbox triage, Create Project, Review Projects).
  > [!NOTE]
  > The **Open Project** command uses macOS JXA and works with **OmniFocus Standard** as well as Pro.
- **Planned Dates** _(optional)_: Requires OmniFocus 4.7+ with a database migrated for Planned Dates. Due and Defer dates function on all supported OmniFocus 4 versions.
- **Compatibility**: The extension targets the stable Raycast API 1.x compatibility line supported by Raycast v2. Legacy Raycast v1 environments may work on older macOS versions or Intel Macs, but are not part of the primary tested release environment.

> [!NOTE]
> OmniFocus may launch automatically in the background when macOS executes JXA or AppleScript queries against it.

### Build from Source Only (For Developers)

- **Node.js** >= 22.22.2
- **npm**

---

## Updating

Because this extension is installed from GitHub rather than the Raycast Store, updates are not applied automatically in the background.

### Prebuilt Installation (Recommended)

1. Check [GitHub Releases](https://github.com/juliandeans/OmniFocus-Command-Center-for-Raycast/releases/latest) for new releases.
2. Download and extract the latest `OmniFocus-Command-Center.zip`.
3. In Raycast, run **`Import Extension`** and select the newly extracted folder.
4. Raycast replaces the previous installation with the updated build.

> [!TIP]
> After updating, you may verify your command hotkeys in **Raycast Settings → Extensions → OmniFocus Command Center**.

### Source / Git Installation

For Git checkouts:

```bash
cd OmniFocus-Command-Center-for-Raycast
git pull
npm ci
npm run dev
```

Press `Ctrl + C` once Raycast registers the updated build. `npm ci` keeps dependencies aligned with `package-lock.json`, and `npm run dev` rebuilds and re-registers the extension in Raycast.

For Source ZIP users:

1. Download and extract the latest source ZIP from GitHub.
2. Open Terminal in the new directory.
3. Run:

   ```bash
   npm ci
   npm run dev
   ```

4. Press `Ctrl + C` once Raycast finishes compiling.

---

## Permissions

When running a command for the first time, macOS will ask for permission:

> _"Raycast" wants access to control "OmniFocus"._

Click **OK** or **Allow**.

To verify or restore permissions manually:

1. Open **System Settings** on your Mac.
2. Navigate to **Privacy & Security → Automation**.
3. Under **Raycast**, ensure **OmniFocus** is turned **On**.

Without this permission, Raycast cannot communicate with OmniFocus.

---

## Write Safety & Guardrails

The extension can modify OmniFocus data (creating, editing, and deleting tasks and projects, as well as changing statuses, tags, and dates).

To protect your OmniFocus database:

- **Explicit User Actions**: Writes occur strictly upon deliberate user actions — never as automatic background cleanups.
- **Confirmation Dialogs**: Destructive actions (deleting tasks or projects, marking projects Done or Dropped) require explicit confirmation.
- **Batch Creation Guardrails**: Creating more than 50 tasks in one action requires a confirmation dialog; batches exceeding 200 tasks are rejected outright.
- **Safe Editing**: Task and project edit forms require a successful live fetch before allowing edits, preventing accidental overwriting of existing notes.
- **Stable ID Targeting**: All mutations resolve target items by their immutable OmniFocus identifier (`primaryKey`), never by name matching.

---

## Troubleshooting

### The extension does not appear in Raycast

- Check that `npm ci` finished without errors.
- Check that `npm run dev` completed without build errors.
- Ensure Raycast is running on your Mac.
- Try quitting and reopening Raycast.

### Automation Permission Denied

- Open **System Settings → Privacy & Security → Automation → Raycast**.
- Enable the toggle for **OmniFocus**.

### OmniFocus Pro Required

- Task browsing, task capture, Inbox triage, and project creation rely on Omni Automation (`evaluateJavascript`), which requires OmniFocus Pro.
- The **Open Project** command uses macOS JXA and works with OmniFocus Standard.

### Planned Dates are unavailable

- Planned Dates require **OmniFocus 4.7 or newer** and a database migrated for Planned Dates (**OmniFocus → Settings**).
- Due dates and defer dates continue to function normally.
- On a completely empty database, support is confirmed once at least one task exists.

### OmniFocus opens unexpectedly

- macOS JXA and AppleScript automatically start OmniFocus when executing automation queries. This is expected macOS automation behavior.

### After an update something looks stale

- Run `npm ci` followed by `npm run dev`.
- Restart Raycast (`Cmd + Q` or via Raycast menu bar).

For further troubleshooting details, see [docs/INSTALL.md](docs/INSTALL.md).

---

## Data & Privacy

- **100% Local Communication**: The extension code makes no outbound API, analytics, telemetry, or cloud-sync requests. OmniFocus communication happens locally via macOS Automation (JXA and Omni Automation).
- **Zero Telemetry or Analytics**: No tracking, usage metrics, or crash reports are gathered or transmitted.
- **No External Network Requests**: The extension never connects to third-party servers, cloud services, or remote endpoints.
- **Metadata-Only Disk Cache**: Fast list re-opening uses Raycast's local cache for titles, statuses, tags, dates, and IDs. **Full task notes are never stored in the persistent disk cache** and are loaded live on demand.
- **Live Note Loading**: Task notes are fetched live from OmniFocus only when viewing details or opening the edit form.
- **Remote Image Blocking**: Task notes cannot trigger tracking pixels or unauthorized network traffic. HTML `<img>` tags are removed and markdown image starts (`![`) are neutralized to a `[Remote image blocked]` placeholder. Standard web links remain clickable.
- **Plain-Text Metadata**: Task titles and metadata are rendered as plain text, preventing malicious titles from triggering markdown formatting.
- **Clipboard Access**: System clipboard is accessed only when you explicitly select a "Copy" action.
- **No Data Leaks**: Error messages strip script code and personal data, presenting clear, user-friendly explanations.

For the complete technical specification, see the [Safety and Security Contract](docs/SAFETY.md).

---

## How It Works

OmniFocus Command Center bridges Raycast directly to your local OmniFocus installation:

```
Raycast UI  ──►  macOS JXA / Omni Automation  ──►  OmniFocus application
```

- **Raycast UI**: Native React-based command views, fuzzy search, forms, and action panels.
- **Local Automation**: Executes JavaScript for Automation (JXA) and Omni Automation (`evaluateJavascript`) via macOS system IPC. The extension does not directly read or touch OmniFocus SQLite database files.
- **Stable Identifiers**: Targets items using immutable OmniFocus primary keys (`id.primaryKey`).
- **Zero Cloud Layer**: Runs entirely offline on your Mac with no remote servers or cloud accounts.

For architectural details, see [Architecture Overview](docs/ARCHITECTURE.md).

---

## Known Limitations

- **OmniFocus Pro Requirement**: Richer automation features require OmniFocus Pro because they rely on Omni Automation (`evaluateJavascript`). OmniFocus Standard can use the **Open Project** command.
- **Planned Dates**: Requires OmniFocus 4.7+ and a database migrated for Planned Dates. On older or unmigrated databases, Planned Date controls are cleanly disabled while Due and Defer dates remain fully functional.
- **Local GitHub Installation**: Distributed as an open-source GitHub repository rather than through the Raycast Store; updates are managed manually via Git or ZIP download.
- **Node.js & npm Required**: Running from source requires Node.js (>= 22.22.2) and npm to compile and register with Raycast.
- **Platform Compatibility**: Targets the Raycast API 1.x line. Recommended on Apple Silicon with macOS Tahoe and Raycast v2. Legacy Raycast v1 environments on older macOS versions or Intel Macs may function, but are not part of the primary tested release environment.
- **Dependency Audit**: `npm audit` reports 2 low-severity advisories via `esbuild` bundled with `@raycast/api` 1.x. They affect only the development server on Windows and are unexploitable on macOS.

---

## Development & Quality Gates

Run the local validation gate before opening a pull request or submitting changes:

```bash
npm run validate
```

This runs:

- `npm test` — Vitest unit test suite
- `npm run typecheck` — TypeScript compiler validation (`tsc --noEmit`)
- `npm run lint` — ESLint code quality checks
- `npm run build` — Raycast extension compilation (`ray build`)

Code formatting is checked with:

```bash
npm run format
```

For test checklists and acceptance criteria, see [Testing Guide](docs/TESTING.md).

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for coding standards, architectural rules, and pull request guidelines.

---

## Security

Please see [SECURITY.md](SECURITY.md) for vulnerability disclosure guidelines via GitHub Private Vulnerability Reporting.

---

## License

MIT. See [LICENSE](LICENSE).
