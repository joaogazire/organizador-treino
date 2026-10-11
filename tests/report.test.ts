import { describe, expect, it } from 'vitest';
import { buildReport, reportText } from '../src/engine/report';
import { defaultState } from '../src/store/storage';
import type { AppState } from '../src/store/types';

describe('relatório semanal', () => {
  it('conta sessões e km da semana padrão', () => {
    const state: AppState = { ...defaultState(), settings: { ...defaultState().settings, cycleStart: '2026-10-12' } };
    state.logs.push({
      id: 'a', date: '2026-10-13', dayType: 'casa-1', slot: 'manha', workout: 'tiros', cycleWeek: 1,
      startedAt: 0, finishedAt: 1, sets: [], runKm: 7.6, feeling: 4,
    });
    state.logs.push({
      id: 'b', date: '2026-10-12', dayType: 'escritorio-1', slot: 'noite', workout: 'superior-a', cycleWeek: 1,
      startedAt: 0, finishedAt: 2, sets: [{ exerciseId: 'supino-reto-barra', set: 1, kg: 60, reps: 8 }],
    });
    const r = buildReport(state, '2026-10-12');
    // seg sup A, ter tiros+pernas A, qua sup B, qui rodagem+pernas B, sab longo (flexível e descanso são opcionais)
    expect(r.planned).toBe(7);
    expect(r.done).toBe(2);
    expect(r.kmPlanned).toBeCloseTo(7.6 + 6 + 7);
    expect(r.chestSets).toBe(1);
    expect(r.records[0]).toContain('Supino reto');
    const txt = reportText(r);
    expect(txt).toContain('Sessões: 2/7');
    expect(txt).toContain('Próxima semana: 2 de 8');
  });

  it('antes do início do ciclo, a próxima semana é a 1', () => {
    const state: AppState = { ...defaultState(), settings: { ...defaultState().settings, cycleStart: '2026-10-19' } };
    expect(buildReport(state, '2026-10-05').next.cycleWeek).toBe(1);
  });
});
