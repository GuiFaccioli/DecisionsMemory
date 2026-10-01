import { git, hasDirtyJournal, readHeadCommit } from './git.js';
import { writeJournalRecord } from './journal.js';
import { relative } from 'node:path';

const generatedPrefix = 'chore(decisionsmemory):';

export async function captureHeadCommit({ repositoryRoot, config, executor }) {
  const commit = await readHeadCommit(repositoryRoot);
  if (commit.subject.startsWith(generatedPrefix)) return { status: 'skipped', message: 'generated documentation commit' };
  if (await hasDirtyJournal(repositoryRoot, config.journalDirectory)) {
    return { status: 'warning', message: 'Journal has uncommitted changes' };
  }
  try {
    const entries = await executor({ commit });
    if (!Array.isArray(entries)) throw new Error('executor returned invalid entries');
    const journal = await writeJournalRecord({ repositoryRoot, config, commit, entries });
    return { status: 'captured', commit, journal };
  } catch (error) {
    return { status: 'warning', message: error.message };
  }
}

export async function commitJournalFiles({ repositoryRoot, journal, sourceCommit }) {
  const paths = journal.generatedFiles.map((file) => relative(repositoryRoot, file));
  await git(repositoryRoot, ['add', '--', ...paths]);
  await git(repositoryRoot, ['commit', '--only', '-m', `${generatedPrefix} record ${sourceCommit.hash.slice(0, 7)}`, '--', ...paths]);
}

export async function runPostCommit({ repositoryRoot, config, executor }) {
  const result = await captureHeadCommit({ repositoryRoot, config, executor });
  if (result.status !== 'captured') return result;
  await commitJournalFiles({ repositoryRoot, journal: result.journal, sourceCommit: result.commit });
  return result;
}
