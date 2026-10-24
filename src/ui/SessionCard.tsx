import { DAY_TYPES, MOBILITY, RUN_INFO, SLOT_LABEL, STRENGTH, isRun, isStrength, type SessionPlan } from '../data/plan';
import { progressionFor } from '../engine/cycle';
import { buildSteps, estimateMinutes, exercisesFor, fmtNum, repsLabel, setsFor } from '../engine/steps';
import type { SessionLog, Settings } from '../store/types';
import { startSession, skipSession, deleteLog, type SessionRef } from './actions';
import { useState } from 'preact/hooks';
import { Icon, Sheet } from './common';

export function SessionCard(props: {
  ref_: SessionRef;
  plan: SessionPlan;
  cycleWeek: number;
  settings: Settings;
  log?: SessionLog;
  officeDay: boolean;
}) {
  const { plan, cycleWeek, settings, log, ref_ } = props;
  const [short, setShort] = useState(false);
  const [more, setMore] = useState(false);
  const opts = { cycleWeek, short, ...settings };
  const steps = buildSteps(plan.workout, opts);
  const minutes = estimateMinutes(steps);
  const prog = progressionFor(cycleWeek);

  let title = '';
  let subtitle = '';
  let lines: string[] = [];
  if (isStrength(plan.workout)) {
    const w = STRENGTH[plan.workout];
    title = w.name;
    subtitle = `${w.subtitle} · ${prog.strength}`;
    lines = exercisesFor(plan.workout, short).map((e) => `${setsFor(e, opts)} × ${repsLabel(e)} — ${e.name}`);
  } else if (isRun(plan.workout)) {
    title = RUN_INFO[plan.workout].name;
    subtitle = RUN_INFO[plan.workout].zone;
    if (plan.workout === 'tiros') {
      const t = prog.tiros;
      lines = [
        '10 min trote + 2 acelerações de 30 s',
        t ? `${t.reps} × ${t.meters} m a ${fmtNum(settings.tiroSpeed)} km/h (desc. ${t.restSec >= 120 ? `${t.restSec / 60} min` : `${t.restSec} s`} caminhando)` : 'Teste: 5 km no melhor ritmo',
        '10 min trote de desaquecimento',
      ];
    } else {
      const km = plan.workout === 'longo' ? prog.longoKm : prog.rodagemKm;
      lines = [`${fmtNum(km)} km a ${fmtNum(settings.easySpeed)} km/h`, RUN_INFO[plan.workout].note];
    }
  } else {
    title = MOBILITY.name;
    subtitle = MOBILITY.note;
  }

  const status = log ? (log.skipped ? 'skipped' : 'done') : 'todo';
  const canShort = props.officeDay && isStrength(plan.workout) && plan.workout !== 'peito-extra';

  const peek = lines.length > 1 ? `${lines.length} itens · ${lines[0].replace(/^.* — /, '')}${lines.length > 1 ? ' …' : ''}` : lines[0] ?? subtitle;
  const restLabel = DAY_TYPES[ref_.dayType].id === 'descanso' ? 'Pular' : 'Descansar hoje';

  return (
    <article class={`session ${status}`}>
      <div class="session-top">
        <span class="slot">{SLOT_LABEL[plan.slot]}{plan.optional ? ' · opcional' : ''}</span>
        <span class="muted">~{minutes} min{short ? ' · versão curta' : ''}</span>
      </div>
      <h3 class="session-title">{title}</h3>
      <button class="peek" onClick={() => setMore(true)}>
        <span>{isStrength(plan.workout) ? `${lines.length} exercícios · ${subtitle}` : peek}</span>
        <Icon name="next" size={14} />
      </button>
      {status === 'todo' ? (
        <div class="session-actions">
          <button class="btn primary big" onClick={() => startSession(ref_, { short })}>Começar</button>
          <button class="icon-btn lg" onClick={() => setMore(true)} aria-label="Mais opções"><Icon name="more" /></button>
        </div>
      ) : (
        log && (
          <div class="row between">
            <span class="badge"><Icon name={log.skipped ? 'minus' : 'check'} size={16} />{log.skipped ? 'Descansou' : log.partial ? 'Parcial' : 'Feito'}{log.runKm ? ` · ${fmtNum(log.runKm)} km` : ''}</span>
            <button class="btn link" onClick={() => setMore(true)}>Detalhes</button>
          </div>
        )
      )}
      {more && (
        <Sheet title={title} onClose={() => setMore(false)}>
          {(close) => (
            <>
              <p class="muted small">{subtitle}</p>
              {lines.length > 0 && <ul class="exercise-list">{lines.map((l) => <li>{l}</li>)}</ul>}
              {status === 'todo' && canShort && (
                <button class="menu-row switch-row" role="switch" aria-checked={short} onClick={() => setShort(!short)}>
                  <span>Dia pesado? Versão 25 min</span>
                  <span class={`switch${short ? ' on' : ''}`}><i /></span>
                </button>
              )}
              {status === 'todo' && (
                <>
                  <button class="btn quiet" onClick={() => { close(); startSession(ref_, { short, manual: true }); }}>Já fiz, registrar</button>
                  {plan.optional && <button class="btn quiet" onClick={() => { close(); skipSession(ref_); }}>{restLabel}</button>}
                </>
              )}
              {log && <button class="btn danger" onClick={() => confirm('Desfazer este registro?') && (close(), deleteLog(log.id))}>Desfazer registro</button>}
            </>
          )}
        </Sheet>
      )}
    </article>
  );
}
