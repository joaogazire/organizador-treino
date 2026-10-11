import {
  MOBILITY,
  RUN_INFO,
  STRENGTH,
  TIROS_COOLDOWN_MIN,
  TIROS_EXTRA_KM,
  TIROS_WARMUP_MIN,
  isRun,
  isStrength,
  type Exercise,
  type WorkoutId,
} from '../data/plan';
import { progressionFor } from './cycle';

export type StepKind =
  /** Série de musculação: termina quando o usuário toca em "Feito" (ou countdown, se `durationSec`). */
  | 'set'
  /** Descanso entre séries: countdown, avança sozinho. */
  | 'rest'
  /** Bloco com tempo (aquecimento, tiro, rodagem…): countdown, avança sozinho. */
  | 'timed'
  /** Cronômetro progressivo (teste de 5 km): termina no "Feito". */
  | 'open';

export interface Step {
  kind: StepKind;
  title: string;
  /** Linha grande abaixo do título: alvo de reps, velocidade… */
  target?: string;
  detail?: string;
  tip?: string;
  durationSec?: number;
  /** "Exercício 2/6" / "Tiro 3/5" */
  group?: string;
  /** "Série 1/4" */
  setLabel?: string;
  exerciseId?: string;
  set?: number;
  /** Para registrar carga/reps nesta série. */
  loggable?: boolean;
  bodyweight?: boolean;
  repsDefault?: number;
  /** Próximo passo (mostrado no descanso). */
  next?: string;
  speedKmh?: number;
  /** Cor/ênfase do passo na UI. */
  tone?: 'work' | 'rest' | 'easy' | 'hard';
}

export interface StepOptions {
  cycleWeek: number;
  tiroSpeed: number;
  easySpeed: number;
  restCompoundSec: number;
  restIsolationSec: number;
  /** Versão 25 min (dia pesado no escritório): 3 primeiros exercícios, 3 séries. */
  short?: boolean;
}

export const fmtNum = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

export function repsLabel(e: Exercise): string {
  if (e.min === null) return e.tip ?? 'até faltar 2 reps';
  const range = e.min === e.max ? `${e.min}` : `${e.min}–${e.max}`;
  const unit = e.unit === 's' ? 's' : 'reps';
  return `${range} ${unit}${e.perSide ? ' por perna' : ''}`;
}

export function setsFor(e: Exercise, opts: Pick<StepOptions, 'cycleWeek' | 'short'>): number {
  let sets = e.sets;
  if (opts.short) sets = Math.min(sets, 3);
  if (progressionFor(opts.cycleWeek).halfSets) sets = Math.ceil(sets / 2);
  return sets;
}

export function exercisesFor(workout: WorkoutId, short?: boolean): Exercise[] {
  if (!isStrength(workout)) return [];
  const list = STRENGTH[workout].exercises;
  return short ? list.slice(0, 3) : list;
}

function strengthSteps(workout: keyof typeof STRENGTH, o: StepOptions): Step[] {
  const exercises = exercisesFor(workout, o.short);
  const steps: Step[] = [];
  exercises.forEach((e, ei) => {
    const sets = setsFor(e, o);
    for (let s = 1; s <= sets; s++) {
      const timed = e.unit === 's' && e.min !== null && e.max !== null;
      steps.push({
        kind: 'set',
        title: e.name,
        target: repsLabel(e),
        detail: e.equipment,
        tip: e.tip,
        group: `Exercício ${ei + 1}/${exercises.length}`,
        setLabel: `Série ${s}/${sets}`,
        exerciseId: e.id,
        set: s,
        loggable: !timed,
        bodyweight: e.bodyweight,
        repsDefault: e.max ?? undefined,
        durationSec: timed ? Math.round((e.min! + e.max!) / 2 / 5) * 5 : undefined,
        tone: 'work',
      });
      const isLast = ei === exercises.length - 1 && s === sets;
      if (!isLast) {
        const nextEx = s < sets ? e : exercises[ei + 1];
        const nextSet = s < sets ? s + 1 : 1;
        steps.push({
          kind: 'rest',
          title: 'Descanso',
          durationSec: e.compound ? o.restCompoundSec : o.restIsolationSec,
          next: `${nextEx.name} · série ${nextSet}`,
          exerciseId: e.id,
          set: s,
          tone: 'rest',
        });
      }
    }
  });
  return steps;
}

const secForKm = (km: number, speed: number) => Math.round((km / speed) * 3600);

