import {
  CHEST_EXERCISES,
  DAY_TYPES,
  SLOT_LABEL,
  STRENGTH,
  isRun,
  isStrength,
  workoutName,
  type DayTypeId,
  type Exercise,
  type SessionPlan,
  type WeekProgression,
} from '../data/plan';
import type { AppState, SessionLog } from '../store/types';
import { locationsFor } from '../store/storage';
import { cycleWeek, holdLegsInWeek, progressionFor } from './cycle';
import { WEEKDAYS, WEEKDAY_LONG, addDays, formatShort, weekDates, type WeekdayKey } from './dates';
import { fmtKg, loadHint } from './progression';
import { assignWeek } from './schedule';
import { fmtNum, plannedKm } from './steps';

export interface ReportDay {
  date: string;
  weekday: WeekdayKey;
  dayType: DayTypeId;
  sessions: { plan: SessionPlan; log?: SessionLog }[];
}

export interface WeekReport {
  monday: string;
  sunday: string;
  cycleWeek: number;
  prog: WeekProgression;
  days: ReportDay[];
  planned: number;
  done: number;
  optionalDone: number;
  kmPlanned: number;
  kmDone: number;
  strengthSets: number;
  chestSets: number;
  avgFeeling?: number;
  records: string[];
  suggestions: string[];
  tiroSpeed: number;
  tiroSpeedChanged: boolean;
  next: { cycleWeek: number; prog: WeekProgression; runIncreases: boolean };
}

const allExercises: Exercise[] = Object.values(STRENGTH).flatMap((w) => w.exercises);

export function logsOfDate(logs: SessionLog[], date: string) {
  return logs.filter((l) => l.date === date);
}

export function findLog(logs: SessionLog[], date: string, plan: SessionPlan) {
  return logs
    .filter((l) => l.date === date && l.workout === plan.workout && l.slot === plan.slot)
    .sort((a, b) => b.finishedAt - a.finishedAt)[0];
}

export function buildReport(state: AppState, monday: string): WeekReport {
  const dates = weekDates(monday);
  const sunday = dates[6];
  const cw = cycleWeek(state.settings.cycleStart, monday);
  const prog = progressionFor(cw);
  const schedule = assignWeek(locationsFor(state, monday));
  const weekLogs = state.logs.filter((l) => l.date >= monday && l.date <= sunday);

  const days: ReportDay[] = dates.map((date, i) => {
    const dayType = schedule[WEEKDAYS[i]];
    return {
      date,
      weekday: WEEKDAYS[i],
      dayType,
      sessions: DAY_TYPES[dayType].sessions.map((plan) => ({ plan, log: findLog(weekLogs, date, plan) })),
    };
  });

  let planned = 0, done = 0, optionalDone = 0, kmPlanned = 0;
  for (const d of days) {
    for (const { plan, log } of d.sessions) {
      const did = !!log && !log.skipped;
      if (plan.optional) {
        if (did) optionalDone++;
      } else {
        planned++;
        if (did) done++;
      }
      if (isRun(plan.workout)) kmPlanned += plannedKm(plan.workout, cw);
    }
  }

  const real = weekLogs.filter((l) => !l.skipped);
  const kmDone = real.reduce((acc, l) => acc + (l.runKm ?? 0), 0);
  const strengthLogs = real.filter((l) => isStrength(l.workout));
  const strengthSets = strengthLogs.reduce((acc, l) => acc + l.sets.length, 0);
  const chestSets = strengthLogs.reduce((acc, l) => acc + l.sets.filter((s) => CHEST_EXERCISES.has(s.exerciseId)).length, 0);
  const feelings = real.map((l) => l.feeling).filter((f): f is NonNullable<typeof f> => !!f);
  const avgFeeling = feelings.length ? feelings.reduce((a, b) => a + b, 0) / feelings.length : undefined;

  // Recordes: maior carga da semana acima de tudo que veio antes.
  const before = state.logs.filter((l) => l.date < monday);
  const records: string[] = [];
  const suggestions: string[] = [];
  const upToSunday = state.logs.filter((l) => l.date <= sunday);
  const nextMonday = addDays(monday, 7);
  const nextCw = cycleWeek(state.settings.cycleStart, nextMonday);
  const next = { cycleWeek: nextCw, prog: progressionFor(nextCw), runIncreases: holdLegsInWeek(state.settings.cycleStart, nextMonday) };
  const ctx = { deload: next.prog.halfSets, holdLegs: next.runIncreases };

  for (const e of allExercises) {
    const weekKg = maxKg(strengthLogs, e.id);
    if (weekKg === undefined) continue;
    const prevKg = maxKg(before, e.id);
    if (prevKg === undefined || weekKg > prevKg) records.push(`${e.name}: ${fmtKg(weekKg)}${prevKg ? ` (antes ${fmtKg(prevKg)})` : ''}`);
    // Só exercícios em que o último registro bateu o topo da faixa.
    const hit = loadHint(e, upToSunday, { deload: false, holdLegs: false });
    if (!hit || hit.lastKg === undefined || hit.message.endsWith('mantenha a carga')) continue;
    const hint = loadHint(e, upToSunday, ctx)!;
    suggestions.push(`${e.name}: ${hint.message.split('→ ')[1]}`);
  }

  // A velocidade dos tiros já é ajustada ao salvar o feedback do último tiro.
  const lastTiro = weekLogs.filter((l) => l.workout === 'tiros' && l.tiroFeedback).sort((a, b) => b.finishedAt - a.finishedAt)[0];
  const tiroSpeed = state.settings.tiroSpeed;
  const tiroSpeedChanged = !!lastTiro && lastTiro.tiroFeedback !== 'ok';

  return {
    monday, sunday, cycleWeek: cw, prog, days, planned, done, optionalDone,
    kmPlanned, kmDone, strengthSets, chestSets, avgFeeling, records, suggestions,
    tiroSpeed, tiroSpeedChanged, next,
  };
}

