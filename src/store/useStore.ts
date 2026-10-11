import { useEffect, useState } from 'preact/hooks';
import { load, save } from './storage';
import type { AppState } from './types';

// Store global mínimo: estado único, persistido a cada mudança.
let state: AppState = load();
const listeners = new Set<(s: AppState) => void>();

export function getState() {
  return state;
}

export function setState(update: (s: AppState) => AppState) {
  state = update(state);
  save(state);
  listeners.forEach((l) => l(state));
}

export function replaceState(next: AppState) {
  setState(() => next);
}

export function useStore(): AppState {
  const [s, set] = useState(state);
  useEffect(() => {
    listeners.add(set);
    set(state);
    return () => {
      listeners.delete(set);
    };
  }, []);
  return s;
}