function tirosSteps(o: StepOptions): Step[] {
  const p = progressionFor(o.cycleWeek);
  const steps: Step[] = [
    { kind: 'timed', title: 'Aquecimento', target: 'Trote leve', durationSec: TIROS_WARMUP_MIN * 60, tone: 'easy', group: 'Aquecimento' },
    { kind: 'timed', title: 'Aceleração 1', target: 'Acelere progressivamente', durationSec: 30, tone: 'hard', group: 'Aquecimento' },
    { kind: 'timed', title: 'Trote', target: 'Volte ao trote', durationSec: 60, tone: 'easy', group: 'Aquecimento' },
    { kind: 'timed', title: 'Aceleração 2', target: 'Acelere progressivamente', durationSec: 30, tone: 'hard', group: 'Aquecimento' },
    { kind: 'timed', title: 'Trote', target: 'Prepare-se para os tiros', durationSec: 60, tone: 'easy', group: 'Aquecimento' },
  ];
  if (!p.tiros) {
    steps.push({
      kind: 'open',
      title: 'Teste de 5 km',
      target: 'Melhor ritmo possível',
      detail: 'Toque em "Feito" ao completar os 5 km e anote o tempo.',
      tone: 'hard',
      group: 'Teste',
    });
  } else {
    const { reps, meters, restSec } = p.tiros;
    for (let i = 1; i <= reps; i++) {
      steps.push({
        kind: 'timed',
        title: `Tiro ${i}/${reps}`,
        target: `${meters} m a ${fmtNum(o.tiroSpeed)} km/h`,
        detail: RUN_INFO.tiros.zone,
        durationSec: secForKm(meters / 1000, o.tiroSpeed),
        speedKmh: o.tiroSpeed,
        group: `Tiro ${i}/${reps}`,
        tone: 'hard',
      });
      if (i < reps) {
        steps.push({
          kind: 'timed',
          title: 'Caminhada',
          target: '5–6 km/h',
          durationSec: restSec,
          next: `Tiro ${i + 1}/${reps}`,
          group: `Tiro ${i}/${reps}`,
          tone: 'rest',
        });
      }
    }
  }
  steps.push({ kind: 'timed', title: 'Desaquecimento', target: 'Trote leve', durationSec: TIROS_COOLDOWN_MIN * 60, tone: 'easy', group: 'Desaquecimento' });
  return steps;
}

function steadySteps(workout: 'rodagem-leve' | 'longo', o: StepOptions): Step[] {
  const p = progressionFor(o.cycleWeek);
  const km = workout === 'longo' ? p.longoKm : p.rodagemKm;
  return [
    {
      kind: 'timed',
      title: RUN_INFO[workout].name,
      target: `${fmtNum(km)} km a ${fmtNum(o.easySpeed)} km/h`,
      detail: RUN_INFO[workout].zone,
      tip: RUN_INFO[workout].note,
      durationSec: secForKm(km, o.easySpeed),
      speedKmh: o.easySpeed,
      group: 'Corrida contínua',
      tone: 'easy',
    },
  ];
}

export function buildSteps(workout: WorkoutId, o: StepOptions): Step[] {
  if (isStrength(workout)) return strengthSteps(workout, o);
  if (workout === 'tiros') return tirosSteps(o);
  if (workout === 'rodagem-leve' || workout === 'longo') return steadySteps(workout, o);
  return [
    { kind: 'timed', title: MOBILITY.name, target: `${MOBILITY.minutes} min`, detail: MOBILITY.note, durationSec: MOBILITY.minutes * 60, tone: 'easy' },
  ];
}

/** Distância planejada da sessão (km), para corrida. */
export function plannedKm(workout: WorkoutId, cycleWeek: number): number {
  if (!isRun(workout)) return 0;
  const p = progressionFor(cycleWeek);
  if (workout === 'rodagem-leve') return p.rodagemKm;
  if (workout === 'longo') return p.longoKm;
  const tiroKm = p.tiros ? (p.tiros.reps * p.tiros.meters) / 1000 : 5;
  return tiroKm + TIROS_EXTRA_KM;
}

/** Duração estimada (min). Séries de musculação contam ~45 s cada. */
export function estimateMinutes(steps: Step[]): number {
  const sec = steps.reduce((acc, s) => acc + (s.durationSec ?? (s.kind === 'open' ? 1800 : 45)), 0);
  return Math.round(sec / 60);
}
