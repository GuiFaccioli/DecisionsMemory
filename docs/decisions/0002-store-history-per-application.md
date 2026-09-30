# 0002 — Store history per application

**Status:** Accepted

## Decision

DecisionMemory data belongs to the application repository being worked on. The approved repository-local location is:

```text
docs/decision-memory/
  entries/
  pending-review/
  index.md
  timeline.md
  site/
```

The reusable workflow may be installed under `.agents/skills/decision-memory/` or another supported shared scope, but it must never merge histories from different applications.

## Rationale

Developers need to find an application's decisions and technical evolution where they already work: inside that application's repository.

## Consequences

- Markdown is the canonical, versioned project history.
- The same DecisionMemory skill can serve multiple repositories safely.
- `site/` is a derived, readable view of repository-local knowledge.

