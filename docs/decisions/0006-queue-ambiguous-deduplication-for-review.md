# 0006 — Queue ambiguous deduplication for review

**Status:** Accepted

## Decision

The writer compares a captured candidate with existing knowledge using simple topic, alias, and metadata matching. It does not use embeddings or a database in V1.

When it cannot confidently determine whether a candidate revises an existing entry or represents a new independent entry, it creates a `pending-review` item outside the main indexes and reports.

## Rationale

Ambiguous automatic updates could overwrite history or create duplicate canonical knowledge. Preserving the candidate for review avoids both losses without adding speculative infrastructure.

## Consequences

- Clear matches update the existing entry and append a revision.
- Clear non-matches create a new entry.
- Ambiguous matches remain visible for review but do not pollute primary history, timelines, or reports.
- V1 favors deterministic metadata matching over semantic-vector infrastructure.

