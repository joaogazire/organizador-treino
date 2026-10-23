import { describe, expect, it } from 'vitest';
import { STRENGTH } from '../src/data/plan';
import { buildSetLogs, checklistFor, lastKgFor, loadFor, restSecFor } from '../src/engine/checklist';
import { loadHint } from '../src/engine/progression';
import type { SessionLog } from '../src/store/types';

const log = (finishedAt: number, sets: SessionLog['sets']): SessionLog => ({
  id: String(finishedAt), date: '2026-10-01', dayType: 'escritorio-1', slot: 'noite', workout: 'superior-a',
  cycleWeek: 1, startedAt: finishedAt - 1000, finishedAt, sets,
});

const ex = (id: string) => Object.values(STRENGTH).flatMap((w) => w.exercises).find((e) => e.id === id)!;

describe('lastKgFor / loadFor', () => {
  const logs = [
    log(100, [{ exerciseId: 'supino-reto-barra', set: 1, kg: 40 }]),
    log(200, [{ exerciseId: 'supino-reto-barra', set: 1, kg: 42 }, { exerciseId: 'supino-reto-barra', set: 2, kg: 42 }]),
  ];

  it('pega a carga da sessão mais recente', () => {
    expect(lastKgFor(logs, 'supino-reto-barra')).toBe(42);
  });

  it('sem histórico → undefined', () => {
    expect(lastKgFor([], 'supino-reto-barra')).toBeUndefined();
    expect(lastKgFor(logs, 'face-pull')).toBeUndefined();
  });

  it('carga editada na sessão vence a última', () => {
    expect(loadFor({ 'supino-reto-barra': 45 }, logs, 'supino-reto-barra')).toBe(45);
    expect(loadFor({}, logs, 'supino-reto-barra')).toBe(42);
  });
});

describe('checklistFor', () => {
  it('uma linha por exercício com a quantidade de séries', () => {
    const list = checklistFor('superior-a', { cycleWeek: 1 });
    expect(list.map((i) => i.sets)).toEqual([4, 3, 3, 2, 3, 3]);
    expect(list[0].exercise.id).toBe('supino-inclinado-barra');
  });

  it('semana leve = metade das séries; versão curta = 3 exercícios × 3', () => {
    expect(checklistFor('superior-a', { cycleWeek: 4 }).map((i) => i.sets)).toEqual([2, 2, 2, 1, 2, 2]);
    expect(checklistFor('superior-b', { cycleWeek: 1, short: true }).map((i) => i.sets)).toEqual([3, 3, 3]);
  });

  it('corrida não tem checklist', () => {
    expect(checklistFor('tiros', { cycleWeek: 1 })).toEqual([]);
  });
});

describe('buildSetLogs: o que vai pro histórico', () => {
  const marked = [
    { exerciseId: 'supino-reto-barra', set: 1 },
    { exerciseId: 'supino-reto-barra', set: 2 },
    { exerciseId: 'prancha', set: 1 },
    { exerciseId: 'flexao-declinada', set: 1 },
  ];

  it('grava a carga do exercício em cada série marcada e NÃO inventa reps', () => {
    const out = buildSetLogs(marked, { 'supino-reto-barra': 45 }, []);
    const supino = out.filter((s) => s.exerciseId === 'supino-reto-barra');
    expect(supino).toEqual([
      { exerciseId: 'supino-reto-barra', set: 1, kg: 45 },
      { exerciseId: 'supino-reto-barra', set: 2, kg: 45 },
    ]);
    expect(supino.every((s) => s.reps === undefined)).toBe(true);
  });

  it('sem carga editada, mantém a da última sessão', () => {
    const logs = [log(100, [{ exerciseId: 'supino-reto-barra', set: 1, kg: 40 }])];
    expect(buildSetLogs([marked[0]], {}, logs)[0].kg).toBe(40);
  });

  it('peso corporal e exercício por tempo ficam sem kg', () => {
    const out = buildSetLogs(marked, { prancha: 20, 'flexao-declinada': 20 }, []);
    expect(out.find((s) => s.exerciseId === 'prancha')).toEqual({ exerciseId: 'prancha', set: 1 });
    expect(out.find((s) => s.exerciseId === 'flexao-declinada')).toEqual({ exerciseId: 'flexao-declinada', set: 1 });
  });

  it('sessão sem reps registradas não dispara "suba a carga" no loadHint', () => {
    const sets = buildSetLogs(
      [1, 2, 3].map((set) => ({ exerciseId: 'supino-reto-barra', set })), { 'supino-reto-barra': 40 }, [],
    );
    const hint = loadHint(ex('supino-reto-barra'), [log(100, sets)], { deload: false, holdLegs: false });
    expect(hint?.suggestKg).toBe(40);
    expect(hint?.message).not.toMatch(/suba/);
  });
});

describe('restSecFor', () => {
  it('composto usa o descanso longo, isolado o curto', () => {
    const s = { restCompoundSec: 150, restIsolationSec: 75 };
    expect(restSecFor(ex('supino-reto-barra'), s)).toBe(150);
    expect(restSecFor(ex('face-pull'), s)).toBe(75);
  });
});
