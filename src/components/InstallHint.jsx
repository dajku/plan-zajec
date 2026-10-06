import React, { useEffect, useState } from 'react';

/**
 * "Install this app" card for the settings screen. Chrome/Edge/Android hand
 * us a beforeinstallprompt event we can trigger; iOS Safari has no API, so
 * we show the manual steps instead. Hidden once the app runs installed.
 */
export function InstallHint() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    function onPrompt(e) {
      e.preventDefault();
      setPromptEvent(e);
    }
    function onInstalled() {
      setInstalled(true);
      setPromptEvent(null);
    }
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const ios = isIos();

  async function install() {
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') setPromptEvent(null);
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Na telefonie</p>
      <h2 className="mt-1 font-display text-base font-semibold text-fg">Zainstaluj jako aplikację</h2>
      <p className="mt-1 text-sm text-muted">Ikona na ekranie głównym, pełny ekran i działanie bez internetu.</p>

      {promptEvent ? (
        <button
          type="button"
          onClick={install}
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-accent font-semibold text-accent-fg hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Zainstaluj
        </button>
      ) : ios ? (
        <>
          <button
            type="button"
            onClick={() => setShowIosSteps((v) => !v)}
            aria-expanded={showIosSteps}
            className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl border border-line font-semibold text-fg hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            Jak zainstalować na iPhonie
          </button>
          {showIosSteps ? (
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-fg">
              <li>W Safari dotknij przycisku Udostępnij (kwadrat ze strzałką).</li>
              <li>Wybierz „Do ekranu początkowego”.</li>
              <li>Potwierdź „Dodaj”.</li>
            </ol>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-sm text-muted">
          W menu przeglądarki (⋮) wybierz „Zainstaluj aplikację” lub „Dodaj do ekranu głównego”.
        </p>
      )}
    </section>
  );
}

function isStandalone() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  } catch {
    return false;
  }
}

function isIos() {
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
