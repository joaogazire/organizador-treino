// Datas locais (sem fuso/UTC) no formato 'YYYY-MM-DD'. Semana = segunda a domingo.

export type WeekdayKey = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
export type WorkdayKey = 'seg' | 'ter' | 'qua' | 'qui' | 'sex';

export const WEEKDAYS: WeekdayKey[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
export const WORKDAYS: WorkdayKey[] = ['seg', 'ter', 'qua', 'qui', 'sex'];

export const WEEKDAY_SHORT: Record<WeekdayKey, string> = {
  seg: 'Seg', ter: 'Ter', qua: 'Qua', qui: 'Qui', sex: 'Sex', sab: 'Sáb', dom: 'Dom',
};
export const WEEKDAY_LONG: Record<WeekdayKey, string> = {
  seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo',
};

const pad = (n: number) => String(n).padStart(2, '0');

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(now = new Date()): string {
  return toISO(now);
}

export function addDays(iso: string, days: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** 0 = segunda … 6 = domingo */
export function weekdayIndex(iso: string): number {
  return (fromISO(iso).getDay() + 6) % 7;
}

export function weekdayKey(iso: string): WeekdayKey {
  return WEEKDAYS[weekdayIndex(iso)];
}

/** Segunda-feira da semana da data. */
export function mondayOf(iso: string): string {
  return addDays(iso, -weekdayIndex(iso));
}

export function weekDates(monday: string): string[] {
  return WEEKDAYS.map((_, i) => addDays(monday, i));
}

/** Diferença inteira em dias (b - a), imune a horário de verão. */
export function diffDays(a: string, b: string): number {
  const utc = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

export function formatShort(iso: string): string {
  const d = fromISO(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/** Datas corridas da segunda de `before` semanas antes ao domingo de `after` semanas depois da data. */
export function daysAround(iso: string, before: number, after: number): string[] {
  const start = addDays(mondayOf(iso), -7 * before);
  return Array.from({ length: 7 * (before + after + 1) }, (_, i) => addDays(start, i));
}
