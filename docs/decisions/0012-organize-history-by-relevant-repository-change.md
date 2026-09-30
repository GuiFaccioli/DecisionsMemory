# 0012 — Organize history by relevant repository change

**Status:** Accepted

**Supersedes:** the flat `entries/` layout in 0002 and the single-entry unit described in 0005.

## Decision

The canonical unit of history is one relevant, comprehensible repository change. Each change receives its own directory under `docs/decisions-memory/changes/`.

A change directory always contains a human-readable change record. When the change is large, it may also contain focused Markdown files about the affected files, decisions, or technical parts. Small changes need only the main record.

```text
docs/decisions-memory/
  changes/
    0001-short-change-name/
      change.md
      files/        # optional focused explanations
      assets/       # optional diagrams or supporting visuals
  pending-review/
  index.md
  timeline.md
  site/
```

The change record explains the state before the change, what changed, the resulting state, rationale when explicit, affected files, and evidence. Related changes remain separate records in chronological sequence rather than being merged into one flat knowledge entry.

## Rationale

Repository work often changes multiple related files and includes several connected technical choices. A directory per meaningful change preserves that context while keeping a small change lightweight. It also gives the generated site a natural visual unit: one understandable event in the application's evolution.

## Consequences

- A large relevant change can be documented at the level of its component files without fragmenting the main narrative.
- A small relevant change produces one concise Markdown record.
- The repository timeline is an ordered sequence of change directories.
- The generated HTML prioritizes visual navigation of changes, before/after transitions, and optional diagrams; it is not a transcript or message feed.
- The exact body template, file-explanation template, and generated-site layout remain to be decided.
