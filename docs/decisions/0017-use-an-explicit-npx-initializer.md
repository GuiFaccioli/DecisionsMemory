# 0017 — Use an explicit npx initializer

**Status:** Accepted

## Decision

Use `npx decisionsmemory init` as the supported setup command. It installs the
current package version in `devDependencies` with lifecycle scripts disabled,
then configures the local Git hook.

## Rationale

npm 12 disables dependency lifecycle scripts by default. Relying on
`postinstall` would make hook installation conditional on each consumer
approving package scripts. An explicit initializer keeps setup intentional and
works with npm's secure defaults.

## Consequences

- `npm install -D decisionsmemory` only installs the package.
- `npx decisionsmemory init` is the one-command setup path for a Git project.
- The package does not use `postinstall` to modify consumer repositories.
