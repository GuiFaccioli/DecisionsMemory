import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function slug(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'commit';
}

async function nextEntryNumber(entriesRoot) {
  try {
    const names = await readdir(entriesRoot, { recursive: true });
    return names.reduce((highest, name) => Math.max(highest, Number(/(?:^|[\\/])entry(\d+)\.md$/.exec(name)?.[1] ?? 0)), 0) + 1;
  } catch (error) {
    if (error.code === 'ENOENT') return 1;
    throw error;
  }
}

function markdown(entry, number, commit) {
  return `---\nentry: ${number}\ncommit: ${commit.hash}\ndate: ${commit.date}\n---\n\n# ${entry.title}\n\n${entry.summary}\n\n## Arquivos\n\n${entry.files.map((file) => `- \`${file}\``).join('\n') || '- Nenhum'}\n\n## Impacto\n\n${entry.impact}\n`;
}

export async function writeJournalRecord({ repositoryRoot, config, commit, entries }) {
  const journalRoot = join(repositoryRoot, config.journalDirectory);
  const entriesRoot = join(journalRoot, 'entries');
  const directory = join(entriesRoot, `${commit.date}-${slug(commit.subject)}`);
  await mkdir(directory, { recursive: true });
  let number = await nextEntryNumber(entriesRoot);
  const generated = [];
  for (const entry of entries) {
    const filename = `entry${number}.md`;
    await writeFile(join(directory, filename), markdown(entry, number, commit));
    generated.push(join(directory, filename));
    number += 1;
  }
  const links = generated.map((file) => `<li><a href="${escapeHtml(file.split('\\').pop())}">${escapeHtml(file.split('\\').pop())}</a></li>`).join('');
  await writeFile(join(directory, 'styles.css'), 'body{font-family:system-ui;max-width:72ch;margin:3rem auto;padding:0 1rem}');
  await writeFile(join(directory, 'index.html'), `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="styles.css"><title>${escapeHtml(commit.subject)}</title></head><body><h1>${escapeHtml(commit.subject)}</h1><ul>${links}</ul></body></html>`);
  await mkdir(journalRoot, { recursive: true });
  const rootLink = relative(journalRoot, join(directory, 'index.html')).replaceAll('\\', '/');
  await writeFile(join(journalRoot, 'index.md'), `# Dev Journal\n\n- [${commit.date} — ${commit.subject}](${rootLink})\n`);
  await writeFile(join(journalRoot, 'index.html'), `<!doctype html><html><body><h1>Dev Journal</h1><a href="${rootLink}">${escapeHtml(commit.date)} — ${escapeHtml(commit.subject)}</a></body></html>`);
  return { directory, generatedFiles: [...generated, join(directory, 'index.html'), join(directory, 'styles.css'), join(journalRoot, 'index.md'), join(journalRoot, 'index.html')] };
}
