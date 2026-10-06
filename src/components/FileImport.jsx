import React, { useRef, useState } from 'react';
import { parseSchedule } from '../lib/scheduleParser.js';
import { readCsvFile } from '../lib/readCsvFile.js';
import { AppHeader } from './AppHeader.jsx';

/**
 * First screen: pick the bundled schedule or upload a CSV export.
 * Calls onLoaded({ csvText, parsed, source, fileName }) on success.
 */
export function FileImport({ bundled, onLoaded }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  function accept(csvText, source, fileName) {
    setError(null);
    let parsed;
    try {
      parsed = parseSchedule(csvText);
    } catch (e) {
      setError(e.message || 'Nie udało się odczytać pliku.');
      return;
    }
    if (parsed.entries.length === 0) {
      setError('Plik nie zawiera żadnych zajęć. Sprawdź, czy to eksport planu z dziekanatu.');
      return;
    }
    onLoaded({ csvText, parsed, source, fileName });
  }

  async function handleFile(file) {
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name)) {
      setError('Wybierz plik CSV. Jeśli masz plik Excela, zapisz go jako CSV (rozdzielany średnikami).');
      return;
    }
    setBusy(true);
    try {
      const text = await readCsvFile(file);
      accept(text, 'upload', file.name);
    } catch {
      setError('Nie udało się odczytać pliku z urządzenia.');
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader title="Mój plan zajęć" subtitle="Zamiast Excela na telefonie" />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pb-10 pt-6">
        <section>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-fg" style={{ textWrap: 'balance' }}>
            Skąd wziąć plan?
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Wczytaj plan raz. Potem wybierzesz swoje grupy i zobaczysz tylko swoje zajęcia.
          </p>
        </section>

        {bundled ? (
          <button
            type="button"
            onClick={() => accept(bundled.csvText, 'bundled', bundled.fileName)}
            className="group flex w-full items-start gap-4 rounded-2xl bg-accent p-4 text-left text-accent-fg shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 6.5h14M4 11h14M4 15.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base font-semibold">Użyj aktualnego planu</span>
              <span className="mt-0.5 block text-sm opacity-90">{bundled.title}</span>
              <span className="mt-2 block text-xs opacity-75">
                Stan na {bundled.asOf} · {bundled.entryCount} zajęć · {bundled.firstDate} – {bundled.lastDate}
              </span>
            </span>
          </button>
        ) : null}

        <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
          <span className="h-px flex-1 bg-line" />
          albo
          <span className="h-px flex-1 bg-line" />
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`rounded-2xl border-2 border-dashed p-5 text-center transition ${
            dragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface'
          }`}
        >
          <p className="font-display text-base font-semibold text-fg">Wgraj plik CSV</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
            Eksport planu z dziekanatu, np. <span className="font-mono text-xs">F_s_IV_jmgr_….csv</span>
          </p>
          <input
            ref={inputRef}
            id="csv-file-input"
            type="file"
            accept=".csv,text/csv,text/plain"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-bg px-5 font-semibold text-fg transition hover:border-accent hover:text-accent disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            {busy ? 'Wczytywanie…' : 'Wybierz plik'}
          </button>
        </div>

        {error ? (
          <p role="alert" className="rounded-xl border border-danger bg-danger-soft px-4 py-3 text-sm text-fg">
            {error}
          </p>
        ) : null}

        <p className="mt-auto text-xs leading-relaxed text-muted">
          Plan i wybrane grupy zapisują się tylko na tym urządzeniu. Nic nie jest wysyłane na serwer.
        </p>
      </main>
    </div>
  );
}
