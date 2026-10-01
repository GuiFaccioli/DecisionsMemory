import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { installHook } from './install.js';

const run = promisify(execFile);

async function installDependency(command, args, options) {
  await run(command, args, { ...options, shell: process.platform === 'win32' });
}

export async function initializeProject({
  repositoryRoot,
  packageName,
  packageVersion,
  installDependency: install = installDependency,
}) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  await install(npm, ['install', '--save-dev', '--ignore-scripts', `${packageName}@${packageVersion}`], { cwd: repositoryRoot });
  return installHook({
    repositoryRoot,
    packageRoot: resolve(repositoryRoot, 'node_modules', ...packageName.split('/')),
  });
}
