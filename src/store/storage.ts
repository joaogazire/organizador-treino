import { DEFAULT_LOCATIONS, type WeekLocations } from '../engine/schedule';
import { mondayOf, todayISO } from '../engine/dates';
import type { AppState, Settings } from './types';

export const STORAGE_KEY = 'coach-hibrido:v1';

export function defaultSettings(today = todayISO()): Settings {
  return {
    cycleStart: mondayOf(today),
    tiroSpeed: 12,
    easySpeed: 9.25,
    restCompoundSec: 150,
    restIsolationSec: 75,
    sound: true,
    vibrate: true,
  };
}

export function defaultState(): AppState {
  return { version: 1, onboarded: false, settings: defaultSettings(), weeks: {}, logs: [] };
}

/** Valida e completa um estado vindo do storage ou de um backup. */
export function normalize(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppState>;
  if (r.version !== 1) return base;
  return {
    version: 1,
    onboarded: !!r.onboarded,
    settings: { ...base.settings, ...(r.settings ?? {}) },
    weeks: r.weeks && typeof r.weeks === 'object' ? r.weeks : {},
    logs: Array.isArray(r.logs) ? r.logs : [],
    active: r.active,
  };
}

export function load(): AppState {
  try {
    const txt = localStorage.getItem(STORAGE_KEY);
    return txt ? normalize(JSON.parse(txt)) : defaultState();
  } catch {
    return defaultState();
  }
}

export function save(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage cheio ou bloqueado: segue só em memória */
  }
}

/** Locais da semana; se ainda não definidos, herda a última semana configurada antes dela. */
export function locationsFor(state: AppState, monday: string): WeekLocations {
  const own = state.weeks[monday]?.locations;
  if (own) return own;
  const previous = Object.keys(state.weeks)
    .filter((k) => k < monday)
    .sort()
    .pop();
  return previous ? state.weeks[previous].locations : DEFAULT_LOCATIONS;
}

export function exportBackup(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importBackup(text: string): AppState {
  const parsed = JSON.parse(text);
  if (!parsed || parsed.version !== 1) throw new Error('Arquivo de backup inválido.');
  return normalize(parsed);
}

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
