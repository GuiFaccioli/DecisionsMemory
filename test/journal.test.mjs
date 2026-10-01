import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { writeJournalRecord } from '../src/journal.js';

const config = { journalDirectory: 'docs/dev-journal' };

test('writeJournalRecord creates numbered Markdown and visual files for a commit', async () => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'decisionsmemory-journal-'));
  const result = await writeJournalRecord({
    repositoryRoot,
    config,
    commit: { hash: 'abc1234', subject: 'Corrige login', date: '2026-09-30' },
    entries: [
      { title: 'Valida sessão', summary: 'Rejeita sessão expirada.', files: ['src/auth.js'], impact: 'Evita acesso inválido.' },
      { title: 'Mostra erro', summary: 'Exibe erro de autenticação.', files: ['src/login.js'], impact: 'Explica a falha.' },
    ],
  });

  assert.match(result.directory, /2026-09-30-corrige-login-abc1234$/);
  assert.match(await readFile(join(result.directory, 'entry1.md'), 'utf8'), /Valida sessão/);
  assert.match(await readFile(join(result.directory, 'entry2.md'), 'utf8'), /Mostra erro/);
  const page = await readFile(join(result.directory, 'index.html'), 'utf8');
  assert.match(page, /Valida sessão/);
  assert.match(page, /Rejeita sessão expirada/);
  assert.match(page, /Evita acesso inválido/);
  await stat(join(result.directory, 'index.html'));
  await stat(join(result.directory, 'styles.css'));
  await stat(join(repositoryRoot, 'docs/dev-journal/index.md'));
  await stat(join(repositoryRoot, 'docs/dev-journal/index.html'));
});

test('writeJournalRecord continues entry numbers across commit folders', async () => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'decisionsmemory-journal-'));
  await writeJournalRecord({ repositoryRoot, config, commit: { hash: 'one', subject: 'Primeiro', date: '2026-09-30' }, entries: [{ title: 'Um', summary: 's', files: [], impact: 'i' }] });
  const result = await writeJournalRecord({ repositoryRoot, config, commit: { hash: 'two', subject: 'Segundo', date: '2026-10-01' }, entries: [{ title: 'Dois', summary: 's', files: [], impact: 'i' }] });

  await stat(join(result.directory, 'entry2.md'));
  const index = await readFile(join(repositoryRoot, 'docs/dev-journal/index.md'), 'utf8');
  assert.match(index, /Primeiro/);
  assert.match(index, /Segundo/);
});

test('writeJournalRecord keeps same-day commits with the same subject in separate folders', async () => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'decisionsmemory-journal-'));
  const first = await writeJournalRecord({ repositoryRoot, config, commit: { hash: 'aaaaaaa', subject: 'Ajuste', date: '2026-09-30' }, entries: [{ title: 'Um', summary: 's', files: [], impact: 'i' }] });
  const second = await writeJournalRecord({ repositoryRoot, config, commit: { hash: 'bbbbbbb', subject: 'Ajuste', date: '2026-09-30' }, entries: [{ title: 'Dois', summary: 's', files: [], impact: 'i' }] });

  assert.notEqual(first.directory, second.directory);
});

test('global HTML index preserves commit subjects containing brackets', async () => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'decisionsmemory-journal-'));
  await writeJournalRecord({ repositoryRoot, config, commit: { hash: 'aaaaaaa', subject: 'feat: add [admin]', date: '2026-09-30' }, entries: [{ title: 'Um', summary: 's', files: [], impact: 'i' }] });

  const page = await readFile(join(repositoryRoot, 'docs/dev-journal/index.html'), 'utf8');
  assert.match(page, /feat: add \[admin\]/);
});

test('writeJournalRecord rejects an existing Journal symlink outside the repository', async () => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'decisionsmemory-journal-'));
  const outside = await mkdtemp(join(tmpdir(), 'decisionsmemory-outside-'));
  await mkdir(join(repositoryRoot, 'docs'));
  await symlink(outside, join(repositoryRoot, 'docs', 'dev-journal'), 'junction');

  await assert.rejects(
    writeJournalRecord({ repositoryRoot, config, commit: { hash: 'aaaaaaa', subject: 'Ajuste', date: '2026-09-30' }, entries: [] }),
    /outside the repository/,
  );
});

test('writeJournalRecord rejects an internal Journal index symlink outside the repository', async () => {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'decisionsmemory-journal-'));
  const outside = await mkdtemp(join(tmpdir(), 'decisionsmemory-outside-'));
  const journalRoot = join(repositoryRoot, 'docs', 'dev-journal');
  const sentinel = join(outside, 'do-not-overwrite.md');
  await writeFile(sentinel, 'do not overwrite');
  await mkdir(journalRoot, { recursive: true });
  await symlink(outside, join(journalRoot, 'index.md'), 'junction');

  await assert.rejects(
    writeJournalRecord({ repositoryRoot, config, commit: { hash: 'aaaaaaa', subject: 'Ajuste', date: '2026-09-30' }, entries: [] }),
    /outside the repository/,
  );
  assert.equal(await readFile(sentinel, 'utf8'), 'do not overwrite');
});
