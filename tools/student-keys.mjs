// Sets up and manages the students' OpenRouter keys. For the teacher only. Same command on Mac
// and Windows, in the kit folder:
//
//   node tools/student-keys.mjs setup
//
// It asks for what it needs: the Management key (hidden), the student list (the ZHdK export or a
// CSV with the header `name`), who uses their own plan, and the last day the keys work. Then it
// shows what it will do and waits for "yes". It sets up the guardrail (the course models, $10 a
// day per key), makes a test key for you and tries it, and makes one key per student ($25 for the
// whole course). Run it again at any time: it only does what is missing.
//
// Keys are numbered (photolipsia-hs26-01, -02, ...), so no student names go to OpenRouter. Which
// number belongs to whom is only on your computer: ~/photolipsia-hs26-students.csv. New keys go
// to ~/photolipsia-hs26-keys.csv (readable only by you), never to the terminal.
//
// Single steps:
//   list                     every course key: who, used, left, limit, status, expiry
//   check [students.csv]     what differs from the course setup
//   fix [students.csv]       repairs what check marks [fix]
//   create <students.csv> [--expires YYYY-MM-DD]
//   assign                   the guardrail to every active course key
//   limit <who> <usd>   disable <who>   enable <who>
//   rename <who> <student>   a key made by hand becomes that student's course key
//   replace <who>            a leaked key: disable it, make a new one with the rest of its limit
//   mail [students.csv]      one email per student with their key, opened in your mail program
//   delete-all               at the end of the course
//
// <who> is a student (anna), a key number (7) or the start of a key hash.
// Options: --budget 10 (dollars per key per day), --limit 25, --guardrail photolipsia,
// --out <keys file>, --map <students file>, --yes (setup without questions: give it the student
// list and --expires). The Management key can also come from OPENROUTER_MANAGEMENT_KEY.

