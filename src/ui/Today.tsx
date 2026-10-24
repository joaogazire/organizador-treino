import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { DAY_TYPES } from '../data/plan';
import { cycleWeek, progressionFor } from '../engine/cycle';
import {
  WEEKDAY_LONG, WEEKDAY_SHORT, WORKDAYS, addDays, daysAround, formatShort, fromISO, mondayOf, todayISO, weekdayKey,
  type WorkdayKey,
} from '../engine/dates';
import { findLog } from '../engine/report';
import { assignWeek } from '../engine/schedule';
import { fmtNum } from '../engine/steps';
import { locationsFor } from '../store/storage';
import type { AppState } from '../store/types';
import { setLocation } from './actions';
import { Icon, Segmented } from './common';
import { SessionCard } from './SessionCard';

export function Today(props: { state: AppState; onReport: () => void }) {
  const { state } = props;
  const today = todayISO();
  const [date, setDate] = useState(today);
  const monday = mondayOf(date);
  const locations = locationsFor(state, monday);
  const schedule = assignWeek(locations);
  const cw = cycleWeek(state.settings.cycleStart, date);
  const prog = progressionFor(cw);
  const wd = weekdayKey(date);
  const dayType = DAY_TYPES[schedule[wd]];
  const isWorkday = (WORKDAYS as string[]).includes(wd);
  const loc = isWorkday ? locations[wd as WorkdayKey] : undefined;
  const days = useMemo(() => daysAround(today, 8, 8), [today]);
  const [dir, setDir] = useState<'l' | 'r'>('r');
  const strip = useRef<HTMLElement | null>(null);
  const first = useRef(true);
  const showReportBanner = weekdayKey(today) === 'dom' && mondayOf(today) === monday;

  const weeks = new Map<string, ReturnType<typeof assignWeek>>();
  const dayDone = (d: string) => {
    const m = mondayOf(d);
    if (!weeks.has(m)) weeks.set(m, assignWeek(locationsFor(state, m)));
    const t = DAY_TYPES[weeks.get(m)![weekdayKey(d)]];
    const required = t.sessions.filter((s) => !s.optional);
    if (!required.length) return false;
    return required.every((s) => findLog(state.logs, d, s));
  };

  const pick = (d: string) => {
    if (d === date) return;
    setDir(d > date ? 'r' : 'l');
    setDate(d);
  };

  // A barra de dias acompanha a seleção (sem animação na primeira vez).
  useEffect(() => {
    strip.current?.querySelector('.day-chip.on')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: first.current ? 'auto' : 'smooth' });
    first.current = false;
  }, [date]);

  // Arrastar o corpo do dia para os lados troca de dia.
  const touch = useRef<{ x: number; y: number } | undefined>(undefined);
  const onTouchEnd = (e: TouchEvent) => {
    const t = touch.current;
    touch.current = undefined;
    if (!t) return;
    const dx = e.changedTouches[0].clientX - t.x;
    const dy = e.changedTouches[0].clientY - t.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const next = addDays(date, dx < 0 ? 1 : -1);
    if (days.includes(next)) pick(next);
  };

  return (
    <div class="screen">
      <header class="today-header">
        <div>
          <p class="eyebrow">Semana {cw} de 8{prog.label ? ` · ${prog.label}` : ''}</p>
          <h1>{date === today ? 'Hoje' : WEEKDAY_LONG[wd]} <span class="muted">{formatShort(date)}</span></h1>
        </div>
        {date !== today && <button class="btn quiet small" onClick={() => setDate(today)}>Hoje</button>}
      </header>

      <nav class="day-strip" aria-label="Dias" ref={strip}>
        {days.map((d) => {
          const k = weekdayKey(d);
          return (
            <button
              class={`day-chip${d === date ? ' on' : ''}${d === today ? ' today' : ''}${dayDone(d) ? ' done' : ''}${k === 'seg' ? ' mon' : ''}`}
              onClick={() => pick(d)}
            >
              <span class="day-chip-name">{WEEKDAY_SHORT[k]}</span>
              <span class="day-chip-num">{fromISO(d).getDate()}</span>
              <span class="day-chip-dot" />
            </button>
          );
        })}
      </nav>

      {showReportBanner && (
        <button class="banner" onClick={props.onReport}>
          <span>Fim de semana. Veja e envie o relatório da semana</span>
          <Icon name="next" size={18} />
        </button>
      )}

      <div class={`day-body from-${dir}`} key={date}
        onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={onTouchEnd}>
      <div class="day-type">
        <div>
          <p class="eyebrow">Treino do dia</p>
          <h2>{dayType.name}</h2>
          {dayType.note && <p class="muted small">{dayType.note}</p>}
        </div>
        {loc && (
          <Segmented
            small
            value={loc}
            options={[{ value: 'casa', label: 'Casa' }, { value: 'escritorio', label: 'Escritório' }]}
            onChange={(v) => setLocation(date, wd as WorkdayKey, v)}
          />
        )}
      </div>

      {dayType.sessions.map((plan) => (
        <SessionCard
          key={`${date}-${plan.slot}-${plan.workout}`}
          ref_={{ date, dayType: dayType.id, slot: plan.slot, workout: plan.workout }}
          plan={plan}
          cycleWeek={cw}
          settings={state.settings}
          log={findLog(state.logs, date, plan)}
          officeDay={loc === 'escritorio'}
        />
      ))}
      </div>

      <p class="muted small center today-foot">
        Meta da semana: {fmtNum(prog.totalKm)} km · Musculação: {prog.strength}
      </p>
    </div>
  );
}
