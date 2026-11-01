// Gibt den aktuellen Stand von main als neue Version für Milena frei:
// Tag v<version> setzen, GitHub-Release mit „Was ist neu“ anlegen, Veröffentlichung starten.
// Aufruf: npm run freigeben   (vorher Version in package.json und CHANGELOG.md erhöhen)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const gh = process.env.GH ?? 'gh';
const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const tag = `v${version}`;

if (run('git', ['status', '--porcelain']))
  throw new Error('Es gibt noch nicht committete Änderungen.');
if (run('git', ['rev-parse', '--abbrev-ref', 'HEAD']) !== 'main')
  throw new Error('Bitte auf main freigeben.');
run('git', ['fetch', 'origin', 'main', '--tags']);
if (run('git', ['rev-parse', 'HEAD']) !== run('git', ['rev-parse', 'origin/main']))
  throw new Error('main ist nicht auf dem Stand von GitHub (erst pushen).');
if (run('git', ['tag', '--list', tag])) throw new Error(`${tag} gibt es schon – Version erhöhen.`);

const zeilen = readFileSync('CHANGELOG.md', 'utf8').split(/\r?\n/);
const start = zeilen.findIndex((z) => z.startsWith(`## ${version} `));
if (start < 0) throw new Error(`CHANGELOG.md hat keinen Abschnitt „## ${version} …“.`);
const ende = zeilen.findIndex((z, i) => i > start && z.startsWith('## '));
const notizen = zeilen
  .slice(start + 1, ende < 0 ? undefined : ende)
  .join('\n')
  .trim();

const datei = join(mkdtempSync(join(tmpdir(), 'miapp-')), 'notizen.md');
writeFileSync(datei, notizen);

run('git', ['tag', '-a', tag, '-m', `MiApp ${version}`]);
run('git', ['push', 'origin', tag]);
run(gh, ['release', 'create', tag, '--title', `MiApp ${version}`, '--notes-file', datei]);
run(gh, ['workflow', 'run', 'deploy.yml', '--ref', 'main']);
console.log(`${tag} freigegeben. Milenas App wird jetzt aktualisiert (ein paar Minuten).`);