import { spawn } from 'node:child_process';
import { appendFileSync, chmodSync, existsSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';

// OPENROUTER_API_BASE is only for testing against a local mock server.
const API = process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1';
const PREFIX = 'photolipsia-hs26-';
const TEST_KEY = `${PREFIX}teacher`;
const MODELS = ['z-ai/glm-5.3-flash', 'z-ai/glm-5.3'];
const LEAKED = '-leaked';
const GUARDRAILS_PAGE = 'https://openrouter.ai/workspaces/default/guardrails';
const CREDITS_PAGE = 'https://openrouter.ai/settings/credits';
const MANAGEMENT_PAGE = 'https://openrouter.ai/settings/management-keys';
const KIT = 'https://github.com/xohm/photolipsia-agentic-kit';

// The email `mail` opens for each student. {first name} and {key} are filled in.
const MAIL_SUBJECT = 'Photolipsia: your course key for tomorrow';
const MAIL_BODY = `Hi {first name},

Tomorrow we go deeper into agentic coding. If you want to look at it beforehand:

- Course kit: ${KIT}
  Fork it: your fork is where you work. It is public.
- Setup guide: ${KIT}/blob/main/docs/student-setup.md
  or as slides: https://xohm.github.io/photolipsia-agentic-kit/slides/00-setup.html
- Your personal course key: {key}
  Section 4 of the guide shows where to put it. $10 a day, $25 for the whole course.
  Keep it to yourself: never in a project, a commit, a screenshot, a chat or a prompt,
  and don't forward this email.

If you have your own Claude or ChatGPT plan, you don't need the key: tell me and I'll
switch it off.

Questions: ${KIT}/discussions, or tomorrow in class.

Max
`;

const { command, args, options } = parseArgs(process.argv.slice(2));
const COMMANDS = { setup, create, list, check, fix, assign, limit, disable, enable, rename, replace, mail, 'delete-all': deleteAll };
const OFFLINE = ['mail'];

if (!COMMANDS[command]) {
  if (command && command !== 'help') console.log(`Unknown command: ${command}\n`);
  console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n\n')[0].replace(/^\/\/ ?/gm, ''));
  process.exit(command && command !== 'help' ? 1 : 0);
}

const guardrailName = options.guardrail ?? 'photolipsia';
const out = expandHome(options.out ?? '~/photolipsia-hs26-keys.csv');
const mapFile = expandHome(options.map ?? '~/photolipsia-hs26-students.csv');
const keyLimit = dollars('--limit', options.limit ?? '25');
const budget = dollars('--budget', options.budget ?? '10');
const names = readMap();
const prompts = { reader: null, lines: [], waiting: null, ended: false, muted: false };

const managementKey = OFFLINE.includes(command) ? '' : process.env.OPENROUTER_MANAGEMENT_KEY?.trim() || await askManagementKey();
const headers = { Authorization: `Bearer ${managementKey}`, 'Content-Type': 'application/json' };

try {
  await COMMANDS[command](...args);
} catch (problem) {
  fail([401, 403].includes(problem.status) ? `${problem.message}\n${await whyRefused()}` : problem.message);
}
prompts.reader?.close();

// ---- commands -------------------------------------------------------------------------------

async function setup(file) {
  console.log('Photolipsia course setup. Nothing changes before you type yes.\n');
  checkFiles();
  const state = await load();
  const students = await chooseStudents(file);
  const expiresAt = options.expires ? expiryOf(options.expires) : await askExpiry();
  const { problems, plan } = analyse(state, null);
  const todo = students.filter((student) => !hasKey(state.keys, student));
  const testKey = state.keys.find((key) => key.name === TEST_KEY && isLive(key));

  console.log('\nWhat setup will do:');
  for (const problem of problems.filter((item) => item.fix)) console.log(`  - fix ${problem.text}`);
  console.log(`  - ${testKey ? 'try your test key' : `make a test key for you (${TEST_KEY}) and try it`}`);
  if (todo.length) {
    const next = nextNumber(state.keys);
    console.log(`  - make ${todo.length} student keys, ${number(next)} to ${number(next + todo.length - 1)}: ${money(keyLimit)} each, until ${expiresAt.slice(0, 10)}`);
  }
  const done = students.length - todo.length;
  if (done) console.log(`  - leave the ${done} students who already have a key`);
  if (!options.yes && (await ask('\nType yes to go on: ')).toLowerCase() !== 'yes') fail('Nothing changed.');

  console.log('\n1. Guardrail');
  const { guardrail, changes } = await applyFixes(state, plan);
  if (!changes) console.log(`guardrail ${guardrail.name}: ${describeGuardrail(guardrail)}`);

  console.log('\n2. Test key');
  if (!(await tryTestKey(guardrail, expiresAt))) {
    fail('\nThe test key did not behave as expected, so no student keys were made. Send this output to whoever helps you.');
  }

  console.log('\n3. Student keys');
  if (todo.length) await createKeys(todo, guardrail, expiresAt);
  else console.log('Every student already has a key.');

  console.log('\n4. Check');
  const after = await load();
  const findings = analyse(after, students);
  report(after, findings);
  console.log(`\nNew keys: ${out}. Move them to your password manager, then delete that file.`);
  console.log(`Who has which number: ${mapFile}. Keep it on this computer until the course is over.`);
  if (findings.problems.length) process.exit(1);
}

async function create(file) {
  if (!file) fail('Which students? node tools/student-keys.mjs create students.csv --expires YYYY-MM-DD');
  const students = readStudents(file);
  const expiresAt = options.expires ? expiryOf(options.expires) : null;
  checkFiles();
  const guardrail = await findGuardrail();
  const keys = await allKeys();
  const todo = students.filter((student) => {
    if (!hasKey(keys, student)) return true;
    console.log(`${student.slug}: already has key ${number(names.get(student.slug).keyName)}, skipped`);
    return false;
  });
  if (todo.length) await createKeys(todo, guardrail, expiresAt);
  else console.log('\nNo new keys: every student already has one.');
}

async function list() {
  const { keys, guardrail, holder, credits } = await load();
  const course = keys.filter((key) => key.name.startsWith(PREFIX));
  if (credits) console.log(`credits: ${money(credits.total_credits)} bought, ${money(credits.total_usage)} used, ${money(credits.total_credits - credits.total_usage)} left`);
  console.log(`guardrail ${guardrailName}: ${guardrail ? describeGuardrail(guardrail) : 'not found'}\n`);
  if (!course.length) {
    console.log(`No course keys yet (names starting with ${PREFIX}).`);
    return;
  }
  const rows = [['key', 'used', 'left', 'limit', 'status', 'expires', 'hash']];
  for (const key of course.sort((a, b) => a.name.localeCompare(b.name))) {
    rows.push([
      shortName(key),
      money(key.usage),
      key.limit == null ? '-' : money(key.limit_remaining),
      key.limit == null ? 'none' : money(key.limit),
      status(key, guardrail, holder),
      key.expires_at?.slice(0, 10) ?? 'never',
      key.hash.slice(0, 8),
    ]);
  }
  printTable(rows);
  const used = course.reduce((sum, key) => sum + (key.usage ?? 0), 0);
  console.log(`\ntotal used by ${course.length} course keys: ${money(used)}`);
}

async function check(file) {
  const state = await load();
  const findings = analyse(state, file ? readStudents(file) : null);
  report(state, findings);
  const count = findings.problems.length;
  const fixable = findings.problems.filter((problem) => problem.fix).length;
  if (count) {
    console.log(`\n${count} problem${count === 1 ? '' : 's'}.${fixable ? ` ${fixable} can be fixed with: node tools/student-keys.mjs fix` : ''}`);
    process.exit(1);
  }
  console.log('\nAll good.');
}

async function fix(file) {
  const students = file ? readStudents(file) : null;
  const state = await load();
  const { changes } = await applyFixes(state, analyse(state, students).plan);
  console.log(changes ? '\nAfter the fixes:' : 'Nothing to fix here.');
  const after = await load();
  const findings = analyse(after, students);
  report(after, findings);
  if (findings.problems.length) process.exit(1);
  console.log('\nAll good.');
}

async function assign() {
  const guardrail = await findGuardrail();
  const live = (await allKeys()).filter((key) => key.name.startsWith(PREFIX) && isLive(key));
  if (!live.length) fail(`No active course keys (names starting with ${PREFIX}).`);
  const count = await assignTo(guardrail, live.map((key) => key.hash));
  console.log(`guardrail ${guardrail.name}: assigned to ${count} of ${live.length} active course keys.`);
}

async function limit(who, usd) {
  if (usd == null) fail('Usage: node tools/student-keys.mjs limit <who> <usd>');
  const key = await findKey(who);
  const value = dollars('limit', usd);
  await api('PATCH', `/keys/${key.hash}`, { limit: value });
  console.log(`${shortName(key)}: limit ${key.limit == null ? 'none' : money(key.limit)} -> ${money(value)} (used ${money(key.usage)})`);
}

async function disable(who) {
  const key = await findKey(who);
  await api('PATCH', `/keys/${key.hash}`, { disabled: true });
  console.log(`${shortName(key)}: disabled`);
}

async function enable(who) {
  const key = await findKey(who);
  await api('PATCH', `/keys/${key.hash}`, { disabled: false });
  console.log(`${shortName(key)}: enabled`);
  if (key.name.includes(LEAKED)) console.log('This key leaked. Enable it only if you are sure.');
}

async function rename(who, student) {
  if (!student) fail('Usage: node tools/student-keys.mjs rename <who> <student>');
  checkFiles();
  const key = await findKey(who);
  const person = { slug: slug(student), label: student };
  const keys = await allKeys();
  const entry = names.get(person.slug) ?? [...names.values()].find((item) => item.label.toLowerCase() === student.trim().toLowerCase());
  if (entry && keys.some((other) => other.name === entry.keyName && other.hash !== key.hash)) fail(`${entry.slug} already has key ${number(entry.keyName)}.`);
  const name = entry?.keyName ?? PREFIX + number(nextNumber(keys));
  await api('PATCH', `/keys/${key.hash}`, { name });
  if (!entry) remember(person, name);
  console.log(`${key.name} -> ${name} (${entry?.slug ?? person.slug})`);
  if (isLive(key)) console.log('Run `node tools/student-keys.mjs fix` to give it the course guardrail and limits.');
}

async function replace(who) {
  checkFiles();
  const key = await findKey(who);
  if (!key.name.startsWith(PREFIX) || key.name.includes(LEAKED)) {
    fail(`${key.name} is not a course key. Make it one first: node tools/student-keys.mjs rename ${key.hash.slice(0, 8)} <student>`);
  }
  const guardrail = await findGuardrail();
  const keys = await allKeys();
  const label = shortName(key);
  const leakedName = freeName(`${key.name}${LEAKED}`, keys);
  const remaining = Math.max(0, Math.round(((key.limit ?? keyLimit) - (key.usage ?? 0)) * 100) / 100);

  await api('PATCH', `/keys/${key.hash}`, { disabled: true, name: leakedName });
  console.log(`${label}: old key disabled and renamed to ${leakedName}`);
  let response;
  try {
    response = await api('POST', '/keys', { name: key.name, limit: remaining, limit_reset: null, ...(key.expires_at && { expires_at: key.expires_at }) });
  } catch (problem) {
    fail(`${problem.message}\nThe old key is disabled. No new key yet: run \`create\` with a CSV holding this student, then \`limit ${number(key.name)} ${remaining}\`.`);
  }
  save(ownerOf(key)?.label ?? label, key.name, response.key);
  try {
    await assignTo(guardrail, [response.data.hash]);
  } catch (problem) {
    fail(`${problem.message}\nThe new key is saved in ${out}, without the guardrail. Assign it: node tools/student-keys.mjs assign`);
  }
  console.log(`${label}: new key saved to ${out}, limit ${money(remaining)} (the rest of ${money(key.limit ?? keyLimit)}), assigned to ${guardrail.name}.`);
  if (remaining === 0) console.log(`The old key had used its whole limit. Raise it: node tools/student-keys.mjs limit ${number(key.name)} <usd>`);
}

// One email per student, opened in your mail program with the key filled in: you press Send.
// The keys come from the --out file and never show in the terminal.
async function mail(file) {
  if (!existsSync(out)) fail(`No keys file at ${out}. Keys are shown only once: give a student a new one with replace <who>.`);
  const saved = new Map(readFileSync(out, 'utf8').split(/\r?\n/).slice(1).map((line) => splitCsv(line, ',')).map((row) => [row[1], row[2]]));
  const students = readStudents(await askStudentFile(file));
  const ready = students.filter((student) => saved.get(names.get(student.slug)?.keyName));
  const without = students.filter((student) => !ready.includes(student));
  if (without.length) console.log(`No key in ${out} for: ${without.map((student) => student.label).join(', ')}`);
  if (!ready.length) fail('Nobody to write to.');

  console.log(`\n${ready.length} students with a key:`);
  ready.forEach((student, i) => console.log(`  ${String(i + 1).padStart(2)}  ${student.label}  ${student.email || '(no address in the list)'}`));
  const picked = await askNumbers('Write to whom? Enter: all of them, or their numbers, e.g. 1 or 2-21: ', ready.length);
  const chosen = picked.length ? ready.filter((_, i) => picked.includes(i + 1)) : ready;

  console.log('\nEach email opens in your mail program. Check it, press Send, then come back here.');
  for (const [i, student] of chosen.entries()) {
    const body = MAIL_BODY.replace('{first name}', () => student.given).replace('{key}', () => saved.get(names.get(student.slug).keyName));
    openMail(student.email ?? '', MAIL_SUBJECT, body);
    const missing = student.email ? '' : ' Fill in the address: the list has none.';
    const answer = await ask(`${i + 1}/${chosen.length} ${student.label}: email opened.${missing} Enter for the next (q to stop): `);
    if (answer.toLowerCase() === 'q') fail('Stopped.');
  }
  console.log(`\nDone: ${chosen.length} emails opened. Once they are sent, move the keys to your password manager and delete ${out}.`);
}

// A mailto: link, handed to the default mail program. Nothing goes through a shell.
function openMail(to, subject, body) {
  const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.replace(/\n/g, '\r\n'))}`;
  const [program, ...rest] = process.platform === 'darwin' ? ['open', url]
    : process.platform === 'win32' ? ['rundll32', 'url.dll,FileProtocolHandler', url]
      : ['xdg-open', url];
  spawn(program, rest, { detached: true, stdio: 'ignore' }).on('error', () => console.log(`Could not start ${program}.`)).unref();
}

async function deleteAll() {
  const course = (await allKeys()).filter((key) => key.name.startsWith(PREFIX));
  if (!course.length) {
    console.log(`No course keys (names starting with ${PREFIX}).`);
    return;
  }
  for (const key of course) console.log(`  ${shortName(key)}  used ${money(key.usage)}`);
  console.log(`\nThis deletes these ${course.length} keys for good. Students can no longer use them.`);
  const answer = await ask('Type delete to go on: ');
  if (answer !== 'delete') fail('Nothing deleted.');
  for (const key of course) {
    await api('DELETE', `/keys/${key.hash}`);
    console.log(`${shortName(key)}: deleted`);
  }
  console.log(`\nDeleted ${course.length} keys. Note the remaining credits: ${CREDITS_PAGE}`);
  console.log(`On this computer: delete ${mapFile} (and ${out}, if it is still there) once you no longer need them.`);
}

// ---- what setup asks ------------------------------------------------------------------------

async function askManagementKey() {
  if (!process.stdin.isTTY) {
    console.log('OPENROUTER_MANAGEMENT_KEY is not set in this terminal.');
    console.log('  Mac:     read -rs "OPENROUTER_MANAGEMENT_KEY?Paste the key: "; export OPENROUTER_MANAGEMENT_KEY');
    console.log("  Windows: $env:OPENROUTER_MANAGEMENT_KEY = Read-Host 'Paste the key'");
    process.exit(1);
  }
  console.log(`This needs a Management key (${MANAGEMENT_PAGE}; it is shown only once when you create it).`);
  const key = await ask('Paste the Management key (it stays hidden), then Enter: ', true);
  if (!key) fail('No key, nothing done.');
  return key;
}

async function askStudentFile(file) {
  let path = file;
  while (!path || !existsSync(expandHome(path))) {
    if (path) console.log(`Can't find ${path}.`);
    if (options.yes) fail('setup --yes needs the student list: node tools/student-keys.mjs setup students.csv --expires YYYY-MM-DD --yes');
    path = cleanPath(await ask('Student list: the ZHdK export or a CSV with the header "name" (you can drag the file here): '));
  }
  return path;
}

