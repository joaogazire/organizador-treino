import { describe, expect, it } from 'vitest';
import { assignWeek, type WeekLocations } from '../src/engine/schedule';

const C = 'casa' as const;
const E = 'escritorio' as const;
const week = (seg: any, ter: any, qua: any, qui: any, sex: any): WeekLocations => ({ seg, ter, qua, qui, sex });

describe('assignWeek', () => {
  it('reproduz o exemplo do documento', () => {
    expect(assignWeek(week(E, C, E, C, E))).toEqual({
      seg: 'escritorio-1', ter: 'casa-1', qua: 'escritorio-2', qui: 'casa-2', sex: 'flexivel', sab: 'longo', dom: 'descanso',
    });
  });

  it('casa-2 na sexta → sábado descanso e domingo longo', () => {
    expect(assignWeek(week(E, C, E, E, C))).toEqual({
      seg: 'escritorio-1', ter: 'casa-1', qua: 'escritorio-2', qui: 'flexivel', sex: 'casa-2', sab: 'descanso', dom: 'longo',
    });
  });

  it('casas consecutivas → casa-2-consecutivo e pernas B no sábado', () => {
    expect(assignWeek(week(E, C, C, E, E))).toEqual({
      seg: 'escritorio-2', ter: 'casa-1', qua: 'casa-2-consecutivo', qui: 'flexivel', sex: 'descanso', sab: 'sabado-com-pernas', dom: 'descanso',
    });
  });

  it('consecutivo quinta+sexta tem prioridade sobre a regra da sexta', () => {
    const s = assignWeek(week(E, E, E, C, C));
    expect(s.qui).toBe('casa-1');
    expect(s.sex).toBe('casa-2-consecutivo');
    expect(s.sab).toBe('sabado-com-pernas');
    expect(s.dom).toBe('descanso');
  });

  it('só 1 dia em casa', () => {
    expect(assignWeek(week(E, E, C, E, E))).toEqual({
      seg: 'escritorio-1', ter: 'escritorio-2', qua: 'casa-1', qui: 'flexivel', sex: 'descanso', sab: 'sabado-com-pernas', dom: 'descanso',
    });
  });

  it('0 dias em casa → domingo vira casa-1', () => {
    expect(assignWeek(week(E, E, E, E, E))).toEqual({
      seg: 'escritorio-1', ter: 'escritorio-2', qua: 'flexivel', qui: 'descanso', sex: 'descanso', sab: 'sabado-com-pernas', dom: 'casa-1',
    });
  });

  it('3+ dias em casa: extras entram na fila do escritório', () => {
    expect(assignWeek(week(C, E, C, E, C))).toEqual({
      seg: 'casa-1', ter: 'escritorio-1', qua: 'casa-2', qui: 'escritorio-2', sex: 'flexivel', sab: 'longo', dom: 'descanso',
    });
    expect(assignWeek(week(C, C, C, C, C))).toEqual({
      seg: 'casa-1', ter: 'casa-2-consecutivo', qua: 'escritorio-2', qui: 'flexivel', sex: 'descanso', sab: 'sabado-com-pernas', dom: 'descanso',
    });
  });

  it('perna nunca em dia de escritório', () => {
    const legs = new Set(['casa-1', 'casa-2', 'sabado-com-pernas']);
    const opts = [C, E];
    for (const a of opts) for (const b of opts) for (const c of opts) for (const d of opts) for (const e of opts) {
      const loc = week(a, b, c, d, e);
      const s = assignWeek(loc);
      for (const day of ['seg', 'ter', 'qua', 'qui', 'sex'] as const) {
        if (loc[day] === E) expect(legs.has(s[day])).toBe(false);
      }
    }
  });
});
