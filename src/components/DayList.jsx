import React from 'react';
import { WHOLE_YEAR, groupKind } from '../lib/scheduleParser.js';
import { formatDuration, formatWeekdayLong, formatDayMonthShort } from '../lib/dates.js';

/**
 * The classes of one day, with breaks between them and a "now" marker when
 * the day is today. `entries` are already filtered to this user and sorted.
 */
export function DayList({ entries, isToday, nowMinutes, nextDayWithClasses, onJumpTo }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-muted" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M5 8h14M7 4v3M17 4v3M5 6h14v14H5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="m9 13 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="font-display text-lg font-semibold text-fg">Brak zajęć</p>
        {nextDayWithClasses ? (
          <button
            type="button"
            onClick={() => onJumpTo(nextDayWithClasses)}
            className="text-sm font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            Następne zajęcia: {formatWeekdayLong(nextDayWithClasses)}, {formatDayMonthShort(nextDayWithClasses)} →
          </button>
        ) : (
          <p className="text-sm text-muted">To już koniec zajęć w tym planie.</p>
        )}
      </div>
    );
  }

  const dayEnd = Math.max(...entries.map((e) => e.endMinutes));
  const items = [];
  entries.forEach((e, i) => {
    if (i > 0) {
      const prevEnd = Math.max(...entries.slice(0, i).map((p) => p.endMinutes));
      const gap = e.startMinutes - prevEnd;
      if (gap > 0) {
        items.push(<Break key={`gap-${e.id}`} minutes={gap} />);
      } else if (gap < 0) {
        items.push(<Overlap key={`overlap-${e.id}`} />);
      }
    }
    const status = !isToday
      ? 'none'
      : nowMinutes >= e.endMinutes
        ? 'past'
        : nowMinutes >= e.startMinutes
          ? 'now'
          : 'upcoming';
    items.push(<EventCard key={e.id} entry={e} status={status} />);
  });

  return (
    <div className="flex flex-col gap-2 px-4 pb-6">
      <p className="px-1 text-xs text-muted">
        {entries.length} {entries.length === 1 ? 'zajęcia' : 'zajęć'} · {entries[0].start}–{toHHMM(dayEnd)}
      </p>
      {items}
    </div>
  );
}

function toHHMM(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

function Break({ minutes }) {
  return (
    <div className="flex items-center gap-2 px-2 text-xs text-muted" aria-label={`Przerwa ${formatDuration(minutes)}`}>
      <span className="h-px flex-1 border-t border-dashed border-line" />
      <span>przerwa {formatDuration(minutes)}</span>
      <span className="h-px flex-1 border-t border-dashed border-line" />
    </div>
  );
}

function Overlap() {
  return (
    <p className="rounded-lg bg-danger-soft px-3 py-1.5 text-xs font-medium text-fg" role="note">
      Te zajęcia nakładają się w czasie
    </p>
  );
}

export function EventCard({ entry, status }) {
  const isNow = status === 'now';
  const isPast = status === 'past';
  const kind = entry.wholeYear ? 'year' : groupKind(entry.group);
  const badgeClass =
    kind === 'letter'
      ? 'bg-letter-soft text-letter'
      : kind === 'number'
        ? 'bg-number-soft text-number'
        : 'bg-surface text-muted';
  const duration = entry.endMinutes - entry.startMinutes;

  return (
    <article
      className={`relative grid grid-cols-[3.75rem_1fr] gap-3 rounded-2xl border p-3 transition ${
        isNow ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
      } ${isPast ? 'opacity-55' : ''}`}
      aria-current={isNow ? 'time' : undefined}
    >
      <div className="flex flex-col items-start pt-0.5 tabular-nums">
        <span className="font-display text-base font-bold leading-tight text-fg">{entry.start}</span>
        <span className="text-sm leading-tight text-muted">{entry.end}</span>
        <span className="mt-1 text-[11px] text-muted">{formatDuration(duration)}</span>
      </div>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[15px] font-semibold leading-snug text-fg">{entry.subject}</h3>
          <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-display text-xs font-bold tabular-nums ${badgeClass}`}>
            {entry.wholeYear ? WHOLE_YEAR : `gr. ${entry.group}`}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-fg">{entry.typeLabel}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
          <span className="inline-flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 21s-6-5.3-6-11a6 6 0 1 1 12 0c0 5.7-6 11-6 11z" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <span className="font-medium text-fg">{entry.room}</span>
          </span>
          <span className="min-w-0 truncate">{entry.teacher}</span>
        </p>
        {isNow ? (
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-accent">teraz</p>
        ) : null}
      </div>
    </article>
  );
}