async function chooseStudents(file) {
  const students = readStudents(await askStudentFile(file));
  if (options.yes) return students;
  console.log(`\n${students.length} students:`);
  students.forEach((student, i) => {
    const entry = names.get(student.slug);
    console.log(`  ${String(i + 1).padStart(2)}  ${student.label}${entry ? `  (has key ${number(entry.keyName)})` : ''}`);
  });
  const picked = await askNumbers('Who uses their own Claude or ChatGPT plan and gets no key? Their numbers, e.g. 3 7 (Enter: nobody): ', students.length);
  return students.filter((_, i) => !picked.includes(i + 1));
}

// Numbers from a list: "3 7", "2-21" or both. Enter gives an empty list.
async function askNumbers(question, max) {
  for (;;) {
    const picked = [];
    for (const part of (await ask(question)).split(/[\s,;]+/).filter(Boolean)) {
      const [from, to = from] = part.split('-').map(Number);
      for (let n = from; n <= to; n++) picked.push(n);
      if (!(from <= to)) picked.push(NaN);
    }
    if (picked.every((n) => Number.isInteger(n) && n >= 1 && n <= max)) return picked;
    console.log(`Use numbers from 1 to ${max}, like 3 7 or 2-${max}.`);
  }
}

async function askExpiry() {
  if (options.yes) fail('setup --yes needs --expires YYYY-MM-DD');
  for (;;) {
    const date = await ask('Last day the keys work, YYYY-MM-DD (a few days after the course; it cannot be changed later): ');
    const problem = expiryProblem(date);
    if (!problem) return `${date}T23:59:59Z`;
    console.log(problem);
  }
}

