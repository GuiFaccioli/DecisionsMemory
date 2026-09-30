# 0003 — Capture knowledge when it appears

**Status:** Accepted

## Decision

DecisionsMemory captures knowledge when the LLM identifies a relevant event during work. It does not wait for a turn or session to end.

The workflow has three responsibilities:

```text
environment event → LLM evaluates relevance → deterministic writer persists the entry
```

The LLM calls `journal.capture` with structured knowledge. The writer updates Markdown, history, and deduplication state.

## Rationale

Important knowledge should already be persisted when a session closes. Session-end processing is not the primary capture mechanism.

## Consequences

- Skills guide the LLM to identify decisions, discoveries, verified fixes, trade-offs, and durable open discussions.
- Codex, Claude Code, and Copilot share the semantic workflow.
- Hooks remain environment-specific adapters and are added only where they improve reliability.
- The design does not promise zero data loss between recognition and persistence.
