import { DUMBBELL_MAX_KG, isLegExercise, type Exercise } from '../data/plan';
import type { SessionLog } from '../store/types';

export interface LoadHint {
  lastKg?: number;
  lastReps: number[];
  suggestKg?: number;
  message: string;
}

/** Último registro (mais recente) com séries deste exercício. */
export function lastSetsFor(logs: SessionLog[], exerciseId: string, beforeTs = Infinity) {
  const sorted = [...logs].filter((l) => l.finishedAt < beforeTs).sort((a, b) => b.finishedAt - a.finishedAt);
  for (const log of sorted) {
    const sets = log.sets.filter((s) => s.exerciseId === exerciseId);
    if (sets.length) return sets.sort((a, b) => a.set - b.set);
  }
  return [];
}

/**
 * Regra do método: bateu o topo da faixa em todas as séries → +2–5% de carga.
 * Halteres travados em 10 kg → progredir com reps/tempo.
 */
export interface HintContext {
  /** Semana leve (4 e 8): mesma carga. */
  deload: boolean;
  /** Corrida subiu forte nesta semana: não subir carga de perna (regra de ouro). */
  holdLegs: boolean;
}

export function loadHint(e: Exercise, logs: SessionLog[], ctx: HintContext): LoadHint | null {
  if (e.bodyweight || e.unit === 's') return null;
  const sets = lastSetsFor(logs, e.id);
  if (!sets.length) return { lastReps: [], message: 'Primeira vez: comece com a carga atual, RIR 2.' };
  const kgs = sets.map((s) => s.kg).filter((k): k is number => typeof k === 'number' && k > 0);
  const lastKg = kgs.length ? Math.max(...kgs) : undefined;
  const lastReps = sets.map((s) => s.reps ?? 0);
  const hitTop = e.max !== null && lastReps.every((r) => r >= e.max!);

  if (lastKg === undefined) return { lastReps, message: `Última: ${lastReps.join('/')} reps` };
  const base = `Última: ${fmtKg(lastKg)} × ${lastReps.join('/')}`;
  const keep = (why: string): LoadHint => ({ lastKg, lastReps, suggestKg: lastKg, message: `${base} → ${why}` });
  if (ctx.deload) return keep('mesma carga (semana leve)');
  if (!hitTop) return keep('mantenha a carga');
  if (ctx.holdLegs && isLegExercise(e.id)) return keep('mantenha (corrida subiu esta semana)');
  if (e.dumbbell && lastKg >= DUMBBELL_MAX_KG) {
    return keep('halter no limite: mais reps (até 20), descida 3 s, pausa 1–2 s; depois troque por barra');
  }
  // +2–5%, no menor incremento disponível (1 kg). Se +1 kg passa de 5%, progride por reps/tempo.
  const suggestKg = Math.ceil(lastKg * 1.025);
  if (e.kettlebell || suggestKg > lastKg * 1.05) return keep('carga leve para subir 2–5%: mais reps ou descida mais lenta');
  return { lastKg, lastReps, suggestKg, message: `${base} → suba para ${fmtKg(suggestKg)}` };
}

export function fmtKg(kg: number) {
  return `${kg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`;
}

/** Ajuste da velocidade dos tiros pelo feedback do último tiro. */
export function nextTiroSpeed(current: number, feedback: SessionLog['tiroFeedback']): number {
  if (feedback === 'facil') return current + 0.5;
  if (feedback === 'nao-terminei') return Math.max(6, current - 0.5);
  return current;
}
