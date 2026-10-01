# 0016 — Distribute as a public npm development tool

**Status:** Accepted

## Decision

Distribute DecisionsMemory as the public unscoped npm package
`decisionsmemory`. Consumer projects install it as a development dependency.

## Rationale

The package configures local Git automation and generates development
documentation. It is not required by an application at runtime or in its
production deployment.

## Consequences

- Consumers use npm to obtain supported releases.
- Runtime production dependencies do not include DecisionsMemory.
- Package publication is protected by the npm publisher account's 2FA policy.
