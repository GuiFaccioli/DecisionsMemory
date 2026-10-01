#!/usr/bin/env node

const command = process.argv[2];
if (!['install', 'post-commit', 'status'].includes(command)) {
  console.error('Usage: decisionsmemory <install|post-commit|status>');
  process.exitCode = 2;
}
