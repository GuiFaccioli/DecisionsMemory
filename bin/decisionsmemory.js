#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { loadConfig } from '../src/config.js';
import { runCodexCapture } from '../src/codex.js';
import { runPostCommit } from '../src/capture.js';
import { initializeProject } from '../src/init.js';
import { installHook } from '../src/install.js';

const command = process.argv[2];
const run = promisify(execFile);
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageManifest = JSON.parse(await readFile(resolve(packageRoot, 'package.json'), 'utf8'));
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
  if (!['init', 'install', 'post-commit', 'status'].includes(command)) {
    console.error('Usage: decisionsmemory <init|install|post-commit|status>');
    process.exitCode = 2;
    return;
  }
  if (command === 'status') {
    const repository = await isRepository(repositoryRoot);
    console.log(`Git repository: ${repository ? 'yes' : 'no'}`);
    if (repository) {
      try {
        await loadConfig(repositoryRoot);
        console.log('Configuration: valid');
      } catch {
        console.log('Configuration: invalid');
      }
      const { stdout } = await run('git', ['rev-parse', '--git-path', 'hooks/post-commit'], { cwd: repositoryRoot });
      try {
        const hook = await readFile(resolve(repositoryRoot, stdout.trim()), 'utf8');
        console.log(`Hook: ${hook.includes('DecisionsMemory managed hook') ? 'installed' : 'missing'}`);
      } catch {
        console.log('Hook: missing');
      }
    }
    return;
  }
  if (command === 'install') {
    const result = await installHook({ repositoryRoot, packageRoot });
    console.log(result.status === 'installed' ? 'DecisionsMemory hook installed' : 'DecisionsMemory hook skipped: not a Git repository');
    return;
  }
  if (command === 'init') {
    if (!await isRepository(repositoryRoot)) throw new Error('init must be run inside a Git repository');
    const result = await initializeProject({
      repositoryRoot,
      packageName: packageManifest.name,
      packageVersion: packageManifest.version,
    });
    console.log(`DecisionsMemory initialized: ${result.hook}`);
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
