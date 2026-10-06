// Date helpers. The app works with local calendar days as 'YYYY-MM-DD'
// strings (the same shape the CSV uses), so nothing here touches time zones.

const pad = (n) => String(n).padStart(2, '0');

export function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDays(iso, days) {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function addMonths(iso, months) {
  const d = fromISODate(iso);
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  return toISODate(d);
}

/** Monday of the week containing `iso`. */
export function startOfWeek(iso) {
  const d = fromISODate(iso);
  const offset = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - offset);
  return toISODate(d);
}

export function weekDays(iso) {
  const monday = startOfWeek(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** 6 rows x 7 days covering the month of `iso`, Monday first; days outside the month are null. */
export function monthGrid(iso) {
  const first = fromISODate(iso);
  first.setDate(1);
  const month = first.getMonth();
  const lead = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  const cursor = new Date(first);
  while (cursor.getMonth() === month) {
    cells.push(toISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function isWeekend(iso) {
  const day = fromISODate(iso).getDay();
  return day === 0 || day === 6;
}

const fmt = (opts) => new Intl.DateTimeFormat('pl-PL', opts);
const WEEKDAY_SHORT = fmt({ weekday: 'short' });
const WEEKDAY_LONG = fmt({ weekday: 'long' });
const DAY_MONTH = fmt({ day: 'numeric', month: 'long' });
const MONTH_YEAR = fmt({ month: 'long', year: 'numeric' });
const DAY_MONTH_SHORT = fmt({ day: 'numeric', month: 'short' });

export const formatWeekdayShort = (iso) => WEEKDAY_SHORT.format(fromISODate(iso)).replace('.', '');
export const formatWeekdayLong = (iso) => WEEKDAY_LONG.format(fromISODate(iso));
export const formatDayMonth = (iso) => DAY_MONTH.format(fromISODate(iso));
export const formatDayMonthShort = (iso) => DAY_MONTH_SHORT.format(fromISODate(iso));
export const formatMonthYear = (iso) => MONTH_YEAR.format(fromISODate(iso));

/** "dziś", "jutro", "wczoraj" or the long weekday. */
export function relativeDayLabel(iso, today = todayISO()) {
  if (iso === today) return 'dziś';
  if (iso === addDays(today, 1)) return 'jutro';
  if (iso === addDays(today, -1)) return 'wczoraj';
  return formatWeekdayLong(iso);
}

/** Minutes since midnight for a Date. */
export function minutesNow(d = new Date()) {
  return d.getHours() * 60 + d.getMinutes();
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
