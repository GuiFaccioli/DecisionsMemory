import { spawn } from 'node:child_process';

function invoke(command, args, { cwd, input }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
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
  const args = ['exec', '--ephemeral', '--model', model, '-c', `model_reasoning_effort=${reasoningEffort}`, '-'];
  const output = await commandRunner(command, args, {
    cwd: repositoryRoot,
    input: JSON.stringify({ task: 'Return JSON array of technical entries only.', commit }),
  });
  const entries = JSON.parse(output);
  if (!Array.isArray(entries) || entries.some((entry) => !entry.title || !entry.summary || !Array.isArray(entry.files) || !entry.impact)) {
    throw new Error('executor returned invalid entries');
  }
  return entries;
}
