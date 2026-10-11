import type { DayTypeId, Slot, WorkoutId } from '../data/plan';
import type { WeekLocations } from '../engine/schedule';

export interface Settings {
  /** Segunda-feira de início do ciclo, 'YYYY-MM-DD'. */
  cycleStart: string;
  tiroSpeed: number;
  easySpeed: number;
  restCompoundSec: number;
  restIsolationSec: number;
  sound: boolean;
  vibrate: boolean;
}

export interface SetLog {
  exerciseId: string;
  set: number;
  kg?: number;
  reps?: number;
}

export interface SessionLog {
  id: string;
  date: string;
  dayType: DayTypeId;
  slot: Slot;
  workout: WorkoutId;
  cycleWeek: number;
  startedAt: number;
  finishedAt: number;
  /** "Descansar hoje" numa sessão opcional, ou sessão pulada. */
  skipped?: boolean;
  /** Saiu antes do fim. */
  partial?: boolean;
  short?: boolean;
  sets: SetLog[];
  runKm?: number;
  runSec?: number;
  feeling?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  tiroFeedback?: 'facil' | 'ok' | 'nao-terminei';
  /** Tempo do teste de 5 km (s), semana 8. */
  testSec?: number;
}

/** Treino em andamento (permite retomar após fechar o navegador). */
export interface ActiveSession {
  date: string;
  dayType: DayTypeId;
  slot: Slot;
  workout: WorkoutId;
  cycleWeek: number;
  short: boolean;
  startedAt: number;
  stepIndex: number;
  /** Horário (ms) em que o passo atual começou. */
  stepStartedAt: number;
  /** Ajuste manual (+/-15 s) do passo atual. */
  extraSec: number;
  /** Se pausado: segundos já decorridos no passo atual. */
  pausedElapsed?: number;
  sets: SetLog[];
  /** Velocidades usadas ao montar os passos (para não mudar no meio do treino). */
  tiroSpeed: number;
  easySpeed: number;
  /** Tempo do teste de 5 km, quando houver. */
  testSec?: number;
  /** Registro manual ("já fiz"), sem passar pelo player. */
  manual?: boolean;
  /** Chegou ao fim dos passos (ou registro manual): mostra a tela de conclusão. */
  finished?: boolean;
}

export interface AppState {
  version: 1;
  onboarded: boolean;
  settings: Settings;
  weeks: Record<string, { locations: WeekLocations }>;
  logs: SessionLog[];
  active?: ActiveSession;
}
