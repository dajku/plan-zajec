# Mój plan zajęć

Mobile-first schedule viewer for the faculty CSV export (React + Tailwind).

## Layout
- `src/lib/scheduleParser.js` – CSV parsing, subjects/groups catalogue, filtering helpers (Step 1)
- `src/lib/storage.js`, `src/lib/readCsvFile.js` – local persistence, file decoding
- `src/components/FileImport.jsx`, `src/components/GroupSelection.jsx` – onboarding (Step 2)
- `src/lib/dates.js` – local-date helpers and Polish formatters
- `src/components/DailyView.jsx`, `WeekStrip.jsx`, `MonthPicker.jsx`, `DayList.jsx` – daily view, week slider, month sheet, class cards (Step 3)
- `src/components/SettingsScreen.jsx` – semester counter, change groups / file
- `src/App.jsx` – screen flow: import → onboarding → daily view ↔ settings
- `src/data/bundledSchedule.js` – generated: the current CSV embedded for the "Użyj aktualnego planu" shortcut
- `src/theme.css`, `tailwind.config.js` – colour/type tokens shared by the app and the preview

## Commands
```
npm install
npm run dev                                   # Vite dev server
npm run build                                 # production build to dist/
npm run embed-csv -- "<plik>.csv"             # refresh src/data/bundledSchedule.js
npm run build:preview                         # single-file dist/preview.html for the Artifact
npm run verify -- "<plik>.csv"                # parser assertions against the real file
```

## Installable app (PWA) and hosting
- `vite.config.js` adds a web manifest and a service worker (vite-plugin-pwa, auto-update, offline cache of the app shell and fonts).
- `public/icons/` holds the app icons; regenerate the PNGs with `npm run icons` (needs Chromium; set `CHROMIUM_PATH` to reuse an installed one).
- `src/components/InstallHint.jsx` shows the install button (Android/desktop Chrome) or the Safari steps (iPhone) on the settings screen.
- `.github/workflows/deploy.yml` builds on every push to `main` and publishes `dist/` to GitHub Pages. The base path is derived from the repository name, so a project repo is served at `https://<owner>.github.io/<repo>/`.
