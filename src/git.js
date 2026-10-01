import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

export async function git(repositoryRoot, args) {
  const { stdout } = await run('git', args, { cwd: repositoryRoot });
  return stdout;
}

export async function readHeadCommit(repositoryRoot) {
  const [metadata, files] = await Promise.all([
    git(repositoryRoot, ['show', '-s', '--format=%H%x00%cs%x00%s', 'HEAD']),
    git(repositoryRoot, ['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD']),
  ]);
  const [hash, date, subject] = metadata.trim().split('\0');
  return { hash, date, subject, files: files.trim() ? files.trim().split(/\r?\n/) : [] };
}

export async function hasDirtyJournal(repositoryRoot, journalDirectory) {
  return Boolean((await git(repositoryRoot, ['status', '--porcelain', '--', journalDirectory])).trim());
}