function maxKg(logs: SessionLog[], exerciseId: string): number | undefined {
  let best: number | undefined;
  for (const l of logs) {
    if (l.skipped) continue;
    for (const s of l.sets) if (s.exerciseId === exerciseId && s.kg && (best === undefined || s.kg > best)) best = s.kg;
  }
  return best;
}

const FEELING_EMOJI = ['', '😫', '😕', '😐', '🙂', '🔥'];

/** Texto para compartilhar (WhatsApp, e-mail, notas). */
export function reportText(r: WeekReport): string {
  const L: string[] = [];
  const range = `${formatShort(r.monday)} a ${formatShort(r.sunday)}`;
  L.push(`🏋️ *Relatório da semana* (${range})`);
  L.push(`Semana ${r.cycleWeek} de 8${r.prog.label ? ` (${r.prog.label})` : ''}`);
  L.push('');
  L.push(`✅ Sessões: ${r.done}/${r.planned}${r.optionalDone ? ` + ${r.optionalDone} opcional` : ''}`);
  L.push(`🏃 Corrida: ${fmtNum(r.kmDone)} / ${fmtNum(r.kmPlanned)} km`);
  L.push(`💪 Séries de musculação: ${r.strengthSets} (peito: ${r.chestSets})`);
  if (r.avgFeeling) L.push(`${FEELING_EMOJI[Math.round(r.avgFeeling)]} Sensação média: ${fmtNum(r.avgFeeling)}/5`);
  L.push('');
  L.push('*Dia a dia*');
  for (const d of r.days) {
    const parts = d.sessions.map(({ plan, log }) => {
      const mark = log ? (log.skipped ? '➖' : log.partial ? '◐' : '✅') : plan.optional ? '·' : '❌';
      return `${mark} ${workoutName(plan.workout)}`;
    });
    L.push(`${WEEKDAY_LONG[d.weekday]}: ${parts.join(' · ')}`);
  }
  if (r.records.length) {
    L.push('');
    L.push('*🏆 Recordes*');
    r.records.forEach((x) => L.push(`• ${x}`));
  }
  if (r.suggestions.length) {
    L.push('');
    L.push('*📈 Próxima sessão*');
    r.suggestions.forEach((x) => L.push(`• ${x}`));
  }
  L.push('');
  L.push(`*Próxima semana: ${r.next.cycleWeek} de 8${r.next.prog.label ? ` (${r.next.prog.label})` : ''}*`);
  const t = r.next.prog.tiros;
  L.push(`• Tiros: ${t ? `${t.reps} × ${t.meters} m a ${fmtNum(r.tiroSpeed)} km/h` : 'teste de 5 km'}`);
  L.push(`• Rodagem: ${fmtNum(r.next.prog.rodagemKm)} km · Longo: ${fmtNum(r.next.prog.longoKm)} km`);
  L.push(`• Musculação: ${r.next.prog.strength}`);
  if (r.next.runIncreases) L.push('⚠️ Corrida aumenta: não suba a carga de perna.');
  return L.join('\n');
}

export function isWeekOver(monday: string, today: string): boolean {
  return today >= addDays(monday, 6);
}

export function sessionLabel(plan: SessionPlan) {
  return `${SLOT_LABEL[plan.slot]} · ${workoutName(plan.workout)}`;
}

