import { describe, expect, it } from 'vitest';
import { STRENGTH } from '../src/data/plan';
import { demoModel, demoPatternFor, demoPatternForWorkout, EXERCISE_PATTERN } from '../src/ui/demo/patterns';

describe('ExerciseDemo: padrões de movimento', () => {
  const all = Object.values(STRENGTH).flatMap((w) => w.exercises);

  it('todo exercício de STRENGTH tem padrão mapeado', () => {
    for (const e of all) expect(demoPatternFor(e.id), e.id).toBeDefined();
  });

  it('não há mapeamento sobrando e ids desconhecidos não têm padrão', () => {
    const ids = new Set(all.map((e) => e.id));
    for (const id of Object.keys(EXERCISE_PATTERN)) expect(ids.has(id), id).toBe(true);
    expect(demoPatternFor('nao-existe')).toBeUndefined();
    expect(demoPatternFor('toString')).toBeUndefined();
  });

  it('corridas e mobilidade têm padrão', () => {
    for (const w of ['tiros', 'rodagem-leve', 'longo', 'mobilidade']) expect(demoPatternForWorkout(w), w).toBeDefined();
    expect(demoPatternForWorkout('superior-a')).toBeUndefined();
  });

  it('todo padrão resolve para um modelo finito', () => {
    for (const id of new Set([...Object.values(EXERCISE_PATTERN), 'run-fast', 'run-easy', 'run-long', 'stretch'] as const)) {
      const m = demoModel(id);
      expect(JSON.stringify(m)).not.toMatch(/NaN|null/);
      expect(m.nodes.length).toBeGreaterThan(0);
    }
  });
});
