import { mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { isPathInside } from './config.js';

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

async function assertJournalInsideRepository(repositoryRoot, journalRoot) {
  const realRoot = await realpath(repositoryRoot);
  let ancestor = realRoot;
  for (const segment of relative(repositoryRoot, journalRoot).split(/[\\/]+/)) {
    ancestor = join(ancestor, segment);
    try {
      const resolvedAncestor = await realpath(ancestor);
      if (!isPathInside(realRoot, resolvedAncestor)) throw new Error('Journal path points outside the repository');
    } catch (error) {
      if (error.code === 'ENOENT') break;
      throw error;
    }
  }
}

function markdown(entry, number, commit) {
  return `---\nentry: ${number}\ncommit: ${commit.hash}\ndate: ${commit.date}\n---\n\n# ${entry.title}\n\n${entry.summary}\n\n## Arquivos\n\n${entry.files.map((file) => `- \`${file}\``).join('\n') || '- Nenhum'}\n\n## Impacto\n\n${entry.impact}\n`;
}

export async function writeJournalRecord({ repositoryRoot, config, commit, entries }) {
  const journalRoot = join(repositoryRoot, config.journalDirectory);
  const entriesRoot = join(journalRoot, 'entries');
  const directory = join(entriesRoot, `${commit.date}-${slug(commit.subject)}-${commit.hash.slice(0, 7)}`);
  const markdownIndex = join(journalRoot, 'index.md');
  const htmlIndex = join(journalRoot, 'index.html');
  const stylesPath = join(directory, 'styles.css');
  const recordIndex = join(directory, 'index.html');
  await Promise.all([journalRoot, entriesRoot, directory, markdownIndex, htmlIndex, stylesPath, recordIndex]
    .map((target) => assertJournalInsideRepository(repositoryRoot, target)));
  let number = await nextEntryNumber(entriesRoot);
  const generated = entries.map((_, index) => join(directory, `entry${number + index}.md`));
  await Promise.all(generated.map((target) => assertJournalInsideRepository(repositoryRoot, target)));
  await mkdir(directory, { recursive: true });
  for (const [index, entry] of entries.entries()) {
    await writeFile(generated[index], markdown(entry, number, commit));
    number += 1;
  }
  const links = generated.map((file) => `<li><a href="${escapeHtml(basename(file))}">${escapeHtml(basename(file))}</a></li>`).join('');
  const cards = entries.map((entry, index) => `<article><h2>${escapeHtml(entry.title)}</h2><p>${escapeHtml(entry.summary)}</p><h3>Arquivos</h3><ul>${entry.files.map((file) => `<li><code>${escapeHtml(file)}</code></li>`).join('') || '<li>Nenhum</li>'}</ul><h3>Impacto</h3><p>${escapeHtml(entry.impact)}</p><a href="entry${number - entries.length + index}.md">Ver Markdown</a></article>`).join('');
  await writeFile(stylesPath, 'body{font-family:system-ui;max-width:72ch;margin:3rem auto;padding:0 1rem}');
  await writeFile(recordIndex, `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="styles.css"><title>${escapeHtml(commit.subject)}</title></head><body><h1>${escapeHtml(commit.subject)}</h1>${cards}<h2>Entradas</h2><ul>${links}</ul></body></html>`);
  await mkdir(journalRoot, { recursive: true });
  const rootLink = relative(journalRoot, join(directory, 'index.html')).replaceAll('\\', '/');
  let existingIndex = '# Dev Journal\n\n';
  try { existingIndex = await readFile(markdownIndex, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const newLink = `- [${commit.date} — ${commit.subject}](${rootLink})\n`;
  if (!existingIndex.includes(`](${rootLink})`)) existingIndex += newLink;
  await writeFile(markdownIndex, existingIndex);
  let existingHtml = '<!doctype html><html><body><h1>Dev Journal</h1><ul></ul></body></html>';
  try { existingHtml = await readFile(htmlIndex, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!existingHtml.includes(`href="${rootLink}"`)) {
    existingHtml = existingHtml.replace('</ul>', `<li><a href="${escapeHtml(rootLink)}">${escapeHtml(`${commit.date} — ${commit.subject}`)}</a></li></ul>`);
  }
  await writeFile(htmlIndex, existingHtml);
  return { directory, generatedFiles: [...generated, recordIndex, stylesPath, markdownIndex, htmlIndex] };
}
