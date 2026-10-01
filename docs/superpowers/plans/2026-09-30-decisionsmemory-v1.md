# DecisionsMemory V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an npm development dependency that records every new Git commit as AI-readable Markdown and local HTML/CSS.

**Architecture:** A dependency-local Node CLI installs and dispatches a chained `post-commit` hook. The CLI validates configuration, asks Codex for structured entries, renders a per-commit Journal directory, and creates a separate documentation commit which its own hook recognizes and skips.

**Tech Stack:** Node.js 20+, ESM JavaScript, npm, Git, Codex CLI, and built-in `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-30-decisionsmemory-design.md`

## Global Constraints

- Package name: `decisionsmemory`; no runtime dependencies.
- Install hook through `npm install -D decisionsmemory`.
- Default output: `docs/dev-journal`; only relative paths inside the repository are valid.
- Default executor: local Codex, `gpt-6-luna`, reasoning effort `low`.
- Never persist full diffs, credentials, or API keys.
- Generated documentation commits use `chore(decisionsmemory):` and are skipped by the hook.
- Do not import prior history, retry failures, overwrite dirty Journal files, or replace an existing hook.

## Review Focus

- Recursive hook calls must skip the generated documentation commit; covered in Task 5.
- Dirty Journal files must remain unchanged; covered in Task 4 and Task 5.
- A pre-existing `post-commit` must still run; covered in Task 3.
- Invalid Codex JSON must not create partial records; covered in Task 4.
- Entry numbers must remain global across directories; covered in Task 2.

---

## File Structure

- `package.json` — package metadata, bin, lifecycle, and test command.
- `bin/decisionsmemory.js` — `install`, `post-commit`, and `status` commands.
- `src/config.js` — `decisionsmemory.json` defaults and validation.
- `src/git.js` — isolated Git command boundary.
- `src/journal.js` — Markdown, HTML/CSS, indexes, and global numbering.
- `src/codex.js` — structured Codex execution.
- `src/capture.js` — safe capture orchestration and scoped documentation commits.
- `src/install.js` — idempotent chained-hook installer.
- `schemas/capture-result.schema.json` — Codex response contract.
- `templates/` — fixed HTML/CSS templates.
- `test/` — module and temporary-repository integration tests.

### Task 1: Bootstrap CLI and configuration

**Files:** Create `package.json`, `bin/decisionsmemory.js`, `src/config.js`, `test/config.test.js`.

**Interfaces:** `loadConfig(repositoryRoot: string): Promise<DecisionsMemoryConfig>`; CLI commands `install`, `post-commit`, `status`.

- [ ] Write failing tests for defaults, valid JSON, invalid JSON, missing executor command, and an output path escaping the repository.
- [ ] Run `node --test test/config.test.js`; expect failure because the module is absent.
- [ ] Implement ESM package metadata and `loadConfig`; default to `codex`, `gpt-6-luna`, `low`, and `docs/dev-journal`; reject absolute and escaping paths.
- [ ] Implement command routing; invalid usage exits 2.
- [ ] Run `node --test test/config.test.js`; expect pass.
- [ ] Commit: `feat: bootstrap DecisionsMemory CLI`.

### Task 2: Write Markdown, local visual pages, and global indexes

**Files:** Create `src/journal.js`, `templates/entry.html`, `templates/styles.css`, `test/journal.test.js`.

**Interfaces:** `writeJournalRecord({ repositoryRoot, commit, entries, config }): Promise<JournalWriteResult>`.

- [ ] Write a failing test asserting a two-entry commit creates one date-and-slug directory with `entry1.md`, `entry2.md`, local `index.html` and `styles.css`, plus root `index.md`/`index.html`; a later record must create `entry3.md`.
- [ ] Run `node --test test/journal.test.js`; expect failure.
- [ ] Implement deterministic Markdown and escaped template rendering; derive next number from existing `entry<number>.md` names; store no raw diff.
- [ ] Run `node --test test/journal.test.js`; expect pass.
- [ ] Commit: `feat: generate Journal records and views`.

### Task 3: Install a chained, idempotent post-commit hook

**Files:** Create `src/install.js`, `test/install.test.js`; modify `bin/decisionsmemory.js`, `package.json`.

**Interfaces:** `installHook({ repositoryRoot, packageRoot }): Promise<InstallResult>`.

- [ ] Write failing temporary-Git-repository tests for non-repository detection, first install, idempotent reinstall, and preservation/execution of an executable existing `post-commit`.
- [ ] Run `node --test test/install.test.js`; expect failure.
- [ ] Implement `installHook`: resolve the hooks directory through Git, preserve an existing hook under a DecisionsMemory-owned backup name, and write a uniquely marked POSIX shell wrapper that invokes the preserved hook then the dependency-local CLI. Use `INIT_CWD` for postinstall target resolution.
- [ ] Run `node --test test/install.test.js`; expect pass.
- [ ] Commit: `feat: install chained post-commit hook`.

### Task 4: Capture one commit through Codex safely

**Files:** Create `schemas/capture-result.schema.json`, `src/git.js`, `src/codex.js`, `src/capture.js`, `test/capture.test.js`.

**Interfaces:** `readHeadCommit(repositoryRoot)`, `runCodexCapture({ repositoryRoot, commit, config })`, `captureHeadCommit({ repositoryRoot, config })`.

- [ ] Write failing tests with a fake executor for safe Git metadata, schema-valid output, invalid output, executor failure, a dirty Journal directory, and a reserved documentation subject that is skipped.
- [ ] Run `node --test test/capture.test.js`; expect failure.
- [ ] Implement the Git reader and Codex executor. Invoke `codex exec --ephemeral --model <model> -c model_reasoning_effort="low" --output-schema <schema> -` with the prompt on stdin. Fully validate the result before calling `writeJournalRecord`; return warnings for model/render failures.
- [ ] Run `node --test test/capture.test.js`; expect pass.
- [ ] Commit: `feat: capture commits with Codex`.

### Task 5: Connect post-commit capture and the documentation commit

**Files:** Modify `bin/decisionsmemory.js`, `src/git.js`, `src/capture.js`; create `test/post-commit.integration.test.js`.

**Interfaces:** `commitJournalFiles({ repositoryRoot, journalDirectory, sourceCommit }): Promise<string>`.

- [ ] Write a failing end-to-end temporary-repository test: install hook, make a user commit using a fake valid executor, assert generated files are separately committed with the reserved prefix, assert the second hook skips, and assert dirty Journal files produce no generated commit.
- [ ] Run `node --test test/post-commit.integration.test.js`; expect failure.
- [ ] Implement the `post-commit` path: stage only paths returned by `writeJournalRecord`, commit them with the reserved prefix, and skip by current commit subject on the re-invoked hook.
- [ ] Run `node --test test/post-commit.integration.test.js`; expect pass.
- [ ] Run `npm test`; expect pass.
- [ ] Commit: `feat: automate Journal commits`.

### Task 6: Status command and user documentation

**Files:** Modify `README.md`, `bin/decisionsmemory.js`; create `test/cli.test.js`.

**Interfaces:** `decisionsmemory status` is read-only and reports configuration and hook status.

- [ ] Write failing tests for read-only `status` output and invalid command exit code 2.
- [ ] Run `node --test test/cli.test.js`; expect failure.
- [ ] Implement `status` and document installation, configuration, Codex prerequisite, automatic documentation commits, failure warnings, and non-goals without promising retries, history import, or provider UI integrations.
- [ ] Run `npm test`; expect pass.
- [ ] Commit: `docs: explain DecisionsMemory workflow`.
