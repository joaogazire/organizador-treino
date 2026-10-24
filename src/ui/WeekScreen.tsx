import { DAY_TYPES, GOLDEN_RULES, workoutName } from '../data/plan';
import { cycleWeek, progressionFor } from '../engine/cycle';
import { WEEKDAYS, WEEKDAY_SHORT, WORKDAYS, addDays, formatShort, mondayOf, todayISO, type WorkdayKey } from '../engine/dates';
import { assignWeek, countCasa } from '../engine/schedule';
import { fmtNum } from '../engine/steps';
import { locationsFor } from '../store/storage';
import type { AppState } from '../store/types';
import { useState } from 'preact/hooks';
import { setLocation } from './actions';
import { Header, Icon, Sheet } from './common';

export function WeekScreen(props: { state: AppState }) {
  const { state } = props;
  const [monday, setMonday] = useState(mondayOf(todayISO()));
  const locations = locationsFor(state, monday);
  const schedule = assignWeek(locations);
  const cw = cycleWeek(state.settings.cycleStart, monday);
  const p = progressionFor(cw);
  const casas = countCasa(locations);

  const [sheet, setSheet] = useState<'metas' | 'regras'>();

  return (
    <div class="screen">
      <Header
        title="Semana"
        subtitle={`${formatShort(monday)} a ${formatShort(addDays(monday, 6))} · semana ${cw} de 8${p.label ? ` (${p.label})` : ''}`}
        right={
          <div class="row">
            <button class="icon-btn" onClick={() => setMonday(addDays(monday, -7))} aria-label="Semana anterior"><Icon name="prev" size={18} /></button>
            <button class="icon-btn" onClick={() => setMonday(addDays(monday, 7))} aria-label="Próxima semana"><Icon name="next" size={18} /></button>
          </div>
        }
      />

      <ul class="week-list" key={monday}>
        {WEEKDAYS.map((d, i) => {
          const t = DAY_TYPES[schedule[d]];
          const work = (WORKDAYS as string[]).includes(d);
          const loc = work ? locations[d as WorkdayKey] : undefined;
          return (
            <li style={{ '--n': i }}>
              <span class="plan-day">{WEEKDAY_SHORT[d]}</span>
              <span class="week-what">
                <strong>{t.name}</strong>
                <span class="muted small">{t.sessions.map((x) => workoutName(x.workout) + (x.optional ? ' (opc.)' : '')).join(' + ')}</span>
              </span>
              {loc && (
                <button class={`loc-btn ${loc}`} onClick={() => setLocation(monday, d as WorkdayKey, loc === 'casa' ? 'escritorio' : 'casa')}>
                  {loc === 'casa' ? 'Casa' : 'Escrit.'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {casas !== 2 && <p class="warn small center">Fora do padrão ({casas} em casa): regras especiais aplicadas.</p>}

      <div class="row gap week-actions">
        <button class="btn grow" onClick={() => setSheet('metas')}>Metas</button>
        <button class="btn grow" onClick={() => setSheet('regras')}>Regras</button>
      </div>

      {sheet === 'metas' && (
        <Sheet title={`Metas da semana ${cw}`} onClose={() => setSheet(undefined)}>
          <ul class="kv">
            <li><span>Tiros</span><strong>{p.tiros ? `${p.tiros.reps} × ${p.tiros.meters} m` : 'Teste 5 km'}</strong></li>
            <li><span>Rodagem leve</span><strong>{fmtNum(p.rodagemKm)} km</strong></li>
            <li><span>Longo</span><strong>{fmtNum(p.longoKm)} km</strong></li>
            <li><span>Total aprox.</span><strong>{fmtNum(p.totalKm)} km</strong></li>
            <li><span>Musculação</span><strong>{p.strength}</strong></li>
          </ul>
        </Sheet>
      )}
      {sheet === 'regras' && (
        <Sheet title="Regras de ouro" onClose={() => setSheet(undefined)}>
          <ul class="rules">{GOLDEN_RULES.map((r) => <li>{r}</li>)}</ul>
        </Sheet>
      )}
    </div>
  );
}
