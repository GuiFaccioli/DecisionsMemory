# 0013 — Record each relevant commit separately

**Status:** Accepted

## Decision

Each relevant atomic Git commit receives its own change directory and canonical change record. A change directory is not used to aggregate several commits into one feature-level account.

Trivial commits remain ordinary Git history and do not create DecisionsMemory records.

## Rationale

Atomic commits already express the real sequence of meaningful development work. Mirroring each relevant one preserves the order and boundaries of that work without turning DecisionsMemory into a duplicate of every low-value Git event.

## Consequences

- A record must include the Git commit it documents; the exact reference format remains to be decided.
- Related relevant commits appear as separate, ordered changes in the generated view.
- Formatting-only, generic documentation, and other trivial commits remain excluded by the relevance gate.
- No feature-level grouping layer is added in V1.
