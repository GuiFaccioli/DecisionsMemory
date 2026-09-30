# 0007 — Generate a consolidated HTML view

**Status:** Accepted

## Decision

Markdown entries are canonical. DecisionsMemory generates one consolidated HTML site at `docs/decisions-memory/site/` as a readable visual map of an application's technical history.

The view includes current knowledge, revision sequences, timelines, and supporting assets when relevant.

## Rationale

Developers need a fast visual way to understand the history of an application without replacing the durable, reviewable Markdown source.

## Consequences

- The site is regenerated from Markdown rather than edited as a source of truth.
- Separate per-session and per-entry HTML pages are not part of V1.
- A broken or missing generated view does not alter canonical history.
