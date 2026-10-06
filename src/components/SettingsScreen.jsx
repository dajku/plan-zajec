import React from 'react';
import { NOT_ATTENDING } from '../lib/scheduleParser.js';
import { AppHeader } from './AppHeader.jsx';
import { InstallHint } from './InstallHint.jsx';

/** Semester counter plus the two actions that restart parts of onboarding. */
export function SettingsScreen({ schedule, selections, entryCount, onBack, onEditGroups, onChangeFile }) {
  const chosen = Object.values(selections).filter((v) => v !== NOT_ATTENDING).length;
  const { meta } = schedule.parsed;

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader title="Ustawienia" subtitle={meta.title} onBack={onBack} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pb-10 pt-6">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Twój semestr</p>
          <p className="mt-2 font-display text-4xl font-bold tabular-nums text-fg">{entryCount}</p>
          <p className="text-sm text-muted">
            zajęć od {meta.firstDate} do {meta.lastDate}
          </p>
          <p className="mt-3 text-sm text-muted">
            Wybrane grupy: <span className="font-semibold tabular-nums text-fg">{chosen} przedmiotów</span>
          </p>
        </section>

        <InstallHint />

        <section className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onEditGroups}
            className="min-h-12 rounded-xl border border-line bg-surface font-semibold text-fg hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            Zmień grupy
          </button>
          <button
            type="button"
            onClick={onChangeFile}
            className="min-h-12 rounded-xl border border-line bg-surface font-semibold text-fg hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            Wczytaj inny plik
          </button>
        </section>

        <p className="mt-auto text-xs leading-relaxed text-muted">
          Plan: {schedule.fileName ?? 'plik CSV'}
          {schedule.source === 'bundled' ? ' (wbudowany)' : ' (wgrany)'}. Dane są zapisane tylko na tym urządzeniu.
        </p>
      </main>
    </div>
  );
}
