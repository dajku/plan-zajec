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

## Android app (APK)

The same code is wrapped with [Capacitor](https://capacitorjs.com) into an Android app (`android/`). Every push to `main` builds `plan-zajec.apk` and publishes it next to the site, at `<site>/plan-zajec.apk`; the install card in the app links to it. Pull requests attach the APK to the workflow run.

- `npm run build:android` builds the web copy without the service worker and syncs it into `android/`.
- `npm run android-assets` regenerates the launcher icons and splash screens from `public/icons/icon.svg`.

Signing: by default each CI build is signed with a throwaway debug key, so a new APK only installs after the old one is uninstalled. To let updates install over each other, create a key once and add three repository secrets (Settings → Secrets and variables → Actions):

```sh
keytool -genkeypair -keystore release.keystore -alias planzajec -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 release.keystore   # on macOS: base64 -i release.keystore
```

- `ANDROID_KEYSTORE_BASE64`: the base64 output
- `ANDROID_KEYSTORE_PASSWORD`: the password you chose
- `ANDROID_KEY_ALIAS`: `planzajec`

Keep `release.keystore` and its password somewhere safe and out of the repo.
