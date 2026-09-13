# Releasing OmniFocus Command Center

This guide outlines the release process for maintainers publishing a new version of **OmniFocus Command Center for Raycast**.

Because this extension is distributed via GitHub Releases (rather than the official Raycast Store), releases provide a prebuilt distribution ZIP for end users alongside the git repository.

---

## 1. Pre-Release Verification

Before creating a release, ensure all quality and security gates are met:

1. **Verify Working Tree:**

   ```bash
   git status
   ```

   Ensure there are no uncommitted changes, temporary test files, or leftover patches.

2. **Verify Version & Changelog:**
   - Confirm version number in `package.json` matches the intended release (e.g. `1.0.0`).
   - Ensure `CHANGELOG.md` documents all user-facing changes and security hardening.

3. **Run Automated Quality Gates:**

   ```bash
   npm ci
   npm run validate
   ```

   Ensure all unit tests pass, TypeScript typecheck passes, ESLint passes, and the Raycast extension compiles without errors.

4. **Build the Release Package:**

   ```bash
   ./scripts/build-release.sh
   ```

   This script builds the pristine distribution bundle in `release/OmniFocus-Command-Center/`, creates `release/OmniFocus-Command-Center.zip`, and generates `release/SHA256SUMS.txt`.

5. **Manual Acceptance Passes:**
   - **Local Prebuilt Import:** In Raycast, run `Import Extension`, select `release/OmniFocus-Command-Center/`, and verify commands work.
   - **Clean-Machine Test:** On a clean macOS machine (or user account) without Node.js/npm installed, test importing the unzipped release package into Raycast.
   - **Update Test:** Import a newer build over an existing installation to verify that Raycast retains user preferences and custom hotkeys.

---

## 2. Publishing the Release

Once all tests pass and the release commit is ready:

1. **Push the Final Release Commit:**

   ```bash
   git push origin main
   ```

2. **Create and Push the Git Tag:**
   Create an annotated Git tag on the exact commit that was built and verified:

   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

   > [!IMPORTANT]
   > Ensure the release package uploaded to GitHub was built from the **exact commit** matching the Git tag. Never upload packages built from uncommitted working copies or copied from local Raycast development directories (`~/.config/raycast/extensions`).

3. **Create GitHub Release:**
   - Go to **Releases → Draft a new release** on GitHub.
   - Select the tag (e.g. `v1.0.0`).
   - Set the Release Title: `OmniFocus Command Center v1.0.0`.
   - Copy the corresponding release notes from `CHANGELOG.md`.

4. **Attach Release Assets:**
   Attach the following two files from the `release/` directory:
   - `OmniFocus-Command-Center.zip` — The prebuilt distribution bundle for users.
   - `SHA256SUMS.txt` — SHA-256 checksum file for verification.

   > [!WARNING]
   > Do **not** confuse the prebuilt asset `OmniFocus-Command-Center.zip` with GitHub's automatically generated `Source code (zip)`. Clearly instruct users in release notes to download `OmniFocus-Command-Center.zip`.

5. **Publish the Release:**
   Review the release notes and click **Publish release**.

6. **Post-Release Checks:**
   - Verify the download link:
     `https://github.com/juliandeans/OmniFocus-Command-Center-for-Raycast/releases/latest/download/OmniFocus-Command-Center.zip`
   - Test downloading and importing the published ZIP on a fresh machine.
   - If the repository was just made public, ensure **Private Vulnerability Reporting** is enabled under **Settings → Code security and analysis**.
