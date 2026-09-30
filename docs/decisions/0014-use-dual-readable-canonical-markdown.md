# 0014 — Use dual-readable canonical Markdown

**Status:** Accepted

## Decision

Every canonical change record is one Markdown source that serves both human readers and AI agents.

Its YAML frontmatter includes the operational metadata from 0011 plus the documented Git commit:

```yaml
id: generated-change-id
commit: git-commit-hash
type: decision
status: decided
topic: stable-topic
aliases: []
created_at: timestamp
updated_at: timestamp
```

Its body uses predictable headings:

```md
# Change title

## Antes

## Mudança

## Depois

## Motivo

## Arquivos envolvidos

## Evidências
```

`Antes`, `Mudança`, `Depois`, and `Evidências` are required. `Motivo` records `Não declarado` when no explicit rationale exists. `Arquivos envolvidos` appears when applicable. Content is concise, evidence-based Markdown with repository-relative paths and Git references where available.

The generated HTML is a read-only derived presentation of these records, never a second source of truth.

## Rationale

A fixed structure lets a developer scan a change quickly and lets an AI reliably locate the state transition, reasons, files, and proof needed to continue work consistently. One source prevents the human documentation and machine context from drifting apart.

## Consequences

- The mandatory `commit` field fulfills the commit linkage required by 0013.
- Agents can parse records without relying on free-form narrative guesses.
- The renderer consumes the same Markdown as humans do.
- The project does not create a separate AI-only database or duplicate documentation format in V1.
