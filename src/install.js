import { access, chmod, readFile, rename, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const marker = '# DecisionsMemory managed hook';

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
  const previous = `${hook}.decisionsmemory-previous`;
  let current = '';
  try { current = await readFile(hook, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!current.includes(marker) && current) await rename(hook, previous);

  const wrapper = `#!/bin/sh\n${marker}\nDIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"\nif [ -x "$DIR/post-commit.decisionsmemory-previous" ]; then\n  "$DIR/post-commit.decisionsmemory-previous" "$@"\nfi\nnode "${resolve(packageRoot, 'bin/decisionsmemory.js').replaceAll('\\', '/')}" post-commit\n`;
  await writeFile(hook, wrapper);
  await chmod(hook, 0o755);
  return { status: 'installed', hook };
}
