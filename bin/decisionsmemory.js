#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { loadConfig } from '../src/config.js';
import { runCodexCapture } from '../src/codex.js';
import { runPostCommit } from '../src/capture.js';
import { installHook } from '../src/install.js';

const command = process.argv[2];
const run = promisify(execFile);
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = command === 'install' ? process.env.INIT_CWD ?? process.cwd() : process.cwd();

async function isRepository(root) {
  try {
    const { stdout } = await run('git', ['rev-parse', '--is-inside-work-tree'], { cwd: root });
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}

async function main() {
  if (!['install', 'post-commit', 'status'].includes(command)) {
    console.error('Usage: decisionsmemory <install|post-commit|status>');
    process.exitCode = 2;
    return;
  }
  if (command === 'status') {
    console.log(`Git repository: ${await isRepository(repositoryRoot) ? 'yes' : 'no'}`);
    return;
  }
  if (command === 'install') {
    const result = await installHook({ repositoryRoot, packageRoot });
    console.log(result.status === 'installed' ? 'DecisionsMemory hook installed' : 'DecisionsMemory hook skipped: not a Git repository');
    return;
  }
  const config = await loadConfig(repositoryRoot);
  const result = await runPostCommit({
    repositoryRoot,
    config,
    executor: ({ commit }) => runCodexCapture({ repositoryRoot, commit, config }),
  });
  if (result.status === 'warning') console.error(`DecisionsMemory warning: ${result.message}`);
}

main().catch((error) => {
  console.error(`DecisionsMemory error: ${error.message}`);
  process.exitCode = 1;
});
