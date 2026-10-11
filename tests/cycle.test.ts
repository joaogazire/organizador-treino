import { describe, expect, it } from 'vitest';
import { cycleWeek } from '../src/engine/cycle';
import { addDays, diffDays, mondayOf, weekdayKey } from '../src/engine/dates';

describe('datas', () => {
  it('segunda-feira da semana', () => {
    expect(mondayOf('2026-10-11')).toBe('2026-10-05'); // domingo
    expect(mondayOf('2026-10-12')).toBe('2026-10-12');
    expect(weekdayKey('2026-10-11')).toBe('dom');
  });
});

describe('cycleWeek', () => {
  const start = '2026-10-12';
  it('semanas 1 a 8', () => {
    for (let w = 0; w < 8; w++) expect(cycleWeek(start, addDays(start, w * 7 + 3))).toBe(w + 1);
  });
  it('depois da 8 recomeça pela 3', () => {
    expect(cycleWeek(start, addDays(start, 8 * 7))).toBe(3);
    expect(cycleWeek(start, addDays(start, 13 * 7))).toBe(8);
    expect(cycleWeek(start, addDays(start, 14 * 7))).toBe(3);
  });
  it('antes do início é semana 1', () => {
    expect(cycleWeek(start, '2026-10-01')).toBe(1);
  });
  it('início no meio da semana conta a semana inteira', () => {
    expect(cycleWeek('2026-10-15', '2026-10-12')).toBe(1);
    expect(cycleWeek('2026-10-15', '2026-10-19')).toBe(2);
  });
});

describe('diffDays', () => {
  it('atravessa meses com tamanhos diferentes', () => {
    expect(diffDays('2026-10-12', '2026-11-02')).toBe(21);
    expect(diffDays('2026-02-23', '2026-03-02')).toBe(7);
  });
});
