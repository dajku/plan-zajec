// Shared by the Vite app and the single-file preview (scripts/build-preview.mjs
// inlines the same `theme` object into the Tailwind play CDN config).
export const theme = {
  extend: {
    colors: {
      bg: 'var(--bg)',
      surface: 'var(--surface)',
      fg: 'var(--fg)',
      muted: 'var(--muted)',
      line: 'var(--line)',
      accent: 'var(--accent)',
      'accent-fg': 'var(--accent-fg)',
      'accent-soft': 'var(--accent-soft)',
      letter: 'var(--letter)',
      'letter-soft': 'var(--letter-soft)',
      number: 'var(--number)',
      'number-soft': 'var(--number-soft)',
      danger: 'var(--danger)',
      'danger-soft': 'var(--danger-soft)',
    },
    fontFamily: {
      display: ['var(--font-display)'],
      sans: ['var(--font-body)'],
    },
  },
};

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme,
  plugins: [],
};
