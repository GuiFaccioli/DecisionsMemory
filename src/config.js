import { readFile, realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve, win32 } from 'node:path';

const defaults = {
  executor: {
    command: 'codex',
    model: 'gpt-6-luna',
    reasoningEffort: 'low',
  },
  journalDirectory: 'docs/dev-journal',
};

export function isPathInside(root, candidate) {
  const path = /^[A-Za-z]:[\\/]/.test(root) || /^[A-Za-z]:[\\/]/.test(candidate) ? win32 : { isAbsolute, relative, sep: '/' };
  const pathRelative = path.relative(root, candidate);
  return pathRelative === '' || (!path.isAbsolute(pathRelative) && pathRelative !== '..' && !pathRelative.startsWith(`..${path.sep}`));
}

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
  if (!/^[A-Za-z0-9._/-]+$/.test(config.executor.command)
    || !/^[A-Za-z0-9._-]+$/.test(config.executor.model)
    || !['low', 'medium', 'high'].includes(config.executor.reasoningEffort)) {
    throw new Error('executor settings must use a safe executable token, model, and reasoning effort');
  }

  const journalPath = resolve(repositoryRoot, config.journalDirectory);
  if (isAbsolute(config.journalDirectory) || !isPathInside(repositoryRoot, journalPath)) {
    throw new Error('journalDirectory must stay inside the repository');
  }
  const realRoot = await realpath(repositoryRoot);
  let ancestor = realRoot;
  for (const segment of config.journalDirectory.split(/[\\/]+/)) {
    ancestor = resolve(ancestor, segment);
    try {
      const resolvedAncestor = await realpath(ancestor);
      if (!isPathInside(realRoot, resolvedAncestor)) {
        throw new Error('journalDirectory must not traverse a symlink');
      }
    } catch (error) {
      if (error.code === 'ENOENT') break;
      throw error;
    }
  }
  return config;
}
