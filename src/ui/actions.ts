import type { DayTypeId, Slot, WorkoutId } from '../data/plan';
import { cycleWeek, speedsFromTest } from '../engine/cycle';
import { mondayOf, type WorkdayKey } from '../engine/dates';
import { nextTiroSpeed } from '../engine/progression';
import type { Location } from '../engine/schedule';
import { locationsFor, newId } from '../store/storage';
import type { ActiveSession, SessionLog } from '../store/types';
import { getState, setState } from '../store/useStore';

export interface SessionRef {
  date: string;
  dayType: DayTypeId;
  slot: Slot;
  workout: WorkoutId;
}

export function setLocation(date: string, day: WorkdayKey, loc: Location) {
  setState((s) => {
    const monday = mondayOf(date);
    const current = locationsFor(s, monday);
    return { ...s, weeks: { ...s.weeks, [monday]: { locations: { ...current, [day]: loc } } } };
  });
}

export function startSession(ref: SessionRef, opts: { short?: boolean; manual?: boolean } = {}) {
  const s = getState();
  const now = Date.now();
  const active: ActiveSession = {
    ...ref,
    cycleWeek: cycleWeek(s.settings.cycleStart, ref.date),
    short: !!opts.short,
    startedAt: now,
    stepIndex: 0,
    stepStartedAt: now,
    extraSec: 0,
    sets: [],
    tiroSpeed: s.settings.tiroSpeed,
    easySpeed: s.settings.easySpeed,
    manual: !!opts.manual,
    finished: !!opts.manual,
  };
  setState((st) => ({ ...st, active }));
}

export function updateActive(fn: (a: ActiveSession) => ActiveSession) {
  setState((s) => (s.active ? { ...s, active: fn(s.active) } : s));
}

export function discardActive() {
  setState((s) => ({ ...s, active: undefined }));
}

export function saveSession(log: Omit<SessionLog, 'id'>) {
  setState((s) => {
    let settings = s.settings;
    if (log.workout === 'tiros' && log.tiroFeedback) settings = { ...settings, tiroSpeed: nextTiroSpeed(settings.tiroSpeed, log.tiroFeedback) };
    // Teste de 5 km (semana 8): vira o novo parâmetro de velocidade do próximo ciclo.
    if (log.testSec) settings = { ...settings, ...speedsFromTest(log.testSec) };
    return { ...s, settings, logs: [...s.logs, { ...log, id: newId() }], active: undefined };
  });
}

export function skipSession(ref: SessionRef) {
  const s = getState();
  const now = Date.now();
  saveSession({ ...ref, cycleWeek: cycleWeek(s.settings.cycleStart, ref.date), startedAt: now, finishedAt: now, skipped: true, sets: [] });
}

export function deleteLog(id: string) {
  setState((s) => ({ ...s, logs: s.logs.filter((l) => l.id !== id) }));
}
