// Step 1: schedule data processing.
// Plain ES module, no dependencies, safe to import from React or Node.
//
// Input: the raw text of the university CSV export (UTF-8, optional BOM,
// ';'-separated, 3 metadata rows, header row at index 3).
// Output: normalized schedule entries plus the subject/group catalogue the
// onboarding screen needs.

export const WHOLE_YEAR = 'cały rok';

/** Polish labels for the class type codes used in the export. */
export const CLASS_TYPE_LABELS = {
  WYK: 'Wykład',
  'CW-K': 'Ćwiczenia kliniczne',
  'CW-A': 'Ćwiczenia audytoryjne',
  CL: 'Ćwiczenia laboratoryjne',
  'CW-L': 'Ćwiczenia laboratoryjne',
};

export function classTypeLabel(code) {
  return CLASS_TYPE_LABELS[code] ?? code;
}

// ---------------------------------------------------------------------------
// Low-level CSV reading
// ---------------------------------------------------------------------------

/**
 * Minimal RFC-4180-style parser with a configurable delimiter.
 * Handles quoted fields, "" escapes, embedded newlines inside quotes
 * (the header cell "data\n(rrrr-mm-dd)" needs this) and CRLF/LF mixes.
 */
export function parseCsv(text, delimiter = ';') {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  if (text.charCodeAt(0) === 0xfeff) i = 1; // strip BOM

  for (; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Picks ';' or ',' depending on which one dominates the header area. */
export function detectDelimiter(text) {
  const sample = text.slice(0, 2000);
  const semis = (sample.match(/;/g) || []).length;
  const commas = (sample.match(/,/g) || []).length;
  return semis >= commas ? ';' : ',';
}

// ---------------------------------------------------------------------------
// Header / column resolution
// ---------------------------------------------------------------------------

const HEADER_ROW_INDEX = 3;

/**
 * Header cells in the export contain line breaks, double spaces and trailing
 * whitespace ("god  od...", "rodzaj zajęć "). Collapse all of that so lookups
 * are stable.
 */
function normalizeHeader(cell) {
  return cell
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Column lookup: for each field, a predicate on the normalized header plus
 * the positional fallback from the known export layout.
 * Note: the real export has the group in column 11, not 12 (column 12 is
 * "info o przedmiotach łączonych" and is empty).
 */
const COLUMN_SPECS = {
  date: { match: (h) => h.startsWith('data'), fallback: 0 },
  weekday: { match: (h) => h.startsWith('dzień'), fallback: 1 },
  start: { match: (h) => h.startsWith('god') && h.includes('od'), fallback: 2 },
  end: { match: (h) => h.includes('do') && h.startsWith('zina'), fallback: 3 },
  subject: { match: (h) => h === 'przedmiot', fallback: 4 },
  type: { match: (h) => h.startsWith('rodzaj'), fallback: 5 },
  degree: { match: (h) => h.startsWith('stopień'), fallback: 6 },
  firstName: { match: (h) => h === 'imię', fallback: 7 },
  lastName: { match: (h) => h === 'nazwisko', fallback: 8 },
  room: { match: (h) => h === 'sala', fallback: 9 },
  group: { match: (h) => h === 'grupa', fallback: 11 },
};

export function resolveColumns(headerRow) {
  const normalized = headerRow.map(normalizeHeader);
  const columns = {};
  for (const [key, spec] of Object.entries(COLUMN_SPECS)) {
    const idx = normalized.findIndex(spec.match);
    columns[key] = idx >= 0 ? idx : spec.fallback;
  }
  return columns;
}

/**
 * Finds the header row. Prefers the known index 3 but scans the first 10 rows
 * for a row containing "przedmiot" in case the export gains or loses a
 * metadata line.
 */
export function findHeaderRowIndex(rows) {
  const looksLikeHeader = (r) => r.some((c) => normalizeHeader(c) === 'przedmiot');
  if (rows[HEADER_ROW_INDEX] && looksLikeHeader(rows[HEADER_ROW_INDEX])) {
    return HEADER_ROW_INDEX;
  }
  const limit = Math.min(rows.length, 10);
  for (let i = 0; i < limit; i++) {
    if (looksLikeHeader(rows[i])) return i;
  }
  throw new Error('Nie znaleziono wiersza nagłówka (kolumny "przedmiot") w pliku CSV.');
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

/** "8:00" -> "08:00"; returns null for anything that is not H:MM / HH:MM. */
export function normalizeTime(raw) {
  const m = /^\s*(\d{1,2})[:.](\d{2})\s*$/.exec(raw || '');
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

/** "08:00" -> 480 (minutes since midnight). */
export function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeDate(raw) {
  const s = (raw || '').trim();
  if (ISO_DATE.test(s)) return s;
  // Tolerate dd.mm.yyyy, which the sheet uses elsewhere (e.g. "05.10.2026").
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}

export function isWholeYear(group) {
  return normalizeHeader(group) === WHOLE_YEAR;
}

function normalizeGroup(raw) {
  const g = (raw || '').trim();
  return isWholeYear(g) ? WHOLE_YEAR : g.toLowerCase();
}

/** Sort groups naturally: numbers ascending, then letters, then anything else. */
export function compareGroups(a, b) {
  const na = Number(a);
  const nb = Number(b);
  const aNum = Number.isInteger(na) && a !== '';
  const bNum = Number.isInteger(nb) && b !== '';
  if (aNum && bNum) return na - nb;
  if (aNum) return -1;
  if (bNum) return 1;
  return a.localeCompare(b, 'pl');
}

/** 'number' for 1..n, 'letter' for a..z, otherwise 'other'. */
export function groupKind(group) {
  if (/^\d+$/.test(group)) return 'number';
  if (/^[a-z]$/.test(group)) return 'letter';
  return 'other';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ScheduleEntry
 * @property {string} id         stable id derived from the row content
 * @property {string} date       'YYYY-MM-DD'
 * @property {string} weekday    as written in the file, e.g. 'czwartek'
 * @property {string} start      'HH:MM'
 * @property {string} end        'HH:MM'
 * @property {number} startMinutes
 * @property {number} endMinutes
 * @property {string} subject
 * @property {string} type       raw code, e.g. 'CW-K'
 * @property {string} typeLabel  Polish label for the code
 * @property {string} teacher    'dr Aleksandra Katan'
 * @property {string} room
 * @property {string} group      lower-cased group or 'cały rok'
 * @property {boolean} wholeYear true when group === 'cały rok'
 */

/**
 * @typedef {Object} SubjectInfo
 * @property {string} name
 * @property {string[]} groups        selectable groups (never includes 'cały rok'), sorted
 * @property {'number'|'letter'|'mixed'|'none'} groupKind
 * @property {boolean} hasWholeYear   subject has at least one 'cały rok' class
 * @property {boolean} wholeYearOnly  nothing to choose, always shown
 * @property {string[]} types         class type codes seen, e.g. ['WYK','CW-K']
 * @property {number} entryCount
 */

/**
 * @typedef {Object} ParsedSchedule
 * @property {Object} meta
 * @property {string|null} meta.title       e.g. 'Fizjoterapia IV rok 2026/2027'
 * @property {string|null} meta.faculty     e.g. 'Wydział Nauk o Zdrowiu Uniwersytet Opolski'
 * @property {string|null} meta.firstDate
 * @property {string|null} meta.lastDate
 * @property {number} meta.rowCount         data rows seen (including skipped)
 * @property {ScheduleEntry[]} entries      sorted by date, then start time
 * @property {SubjectInfo[]} subjects       sorted by name (pl locale)
 * @property {{rowIndex:number, reason:string}[]} skipped
 */

/**
 * Parses the CSV text into normalized entries and the subject/group catalogue.
 * @param {string} text
 * @returns {ParsedSchedule}
 */
export function parseSchedule(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new Error('Plik CSV jest pusty.');
  }
  const rows = parseCsv(text, detectDelimiter(text));
  const headerIdx = findHeaderRowIndex(rows);
  const columns = resolveColumns(rows[headerIdx]);
  const cell = (row, key) => (row[columns[key]] ?? '').trim();

  const entries = [];
  const skipped = [];

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c.trim() === '')) continue; // blank line

    const date = normalizeDate(cell(row, 'date'));
    const start = normalizeTime(cell(row, 'start'));
    const end = normalizeTime(cell(row, 'end'));
    const subject = cell(row, 'subject');
    const group = normalizeGroup(cell(row, 'group'));

    const problem = !date
      ? 'nieprawidłowa data'
      : !subject
        ? 'brak przedmiotu'
        : !start || !end
          ? 'nieprawidłowa godzina'
          : !group
            ? 'brak grupy'
            : null;
    if (problem) {
      skipped.push({ rowIndex: r, reason: problem });
      continue;
    }

    const type = cell(row, 'type');
    const teacher = [cell(row, 'degree'), cell(row, 'firstName'), cell(row, 'lastName')]
      .filter(Boolean)
      .join(' ');

    entries.push({
      id: `${date}_${start}_${subject}_${type}_${group}`.replace(/\s+/g, '-'),
      date,
      weekday: cell(row, 'weekday'),
      start,
      end,
      startMinutes: timeToMinutes(start),
      endMinutes: timeToMinutes(end),
      subject,
      type,
      typeLabel: classTypeLabel(type),
      teacher,
      room: cell(row, 'room'),
      group,
      wholeYear: group === WHOLE_YEAR,
    });
  }

  entries.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.startMinutes - b.startMinutes ||
      a.subject.localeCompare(b.subject, 'pl'),
  );

  return {
    meta: {
      ...extractMeta(rows.slice(0, headerIdx)),
      firstDate: entries[0]?.date ?? null,
      lastDate: entries.at(-1)?.date ?? null,
      rowCount: rows.length - headerIdx - 1,
    },
    entries,
    subjects: extractSubjects(entries),
    skipped,
  };
}

/** Reads the faculty / plan title out of the metadata rows above the header. */
function extractMeta(metaRows) {
  const texts = metaRows
    .map((r) => r.find((c) => c.trim() && !/^\d+$/.test(c.trim())) ?? '')
    .map((s) => s.trim())
    .filter(Boolean);
  const titleLine = texts.find((t) => /^plan zajęć dla:/i.test(t));
  const faculty = texts.find((t) => /wydział/i.test(t)) ?? null;
  return {
    title: titleLine ? titleLine.replace(/^plan zajęć dla:\s*/i, '').trim() : null,
    faculty: faculty ? faculty.replace(/\s+\d+\s+\S+$/, '').trim() : null, // drops trailing "5 paź"
  };
}

/**
 * Builds the subject catalogue from the entries.
 * @param {ScheduleEntry[]} entries
 * @returns {SubjectInfo[]}
 */
export function extractSubjects(entries) {
  const bySubject = new Map();
  for (const e of entries) {
    let info = bySubject.get(e.subject);
    if (!info) {
      info = { name: e.subject, groupSet: new Set(), typeSet: new Set(), hasWholeYear: false, entryCount: 0 };
      bySubject.set(e.subject, info);
    }
    info.entryCount++;
    info.typeSet.add(e.type);
    if (e.wholeYear) info.hasWholeYear = true;
    else info.groupSet.add(e.group);
  }

  return [...bySubject.values()]
    .map((info) => {
      const groups = [...info.groupSet].sort(compareGroups);
      const kinds = new Set(groups.map(groupKind));
      return {
        name: info.name,
        groups,
        groupKind: groups.length === 0 ? 'none' : kinds.size === 1 ? [...kinds][0] : 'mixed',
        hasWholeYear: info.hasWholeYear,
        wholeYearOnly: groups.length === 0,
        types: [...info.typeSet].sort(),
        entryCount: info.entryCount,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
}

/**
 * The value a user picks for a subject they do not attend.
 * Kept distinct from any real group so it can never collide.
 */
export const NOT_ATTENDING = '__nie_uczeszczam__';

/**
 * Filters entries down to what one student sees.
 * @param {ScheduleEntry[]} entries
 * @param {Record<string, string>} selections  subject name -> chosen group | NOT_ATTENDING.
 *   Subjects missing from the map are treated as not yet chosen: their
 *   'cały rok' classes still show, their group classes do not.
 * @returns {ScheduleEntry[]}
 */
export function filterEntriesForUser(entries, selections) {
  return entries.filter((e) => {
    const choice = selections[e.subject];
    if (choice === NOT_ATTENDING) return false;
    if (e.wholeYear) return true;
    return choice !== undefined && choice === e.group;
  });
}

/**
 * Convenience for the daily view: entries for one 'YYYY-MM-DD', already
 * filtered to the user's selections and sorted by start time.
 */
export function entriesForDay(entries, selections, date) {
  return filterEntriesForUser(entries, selections).filter((e) => e.date === date);
}

/**
 * Subjects that still need a decision from the user during onboarding.
 * Whole-year-only subjects are excluded (they are always shown).
 */
export function subjectsNeedingSelection(subjects, selections = {}) {
  return subjects.filter((s) => !s.wholeYearOnly && selections[s.name] === undefined);
}
