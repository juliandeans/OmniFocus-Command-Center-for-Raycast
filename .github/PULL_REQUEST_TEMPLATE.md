## Description

Briefly describe the change and the rationale behind it.

## Related Issue

Closes #<!-- issue number, if applicable -->

## Pull Request Checklist

Please check all items before submitting:

- [ ] Local quality gate passed: `npm run validate` (runs Vitest unit tests, typecheck, lint, and build)
- [ ] No real or private OmniFocus data (task names, notes, project names, client info) included in test fixtures, mocks, commits, or screenshots
- [ ] Any new library logic (`src/lib/`) is accompanied by unit tests in `tests/`
- [ ] Automation scripts use the central `j()` escaping helper — no raw user inputs are interpolated into JXA or Omni Automation scripts
- [ ] Manual testing was performed with disposable dummy data
