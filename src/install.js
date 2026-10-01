import { access, chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const marker = '# DecisionsMemory managed hook';

const shellQuote = (value) => `'${value.replaceAll("'", "'\"'\"'")}'`;

async function nextBackupPath(hook) {
  const base = `${hook}.decisionsmemory-previous`;
  let candidate = base;
  let suffix = 2;
  while (true) {
    try {
      await access(candidate, constants.F_OK);
      candidate = `${base}-${suffix}`;
      suffix += 1;
    } catch {
      return candidate;
    }
  }
}

async function hookPath(repositoryRoot) {
  try {
    const { stdout } = await run('git', ['rev-parse', '--git-path', 'hooks/post-commit'], { cwd: repositoryRoot });
    return resolve(repositoryRoot, stdout.trim());
  } catch {
    return null;
  }
}

export async function installHook({ repositoryRoot, packageRoot }) {
  const hook = await hookPath(repositoryRoot);
  if (!hook) return { status: 'skipped' };
  await mkdir(dirname(hook), { recursive: true });
  let current = '';
  try { current = await readFile(hook, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!current.includes(marker) && current) await rename(hook, await nextBackupPath(hook));

  const executable = shellQuote(resolve(packageRoot, 'bin/decisionsmemory.js').replaceAll('\\', '/'));
  const wrapper = `#!/bin/sh\n${marker}\nDIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"\nfor HOOK in "$DIR"/post-commit.decisionsmemory-previous*; do\n  [ -x "$HOOK" ] && "$HOOK" "$@"\ndone\nnode ${executable} post-commit\n`;
  await writeFile(hook, wrapper);
  await chmod(hook, 0o755);
  return { status: 'installed', hook };
}
