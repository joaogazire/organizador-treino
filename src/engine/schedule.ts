import type { DayTypeId } from '../data/plan';
import { WORKDAYS, type WeekdayKey, type WorkdayKey } from './dates';

export type Location = 'casa' | 'escritorio';
export type WeekLocations = Record<WorkdayKey, Location>;
export type WeekSchedule = Record<WeekdayKey, DayTypeId>;

/** Padrão do exemplo do método: 2 em casa (ter, qui), 3 no escritório. */
export const DEFAULT_LOCATIONS: WeekLocations = {
  seg: 'escritorio',
  ter: 'casa',
  qua: 'escritorio',
  qui: 'casa',
  sex: 'escritorio',
};

/**
 * Regras de atribuição (docs/treino-hibrido.md, seção 1), aplicadas em ordem.
 */
export function assignWeek(loc: WeekLocations): WeekSchedule {
  const out = {} as WeekSchedule;
  const casaIdx = WORKDAYS.map((d, i) => (loc[d] === 'casa' ? i : -1)).filter((i) => i >= 0);

  let queue: DayTypeId[];
  /** Índices dos dias úteis que recebem a fila (escritório + casas extras). */
  let queueDays: number[];

  if (casaIdx.length === 0) {
    queue = ['escritorio-1', 'escritorio-2', 'flexivel', 'descanso', 'descanso'];
    queueDays = [0, 1, 2, 3, 4];
    out.sab = 'sabado-com-pernas';
    out.dom = 'casa-1';
  } else if (casaIdx.length === 1) {
    out[WORKDAYS[casaIdx[0]]] = 'casa-1';
    queue = ['escritorio-1', 'escritorio-2', 'flexivel', 'descanso'];
    queueDays = [0, 1, 2, 3, 4].filter((i) => i !== casaIdx[0]);
    out.sab = 'sabado-com-pernas';
    out.dom = 'descanso';
  } else {
    const [first, second] = casaIdx;
    out[WORKDAYS[first]] = 'casa-1';
    queueDays = [0, 1, 2, 3, 4].filter((i) => i !== first && i !== second);
    if (second === first + 1) {
      out[WORKDAYS[second]] = 'casa-2-consecutivo';
      queue = ['escritorio-2', 'flexivel', 'descanso'];
      out.sab = 'sabado-com-pernas';
      out.dom = 'descanso';
    } else {
      out[WORKDAYS[second]] = 'casa-2';
      queue = ['escritorio-1', 'escritorio-2', 'flexivel'];
      if (WORKDAYS[second] === 'sex') {
        out.sab = 'descanso';
        out.dom = 'longo';
      } else {
        out.sab = 'longo';
        out.dom = 'descanso';
      }
    }
  }

  queueDays.forEach((dayIdx, i) => {
    out[WORKDAYS[dayIdx]] = queue[i] ?? 'descanso';
  });
  return out;
}

export function countCasa(loc: WeekLocations): number {
  return WORKDAYS.filter((d) => loc[d] === 'casa').length;
}
