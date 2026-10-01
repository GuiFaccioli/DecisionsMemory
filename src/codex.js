import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const outputSchema = fileURLToPath(new URL('../schemas/capture-result.schema.json', import.meta.url));

export function buildWindowsCommand(command, args) {
  const quote = (value) => `"${String(value).replaceAll('%', '%%').replaceAll('"', '""')}"`;
  return [command, ...args].map(quote).join(' ');
}

function invoke(command, args, { cwd, input, shell }) {
  return new Promise((resolve, reject) => {
    const executable = shell ? buildWindowsCommand(command, args) : command;
    const child = spawn(executable, shell ? [] : args, { cwd, shell, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve(stdout) : reject(new Error(stderr || `${command} exited ${code}`)));
    child.stdin.end(input);
  });
}

export async function runCodexCapture({ repositoryRoot, commit, config, commandRunner = invoke }) {
  const { command, model, reasoningEffort } = config.executor;
  const args = ['exec', '--ephemeral', '--model', model, '-c', `model_reasoning_effort=${reasoningEffort}`, '--output-schema', outputSchema, '-'];
  const output = await commandRunner(command, args, {
    cwd: repositoryRoot,
    shell: process.platform === 'win32',
    input: JSON.stringify({
      task: 'Return only a JSON object with an entries array. Each entry must have non-empty string title, summary, impact, and files as an array of strings. Do not include raw diffs or credentials.',
      commit,
    }),
  });
  const entries = JSON.parse(output).entries;
  if (!Array.isArray(entries) || entries.some((entry) =>
    typeof entry?.title !== 'string' || !entry.title.trim()
    || typeof entry.summary !== 'string' || !entry.summary.trim()
    || !Array.isArray(entry.files) || entry.files.some((file) => typeof file !== 'string')
    || typeof entry.impact !== 'string' || !entry.impact.trim()
  )) {
    throw new Error('executor returned invalid entries');
  }
  return entries;
}
