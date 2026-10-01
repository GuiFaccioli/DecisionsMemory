# DecisionsMemory

DecisionsMemory records each new Git commit as AI-readable Markdown plus a
local HTML/CSS page. It is an npm development dependency: it lives with the
project whose technical history it documents.

## Install

```sh
npm install -D decisionsmemory
```

The install script configures a chained `post-commit` hook when run inside a
Git repository. Existing `post-commit` hooks are preserved. Outside a Git
repository the package installs normally and reports that the hook was
skipped.

The hook uses locally authenticated Codex with Luna and low reasoning effort.
Install and authenticate Codex before making commits.

## Configuration

Create `decisionsmemory.json` at the repository root to override non-secret
settings:

```json
{
  "executor": {
    "command": "codex",
    "model": "gpt-6-luna",
    "reasoningEffort": "low"
  },
  "journalDirectory": "docs/dev-journal"
}
```

Credentials belong in the Codex environment, never in this file.

## Output

Each ordinary commit creates a directory such as
`docs/dev-journal/entries/2026-09-30-corrige-login/`. It contains globally
numbered `entryN.md` files, `index.html`, and `styles.css`. The Journal root
also has `index.md` and `index.html`.

DecisionsMemory creates a separate commit beginning with
`chore(decisionsmemory):`; the hook skips that commit to prevent recursion.

## Safety and limits

- Full diffs and credentials are not saved.
- If Codex fails, the original commit remains valid and a warning is printed.
- If `docs/dev-journal/` has uncommitted changes, generation is skipped rather
  than mixing or overwriting your work.
- Existing history is not imported on installation.
- Retries, hosted publishing, and provider-specific UI integrations are not in
  V1.

Run `npx decisionsmemory status` to check whether the current directory is a
Git repository.
