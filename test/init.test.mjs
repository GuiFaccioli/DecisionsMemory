import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';

import { initializeProject } from '../src/init.js';

const run = promisify(execFile);

test('initializeProject installs the pinned package without lifecycle scripts and installs its hook', async () => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'decisionsmemory-init-'));
  await run('git', ['init', '-q'], { cwd: repositoryRoot });
  let invocation;

  const result = await initializeProject({
    repositoryRoot,
    packageName: 'decisionsmemory',
    packageVersion: '0.1.1',
    installDependency: async (command, args, options) => { invocation = { command, args, options }; },
  });

  assert.equal(invocation.command, process.platform === 'win32' ? 'npm.cmd' : 'npm');
  assert.deepEqual(invocation.args, ['install', '--save-dev', '--ignore-scripts', 'decisionsmemory@0.1.1']);
  assert.equal(invocation.options.cwd, repositoryRoot);
  assert.match(await readFile(result.hook, 'utf8'), /DecisionsMemory managed hook/);
  assert.match(await readFile(result.hook, 'utf8'), /node_modules/);
});
