import { hasDirtyJournal, readHeadCommit } from './git.js';
import { writeJournalRecord } from './journal.js';

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
