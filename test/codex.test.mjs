import assert from 'node:assert/strict';
import test from 'node:test';

import { buildWindowsCommand, runCodexCapture } from '../src/codex.js';

test('runCodexCapture invokes configured Codex with low reasoning and parses entries', async () => {
  let invocation;
  const entries = await runCodexCapture({
    repositoryRoot: '/repo',
    commit: { hash: 'abc', date: '2026-09-30', subject: 'Corrige', files: ['src/a.js'] },
    config: { executor: { command: 'codex', model: 'gpt-6-luna', reasoningEffort: 'low' } },
    commandRunner: async (command, args, options) => {
      invocation = { command, args, options };
      return JSON.stringify({ entries: [{ title: 'Mudança', summary: 'Resumo', files: ['src/a.js'], impact: 'Impacto' }] });
    },
  });

  assert.equal(invocation.command, 'codex');
  assert.deepEqual(entries, [{ title: 'Mudança', summary: 'Resumo', files: ['src/a.js'], impact: 'Impacto' }]);
  assert.ok(invocation.args.includes('--ephemeral'));
  assert.ok(invocation.args.includes('model_reasoning_effort=low'));
  assert.ok(invocation.args.includes('--output-schema'));
  assert.equal(invocation.options.shell, process.platform === 'win32');
});

test('runCodexCapture rejects entries with invalid field types', async () => {
  await assert.rejects(
    runCodexCapture({
      repositoryRoot: '/repo',
      commit: { hash: 'abc', date: '2026-09-30', subject: 'Corrige', files: [] },
      config: { executor: { command: 'codex', model: 'gpt-6-luna', reasoningEffort: 'low' } },
      commandRunner: async () => JSON.stringify({ entries: [{ title: 1, summary: true, files: [], impact: {} }] }),
    }),
    /invalid entries/,
  );
});

test('buildWindowsCommand preserves spaces and literal percent signs', () => {
  const command = buildWindowsCommand('codex', ['exec', '--output-schema', 'C:/My Project/%PROBE%/schema.json', '-']);
  assert.match(command, /"C:\/My Project\/"\^%"PROBE"\^%"\/schema.json"/);
});