// A path typed or dragged into the terminal: without quotes or the backslashes before spaces.
function cleanPath(text) {
  return text.trim().replace(/^(['"])(.*)\1$/, '$2').replace(/\\ /g, ' ');
}

// One line from the keyboard. Lines typed ahead (or piped in) wait in a queue, and a hidden
// answer is not echoed.
async function ask(question, hidden = false) {
  if (!prompts.reader) {
    const output = new Writable({
      write(chunk, encoding, done) {
        if (!prompts.muted) process.stdout.write(chunk, encoding);
        done();
      },
    });
    Object.defineProperty(output, 'columns', { get: () => process.stdout.columns });
    prompts.reader = createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) });
    prompts.reader.on('line', (line) => (prompts.waiting ? prompts.waiting(line) : prompts.lines.push(line)));
    prompts.reader.on('close', () => {
      prompts.ended = true;
      prompts.waiting?.('');
    });
    prompts.reader.on('SIGINT', () => {
      process.stdout.write('\n');
      process.exit(130);
    });
  }
  if (hidden) process.stdout.write(question);
  prompts.reader.setPrompt(hidden ? '' : question);
  prompts.muted = hidden;
  prompts.reader.prompt();
  const answer = prompts.lines.length ? prompts.lines.shift() : prompts.ended ? '' : await new Promise((done) => {
    prompts.waiting = (line) => {
      prompts.waiting = null;
      done(line);
    };
  });
  prompts.muted = false;
  if (hidden || !process.stdin.isTTY) process.stdout.write('\n');
  return answer.trim();
}

// ---- what check looks at --------------------------------------------------------------------

