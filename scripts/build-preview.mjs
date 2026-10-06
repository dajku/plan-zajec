// Builds a single-file preview (dist/preview.html) that runs the same source
// as the Vite app, for publishing as an Artifact. React, ReactDOM and Babel
// come from cdnjs; Tailwind from its play CDN; everything else is inlined.
//
// Usage: node app/scripts/build-preview.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// Order matters: a file may only use what earlier files defined.
const SOURCES = [
  'src/lib/scheduleParser.js',
  'src/lib/storage.js',
  'src/lib/readCsvFile.js',
  'src/lib/dates.js',
  'src/data/bundledSchedule.js',
  'src/components/AppHeader.jsx',
  'src/components/FileImport.jsx',
  'src/components/GroupSelection.jsx',
  'src/components/WeekStrip.jsx',
  'src/components/MonthPicker.jsx',
  'src/components/DayList.jsx',
  'src/components/DailyView.jsx',
  'src/components/InstallHint.jsx',
  'src/components/SettingsScreen.jsx',
  'src/App.jsx',
];

/** Turns an ES module into a plain script body: drops imports, unwraps exports. */
function stripModuleSyntax(code) {
  return code
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^export default function/gm, 'function')
    .replace(/^export default /gm, 'const __default = ')
    .replace(/^export (const|let|function|class|async function)/gm, '$1');
}

const { theme } = await import(join(root, 'tailwind.config.js'));
const themeCss = read('src/theme.css');
const bundle = SOURCES.map((p) => `// ---- ${p}\n${stripModuleSyntax(read(p))}`).join('\n\n');

const html = `<title>Mój plan zajęć</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
${themeCss}
</style>
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = { theme: ${JSON.stringify(theme)} };
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.26.4/babel.min.js"></script>
<div id="root"></div>
<script type="text/babel" data-presets="react">
const { useState, useEffect, useMemo, useRef, useCallback } = React;
${bundle}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
</script>
`;

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/preview.html'), html);
console.log(`dist/preview.html written (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
