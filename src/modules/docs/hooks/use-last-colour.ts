import { useSyncExternalStore } from 'react';

import { type LastColour, lastColourOf } from '../core/last-colour';

const STORAGE_KEY = 'kotsu.docs.lastColour';

const subscribers = new Set<() => void>();

export function useLastColour() {
  const stored = useSyncExternalStore(subscribe, readStored, () => null);
  return lastColourOf(stored);
}

export function readLastColour() {
  return lastColourOf(readStored());
}

export function rememberLastColour(colour: LastColour) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colour));
  } catch {
    return;
  }
  for (const notify of subscribers) notify();
}

function subscribe(onChange: () => void) {
  subscribers.add(onChange);
  addEventListener('storage', onChange);
  return () => {
    subscribers.delete(onChange);
    removeEventListener('storage', onChange);
  };
}

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