// Every difference from the course setup. A problem with `fix` is one that `fix` repairs.
function analyse({ keys, guardrails, guardrail, holder, credits, destinations }, students) {
  const problems = [];
  const notes = [];
  const plan = { guardrail: null, assign: [], patches: [] };
  const course = keys.filter((key) => key.name.startsWith(PREFIX));
  const live = course.filter(isLive);

  if (!guardrail) {
    problems.push({ text: `guardrail ${guardrailName}: missing`, fix: true });
  } else {
    const wanted = wantedGuardrail();
    if (guardrail.limit_usd == null || Number(guardrail.limit_usd) !== budget || guardrail.reset_interval !== 'daily') {
      problems.push({ text: `guardrail ${guardrailName}: budget ${budgetOf(guardrail)}, the course uses ${budgetOf(wanted)}`, fix: true });
      plan.guardrail = { ...plan.guardrail, limit_usd: wanted.limit_usd, reset_interval: wanted.reset_interval };
    }
    if (modelSet(guardrail.allowed_models) !== modelSet(MODELS)) {
      problems.push({ text: `guardrail ${guardrailName}: models ${guardrail.allowed_models?.join(', ') ?? 'all'}, the course uses ${MODELS.join(', ')}`, fix: true });
      plan.guardrail = { ...plan.guardrail, allowed_models: wanted.allowed_models };
    }
    if (guardrail.allowed_providers?.length) notes.push(`guardrail ${guardrailName}: only the providers ${guardrail.allowed_providers.join(', ')}`);
  }

  for (const other of guardrails.filter((item) => item !== guardrail && /^Workspace .* Default$/.test(item.name))) {
    if (other.allowed_models && !MODELS.every((model) => other.allowed_models.includes(model))) {
      problems.push({ text: `${other.name} (applies to every key): its models ${other.allowed_models.join(', ')} block a course model. Change it: ${GUARDRAILS_PAGE}` });
    } else if (other.allowed_models || other.limit_usd != null) {
      notes.push(`${other.name} applies to every key too: ${describeGuardrail(other)}`);
    }
  }

  for (const [name, same] of groupBy(live, (key) => key.name)) {
    if (same.length > 1) problems.push({ text: `${shortName(same[0])}: ${same.length} active keys with this name (${same.map((key) => key.hash.slice(0, 8)).join(', ')}). Disable the extra one by its hash.` });
  }

  const inactive = [];
  const noExpiry = [];
  for (const key of course) {
    const who = shortName(key);
    if (key.name.includes(LEAKED)) {
      if (!key.disabled) {
        problems.push({ text: `${who}: leaked key still enabled`, fix: true });
        plan.patches.push({ key, body: { disabled: true }, text: 'leaked key disabled' });
      }
      continue;
    }
    if (!isLive(key)) {
      inactive.push(`${who} (${key.disabled ? 'disabled' : 'expired'})`);
      continue;
    }
    const held = holder.get(key.hash);
    if (!guardrail || held !== guardrail.id) {
      const other = guardrails.find((item) => item.id === held);
      problems.push({ text: `${who}: ${held ? `guardrail ${other?.name ?? held} instead of ${guardrailName}` : 'no guardrail'}`, fix: true });
      plan.assign.push(key);
    }
    if (key.limit == null) {
      problems.push({ text: `${who}: no credit limit`, fix: true });
      plan.patches.push({ key, body: { limit: keyLimit, limit_reset: null }, text: `limit ${money(keyLimit)}, no reset` });
    } else if (key.limit_reset) {
      problems.push({ text: `${who}: the limit resets ${key.limit_reset}, the course limit never resets`, fix: true });
      plan.patches.push({ key, body: { limit_reset: null }, text: 'limit no longer resets' });
    }
    if (!key.expires_at) noExpiry.push(who);
  }
  if (inactive.length) notes.push(`not active: ${inactive.join(', ')}`);
  if (noExpiry.length) notes.push(`no expiry: ${noExpiry.join(', ')} (the API can't add one later; the dashboard may)`);

  if (students) {
    const missing = students.filter((student) => !hasKey(keys, student));
    if (missing.length) problems.push({ text: `no key yet for ${missing.map((student) => student.slug).join(', ')}: run setup` });
  }
  const mapped = new Set([...names.values()].map((entry) => entry.keyName));
  const unknown = course.filter((key) => !key.name.includes(LEAKED) && key.name !== TEST_KEY && !mapped.has(key.name));
  if (unknown.length) notes.push(`keys with no student in ${mapFile}: ${unknown.map(shortName).join(', ')}`);

  const others = keys.filter((key) => !key.name.startsWith(PREFIX));
  if (others.length) {
    notes.push(`other keys in this account: ${others.map((key) => `"${key.name}" (${key.hash.slice(0, 8)})`).join(', ')}. ` +
      'A student\'s key among them? node tools/student-keys.mjs rename <hash> <student>');
  }

  if (credits) {
    const left = credits.total_credits - credits.total_usage;
    const day = live.length * budget;
    if (left < day) notes.push(`credits: ${money(left)} left; all ${live.length} active keys at their daily budget could use ${money(day)} in one day. Buy more: ${CREDITS_PAGE}`);
  }
  for (const destination of destinations ?? []) {
    if (destination.enabled) problems.push({ text: `broadcast destination "${destination.name}" (${destination.type}) is on: prompts are sent there too. Dashboard: Settings, Observability` });
  }
  if (!destinations) notes.push('broadcast destinations: could not be read');

  return { problems, notes, plan };
}

function report({ keys, guardrail, credits }, { problems, notes }) {
  const course = keys.filter((key) => key.name.startsWith(PREFIX) && !key.name.includes(LEAKED));
  if (credits) console.log(`credits: ${money(credits.total_credits - credits.total_usage)} left of ${money(credits.total_credits)}`);
  console.log(`guardrail ${guardrailName}: ${guardrail ? describeGuardrail(guardrail) : 'not found'}`);
  console.log(`course keys: ${course.length} (${course.filter(isLive).length} active)`);
  if (problems.length) {
    console.log('\nProblems:');
    for (const problem of problems) console.log(`  - ${problem.text}${problem.fix ? '   [fix]' : ''}`);
  }
  if (notes.length) {
    console.log('\nNotes:');
    for (const note of notes) console.log(`  - ${note}`);
  }
}

// ---- changes --------------------------------------------------------------------------------

async function applyFixes(state, plan) {
  let guardrail = state.guardrail;
  let changes = 0;
  if (!guardrail) {
    guardrail = (await api('POST', '/guardrails', { name: guardrailName, description: 'Photolipsia course keys', ...wantedGuardrail() })).data;
    console.log(`guardrail ${guardrailName}: created, ${describeGuardrail(guardrail)}`);
    changes++;
  } else if (plan.guardrail) {
    guardrail = (await api('PATCH', `/guardrails/${guardrail.id}`, plan.guardrail)).data;
    console.log(`guardrail ${guardrailName}: now ${describeGuardrail(guardrail)}`);
    changes++;
  }
  if (plan.assign.length) {
    await assignTo(guardrail, plan.assign.map((key) => key.hash));
    console.log(`guardrail ${guardrailName}: assigned to ${plan.assign.map(shortName).join(', ')}`);
    changes++;
  }
  for (const { key, body, text } of plan.patches) {
    await api('PATCH', `/keys/${key.hash}`, body);
    console.log(`${shortName(key)}: ${text}`);
    changes++;
  }
  return { guardrail, changes };
}

