import { readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

const defaults = {
  executor: {
    command: 'codex',
    model: 'gpt-6-luna',
    reasoningEffort: 'low',
  },
  journalDirectory: 'docs/dev-journal',
};

export async function loadConfig(repositoryRoot) {
  let configured = {};
  try {
    configured = JSON.parse(await readFile(resolve(repositoryRoot, 'decisionsmemory.json'), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const config = {
    executor: { ...defaults.executor, ...configured.executor },
    journalDirectory: configured.journalDirectory ?? defaults.journalDirectory,
  };
  if (typeof config.executor.command !== 'string' || !config.executor.command.trim()) {
    throw new Error('executor.command is required');
  }

  const journalPath = resolve(repositoryRoot, config.journalDirectory);
  if (isAbsolute(config.journalDirectory) || relative(repositoryRoot, journalPath).startsWith('..')) {
    throw new Error('journalDirectory must stay inside the repository');
  }
  return config;
}
