import React, { useEffect, useState } from 'react';
import { useBackButton } from '../lib/native.js';
import { monthGrid, formatMonthYear, addMonths, fromISODate } from '../lib/dates.js';

const WEEKDAY_HEADERS = ['pn', 'wt', 'śr', 'cz', 'pt', 'so', 'nd'];

/**
 * Bottom-sheet month calendar. Days with classes get a dot; tapping a day
 * selects it and closes the sheet.
 */
export function MonthPicker({ selected, today, datesWithClasses, onSelect, onClose }) {
  const [month, setMonth] = useState(selected);
  const cells = monthGrid(month);
  useBackButton(onClose);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Wybierz dzień">
      <button type="button" aria-label="Zamknij kalendarz" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-md rounded-t-3xl bg-bg px-4 pt-3 shadow-2xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            aria-label="Poprzedni miesiąc"
            className="grid h-10 w-10 place-items-center rounded-full text-fg hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="font-display text-base font-semibold capitalize text-fg">{formatMonthYear(month)}</h2>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Następny miesiąc"
            className="grid h-10 w-10 place-items-center rounded-full text-fg hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="mt-2 grid grid-cols-7 text-center text-[11px] uppercase tracking-wider text-muted" aria-hidden="true">
          {WEEKDAY_HEADERS.map((d) => (
            <span key={d} className="py-1">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((iso, i) =>
            iso === null ? (
              <span key={`empty-${i}`} />
            ) : (
              <button
                key={iso}
                type="button"
                onClick={() => {
                  onSelect(iso);
                  onClose();
                }}
                aria-pressed={iso === selected}
                className={`mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-full font-display text-base tabular-nums transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                  iso === selected
                    ? 'bg-fg font-bold text-bg'
                    : iso === today
                      ? 'font-bold text-accent hover:bg-surface'
                      : datesWithClasses.has(iso)
                        ? 'text-fg hover:bg-surface'
                        : 'text-muted hover:bg-surface'
                }`}
              >
                <span className="leading-none">{fromISODate(iso).getDate()}</span>
                <span
                  aria-hidden="true"
                  className={`mt-1 h-1 w-1 rounded-full ${
                    datesWithClasses.has(iso) ? (iso === selected ? 'bg-bg' : 'bg-accent') : 'bg-transparent'
                  }`}
                />
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            onSelect(today);
            onClose();
          }}
          className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl border border-line text-sm font-semibold text-fg hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          Przejdź do dziś
        </button>
      </div>
    </div>
  );
}