// One key per student, numbered after the highest number in use. Each key is saved before the
// next one is made, and all of them get the guardrail at the end.
async function createKeys(students, guardrail, expiresAt) {
  const keys = await allKeys();
  let next = nextNumber(keys);
  const created = [];
  let error = null;
  for (const student of students) {
    const entry = names.get(student.slug);
    const name = entry?.keyName ?? PREFIX + number(next++);
    try {
      const response = await api('POST', '/keys', { name, limit: keyLimit, limit_reset: null, ...(expiresAt && { expires_at: expiresAt }) });
      save(student.label, name, response.key);
      if (!entry) remember(student, name);
      created.push(response.data);
      console.log(`${student.slug}: key ${number(name)}, limit ${money(keyLimit)}${expiresAt ? `, until ${expiresAt.slice(0, 10)}` : ''}`);
    } catch (problem) {
      error = problem;
      break;
    }
  }
  if (created.length) {
    try {
      await assignTo(guardrail, created.map((key) => key.hash));
    } catch (problem) {
      fail(`${problem.message}\n${created.length} new keys are saved in ${out}, without the guardrail. Assign it: node tools/student-keys.mjs assign`);
    }
    console.log(`${created.length} new keys saved to ${out}, assigned to the guardrail ${guardrail.name}.`);
  }
  if (error) fail(`Stopped: ${error.message}`);
}

// The test key gets the same settings as a student key. It is tried like tools/check-openrouter.mjs
// does: the course model must answer, another model must be blocked.
async function tryTestKey(guardrail, expiresAt) {
  const keys = await allKeys();
  let secret = savedKey(TEST_KEY);
  if (!keys.some((key) => key.name === TEST_KEY && isLive(key))) {
    const response = await api('POST', '/keys', { name: TEST_KEY, limit: keyLimit, limit_reset: null, expires_at: expiresAt });
    save('teacher (test key)', TEST_KEY, response.key);
    await assignTo(guardrail, [response.data.hash]);
    secret = response.key;
    console.log(`${TEST_KEY}: created, saved to ${out}`);
  } else if (!secret) {
    console.log(`${TEST_KEY}: exists, but its key is not in ${out}, so it can't be tried. Skipped.`);
    return true;
  }
  const course = await chat(secret, MODELS[0]);
  console.log(`${MODELS[0]} (should work): ${course.status} ${course.status === 200 ? 'OK' : 'UNEXPECTED'} ${course.detail}`);
  const other = await anotherModel();
  if (!other) return course.status === 200;
  let blocked;
  for (let attempt = 1; attempt <= 3; attempt++) {
    blocked = await chat(secret, other);
    if ([403, 404].includes(blocked.status) || attempt === 3) break;
    await new Promise((done) => setTimeout(done, 5000)); // a new guardrail assignment can take a moment
  }
  const isBlocked = [403, 404].includes(blocked.status);
  console.log(`${other} (should be blocked): ${blocked.status} ${isBlocked ? 'OK' : 'UNEXPECTED'} ${blocked.detail}`);
  return course.status === 200 && isBlocked;
}

async function chat(secret, model) {
  const response = await fetch(`${API}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Reply with the single word: hello' }],
      reasoning: { effort: 'low' },
      max_tokens: 300,
    }),
  }).catch(() => null);
  if (!response) return { status: 'no connection', detail: '' };
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return { status: response.status, detail: response.ok ? `"${(json.choices?.[0]?.message?.content ?? '').trim().slice(0, 40)}"` : `"${json.error?.message ?? text}"`.slice(0, 160) };
  } catch {
    return { status: response.status, detail: text.slice(0, 160) };
  }
}

// A cheap model that is not on the course allowlist.
async function anotherModel() {
  const response = await fetch(`${API}/models`).catch(() => null);
  if (!response?.ok) return null;
  const { data } = await response.json();
  const cheap = data
    .filter((model) => !model.id.includes('z-ai/') && !model.id.startsWith('~') && Number(model.pricing?.prompt) > 0)
    .sort((a, b) => Number(a.pricing.prompt) - Number(b.pricing.prompt));
  return cheap[0]?.id ?? null;
}

// ---- OpenRouter -----------------------------------------------------------------------------

async function load() {
  const [keys, guardrails, assignments, credits, destinations] = await Promise.all([
    allKeys(),
    pages('/guardrails', { limit: 100 }),
    pages('/guardrails/assignments/keys', { limit: 100 }),
    api('GET', '/credits').then((json) => json.data, () => null),
    pages('/observability/destinations', { limit: 100 }).catch(() => null),
  ]);
  const holder = new Map(assignments.map((item) => [item.key_hash, item.guardrail_id]));
  return { keys, guardrails, guardrail: pick(guardrails), holder, credits, destinations };
}

function allKeys() {
  return pages('/keys', { include_disabled: 'true', include_expired: 'true' });
}

async function findGuardrail() {
  const guardrail = pick(await pages('/guardrails', { limit: 100 }));
  if (!guardrail) {
    fail(`Guardrail "${guardrailName}" not found. Nothing was changed.\n` +
      'Run `node tools/student-keys.mjs setup` (it creates it), or create it in the dashboard:\n' +
      `${GUARDRAILS_PAGE} (docs/teacher-setup.md section 3).`);
  }
  return guardrail;
}

function pick(guardrails) {
  return guardrails.find((item) => item.name === guardrailName) ??
    guardrails.find((item) => item.name.toLowerCase() === guardrailName.toLowerCase()) ?? null;
}

async function assignTo(guardrail, hashes) {
  let count = 0;
  for (let start = 0; start < hashes.length; start += 500) {
    const json = await api('POST', `/guardrails/${guardrail.id}/assignments/keys`, { key_hashes: hashes.slice(start, start + 500) });
    count += json.assigned_count ?? 0;
  }
  return count;
}

async function findKey(who) {
  if (!who) fail(`Which student? node tools/student-keys.mjs ${command} anna`);
  const keys = await allKeys();
  const wanted = who.trim().toLowerCase();
  const entry = names.get(slug(who)) ?? [...names.values()].find((item) => item.label.toLowerCase() === wanted);
  const suffix = /^\d{1,3}$/.test(wanted) ? number(Number(wanted)) : slug(who);
  let found = entry ? keys.filter((key) => key.name === entry.keyName) : [];
  if (!found.length) found = keys.filter((key) => key.name === PREFIX + suffix);
  if (!found.length) found = keys.filter((key) => key.name.toLowerCase() === wanted);
  if (!found.length && /^[0-9a-f]{6,}$/.test(wanted)) found = keys.filter((key) => key.hash.startsWith(wanted));
  if (!found.length) fail(`No key for "${who}". \`node tools/student-keys.mjs list\` shows the course keys.`);
  if (found.length > 1) {
    fail(`"${who}" matches ${found.length} keys: ${found.map((key) => `${key.name} (${key.hash.slice(0, 8)}${key.disabled ? ', disabled' : ''})`).join(', ')}. Use the hash.`);
  }
  return found[0];
}

