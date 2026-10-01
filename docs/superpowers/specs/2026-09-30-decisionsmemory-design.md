# DecisionsMemory: design approved for V1

## Goal

DecisionsMemory is an npm development dependency that records every new Git
commit in a repository as durable, AI-readable Markdown and a local visual
page. The records explain the technical changes made by the commit without
storing full diffs.

The V1 is Git- and npm-based. It does not require VS Code, Orca, a hosted
service, a database, or a web deployment.

## Installation and configuration

Users install the package in a Git repository with:

```sh
npm install -D decisionsmemory
```

The package's install lifecycle configures a local `post-commit` hook. If the
current directory is not a Git repository, installation succeeds and reports
that no hook was configured. If a `post-commit` hook already exists, the
installer preserves it and chains DecisionsMemory rather than replacing it.

`decisionsmemory.json` at repository root contains non-secret configuration:

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

The V1 default executor is the locally authenticated Codex CLI using Luna with
low reasoning effort. Credentials remain in the provider environment and are
never written to this file.

## Commit processing

Every ordinary user commit invokes DecisionsMemory synchronously through the
`post-commit` hook.

1. The hook reads commit metadata, changed-file names, and safe Git summaries.
2. It invokes the configured Codex executor to identify coherent technical
   changes and write the records.
3. It renders local HTML and CSS pages from a fixed template.
4. It commits the generated Journal files in a separate documentation commit.

The generated documentation commit has the reserved message prefix
`chore(decisionsmemory):`. The `post-commit` hook detects that prefix and
returns without processing it. This is the one necessary exception to
recording every commit; capturing it would create an infinite hook/commit
loop. The generated commit may use `--no-verify` to avoid unrelated blocking
pre-commit checks, but that option alone does not suppress `post-commit`.

The hook does not save full diffs. It records commit metadata, changed files,
and the generated technical summaries only.

If Codex or the renderer fails, the original user commit remains valid and the
hook prints a warning. The missing Journal record is not retried automatically
in V1. If `docs/dev-journal/` already contains uncommitted changes, the hook
also aborts Journal generation and warns; it never mixes or overwrites those
changes.

The V1 starts recording after installation. It does not import prior Git
history.

## Journal layout

The Journal lives in the consumer repository:

```text
docs/dev-journal/
├─ index.md
├─ index.html
└─ entries/
   ├─ 2026-09-30-corrige-login/
   │  ├─ entry1.md
   │  ├─ entry2.md
   │  ├─ index.html
   │  └─ styles.css
   └─ 2026-10-01-adiciona-validacao/
      ├─ entry3.md
      ├─ index.html
      └─ styles.css
```

Each ordinary commit receives its own date-and-title directory. Each coherent
technical change within it receives one Markdown file named `entryN.md`. `N`
is a single global sequence across the whole Journal and never resets between
directories.

An `entryN.md` is the canonical AI-readable source. It includes minimal
structured metadata plus a concise technical explanation, affected files,
impact, and a reference to the originating commit. Each commit directory has
an `index.html` and `styles.css` for its visual view. The root `index.md` and
`index.html` provide navigable global indexes.

## History rewriting and hook coexistence

Amended commits, rebases, and cherry-picks are recorded as ordinary new
commits when they reach `post-commit`. V1 does not link them to older Journal
entries and does not mark anything as superseded.

The hook installation is idempotent: rerunning installation repairs the
DecisionsMemory portion while retaining an existing hook chain.

## Non-goals

- Importing existing history during installation.
- Storing full diffs, secrets, embeddings, or a database.
- Automatic retry queues.
- Provider-specific UI integrations for VS Code, Orca, Claude, or hosted web
  publishing.

The file layout and CLI are host-independent so those integrations can be
added later without changing stored Journal records.

## Verification targets

- Install in a clean Git repository and verify hook creation.
- Preserve a pre-existing `post-commit` hook.
- Commit a change and verify the expected folder, global entry numbering,
  Markdown, HTML/CSS, root indexes, and a separate documentation commit.
- Verify generated documentation does not recursively invoke the hook.
- Verify a failed executor leaves the original commit intact and emits a
  warning.
- Verify dirty `docs/dev-journal/` prevents automatic generation without
  overwriting user changes.
- Verify no historical commits are imported on initial install.
