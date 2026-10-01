import assert from 'node:assert/strict';
import test from 'node:test';

import { runCodexCapture } from '../src/codex.js';

test('runCodexCapture invokes configured Codex with low reasoning and parses entries', async () => {
  let invocation;
  const entries = await runCodexCapture({
    repositoryRoot: '/repo',
    commit: { hash: 'abc', date: '2026-09-30', subject: 'Corrige', files: ['src/a.js'] },
    config: { executor: { command: 'codex', model: 'gpt-6-luna', reasoningEffort: 'low' } },
    commandRunner: async (command, args, options) => {
      invocation = { command, args, options };
      return JSON.stringify([{ title: 'Mudança', summary: 'Resumo', files: ['src/a.js'], impact: 'Impacto' }]);
    },
  });

  assert.equal(invocation.command, 'codex');
  assert.deepEqual(entries, [{ title: 'Mudança', summary: 'Resumo', files: ['src/a.js'], impact: 'Impacto' }]);
  assert.ok(invocation.args.includes('--ephemeral'));
  assert.ok(invocation.args.includes('model_reasoning_effort=low'));
});