// All items of a list endpoint, page by page.
async function pages(path, params) {
  const items = [];
  const seen = new Set();
  for (;;) {
    const query = new URLSearchParams({ ...params, offset: String(items.length) });
    const { data = [], total_count: total } = await api('GET', `${path}?${query}`);
    const fresh = data.filter((item) => !seen.has(item.hash ?? item.id));
    for (const item of fresh) seen.add(item.hash ?? item.id);
    items.push(...fresh);
    if (!fresh.length || (total != null && items.length >= total)) return items;
  }
}

async function api(method, path, body) {
  let response;
  try {
    response = await fetch(API + path, { method, headers, body: body && JSON.stringify(body) });
  } catch (problem) {
    const reason = problem.cause?.code ?? problem.cause?.errors?.[0]?.code ?? problem.message;
    throw new Error(`${method} ${path.split('?')[0]}: no connection to ${API} (${reason})`);
  }
  const text = await response.text();
  if (!response.ok) {
    throw Object.assign(new Error(`${method} ${path.split('?')[0]}: HTTP ${response.status} ${text.slice(0, 300)}`), { status: response.status });
  }
  return text ? JSON.parse(text) : {};
}

// Why OpenRouter refused the Management key, without printing it. GET /key answers for every
// valid key and says whether it is a Management key.
async function whyRefused() {
  const start = managementKey.startsWith('sk-or-v1-') ? 'starts with sk-or-v1-' : "doesn't start with sk-or-v1-";
  const lines = [`The Management key ${start}, ${managementKey.length} characters.`];
  const response = await fetch(`${API}/key`, { headers }).catch(() => null);
  const data = response?.ok ? (await response.json()).data : null;
  if (data && !data.is_management_key && !data.is_provisioning_key) {
    lines.push('That is a normal API key: it can call models but not manage keys.');
  } else if (data) {
    lines.push('It is a Management key, but this request was refused.');
    return lines.join('\n');
  } else {
    lines.push('OpenRouter does not know this key: copied only in part (the dashboard list shows only a short', 'label like sk-or-v1-abc...123), deleted, or expired.');
  }
  lines.push(`Create a Management key at ${MANAGEMENT_PAGE} (shown only once) and use that one.`);
  return lines.join('\n');
}

// ---- helpers --------------------------------------------------------------------------------

function wantedGuardrail() {
  return { limit_usd: budget, reset_interval: 'daily', allowed_models: MODELS };
}

// The same models, also when the API answers with dated canonical slugs (z-ai/glm-5.3-20260816).
function modelSet(models) {
  return [...new Set((models ?? []).map((model) => model.replace(/-\d{6,8}$/, '')))].sort().join(',');
}

function describeGuardrail(guardrail) {
  const models = guardrail.allowed_models?.join(', ') ?? 'all models';
  return `${budgetOf(guardrail)} per key, ${models}, providers ${guardrail.allowed_providers?.join(', ') ?? 'all'}`;
}

function budgetOf(guardrail) {
  return guardrail.limit_usd == null ? 'no budget' : `${money(guardrail.limit_usd)} ${guardrail.reset_interval ?? ''}`.trim();
}

function status(key, guardrail, holder) {
  if (key.disabled) return 'disabled';
  if (!isLive(key)) return 'expired';
  const parts = [key.limit != null && key.limit_remaining <= 0 ? 'limit reached' : 'active'];
  if (!guardrail || holder.get(key.hash) !== guardrail.id) parts.push(holder.has(key.hash) ? 'other guardrail' : 'no guardrail');
  return parts.join(', ');
}

function isLive(key) {
  return !key.disabled && !(key.expires_at && Date.parse(key.expires_at) < Date.now());
}

function number(value) {
  return typeof value === 'number' ? String(value).padStart(2, '0') : value.slice(PREFIX.length);
}

function nextNumber(keys) {
  const used = [...keys.map((key) => key.name), ...[...names.values()].map((entry) => entry.keyName)]
    .filter((name) => name.startsWith(PREFIX))
    .map((name) => Number.parseInt(name.slice(PREFIX.length), 10))
    .filter(Number.isFinite);
  return Math.max(0, ...used) + 1;
}

function hasKey(keys, student) {
  const entry = names.get(student.slug);
  return Boolean(entry && keys.some((key) => key.name === entry.keyName));
}

function ownerOf(key) {
  return [...names.values()].find((entry) => key.name === entry.keyName || key.name.startsWith(`${entry.keyName}${LEAKED}`));
}

// "07 anna": the key number and, from the students file on this computer, who has it.
function shortName(key) {
  if (!key.name.startsWith(PREFIX)) return key.name;
  const owner = ownerOf(key);
  return owner ? `${number(key.name)} ${owner.slug}` : number(key.name);
}

function freeName(name, keys) {
  let candidate = name;
  for (let n = 2; keys.some((key) => key.name === candidate); n++) candidate = `${name}-${n}`;
  return candidate;
}

