# 0011 — Use minimal YAML frontmatter

**Status:** Accepted

## Decision

Each canonical entry starts with minimal YAML frontmatter containing only operational metadata:

```yaml
id: generated-entry-id
type: decision
status: decided
topic: stable-topic
aliases: []
created_at: timestamp
updated_at: timestamp
```

The Markdown body contains the evidence, rationale when explicit, current state, and revision transitions. Revisions and evidence are not serialized as frontmatter data structures.

## Rationale

The writer needs stable fields for identity, filtering, and deterministic topic/alias matching. Keeping narrative knowledge in the body preserves a document a developer can read and review without interpreting a data payload.

## Consequences

- The writer owns generated identifiers and timestamps.
- `topic` and `aliases` support hybrid deduplication.
- The body remains the canonical readable history.
- No full-state, evidence, or revision arrays are added to frontmatter in V1.
