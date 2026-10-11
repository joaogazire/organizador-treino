import { useState } from 'preact/hooks';
import { DAY_TYPES } from '../data/plan';
import { cycleWeek, progressionFor } from '../engine/cycle';
import {
  WEEKDAYS, WEEKDAY_LONG, WEEKDAY_SHORT, WORKDAYS, addDays, formatShort, fromISO, mondayOf, todayISO, weekDates, weekdayKey,
  type WorkdayKey,
} from '../engine/dates';
import { findLog } from '../engine/report';
import { assignWeek } from '../engine/schedule';
import { fmtNum } from '../engine/steps';
import { locationsFor } from '../store/storage';
import type { AppState } from '../store/types';
import { setLocation } from './actions';
import { Segmented } from './common';
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
  const dates = weekDates(monday);
  const showReportBanner = weekdayKey(today) === 'dom' && mondayOf(today) === monday;

  const dayDone = (d: string) => {
    const t = DAY_TYPES[schedule[weekdayKey(d)]];
    const required = t.sessions.filter((s) => !s.optional);
    if (!required.length) return false;
    return required.every((s) => findLog(state.logs, d, s));
  };

  return (
    <div class="screen">
      <header class="today-header">
        <div>
          <p class="eyebrow">Semana {cw} de 8{prog.label ? ` · ${prog.label}` : ''}</p>
          <h1>{date === today ? 'Hoje' : WEEKDAY_LONG[wd]} <span class="muted">{formatShort(date)}</span></h1>
        </div>
        {date !== today && <button class="btn ghost small" onClick={() => setDate(today)}>Hoje</button>}
      </header>

      <nav class="day-strip" aria-label="Dias da semana">
        <button class="strip-arrow" onClick={() => setDate(addDays(date, -7))} aria-label="Semana anterior">‹</button>
        {dates.map((d, i) => {
          const k = WEEKDAYS[i];
          return (
            <button
              class={`day-chip${d === date ? ' on' : ''}${d === today ? ' today' : ''}${dayDone(d) ? ' done' : ''}`}
              onClick={() => setDate(d)}
            >
              <span class="day-chip-name">{WEEKDAY_SHORT[k]}</span>
              <span class="day-chip-num">{fromISO(d).getDate()}</span>
              <span class="day-chip-dot" />
            </button>
          );
        })}
        <button class="strip-arrow" onClick={() => setDate(addDays(date, 7))} aria-label="Próxima semana">›</button>
      </nav>

      {showReportBanner && (
        <button class="banner" onClick={props.onReport}>
          📊 Fim de semana! Veja e envie o relatório da semana →
        </button>
      )}

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
            options={[{ value: 'casa', label: '🏠 Casa' }, { value: 'escritorio', label: '🏢 Escritório' }]}
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

      <p class="muted small center">
        Meta da semana: {fmtNum(prog.totalKm)} km · Musculação: {prog.strength}
      </p>
    </div>
  );
}
