import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';

const run = promisify(execFile);
const cli = join(process.cwd(), 'bin', 'decisionsmemory.js');

test('CLI rejects an unknown command with exit code 2', async () => {
  await assert.rejects(run(process.execPath, [cli, 'unknown']), (error) => error.code === 2);
});

test('status reports a non-Git workspace without mutating it', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'decisionsmemory-cli-'));
  const { stdout } = await run(process.execPath, [cli, 'status'], { cwd: directory });
  assert.match(stdout, /Git repository: no/);
});
