# 0008 — Use hybrid deduplication

**Status:** Accepted

## Decision

V1 classifies every capture through three deterministic outcomes:

- A match on a known topic or alias updates the matching entry and appends a revision.
- A clearly unrelated candidate creates a new entry.
- A candidate that may relate to an existing entry but lacks a deterministic match goes to `pending-review`.

The writer does not treat an LLM's semantic judgment alone as authorization to revise canonical history.

## Rationale

Known-topic updates should be automatic, while a merely plausible relation can silently merge independent knowledge or revise the wrong history. The hybrid rule preserves useful automation without making uncertain semantic inference destructive.

## Consequences

- V1 needs topic and alias normalization sufficient for deterministic matching.
- `pending-review` is the boundary for semantic-but-unconfirmed similarity.
- An LLM may provide evidence and context for a candidate, but the writer's matching rule determines automatic revision.
- Embeddings, a vector database, and autonomous semantic merging remain out of scope for V1.
