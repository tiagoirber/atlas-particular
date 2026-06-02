'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              newSW.postMessage('skipWaiting');
              navigator.serviceWorker.addEventListener('controllerchange', () => {
                location.reload();
              });
            }
          });
        });
      })
      .catch(console.error);
  }, []);

  return null;
}
