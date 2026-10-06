import React, { useMemo, useState } from 'react';
import { NOT_ATTENDING, classTypeLabel, groupKind } from '../lib/scheduleParser.js';
import { AppHeader } from './AppHeader.jsx';

const KIND_LABEL = {
  letter: 'grupa ćwiczeniowa (litera)',
  number: 'grupa (numer)',
  mixed: 'grupa',
};

/**
 * Onboarding step 2: one subject per screen, pick a group or "Nie uczęszczam".
 * After the last subject a review list lets the user fix anything before saving.
 *
 * props:
 *   subjects        SubjectInfo[] that need a choice (whole-year-only ones excluded)
 *   wholeYearOnly   SubjectInfo[] always shown, listed read-only on the review screen
 *   selections      { [subjectName]: group | NOT_ATTENDING }
 *   onChange(next)  called with the full updated selections object
 *   onDone()        all subjects chosen and confirmed
 *   onCancel()      go back to the import screen
 */
export function GroupSelection({ subjects, wholeYearOnly, selections, onChange, onDone, onCancel, planTitle }) {
  const firstUnanswered = subjects.findIndex((s) => selections[s.name] === undefined);
  const allAnswered = firstUnanswered === -1;
  const [index, setIndex] = useState(allAnswered ? subjects.length : Math.max(firstUnanswered, 0));

  // The group the user picked most recently for each kind of group, used to
  // mark a suggested chip on later subjects of the same kind.
  const lastPickByKind = useMemo(() => {
    const out = {};
    for (const s of subjects) {
      const g = selections[s.name];
      if (g && g !== NOT_ATTENDING) out[groupKind(g)] = g;
    }
    return out;
  }, [subjects, selections]);

  const reviewing = index >= subjects.length;
  const subject = reviewing ? null : subjects[index];

  function choose(name, value) {
    onChange({ ...selections, [name]: value });
    setIndex((i) => Math.min(i + 1, subjects.length));
  }

  function back() {
    if (index === 0) onCancel();
    else setIndex((i) => i - 1);
  }

  if (reviewing) {
    return (
      <ReviewSelections
        subjects={subjects}
        wholeYearOnly={wholeYearOnly}
        selections={selections}
        onEdit={(i) => setIndex(i)}
        onBack={() => setIndex(subjects.length - 1)}
        onDone={onDone}
        planTitle={planTitle}
      />
    );
  }

  const current = selections[subject.name];
  const suggested = lastPickByKind[subject.groupKind];
  const suggestionAvailable = suggested && subject.groups.includes(suggested) && current === undefined;

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader
        title="Wybierz swoje grupy"
        subtitle={`${index + 1} z ${subjects.length} przedmiotów`}
        onBack={back}
      />
      <div className="h-1 w-full bg-line" aria-hidden="true">
        <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${(index / subjects.length) * 100}%` }} />
      </div>

      <main key={subject.name} className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pb-28 pt-6">
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{KIND_LABEL[subject.groupKind] ?? 'grupa'}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight text-fg" style={{ textWrap: 'balance' }}>
            {subject.name}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2 text-xs">
            {subject.types.map((t) => (
              <li key={t} className="rounded-full bg-surface px-2.5 py-1 text-muted">
                {classTypeLabel(t)}
              </li>
            ))}
            <li className="rounded-full bg-surface px-2.5 py-1 tabular-nums text-muted">{subject.entryCount} zajęć</li>
          </ul>
        </section>

        <section aria-labelledby={`groups-${index}`}>
          <h3 id={`groups-${index}`} className="text-sm font-medium text-fg">
            Do której grupy należysz?
          </h3>
          <div
            className={`mt-3 grid gap-2 ${subject.groups.length > 6 ? 'grid-cols-5' : 'grid-cols-3'}`}
            role="radiogroup"
          >
            {subject.groups.map((g) => {
              const selected = current === g;
              const isSuggested = suggestionAvailable && g === suggested;
              const kindClass = subject.groupKind === 'letter' ? 'text-letter' : 'text-number';
              return (
                <button
                  key={g}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(subject.name, g)}
                  className={`relative flex min-h-14 flex-col items-center justify-center rounded-xl border font-display text-xl font-bold tabular-nums transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    selected
                      ? 'border-accent bg-accent text-accent-fg'
                      : isSuggested
                        ? 'border-accent bg-accent-soft ' + kindClass
                        : 'border-line bg-surface hover:border-accent ' + kindClass
                  }`}
                >
                  {g}
                  {isSuggested ? (
                    <span className="mt-0.5 text-[9px] font-medium uppercase leading-none tracking-wider text-accent">ostatnio</span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            role="radio"
            aria-checked={current === NOT_ATTENDING}
            onClick={() => choose(subject.name, NOT_ATTENDING)}
            className={`mt-3 flex min-h-12 w-full items-center justify-center rounded-xl border text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              current === NOT_ATTENDING ? 'border-fg bg-fg text-bg' : 'border-line text-muted hover:border-fg hover:text-fg'
            }`}
          >
            Nie uczęszczam na ten przedmiot
          </button>
        </section>

        {subject.hasWholeYear ? (
          <p className="text-xs leading-relaxed text-muted">
            Wykłady z tego przedmiotu są dla całego roku i pokażą się niezależnie od grupy.
          </p>
        ) : null}
      </main>

      <footer
        className="fixed inset-x-0 bottom-0 border-t border-line bg-bg px-4 pt-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            className="min-h-11 rounded-xl px-4 text-sm font-semibold text-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            Wstecz
          </button>
          {current !== undefined ? (
            <button
              type="button"
              onClick={() => setIndex((i) => i + 1)}
              className="min-h-11 rounded-xl bg-fg px-5 text-sm font-semibold text-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Dalej
            </button>
          ) : (
            <span className="text-xs text-muted">Wybierz grupę, aby przejść dalej</span>
          )}
        </div>
      </footer>
    </div>
  );
}

function ReviewSelections({ subjects, wholeYearOnly, selections, onEdit, onBack, onDone, planTitle }) {
  const missing = subjects.filter((s) => selections[s.name] === undefined);
  const attending = subjects.filter((s) => selections[s.name] !== undefined && selections[s.name] !== NOT_ATTENDING);
  const skipped = subjects.filter((s) => selections[s.name] === NOT_ATTENDING);

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader title="Sprawdź swoje grupy" subtitle={planTitle} onBack={onBack} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pb-28 pt-6">
        {missing.length > 0 ? (
          <p role="alert" className="rounded-xl border border-danger bg-danger-soft px-4 py-3 text-sm text-fg">
            Brakuje wyboru dla {missing.length} {missing.length === 1 ? 'przedmiotu' : 'przedmiotów'}. Dotknij, aby uzupełnić.
          </p>
        ) : null}

        <ReviewGroup title="Twoje grupy" items={attending.concat(missing)} subjects={subjects} selections={selections} onEdit={onEdit} />
        {skipped.length > 0 ? (
          <ReviewGroup title="Nie uczęszczasz" items={skipped} subjects={subjects} selections={selections} onEdit={onEdit} muted />
        ) : null}
        {wholeYearOnly.length > 0 ? (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Zawsze widoczne (cały rok)</h2>
            <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface">
              {wholeYearOnly.map((s) => (
                <li key={s.name} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1 text-sm text-fg">{s.name}</span>
                  <span className="shrink-0 text-xs text-muted">cały rok</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      <footer
        className="fixed inset-x-0 bottom-0 border-t border-line bg-bg px-4 pt-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <div className="mx-auto max-w-md">
          <button
            type="button"
            disabled={missing.length > 0}
            onClick={onDone}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-accent font-display text-base font-semibold text-accent-fg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Zapisz i pokaż plan
          </button>
        </div>
      </footer>
    </div>
  );
}

function ReviewGroup({ title, items, subjects, selections, onEdit, muted }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</h2>
      <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface">
        {items.map((s) => {
          const value = selections[s.name];
          const i = subjects.indexOf(s);
          return (
            <li key={s.name}>
              <button
                type="button"
                onClick={() => onEdit(i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-bg focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
              >
                <span className={`min-w-0 flex-1 text-sm ${muted ? 'text-muted line-through decoration-line' : 'text-fg'}`}>{s.name}</span>
                {value === undefined ? (
                  <span className="shrink-0 rounded-full border border-danger px-2.5 py-0.5 text-xs font-semibold text-fg">brak</span>
                ) : value === NOT_ATTENDING ? (
                  <span className="shrink-0 text-xs text-muted">pomijany</span>
                ) : (
                  <span
                    className={`grid h-8 min-w-8 shrink-0 place-items-center rounded-lg px-2 font-display text-base font-bold tabular-nums ${
                      s.groupKind === 'letter' ? 'bg-letter-soft text-letter' : 'bg-number-soft text-number'
                    }`}
                  >
                    {value}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
