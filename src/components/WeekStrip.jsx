import React, { useRef } from 'react';
import { weekDays, formatWeekdayShort, fromISODate, addDays, isWeekend } from '../lib/dates.js';

const SHORT = ['pn', 'wt', 'śr', 'cz', 'pt', 'so', 'nd'];

/**
 * Seven-day slider. Tap a day to select it, use the arrows or swipe to move
 * a week at a time. A dot marks days that have classes for this user.
 */
export function WeekStrip({ selected, today, datesWithClasses, onSelect }) {
  const days = weekDays(selected);
  const touchStartX = useRef(null);

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 48) onSelect(addDays(selected, dx < 0 ? 7 : -7));
  }

  return (
    <div className="flex items-stretch gap-1 px-2" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <ArrowButton dir={-1} onClick={() => onSelect(addDays(selected, -7))} label="Poprzedni tydzień" />
      <ol className="grid flex-1 grid-cols-7 gap-1" aria-label="Dni tygodnia">
        {days.map((iso, dayIndex) => {
          const isSelected = iso === selected;
          const isToday = iso === today;
          const has = datesWithClasses.has(iso);
          const weekend = isWeekend(iso);
          return (
            <li key={iso}>
              <button
                type="button"
                onClick={() => onSelect(iso)}
                aria-pressed={isSelected}
                aria-label={`${formatWeekdayShort(iso)} ${fromISODate(iso).getDate()}${has ? ', zajęcia' : ''}`}
                className={`flex w-full flex-col items-center gap-0.5 rounded-xl py-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                  isSelected ? 'bg-fg text-bg' : 'hover:bg-surface'
                }`}
              >
                <span className={`text-[11px] uppercase tracking-wider ${isSelected ? 'opacity-80' : weekend ? 'text-muted/70' : 'text-muted'}`}>
                  {SHORT[dayIndex]}
                </span>
                <span
                  className={`font-display text-lg font-bold tabular-nums leading-none ${
                    isToday && !isSelected ? 'text-accent' : ''
                  }`}
                >
                  {fromISODate(iso).getDate()}
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                    has ? (isSelected ? 'bg-bg' : 'bg-accent') : 'bg-transparent'
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ol>
      <ArrowButton dir={1} onClick={() => onSelect(addDays(selected, 7))} label="Następny tydzień" />
    </div>
  );
}

function ArrowButton({ dir, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid w-7 shrink-0 place-items-center rounded-xl text-muted hover:bg-surface hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d={dir < 0 ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
