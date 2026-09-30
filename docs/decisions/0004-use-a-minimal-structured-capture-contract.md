# 0004 — Use a minimal structured capture contract

**Status:** Accepted

## Decision

`journal.capture` receives a structured knowledge candidate from the LLM.

| Field | Required | Purpose |
|---|---:|---|
| `type` | Yes | `decision`, `discovery`, `bugfix`, `tradeoff`, or `technique` |
| `status` | Yes | `open`, `decided`, `rejected`, `tradeoff-accepted`, `revised`, or `conscious-debt` |
| `topic` | Yes | Stable subject used to locate related knowledge |
| `claim` | Yes | The knowledge to preserve |
| `evidence` | Yes | Conversation, file, command, or test that supports the claim |
| `rationale` | No | Explicit reason, when available |
| `files` | No | Related repository files |

The writer generates entry identifiers, titles, timestamps, history records, and derived views. It chooses whether to create, update, or queue a review item.

## Rationale

The contract keeps the LLM responsible for semantic interpretation and the writer responsible for deterministic persistence. Rich fields without a current use case are deferred.

## Consequences

- A missing rationale is recorded as not explicit; it is never invented.
- Evidence is required for every stored claim.
- Relations, confidence scores, impact ratings, broad tags, and timeline metadata are outside V1.

