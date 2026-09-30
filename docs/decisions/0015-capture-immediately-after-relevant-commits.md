# 0015 — Capture immediately after relevant commits

**Status:** Accepted

## Decision

After a relevant technical Git commit is created, DecisionsMemory immediately creates the corresponding change directory and record in a separate documentation commit. The record references the preceding technical commit hash.

Commits created solely by DecisionsMemory to add or refresh its records and derived view are excluded from capture.

## Rationale

The technical commit hash is only known after the commit exists. A following documentation commit records it accurately without rewriting history or using temporary placeholders. Excluding self-generated commits prevents an infinite capture loop.

## Consequences

- Capture happens during active work, not at turn or session close.
- One relevant technical commit is followed by one DecisionsMemory documentation commit.
- Documentation commits are visible Git history but do not create their own change records.
- The exact trigger mechanism and failure behavior remain to be decided.
