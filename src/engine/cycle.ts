import { BASE_5K_SPEED as BASE_5K_SPEED_REF, BASE_EASY_SPEED as BASE_EASY_REF, BASE_TIRO_SPEED as BASE_TIRO_REF, PROGRESSION, RUN_JUMP_THRESHOLD, type WeekProgression } from '../data/plan';
import { addDays, diffDays, mondayOf } from './dates';

/**
 * Semana do ciclo (1–8) para a semana que contém `date`.
 * Depois da semana 8, recomeça pela semana 3 (3…8, 3…8, …).
 * Antes do início do ciclo, retorna 1.
 */
export function cycleWeek(cycleStart: string, date: string): number {
  const n = Math.floor(diffDays(mondayOf(cycleStart), mondayOf(date)) / 7);
  if (n < 0) return 1;
  if (n < 8) return n + 1;
  return 3 + ((n - 8) % 6);
}

export function progressionFor(week: number): WeekProgression {
  return PROGRESSION[Math.min(Math.max(week, 1), 8) - 1];
}

/**
 * Regra de ouro "nunca aumentar corrida e carga de perna na mesma semana".
 * Como a corrida sobe um pouco quase toda semana, só seguramos a perna quando o salto
 * de km em relação à semana anterior passa de RUN_JUMP_THRESHOLD (ex.: 4→5 e 8→3).
 */
export function holdLegsInWeek(cycleStart: string, date: string): boolean {
  const monday = mondayOf(date);
  if (diffDays(mondayOf(cycleStart), monday) < 7) return false;
  const prev = progressionFor(cycleWeek(cycleStart, addDays(monday, -7)));
  const cur = progressionFor(cycleWeek(cycleStart, monday));
  return cur.totalKm > prev.totalKm * (1 + RUN_JUMP_THRESHOLD);
}

/** Velocidades recalibradas pelo teste de 5 km (base do método: 5 km em 30 min). */
export function speedsFromTest(testSec: number): { tiroSpeed: number; easySpeed: number } {
  const v5 = 5 / (testSec / 3600);
  const factor = v5 / BASE_5K_SPEED_REF;
  return {
    tiroSpeed: Math.round(BASE_TIRO_REF * factor * 2) / 2,
    easySpeed: Math.round(BASE_EASY_REF * factor * 4) / 4,
  };
}
