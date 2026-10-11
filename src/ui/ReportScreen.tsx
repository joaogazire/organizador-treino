import { useState } from 'preact/hooks';
import { DAY_TYPES, workoutName } from '../data/plan';
import { WEEKDAY_SHORT, addDays, formatShort, mondayOf, todayISO } from '../engine/dates';
import { buildReport, reportText } from '../engine/report';
import { fmtNum } from '../engine/steps';
import { downloadFile, shareText } from '../lib/share';
import type { AppState } from '../store/types';
import { Card, Header, Icon } from './common';

export function ReportScreen(props: { state: AppState }) {
  const [monday, setMonday] = useState(mondayOf(todayISO()));
  const [toast, setToast] = useState('');
  const r = buildReport(props.state, monday);
  const text = reportText(r);
  const pct = r.planned ? Math.round((r.done / r.planned) * 100) : 0;

  const send = async () => {
    const res = await shareText('Relatório da semana', text);
    setToast(res === 'copied' ? 'Relatório copiado — cole onde quiser.' : res === 'shared' ? 'Enviado!' : '');
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <div class="screen">
      <Header
        title="Relatório"
        subtitle={`${formatShort(r.monday)} a ${formatShort(r.sunday)} · semana ${r.cycleWeek} de 8`}
        right={
          <div class="row">
            <button class="icon-btn" onClick={() => setMonday(addDays(monday, -7))} aria-label="Semana anterior"><Icon name="prev" size={18} /></button>
            <button class="icon-btn" onClick={() => setMonday(addDays(monday, 7))} aria-label="Próxima semana"><Icon name="next" size={18} /></button>
          </div>
        }
      />

      <div class="stats">
        <div class="stat"><strong>{r.done}/{r.planned}</strong><span>sessões ({pct}%)</span></div>
        <div class="stat"><strong>{fmtNum(r.kmDone)}</strong><span>de {fmtNum(r.kmPlanned)} km</span></div>
        <div class="stat"><strong>{r.strengthSets}</strong><span>séries ({r.chestSets} peito)</span></div>
        <div class="stat"><strong>{r.avgFeeling ? fmtNum(r.avgFeeling) : '—'}</strong><span>sensação /5</span></div>
      </div>

      <Card>
        <h3>Dia a dia</h3>
        <ul class="plan-list">
          {r.days.map((d) => (
            <li>
              <span class="plan-day">{WEEKDAY_SHORT[d.weekday]}</span>
              <span>
                <strong>{DAY_TYPES[d.dayType].name}</strong>
                <br />
                {d.sessions.map(({ plan, log }) => (
                  <span class={`chip ${log ? (log.skipped ? 'skipped' : 'done') : plan.optional ? 'opt' : 'miss'}`}>
                    {log ? (log.skipped ? '–' : log.partial ? '½' : '✓') : plan.optional ? '·' : '✕'} {workoutName(plan.workout)}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {r.records.length > 0 && (
        <Card>
          <h3>Recordes</h3>
          <ul class="rules">{r.records.map((x) => <li>{x}</li>)}</ul>
        </Card>
      )}

      {r.suggestions.length > 0 && (
        <Card>
          <h3>Progressão sugerida</h3>
          <ul class="rules">{r.suggestions.map((x) => <li>{x}</li>)}</ul>
        </Card>
      )}

      <Card>
        <h3>Próxima semana ({r.next.cycleWeek} de 8{r.next.prog.label ? `, ${r.next.prog.label}` : ''})</h3>
        <ul class="kv">
          <li><span>Tiros</span><strong>{r.next.prog.tiros ? `${r.next.prog.tiros.reps} × ${r.next.prog.tiros.meters} m a ${fmtNum(r.tiroSpeed)} km/h` : 'Teste 5 km'}</strong></li>
          <li><span>Rodagem / Longo</span><strong>{fmtNum(r.next.prog.rodagemKm)} / {fmtNum(r.next.prog.longoKm)} km</strong></li>
          <li><span>Musculação</span><strong>{r.next.prog.strength}</strong></li>
        </ul>
        {r.tiroSpeedChanged && <p class="muted small">Velocidade dos tiros ajustada pelo seu feedback.</p>}
        {r.next.runIncreases && <p class="warn">A corrida aumenta: não suba carga de perna.</p>}
      </Card>

      <div class="share-actions">
        <button class="btn primary big" onClick={send}>Enviar relatório</button>
        <button class="btn quiet" onClick={() => downloadFile(`relatorio-${r.monday}.md`, text, 'text/markdown')}>Baixar .md</button>
      </div>
      {toast && <div class="toast">{toast}</div>}

      <details class="card">
        <summary>Ver texto do relatório</summary>
        <pre class="report-text">{text}</pre>
      </details>
    </div>
  );
}
