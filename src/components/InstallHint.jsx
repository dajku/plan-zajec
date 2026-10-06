import React, { useEffect, useState } from 'react';
import { isNativeApp, useBackButton } from '../lib/native.js';

/**
 * Everything about getting the app onto a phone: the settings card, the
 * dismissible banner on the daily view and the bottom sheet it opens.
 * Android gets the APK download (plus the browser install as a fallback),
 * iPhone gets the Safari "Add to Home Screen" steps. Nothing is shown inside
 * the Android app itself or once the web app runs installed.
 */

export const APK_URL = `${import.meta.env.BASE_URL}plan-zajec.apk`;

// Chrome fires beforeinstallprompt once, early, so catch it at load time
// rather than when a component that wants it happens to mount.
let deferredPrompt = null;
const promptListeners = new Set();
if (typeof window !== 'undefined' && !isNativeApp) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    promptListeners.forEach((fn) => fn(e));
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    promptListeners.forEach((fn) => fn(null));
  });
}

function useInstallPrompt() {
  const [prompt, setPrompt] = useState(deferredPrompt);
  useEffect(() => {
    promptListeners.add(setPrompt);
    return () => promptListeners.delete(setPrompt);
  }, []);
  return prompt;
}

export function shouldOfferInstall() {
  return !isNativeApp && !isStandalone();
}

export function isPhone() {
  return platform() !== 'other';
}

/** Card on the settings screen. */
export function InstallHint() {
  if (!shouldOfferInstall()) return null;
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Na telefonie</p>
      <InstallSteps />
    </section>
  );
}

/** Slim banner above the day's classes; tapping it opens InstallSheet. */
export function InstallBanner({ onOpen, onDismiss }) {
  return (
    <div className="mx-4 mb-3 flex items-center gap-3 rounded-2xl bg-accent-soft py-2 pl-4 pr-2">
      <button
        type="button"
        onClick={onOpen}
        className="min-h-11 min-w-0 flex-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="block font-display text-sm font-semibold text-fg">Dodaj plan do telefonu</span>
        <span className="block text-xs text-muted">Ikona na ekranie, działa bez internetu. Zobacz jak →</span>
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Nie pokazuj więcej"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

/** Bottom sheet with the same steps as the settings card. */
export function InstallSheet({ onClose }) {
  useBackButton(onClose);
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Zainstaluj aplikację">
      <button type="button" aria-label="Zamknij" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div
        className="relative max-h-[90%] w-full max-w-md overflow-y-auto rounded-t-3xl bg-bg px-5 pt-3 shadow-2xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" aria-hidden="true" />
        <InstallSteps />
        <button
          type="button"
          onClick={onClose}
          className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl border border-line font-semibold text-fg hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          Zamknij
        </button>
      </div>
    </div>
  );
}

function InstallSteps() {
  const kind = platform();
  if (kind === 'android') return <AndroidSteps />;
  if (kind === 'ios') return <IosSteps />;
  return <OtherSteps />;
}

function AndroidSteps() {
  const prompt = useInstallPrompt();

  async function installPwa() {
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice;
  }

  return (
    <>
      <h2 className="mt-1 font-display text-lg font-semibold text-fg">Zainstaluj na Androidzie</h2>
      <a
        href={APK_URL}
        download="plan-zajec.apk"
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent font-semibold text-accent-fg hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 3v10m0 0-4-4m4 4 4-4M4 16h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Pobierz aplikację
      </a>
      <Steps
        items={[
          'Dotknij „Pobierz aplikację” i poczekaj, aż plik się pobierze.',
          'Otwórz pobrany plik „plan-zajec.apk” z powiadomienia albo z folderu Pobrane.',
          'Jeśli telefon zapyta, zezwól przeglądarce na instalowanie aplikacji, wróć i dotknij „Zainstaluj”.',
        ]}
      />
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Aplikacja nie pochodzi ze Sklepu Play, dlatego telefon może pokazać ostrzeżenie. To normalne przy instalacji spoza sklepu.
      </p>
      <div className="mt-4 border-t border-line pt-4">
        {prompt ? (
          <button
            type="button"
            onClick={installPwa}
            className="flex min-h-11 w-full items-center justify-center rounded-xl border border-line font-semibold text-fg hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            Albo zainstaluj z przeglądarki
          </button>
        ) : (
          <p className="text-sm text-muted">
            Wolisz bez pobierania pliku? W Chrome otwórz menu <b className="text-fg">⋮</b> i wybierz{' '}
            <b className="text-fg">„Dodaj do ekranu głównego”</b>.
          </p>
        )}
      </div>
    </>
  );
}

function IosSteps() {
  const safari = isIosSafari();
  return (
    <>
      <h2 className="mt-1 font-display text-lg font-semibold text-fg">Zainstaluj na iPhonie</h2>
      <p className="mt-1 text-sm text-muted">Zajmie to kilka sekund i nie wymaga App Store.</p>
      <Steps
        items={[
          <>
            Dotknij <b>Udostępnij</b> <ShareIcon />{' '}
            {safari ? 'na pasku na dole ekranu (albo w menu ••• obok adresu).' : 'obok paska adresu.'}
          </>,
          <>
            Przewiń w dół i wybierz <b>„Do ekranu początkowego”</b> <AddIcon />.
          </>,
          <>
            Dotknij <b>„Dodaj”</b> w prawym górnym rogu.
          </>,
        ]}
      />
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Ikona „Plan zajęć” pojawi się na ekranie początkowym. Otwieraj plan z niej, a nie z przeglądarki.
      </p>
    </>
  );
}

function OtherSteps() {
  const url = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  return (
    <>
      <h2 className="mt-1 font-display text-lg font-semibold text-fg">Zainstaluj na telefonie</h2>
      <p className="mt-1 text-sm text-muted">
        Otwórz ten adres na telefonie, a w ustawieniach pojawi się instrukcja dla Androida lub iPhone’a:
      </p>
      <p className="mt-2 break-all rounded-xl bg-bg px-3 py-2 font-mono text-xs text-fg">{url}</p>
      <a
        href={APK_URL}
        download="plan-zajec.apk"
        className="mt-3 inline-block text-sm font-semibold text-accent underline underline-offset-2"
      >
        Pobierz plik APK na Androida
      </a>
    </>
  );
}

function Steps({ items }) {
  return (
    <ol className="mt-4 space-y-3">
      {items.map((text, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-fg">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">
            {i + 1}
          </span>
          <span className="pt-0.5">{text}</span>
        </li>
      ))}
    </ol>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-label="ikona Udostępnij" className="inline -mt-1 text-accent">
      <path d="M10 2v11M6 6l4-4 4 4M5 9H4v9h12V9h-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="inline -mt-1 text-accent">
      <rect x="2.5" y="2.5" width="15" height="15" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 6.5v7M6.5 10h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function platform() {
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  return 'other';
}

function isIosSafari() {
  const ua = navigator.userAgent || '';
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

function isStandalone() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch {
    return false;
  }
}
