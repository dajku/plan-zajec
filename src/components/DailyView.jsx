import React, { useEffect, useMemo, useState } from 'react';
import { WeekStrip } from './WeekStrip.jsx';
import { MonthPicker } from './MonthPicker.jsx';
import { DayList } from './DayList.jsx';
import { todayISO, minutesNow, relativeDayLabel, formatDayMonth, formatWeekdayLong } from '../lib/dates.js';

/**
 * Main screen: the selected day's classes, a week slider, a month picker.
 * `entries` are already filtered to the user's groups + cały rok.
 */
export function DailyView({ entries, planTitle, onOpenSettings }) {
  const [today, setToday] = useState(todayISO);
  const [nowMinutes, setNowMinutes] = useState(minutesNow);
  const [pickerOpen, setPickerOpen] = useState(false);

  const byDate = useMemo(() => {
    const map = new Map();
    for (const e of entries) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date).push(e);
    }
    return map;
  }, [entries]);
  const datesWithClasses = useMemo(() => new Set(byDate.keys()), [byDate]);
  const sortedDates = useMemo(() => [...byDate.keys()].sort(), [byDate]);

  // Open on today; if the semester has not started yet, on its first day.
  const [selected, setSelected] = useState(() => {
    const first = sortedDates[0];
    return first && first > today ? first : today;
  });

  // Keep "today" and the now-marker fresh while the app stays open.
  useEffect(() => {
    const id = setInterval(() => {
      setToday(todayISO());
      setNowMinutes(minutesNow());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const dayEntries = byDate.get(selected) ?? [];
  const label = relativeDayLabel(selected, today);
  const yearSuffix = selected.slice(0, 4) === today.slice(0, 4) ? '' : ` ${selected.slice(0, 4)}`;
  const subtitle = (label === formatWeekdayLong(selected) ? '' : `${formatWeekdayLong(selected)}, `) + formatDayMonth(selected) + yearSuffix;
  const nextDayWithClasses = sortedDates.find((d) => d > selected) ?? null;

  return (
    <div className="flex min-h-full flex-col">
      <header
        className="sticky z-10 border-b border-line bg-bg"
        style={{ top: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center gap-2 px-4 pt-3">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-haspopup="dialog"
            className="-ml-1 flex min-w-0 flex-1 items-center gap-2 rounded-xl px-1 py-1 text-left hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <span className="min-w-0">
              <span className="block truncate font-display text-xl font-bold capitalize leading-tight text-fg">
                {label}
              </span>
              <span className="block truncate text-sm text-muted">{subtitle}</span>
            </span>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0 text-muted">
              <path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {selected !== today ? (
            <button
              type="button"
              onClick={() => setSelected(today)}
              className="min-h-9 rounded-full border border-line px-3 text-xs font-semibold text-fg hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              Dziś
            </button>
          ) : null}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Ustawienia"
            className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="py-2">
          <WeekStrip selected={selected} today={today} datesWithClasses={datesWithClasses} onSelect={setSelected} />
        </div>
      </header>

      <main key={selected} className="mx-auto w-full max-w-md flex-1 pt-3">
        <DayList
          entries={dayEntries}
          isToday={selected === today}
          nowMinutes={nowMinutes}
          nextDayWithClasses={nextDayWithClasses}
          onJumpTo={setSelected}
        />
      </main>

      <p className="px-4 pb-4 text-center text-[11px] text-muted">{planTitle}</p>

      {pickerOpen ? (
        <MonthPicker
          selected={selected}
          today={today}
          datesWithClasses={datesWithClasses}
          onSelect={setSelected}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </div>
  );
}
