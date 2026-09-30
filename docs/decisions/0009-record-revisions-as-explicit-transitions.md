# 0009 — Record revisions as explicit transitions

**Status:** Accepted

## Decision

Every entry revision records three explicit values:

```text
Before: state before this revision
Change: knowledge added, revised, or removed by this revision
After: resulting state after this revision
```

The writer persists these values in canonical Markdown. It does not require readers or derived views to reconstruct a revision from a bare delta, and it does not repeat an unstructured full entry snapshot for every revision.

## Rationale

The project requires a real, visually legible sequence of technical evolution. An explicit transition answers what was true, what changed now, and what became true afterward, while keeping each revision independently understandable.

## Consequences

- Markdown and the generated HTML show the same `Before → Change → After` progression.
- The current state is the `After` value from the latest revision.
- The exact representation of initial creation, frontmatter, and heading layout remains to be decided; this decision fixes revision semantics, not presentation syntax.
