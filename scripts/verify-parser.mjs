// Runs the parser against the real CSV and prints a summary plus assertions.
// Usage: node app/scripts/verify-parser.mjs "<path to csv>"
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import {
  parseSchedule,
  filterEntriesForUser,
  entriesForDay,
  subjectsNeedingSelection,
  NOT_ATTENDING,
} from '../src/lib/scheduleParser.js';

const path = process.argv[2];
if (!path) {
  console.error('Podaj ścieżkę do pliku CSV.');
  process.exit(1);
}

const text = readFileSync(path, 'utf8');
const result = parseSchedule(text);

console.log('meta:', result.meta);
console.log('entries:', result.entries.length, 'skipped:', result.skipped.length);
console.log('first entry:', result.entries[0]);
console.log('\nsubjects:');
for (const s of result.subjects) {
  console.log(
    `  ${s.name.padEnd(55)} kind=${s.groupKind.padEnd(6)} groups=[${s.groups.join(',')}]` +
      ` całyRok=${s.hasWholeYear} only=${s.wholeYearOnly} types=${s.types.join('/')} n=${s.entryCount}`,
  );
}

// --- assertions against known facts about this export ---------------------
assert.equal(result.entries.length, 859, 'all 859 data rows parsed');
assert.equal(result.skipped.length, 0, 'nothing skipped');
assert.equal(result.subjects.length, 15, '15 subjects');
assert.equal(result.meta.title, 'Fizjoterapia IV rok 2026/2027');
assert.equal(result.meta.firstDate, '2026-10-01');
assert.equal(result.meta.lastDate, '2027-02-02');
assert.equal(result.entries.filter((e) => e.wholeYear).length, 72, '72 cały rok rows');
assert.ok(result.entries.every((e) => /^\d{2}:\d{2}$/.test(e.start)), 'times zero-padded');
assert.ok(result.entries.every((e) => e.endMinutes > e.startMinutes), 'end after start');

const genetyka = result.subjects.find((s) => s.name === 'Genetyka');
assert.ok(genetyka.wholeYearOnly, 'Genetyka is whole-year only');

const woda = result.subjects.find((s) => s.name === 'PDW: Fizjoterapia w wodzie');
assert.deepEqual(woda.groups, ['2', '4']);
assert.equal(woda.groupKind, 'number');

const diag = result.subjects.find((s) => s.name === 'Diagnostyka funkcjonalna w dysfunkcjach układu ruchu');
assert.deepEqual(diag.groups, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']);
assert.equal(diag.groupKind, 'letter');
assert.ok(diag.hasWholeYear);

assert.equal(subjectsNeedingSelection(result.subjects).length, 14, '14 subjects need a choice');

// --- simulate one student ---------------------------------------------------
const selections = {};
for (const s of result.subjects) {
  if (s.wholeYearOnly) continue;
  selections[s.name] = s.groupKind === 'letter' ? 'c' : s.groups.includes('2') ? '2' : NOT_ATTENDING;
}
const mine = filterEntriesForUser(result.entries, selections);
console.log('\nstudent (letter c, number 2):', mine.length, 'classes');
assert.ok(mine.every((e) => e.wholeYear || e.group === selections[e.subject]));
assert.ok(mine.some((e) => e.subject === 'Genetyka'), 'whole-year-only subject still shown');
assert.ok(!mine.some((e) => selections[e.subject] === NOT_ATTENDING), 'not-attending subjects hidden');

const day = entriesForDay(result.entries, selections, '2026-10-05');
console.log('\n2026-10-05 for this student:');
for (const e of day) console.log(`  ${e.start}-${e.end} ${e.subject} (${e.typeLabel}, gr. ${e.group}) ${e.room} ${e.teacher}`);
assert.ok(day.every((e) => e.date === '2026-10-05'));

// --- robustness: comma delimiter + shuffled columns ------------------------
const header = 'grupa,przedmiot,"data\n(rrrr-mm-dd)",god  od...,zina …do,rodzaj zajęć ,imię,nazwisko,sala\n';
const alt = header + 'a,Test,2026-11-02,8:00,9:30,WYK,Jan,Kowalski,A1\ncały rok,Test,2026-11-02,10:00,11:30,WYK,Jan,Kowalski,A1\n';
const altResult = parseSchedule(alt);
assert.equal(altResult.entries.length, 2);
assert.equal(altResult.entries[0].group, 'a');
assert.equal(altResult.entries[1].wholeYear, true);
assert.equal(altResult.entries[0].start, '08:00');

console.log('\nWszystkie asercje przeszły.');
