# 0010 — Represent initial creation as a transition

**Status:** Accepted

## Decision

An entry's creation is its first explicit transition:

```text
Before: no state
Change: creation
After: initial state
```

It uses the same `Before → Change → After` structure as every later revision.

## Rationale

One transition model makes the history uniform. Readers do not need to learn a special case to understand when a knowledge item first became canonical.

## Consequences

- Every canonical entry begins with a readable origin event.
- The generated HTML can render creation and later revisions through the same component.
- The literal Markdown syntax for `no state` and the exact frontmatter remain to be decided.
