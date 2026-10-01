import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';

import { runPostCommit } from '../src/capture.js';

const run = promisify(execFile);
const config = { journalDirectory: 'docs/dev-journal' };

test('runPostCommit creates one documentation commit and skips it on the next invocation', async () => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'decisionsmemory-integration-'));
  await run('git', ['init', '-q'], { cwd: repositoryRoot });
  await run('git', ['config', 'user.email', 'test@example.com'], { cwd: repositoryRoot });
  await run('git', ['config', 'user.name', 'Test'], { cwd: repositoryRoot });
  await run('git', ['commit', '--allow-empty', '-m', 'Corrige login'], { cwd: repositoryRoot });
  await writeFile(join(repositoryRoot, 'unrelated.txt'), 'must stay staged');
  await run('git', ['add', 'unrelated.txt'], { cwd: repositoryRoot });

  const first = await runPostCommit({
    repositoryRoot,
    config,
    executor: async () => [{ title: 'Login', summary: 'Corrige validação.', files: [], impact: 'Seguro.' }],
  });
  assert.equal(first.status, 'captured');
  const { stdout: subject } = await run('git', ['log', '-1', '--format=%s'], { cwd: repositoryRoot });
  assert.match(subject, /^chore\(decisionsmemory\):/);
  const { stdout: committedFiles } = await run('git', ['show', '--format=', '--name-only', 'HEAD'], { cwd: repositoryRoot });
  assert.doesNotMatch(committedFiles, /unrelated.txt/);
  const { stdout: stagedFiles } = await run('git', ['diff', '--cached', '--name-only'], { cwd: repositoryRoot });
  assert.match(stagedFiles, /unrelated.txt/);

  const second = await runPostCommit({ repositoryRoot, config, executor: async () => { throw new Error('must not run'); } });
  assert.equal(second.status, 'skipped');
});
