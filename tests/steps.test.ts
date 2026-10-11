import { describe, expect, it } from 'vitest';
import { buildSteps, plannedKm } from '../src/engine/steps';
import { loadHint, nextTiroSpeed } from '../src/engine/progression';
import { holdLegsInWeek, speedsFromTest } from '../src/engine/cycle';
import { addDays } from '../src/engine/dates';

const N = { deload: false, holdLegs: false };
const D = { deload: true, holdLegs: false };
import { STRENGTH } from '../src/data/plan';
import type { SessionLog } from '../src/store/types';

const base = { tiroSpeed: 12, easySpeed: 9, restCompoundSec: 150, restIsolationSec: 75 };

describe('buildSteps', () => {
  it('Superior A: série → descanso, sem descanso no final', () => {
    const steps = buildSteps('superior-a', { ...base, cycleWeek: 1 });
    const sets = steps.filter((s) => s.kind === 'set');
    expect(sets).toHaveLength(4 + 3 + 3 + 2 + 3 + 3);
    expect(steps.filter((s) => s.kind === 'rest')).toHaveLength(sets.length - 1);
    expect(steps.at(-1)!.kind).toBe('set');
    expect(steps[1]).toMatchObject({ kind: 'rest', durationSec: 150 });
  });

  it('semana 4: metade das séries', () => {
    const sets = buildSteps('superior-a', { ...base, cycleWeek: 4 }).filter((s) => s.kind === 'set');
    expect(sets).toHaveLength(2 + 2 + 2 + 1 + 2 + 2);
  });

  it('versão 25 min: 3 exercícios × 3 séries', () => {
    const sets = buildSteps('superior-b', { ...base, cycleWeek: 1, short: true }).filter((s) => s.kind === 'set');
    expect(sets).toHaveLength(9);
  });

  it('prancha é por tempo', () => {
    const plank = buildSteps('pernas-a', { ...base, cycleWeek: 1 }).find((s) => s.exerciseId === 'prancha' && s.kind === 'set')!;
    expect(plank.durationSec).toBe(50);
    expect(plank.loggable).toBe(false);
  });

  it('tiros semana 1: 6 × 600 m a 12 km/h = 180 s cada', () => {
    const steps = buildSteps('tiros', { ...base, cycleWeek: 1 });
    const tiros = steps.filter((s) => s.title.startsWith('Tiro '));
    expect(tiros).toHaveLength(6);
    expect(tiros[0].durationSec).toBe(180);
    expect(steps.filter((s) => s.title === 'Caminhada')).toHaveLength(5);
  });

  it('semana 8: teste de 5 km com cronômetro', () => {
    const steps = buildSteps('tiros', { ...base, cycleWeek: 8 });
    expect(steps.some((s) => s.kind === 'open')).toBe(true);
  });

  it('rodagem: distância ÷ velocidade', () => {
    const [run] = buildSteps('rodagem-leve', { ...base, cycleWeek: 1 });
    expect(run.durationSec).toBe(40 * 60); // 6 km a 9 km/h
    expect(plannedKm('tiros', 1)).toBeCloseTo(7.6);
  });
});

describe('progressão', () => {
  const supino = STRENGTH['superior-a'].exercises[0];
  const log = (reps: number[], kg: number, ex = supino.id): SessionLog => ({
    id: 'x', date: '2026-10-12', dayType: 'escritorio-1', slot: 'noite', workout: 'superior-a', cycleWeek: 1,
    startedAt: 0, finishedAt: 1, sets: reps.map((r, i) => ({ exerciseId: ex, set: i + 1, kg, reps: r })),
  });

  it('bateu o topo em todas → sobe carga', () => {
    expect(loadHint(supino, [log([8, 8, 8, 8], 40)], N)?.suggestKg).toBe(41);
  });
  it('não bateu → mantém', () => {
    expect(loadHint(supino, [log([8, 8, 7, 6], 40)], N)?.suggestKg).toBe(40);
  });
  it('semana leve → mantém', () => {
    expect(loadHint(supino, [log([8, 8, 8, 8], 40)], D)?.suggestKg).toBe(40);
  });
  it('halter no limite de 10 kg → mais reps', () => {
    const cruc = STRENGTH['superior-a'].exercises[2];
    expect(loadHint(cruc, [log([15, 15, 15], 10, cruc.id)], N)?.message).toContain('mais reps');
  });
  it('incremento nunca passa de 5%: carga leve progride por reps', () => {
    const tri = STRENGTH['superior-a'].exercises[5];
    expect(loadHint(tri, [log([15, 15, 15], 15, tri.id)], N)?.suggestKg).toBe(15);
    expect(loadHint(supino, [log([8, 8, 8, 8], 100)], N)?.suggestKg).toBe(103);
  });
  it('kettlebell progride por reps', () => {
    const swing = STRENGTH['pernas-b'].exercises[4];
    expect(loadHint(swing, [log([15, 15, 15], 16, swing.id)], N)?.suggestKg).toBe(16);
  });
  it('regra de ouro: perna segura só quando a corrida salta', () => {
    const agach = STRENGTH['pernas-a'].exercises[0];
    const l = [log([7, 7, 7, 7], 80, agach.id)];
    expect(loadHint(agach, l, { deload: false, holdLegs: true })?.suggestKg).toBe(80);
    expect(loadHint(supino, [log([8, 8, 8, 8], 40)], { deload: false, holdLegs: true })?.suggestKg).toBe(41);
    const start = '2026-10-12';
    expect(holdLegsInWeek(start, start)).toBe(false); // semana 1
    expect(holdLegsInWeek(start, addDays(start, 7))).toBe(false); // 1→2: +7%
    expect(holdLegsInWeek(start, addDays(start, 28))).toBe(true); // 4→5: +49%
    expect(holdLegsInWeek(start, addDays(start, 56))).toBe(true); // 8→3: +20%
  });
  it('teste de 5 km recalibra velocidades', () => {
    expect(speedsFromTest(30 * 60)).toEqual({ tiroSpeed: 12.5, easySpeed: 9.25 });
    expect(speedsFromTest(25 * 60).tiroSpeed).toBe(14.5);
  });
  it('velocidade dos tiros', () => {
    expect(nextTiroSpeed(12, 'facil')).toBe(12.5);
    expect(nextTiroSpeed(12, 'nao-terminei')).toBe(11.5);
    expect(nextTiroSpeed(12, 'ok')).toBe(12);
  });
});
