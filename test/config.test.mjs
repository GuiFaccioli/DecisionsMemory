import assert from 'node:assert/strict';
import { mkdtemp, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { isPathInside, loadConfig } from '../src/config.js';

test('loadConfig supplies the safe V1 defaults when no file exists', async () => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'decisionsmemory-config-'));

  const config = await loadConfig(repositoryRoot);

  assert.deepEqual(config, {
    executor: {
      command: 'codex',
      model: 'gpt-6-luna',
      reasoningEffort: 'low',
    },
    journalDirectory: 'docs/dev-journal',
  });
});

test('loadConfig rejects a Journal directory outside the repository', async () => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'decisionsmemory-config-'));
  await writeFile(
    join(repositoryRoot, 'decisionsmemory.json'),
    JSON.stringify({ journalDirectory: '../outside' }),
  );

  await assert.rejects(loadConfig(repositoryRoot), /inside the repository/);
});

test('loadConfig rejects malformed configuration JSON', async () => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'decisionsmemory-config-'));
  await writeFile(join(repositoryRoot, 'decisionsmemory.json'), '{not json');

  await assert.rejects(loadConfig(repositoryRoot), SyntaxError);
});

test('loadConfig rejects an empty executor command', async () => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'decisionsmemory-config-'));
  await writeFile(
    join(repositoryRoot, 'decisionsmemory.json'),
    JSON.stringify({ executor: { command: '' } }),
  );

  await assert.rejects(loadConfig(repositoryRoot), /executor.command is required/);
});

test('loadConfig rejects shell syntax in executor settings', async () => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'decisionsmemory-config-'));
  await writeFile(
    join(repositoryRoot, 'decisionsmemory.json'),
    JSON.stringify({ executor: { command: 'codex & evil', model: 'model;evil' } }),
  );

  await assert.rejects(loadConfig(repositoryRoot), /safe executable token/);
});

test('loadConfig rejects a Journal path traversing a symlink', async () => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'decisionsmemory-config-'));
  const outside = await mkdtemp(join(tmpdir(), 'decisionsmemory-outside-'));
  await symlink(outside, join(repositoryRoot, 'linked'), 'junction');
  await writeFile(join(repositoryRoot, 'decisionsmemory.json'), JSON.stringify({ journalDirectory: 'linked/journal' }));

  await assert.rejects(loadConfig(repositoryRoot), /must not traverse a symlink/);
});

test('isPathInside rejects a path on another Windows drive', () => {
  assert.equal(isPathInside('C:\\repo', 'D:\\outside'), false);
});
