# Installation & Setup Guide

This guide walks you through installing and configuring **OmniFocus Command Center for Raycast**.

## Requirements

### Recommended & Tested

- **Raycast**: Current Raycast v2 (officially released, replacing v1)
- **macOS**: Tahoe
- **Architecture**: Apple Silicon

### Platform & Automation Details

- **OmniFocus 4 for Mac**
- **OmniFocus Pro**: Required for commands that inspect task hierarchies, manage tags, triage the Inbox, or create tasks (using Omni Automation).
  > [!NOTE]
  > The **Open Project** command uses macOS JXA and works with **OmniFocus Standard** as well as Pro.
- **Planned Dates** _(optional)_: Requires OmniFocus 4.7+ with a database migrated for Planned Dates. Due and Defer dates function on all supported OmniFocus 4 versions.
- **Compatibility**: Targets the stable Raycast API 1.x compatibility line supported by Raycast v2. Legacy Raycast v1 environments may work on older macOS versions or Intel Macs, but are not part of the primary tested release environment.

### Build from Source Only (For Developers)

- **Node.js** >= 22.22.2
- **npm**

---

## Step 1: Recommended — Prebuilt Release Installation

The prebuilt release is designed to be imported directly into Raycast without building the extension from source.

1. Open the [Latest GitHub Release](https://github.com/juliandeans/OmniFocus-Command-Center-for-Raycast/releases/latest).
2. Download the prebuilt asset: [OmniFocus-Command-Center.zip](https://github.com/juliandeans/OmniFocus-Command-Center-for-Raycast/releases/latest/download/OmniFocus-Command-Center.zip).
   > [!IMPORTANT]
   > Make sure to download `OmniFocus-Command-Center.zip` under **Assets**. Do **not** use GitHub's automatic `Source code (zip)` archive.
   > - `OmniFocus-Command-Center.zip` = ready-to-run prebuilt extension bundle for Raycast.
   > - GitHub `Source code (zip)` = uncompiled source code (requires Node/npm to build).
3. Extract `OmniFocus-Command-Center.zip` on your Mac (producing an `OmniFocus-Command-Center` folder).
4. Open **Raycast**.
5. Run the Raycast command: **`Import Extension`**.
6. Select the extracted `OmniFocus-Command-Center` folder.
7. The extension is now registered and ready to use in Raycast!

---

## Step 2: Authorize macOS Automation Permissions

The first time you run an OmniFocus command from Raycast, macOS presents a system security dialog:

> _"Raycast" wants access to control "OmniFocus"._

Click **OK** or **Allow**.

### If permissions were denied or need checking

1. Open **System Settings** on your Mac.
2. Navigate to **Privacy & Security → Automation**.
3. Locate **Raycast** in the application list.
4. Ensure the toggle switch for **OmniFocus** is turned **On**.

Without this permission, Raycast cannot communicate with OmniFocus.

---

## Step 3: Recommended Raycast Shortcuts & Preferences

### Global Command Hotkeys

To access commands with global keystrokes from anywhere in macOS:

1. Open Raycast (`Cmd + Space` or your configured hotkey).
2. Open **Raycast Settings → Extensions**.
3. Select **OmniFocus Command Center**.
4. Set hotkeys for your most frequent workflows:

| Command                | Suggested Shortcut | Workflow                                   |
| ---------------------- | ------------------ | ------------------------------------------ |
| **Open Project**       | `⌥ P`              | Rapidly switch projects in OmniFocus       |
| **Search Tasks**       | `⌥ T`              | Global task search across projects & Inbox |
| **Show Tasks**         | `⌥ ⇧ P`            | Pick a project and browse its tasks        |
| **Inbox**              | `⌥ I`              | Triage and process Inbox items             |
| **Add Task**           | `⌥ A`              | Full capture with dates, tags, and notes   |
| **Quick Add to Inbox** | `⌥ ⇧ I`            | Fast background capture to Inbox           |

### Action Personalization

You can customize what pressing `Enter` or keyboard shortcuts execute inside task and project views:

- **Where to configure**: In **Raycast Settings → Extensions → OmniFocus Command Center → [Command]**, or press `⌘ ⇧ ,` inside any list view.
- **Primary Task Action**: Choose what `Enter` does (`Open in OmniFocus`, `View Details`, `Edit Task`, plus `Complete / Reopen` for Inbox). Default: `Open in OmniFocus`. The complementary action is assigned to `⌘ Enter` automatically (`Open` ↔ `Details`).
- **Primary Project Action**: Choose what `Enter` does (`Open in OmniFocus`, `Show Tasks`, `Edit Project`). Default: `Open in OmniFocus`. The complementary action is assigned to `⌘ Enter` automatically (`Open` ↔ `Show Tasks`).
- **Action Shortcut Style**: In extension preferences, select your preferred modifier style (`Option`, `Cmd + Shift`, `Ctrl + Option`, or `Off`) for domain actions (Dates, Tags, Move, Add Subtask, Flag).

---

## Step 4: Updating Prebuilt Installations

Because this extension is distributed via GitHub Releases rather than the Raycast Store, updates are not applied automatically in the background.

To update:

1. Check [GitHub Releases](https://github.com/juliandeans/OmniFocus-Command-Center-for-Raycast/releases/latest) for new releases.
2. Download and extract the latest `OmniFocus-Command-Center.zip`.
3. In Raycast, run **`Import Extension`** and choose the newly extracted folder.
4. Raycast replaces the previous installation with the updated build.

> [!TIP]
> After updating, you may verify that your command hotkeys in **Raycast Settings → Extensions → OmniFocus Command Center** remain active.

---

## Step 5: Alternative — Install from Source (For Developers)

If you are developing or prefer building the extension locally:

### Option A — Download Source ZIP

1. On GitHub, click **Code → Download ZIP**.
2. Extract the archive on your Mac.
3. Open **Terminal** in the extracted directory.
4. Install dependencies and start development mode:

   ```bash
   npm ci
   npm run dev
   ```

5. Raycast compiles and registers the extension.
6. Press `Ctrl + C` to stop the development runner. The extension stays registered in Raycast.

### Option B — Clone with Git

```bash
git clone https://github.com/juliandeans/OmniFocus-Command-Center-for-Raycast.git
cd OmniFocus-Command-Center-for-Raycast
npm ci
npm run dev
```

Press `Ctrl + C` once Raycast registers the extension.

To update a Git installation:

```bash
git pull
npm ci
npm run dev
```

---

## Step 6: Developer Verification

To run the complete automated test suite and static analysis checks:

```bash
npm run validate
```

This runs:

1. `npm test` — Vitest unit tests (escaping, sanitization, dates, guardrails, mutations, preferences)
2. `npm run typecheck` — TypeScript compiler validation (`tsc --noEmit`)
3. `npm run lint` — ESLint code quality checks
4. `npm run build` — Raycast extension compilation (`ray build`)

To build a release package locally:

```bash
./scripts/build-release.sh
```

---

## Step 7: Troubleshooting

### The extension does not appear in Raycast

- If using the **Prebuilt Release**: ensure you ran Raycast's `Import Extension` command and selected the extracted folder containing `package.json`.
- If installing from source: verify that `npm ci` and `npm run dev` completed without errors.
- Ensure Raycast is running on your Mac. Try restarting Raycast (`Cmd + Q` and reopen).

### "Automation Permission Denied"

- Open **System Settings → Privacy & Security → Automation → Raycast**.
- Enable the toggle for **OmniFocus**.

### "OmniFocus Pro Required"

- Commands that inspect task lists, triage the Inbox, or create items use Omni Automation (`evaluateJavascript`), which is an OmniFocus Pro feature.
- **Open Project** uses macOS JXA and works with OmniFocus Standard.

### "Planned Dates are unavailable"

- Planned Dates require **OmniFocus 4.7 or newer** and an OmniFocus database migrated to the 4.7 format (**OmniFocus → Settings**).
- If your database is empty, support cannot be verified yet until at least one item exists; retry once you have added a task.
- Due dates and defer dates function completely normally regardless of Planned Date availability.

### OmniFocus opens unexpectedly

- macOS JXA and AppleScript automatically launch OmniFocus when querying or mutating data. This is normal macOS automation behavior.
