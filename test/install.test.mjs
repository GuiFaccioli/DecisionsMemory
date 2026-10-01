import assert from 'node:assert/strict';
import { chmod, mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';

import { installHook } from '../src/install.js';

const run = promisify(execFile);

async function repository() {
  const root = await mkdtemp(join(tmpdir(), 'decisionsmemory-hook-'));
  await run('git', ['init', '-q'], { cwd: root });
  return root;
}

test('installHook reports skipped outside a Git repository', async () => {
  const root = await mkdtemp(join(tmpdir(), 'decisionsmemory-no-git-'));
  const result = await installHook({ repositoryRoot: root, packageRoot: '/package' });
  assert.equal(result.status, 'skipped');
});

test('installHook preserves an existing hook and creates an idempotent wrapper', async () => {
  const root = await repository();
  const packageRoot = await mkdtemp(join(tmpdir(), 'decisionsmemory-package-'));
  await mkdir(join(packageRoot, 'bin'));
  await writeFile(join(packageRoot, 'bin', 'decisionsmemory.js'), "import { appendFileSync } from 'node:fs'; appendFileSync(process.env.RESULT, 'journal\\n');");
  const hooks = join(root, '.git', 'hooks');
  const original = join(hooks, 'post-commit');
  await writeFile(original, '#!/bin/sh\necho original >> "$RESULT"\n');
  await chmod(original, 0o755);

  await installHook({ repositoryRoot: root, packageRoot });
  await installHook({ repositoryRoot: root, packageRoot });

  assert.match(await readFile(join(hooks, 'post-commit.decisionsmemory-previous'), 'utf8'), /echo original/);
  const wrapper = await readFile(original, 'utf8');
  assert.match(wrapper, /DecisionsMemory managed hook/);
  const result = join(root, 'hook-result');
  await run('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  await run('git', ['config', 'user.name', 'Test'], { cwd: root });
  await run('git', ['commit', '--allow-empty', '-m', 'test'], { cwd: root, env: { ...process.env, RESULT: result } });
  assert.equal(await readFile(result, 'utf8'), 'original\njournal\n');
});

test('installed hook runs the real CLI and creates one Journal commit', async () => {
  const root = await repository();
  const fakeBin = await mkdtemp(join(tmpdir(), 'decisionsmemory-codex-'));
  await writeFile(join(fakeBin, 'codex.cmd'), '@echo {"entries":[{"title":"Entrada","summary":"Resumo","files":[],"impact":"Impacto"}]}\r\n');
  const posixCodex = join(fakeBin, 'codex');
  await writeFile(posixCodex, '#!/bin/sh\nprintf \'{"entries":[{"title":"Entrada","summary":"Resumo","files":[],"impact":"Impacto"}]}\\n\'\n');
  await chmod(posixCodex, 0o755);
  await run('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  await run('git', ['config', 'user.name', 'Test'], { cwd: root });
  await installHook({ repositoryRoot: root, packageRoot: process.cwd() });

  await run('git', ['commit', '--allow-empty', '-m', 'Mudança real'], {
    cwd: root,
    env: { ...process.env, PATH: `${fakeBin}${delimiter}${process.env.PATH}` },
  });

  const { stdout: subjects } = await run('git', ['log', '--format=%s', '-2'], { cwd: root });
  assert.match(subjects, /^chore\(decisionsmemory\):/m);
  const { stdout: generated } = await run('git', ['show', '--format=', '--name-only', 'HEAD'], { cwd: root });
  assert.match(generated, /docs\/dev-journal\/entries/);
});

test('installHook creates a configured hooks directory when it does not exist', async () => {
  const root = await repository();
  await run('git', ['config', 'core.hooksPath', '.decisionsmemory-hooks'], { cwd: root });

  const result = await installHook({ repositoryRoot: root, packageRoot: '/package' });

  assert.equal(result.status, 'installed');
  assert.match(await readFile(join(root, '.decisionsmemory-hooks', 'post-commit'), 'utf8'), /DecisionsMemory managed hook/);
});
