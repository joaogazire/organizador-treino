import { STRENGTH, isStrength, type Exercise, type WorkoutId } from '../data/plan';
import type { SessionLog, SetLog, Settings } from '../store/types';
import { lastSetsFor } from './progression';
import { exercisesFor, setsFor, type StepOptions } from './steps';

export interface ChecklistItem {
  exercise: Exercise;
  sets: number;
}

/** Uma linha por exercício, com o número de séries do dia (semana leve e versão curta já aplicadas). */
export function checklistFor(workout: WorkoutId, o: Pick<StepOptions, 'cycleWeek' | 'short'>): ChecklistItem[] {
  if (!isStrength(workout)) return [];
  return exercisesFor(workout, o.short).map((exercise) => ({ exercise, sets: setsFor(exercise, o) }));
}

/** Carga da última sessão em que o exercício foi feito. */
export function lastKgFor(logs: SessionLog[], exerciseId: string): number | undefined {
  const kgs = lastSetsFor(logs, exerciseId).map((s) => s.kg).filter((k): k is number => typeof k === 'number' && k > 0);
  return kgs.length ? Math.max(...kgs) : undefined;
}

/** Carga a mostrar: a editada nesta sessão ou, se não houver, a da última. */
export function loadFor(loads: Record<string, number> | undefined, logs: SessionLog[], exerciseId: string): number | undefined {
  return loads?.[exerciseId] ?? lastKgFor(logs, exerciseId);
}

const hasLoad = (e: Exercise | undefined) => !!e && !e.bodyweight && e.unit !== 's';

const exerciseById = new Map(Object.values(STRENGTH).flatMap((w) => w.exercises.map((e) => [e.id, e] as const)));

/** Séries marcadas → registro do histórico. Reps não são registradas (ficam indefinidas, nunca inventadas). */
export function buildSetLogs(
  marked: Pick<SetLog, 'exerciseId' | 'set'>[],
  loads: Record<string, number> | undefined,
  logs: SessionLog[],
): SetLog[] {
  return marked.map(({ exerciseId, set }) => {
    const kg = hasLoad(exerciseById.get(exerciseId)) ? loadFor(loads, logs, exerciseId) : undefined;
    return kg === undefined ? { exerciseId, set } : { exerciseId, set, kg };
  });
}

export function restSecFor(e: Exercise, s: Pick<Settings, 'restCompoundSec' | 'restIsolationSec'>): number {
  return e.compound ? s.restCompoundSec : s.restIsolationSec;
}

export { hasLoad };
