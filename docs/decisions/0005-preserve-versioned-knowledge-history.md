# 0005 — Preserve versioned knowledge history

**Status:** Accepted

## Decision

An entry keeps its current state and an append-only revision history. Every revision preserves a state transition:

```text
Before: X
Change: +Y
After: X + Y
```

The generated view shows the sequence visually, so a reader can distinguish what existed before, what changed in a specific revision, and what became true afterward.

## Rationale

An append-only note list is insufficient. The history must make the technical evolution legible without erasing the prior reasoning or making the reader reconstruct state manually.

## Consequences

- A change to the same topic becomes a versioned revision of its entry.
- An independent knowledge item becomes a new entry, with an optional link to related entries.
- The current state is the accumulated result of revisions.
- The Markdown and derived HTML both present current state and revision sequence.

