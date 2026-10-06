import React from 'react';

/** Slim top bar shared by every screen. */
export function AppHeader({ title, subtitle, onBack, action }) {
  return (
    <header
      className="sticky z-10 flex items-center gap-3 border-b border-line bg-bg px-4 py-3"
      style={{ top: 'env(safe-area-inset-top, 0px)' }}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Wstecz"
          className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-fg hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.5 4 6.5 10l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent font-display text-base font-bold text-accent-fg" aria-hidden="true">
          P
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-base font-semibold leading-tight text-fg">{title}</h1>
        {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}
