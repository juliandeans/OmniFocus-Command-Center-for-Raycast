#!/usr/bin/env bash
set -euo pipefail

# Determine repository root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> Building OmniFocus Command Center release package..."
echo "==> Repository root: $REPO_ROOT"

# Clean any existing release directory
RELEASE_DIR="$REPO_ROOT/release"
OUTPUT_DIR="$RELEASE_DIR/OmniFocus-Command-Center"
ZIP_FILE="$RELEASE_DIR/OmniFocus-Command-Center.zip"
CHECKSUM_FILE="$RELEASE_DIR/SHA256SUMS.txt"

rm -rf "$RELEASE_DIR"
mkdir -p "$OUTPUT_DIR"

# Ensure pristine dependencies according to package-lock.json
echo "==> Running npm ci..."
npm ci

# Run all verification gates
echo "==> Running npm run validate (tests, typecheck, lint, build)..."
npm run validate

# Build distribution bundle into release directory
echo "==> Compiling distribution bundle with ray build -e dist..."
npx ray build -e dist -o "$OUTPUT_DIR"

# Package into ZIP archive
echo "==> Creating release archive: OmniFocus-Command-Center.zip..."
(
  cd "$RELEASE_DIR"
  zip -r -X "OmniFocus-Command-Center.zip" "OmniFocus-Command-Center"
)

# Generate SHA-256 checksum
echo "==> Generating SHA-256 checksum..."
(
  cd "$RELEASE_DIR"
  shasum -a 256 "OmniFocus-Command-Center.zip" > "SHA256SUMS.txt"
)

echo ""
echo "=================================================="
echo "RELEASE BUILD SUCCESSFUL"
echo "=================================================="
echo "Artifact directory: $OUTPUT_DIR"
echo "Release archive:    $ZIP_FILE"
echo "Checksum file:      $CHECKSUM_FILE"
echo ""
echo "Contents of SHA256SUMS.txt:"
cat "$CHECKSUM_FILE"
echo ""
echo "Generated release directory listing:"
find "$RELEASE_DIR" -maxdepth 3 | sort
echo "=================================================="
