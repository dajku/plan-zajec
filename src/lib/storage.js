// Per-device persistence. localStorage can be missing or throw (private
// windows, blocked site data), so every access is guarded and the app must
// work with nothing stored.

const KEYS = {
  csv: 'plan.csvText',
  source: 'plan.source', // 'bundled' | 'upload'
  fileName: 'plan.fileName',
  selections: 'plan.selections',
};

function read(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    if (value === null || value === undefined) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the session just won't be remembered */
  }
}

export function loadStoredSchedule() {
  const csvText = read(KEYS.csv);
  if (!csvText) return null;
  return {
    csvText,
    source: read(KEYS.source) || 'upload',
    fileName: read(KEYS.fileName) || null,
  };
}

export function saveStoredSchedule({ csvText, source, fileName }) {
  write(KEYS.csv, csvText);
  write(KEYS.source, source);
  write(KEYS.fileName, fileName ?? null);
}

export function loadSelections() {
  const raw = read(KEYS.selections);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveSelections(selections) {
  write(KEYS.selections, JSON.stringify(selections));
}

export function clearAll() {
  for (const key of Object.values(KEYS)) write(key, null);
}
