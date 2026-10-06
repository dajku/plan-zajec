import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

// True inside the Android app built with Capacitor, false in any browser.
export const isNativeApp = Capacitor.isNativePlatform();

// Android's back button: the most recently opened screen or sheet handles it;
// with nothing open it leaves the app, like any other Android app.
const backHandlers = [];
if (isNativeApp) {
  App.addListener('backButton', () => {
    const top = backHandlers[backHandlers.length - 1];
    if (top) top();
    else App.exitApp();
  });
}

export function useBackButton(handler, enabled = true) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!isNativeApp || !enabled) return undefined;
    const fn = () => ref.current();
    backHandlers.push(fn);
    return () => {
      const i = backHandlers.lastIndexOf(fn);
      if (i >= 0) backHandlers.splice(i, 1);
    };
  }, [enabled]);
}