// Students from a CSV: header `name`, or the ZHdK export (Name = surname, Vorname = first name).
// Two students with the same first name get the first letter of the surname: anna-m, anna-k.
function readStudents(file) {
  let text;
  try {
    text = readFileSync(expandHome(file), 'utf8');
  } catch {
    fail(`Can't read ${file}.`);
  }
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) fail(`${file} is empty.`);
  const delimiter = count(lines[0], ';') > count(lines[0], ',') ? ';' : ',';
  const [header, ...rows] = lines.map((line) => splitCsv(line, delimiter));
  const column = (name) => header.findIndex((cell) => cell.trim().toLowerCase() === name);
  const first = column('vorname');
  const name = column('name');
  const email = header.findIndex((cell) => /e-?mail/i.test(cell));
  if (name < 0) fail(`${file} needs a header line with the column "name" (or the ZHdK columns Name and Vorname).`);

  const people = rows.map((row) => {
    const given = (first >= 0 ? row[first] : row[name])?.trim() ?? '';
    const surname = first >= 0 ? row[name]?.trim() ?? '' : '';
    const address = email >= 0 ? row[email]?.trim() : '';
    return { given, surname, label: [given, surname].filter(Boolean).join(' '), slug: slug(given), email: address || null };
  }).filter((person) => person.slug);
  if (!people.length) fail(`No names in ${file}.`);

  const counts = groupBy(people, (person) => person.slug);
  for (const person of people) {
    if (counts.get(person.slug).length > 1 && person.surname) person.slug = slug(`${person.given} ${person.surname[0]}`);
  }
  const seen = new Set();
  for (const person of people) {
    if (seen.has(person.slug)) fail(`Two students are both called ${person.slug}. Give one a different name in ${file}.`);
    seen.add(person.slug);
  }
  return people;
}

// Which key belongs to which student: only on this computer, never in a repository.
function readMap() {
  const entries = new Map();
  if (!existsSync(mapFile)) return entries;
  for (const line of readFileSync(mapFile, 'utf8').split(/\r?\n/).slice(1)) {
    const [name, student, keyName] = splitCsv(line, ',');
    if (name && keyName) entries.set(name, { slug: name, label: student ?? name, keyName });
  }
  return entries;
}

function remember(student, keyName) {
  appendPrivate(mapFile, 'name,student,key_name', [student.slug, student.label, keyName]);
  names.set(student.slug, { slug: student.slug, label: student.label, keyName });
}

// New keys are appended to the --out file: readable only by you, never inside a repository.
function save(student, name, key) {
  appendPrivate(out, 'student,key_name,key', [student, name, key]);
}

function savedKey(name) {
  if (!existsSync(out)) return null;
  const rows = readFileSync(out, 'utf8').split(/\r?\n/).map((line) => splitCsv(line, ','));
  return rows.filter((row) => row[1] === name).at(-1)?.[2] ?? null;
}

function appendPrivate(file, header, cells) {
  const isNew = !existsSync(file);
  appendFileSync(file, `${isNew ? `${header}\n` : ''}${cells.map(csvCell).join(',')}\n`, { mode: 0o600 });
  if (process.platform !== 'win32') chmodSync(file, 0o600);
}

function checkFiles() {
  const home = homedir();
  for (const file of [out, mapFile]) {
    for (let folder = dirname(file); folder !== home && folder !== dirname(folder); folder = dirname(folder)) {
      if (existsSync(join(folder, '.git'))) fail(`${file} is inside a git repository (${folder}). Keep it outside, e.g. in your home folder.`);
    }
    if (!existsSync(dirname(file))) fail(`The folder for ${file} doesn't exist.`);
    if (existsSync(file) && statSync(file).isDirectory()) fail(`${file} is a folder, not a file.`);
  }
}

function splitCsv(line, delimiter) {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted && char === '"' && line[i + 1] === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }
  return [...cells, cell];
}

function csvCell(text) {
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function count(text, char) {
  return text.split(char).length - 1;
}

function groupBy(items, keyOf) {
  const groups = new Map();
  for (const item of items) groups.set(keyOf(item), [...(groups.get(keyOf(item)) ?? []), item]);
  return groups;
}

function slug(text) {
  const german = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };
  return text.normalize('NFC').toLowerCase().replace(/[äöüß]/g, (char) => german[char])
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function expiryProblem(date) {
  const parsed = new Date(`${date}T00:00:00Z`);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date);
  if (!valid) return `${date || '(empty)'}: use a date like 2026-12-01.`;
  if (Date.parse(`${date}T23:59:59Z`) < Date.now()) return `${date} is in the past.`;
  return null;
}

function expiryOf(date) {
  const problem = expiryProblem(date);
  if (problem) fail(`--expires ${problem}`);
  return `${date}T23:59:59Z`;
}

function dollars(label, value) {
  const amount = Number(value);
  if (value === '' || value === true || !Number.isFinite(amount) || amount < 0) fail(`${label} ${value}: use an amount in dollars, like 25.`);
  return amount;
}

function money(value) {
  return value == null ? '-' : `$${Number(value).toFixed(2)}`;
}

function printTable(rows) {
  const widths = rows[0].map((_, column) => Math.max(...rows.map((row) => String(row[column]).length)));
  for (const row of rows) console.log(row.map((cell, column) => String(cell).padEnd(widths[column])).join('  ').trimEnd());
}

function expandHome(path) {
  return resolve(/^~(?=$|[\\/])/.test(path) ? homedir() + path.slice(1) : path);
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  const known = ['limit', 'expires', 'guardrail', 'out', 'map', 'budget', 'yes'];
  for (let i = 0; i < argv.length; i++) {
    if (['--help', '-h'].includes(argv[i])) return { command: 'help', args: [], options: {} };
    const match = argv[i].match(/^--([a-z-]+)(?:=(.*))?$/);
    if (!match) {
      positional.push(argv[i]);
      continue;
    }
    if (!known.includes(match[1])) fail(`Unknown option --${match[1]}. Options: ${known.map((name) => `--${name}`).join(', ')}`);
    flags[match[1]] = match[1] === 'yes' ? true : match[2] ?? argv[++i] ?? true;
  }
  const [name, ...rest] = positional;
  return { command: name, args: rest, options: flags };
}

function fail(message) {
  console.log(message);
  process.exit(1);
}
