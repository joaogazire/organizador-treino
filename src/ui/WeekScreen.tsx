import { DAY_TYPES, GOLDEN_RULES, workoutName } from '../data/plan';
import { cycleWeek, progressionFor } from '../engine/cycle';
import { WEEKDAYS, WEEKDAY_LONG, WORKDAYS, addDays, formatShort, mondayOf, todayISO } from '../engine/dates';
import { assignWeek, countCasa } from '../engine/schedule';
import { fmtNum } from '../engine/steps';
import { locationsFor } from '../store/storage';
import type { AppState } from '../store/types';
import { useState } from 'preact/hooks';
import { setLocation } from './actions';
import { Card, Header, Icon, Segmented } from './common';

export function WeekScreen(props: { state: AppState }) {
  const { state } = props;
  const [monday, setMonday] = useState(mondayOf(todayISO()));
  const locations = locationsFor(state, monday);
  const schedule = assignWeek(locations);
  const cw = cycleWeek(state.settings.cycleStart, monday);
  const p = progressionFor(cw);
  const casas = countCasa(locations);

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

      <Card>
        <h3>Onde você vai estar?</h3>
        <p class="muted small">Padrão: 2 dias em casa e 3 no escritório. {casas !== 2 && <strong>Semana fora do padrão ({casas} em casa) — regras especiais aplicadas.</strong>}</p>
        <div class="loc-list">
          {WORKDAYS.map((d) => (
            <div class="loc-row">
              <span>{WEEKDAY_LONG[d]}</span>
              <Segmented
                small
                value={locations[d]}
                options={[{ value: 'casa', label: 'Casa' }, { value: 'escritorio', label: 'Escritório' }]}
                onChange={(v) => setLocation(monday, d, v)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3>Plano da semana</h3>
        <ul class="plan-list">
          {WEEKDAYS.map((d) => {
            const t = DAY_TYPES[schedule[d]];
            return (
              <li>
                <span class="plan-day">{WEEKDAY_LONG[d]}</span>
                <span>
                  <strong>{t.name}</strong>
                  <br />
                  <span class="muted small">{t.sessions.map((s) => workoutName(s.workout) + (s.optional ? ' (opc.)' : '')).join(' + ')}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <h3>Metas da semana {cw}</h3>
        <ul class="kv">
          <li><span>Tiros</span><strong>{p.tiros ? `${p.tiros.reps} × ${p.tiros.meters} m` : 'Teste 5 km'}</strong></li>
          <li><span>Rodagem leve</span><strong>{fmtNum(p.rodagemKm)} km</strong></li>
          <li><span>Longo</span><strong>{fmtNum(p.longoKm)} km</strong></li>
          <li><span>Total aprox.</span><strong>{fmtNum(p.totalKm)} km</strong></li>
          <li><span>Musculação</span><strong>{p.strength}</strong></li>
        </ul>
      </Card>

      <Card>
        <h3>Regras de ouro</h3>
        <ul class="rules">{GOLDEN_RULES.map((r) => <li>{r}</li>)}</ul>
      </Card>
    </div>
  );
}
