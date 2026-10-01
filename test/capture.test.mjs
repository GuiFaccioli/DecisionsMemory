import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';

import { captureHeadCommit } from '../src/capture.js';
import { readHeadCommit } from '../src/git.js';

const run = promisify(execFile);
const config = { journalDirectory: 'docs/dev-journal' };

async function repository(subject) {
  const root = await mkdtemp(join(tmpdir(), 'decisionsmemory-capture-'));
  await run('git', ['init', '-q'], { cwd: root });
  await run('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  await run('git', ['config', 'user.name', 'Test'], { cwd: root });
  await run('git', ['commit', '--allow-empty', '-m', subject], { cwd: root });
  return root;
}

test('captureHeadCommit writes structured records from safe commit metadata', async () => {
  const repositoryRoot = await repository('Corrige login');
  let input;
  const result = await captureHeadCommit({
    repositoryRoot,
    config,
    executor: async (payload) => {
      input = payload;
      return [{ title: 'Sessão', summary: 'Valida sessão.', files: [], impact: 'Seguro.' }];
    },
  });

  assert.equal(result.status, 'captured');
  assert.equal(input.commit.subject, 'Corrige login');
  assert.equal(Object.hasOwn(input.commit, 'diff'), false);
});

test('captureHeadCommit skips generated documentation commits', async () => {
  const repositoryRoot = await repository('chore(decisionsmemory): record abc');
  const result = await captureHeadCommit({ repositoryRoot, config, executor: async () => { throw new Error('must not run'); } });
  assert.equal(result.status, 'skipped');
});

test('captureHeadCommit leaves a dirty Journal untouched', async () => {
  const repositoryRoot = await repository('Mudança');
  const journal = join(repositoryRoot, 'docs/dev-journal');
  await mkdir(journal, { recursive: true });
  await writeFile(join(journal, 'note.md'), 'user content');
  const result = await captureHeadCommit({ repositoryRoot, config, executor: async () => [] });
  assert.equal(result.status, 'warning');
  assert.match(result.message, /uncommitted/);
});

test('captureHeadCommit reports executor failure without writing records', async () => {
  const repositoryRoot = await repository('Mudança');
  const result = await captureHeadCommit({ repositoryRoot, config, executor: async () => { throw new Error('offline'); } });
  assert.equal(result.status, 'warning');
  assert.match(result.message, /offline/);
});

test('readHeadCommit includes files from an initial commit', async () => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'decisionsmemory-capture-'));
  await run('git', ['init', '-q'], { cwd: repositoryRoot });
  await run('git', ['config', 'user.email', 'test@example.com'], { cwd: repositoryRoot });
  await run('git', ['config', 'user.name', 'Test'], { cwd: repositoryRoot });
  await writeFile(join(repositoryRoot, 'README.md'), 'initial');
  await run('git', ['add', 'README.md'], { cwd: repositoryRoot });
  await run('git', ['commit', '-m', 'Inicial'], { cwd: repositoryRoot });

  assert.deepEqual((await readHeadCommit(repositoryRoot)).files, ['README.md']);
});
