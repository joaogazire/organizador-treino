import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { STRENGTH, isRun, isStrength, workoutName } from '../data/plan';
import { holdLegsInWeek, progressionFor } from '../engine/cycle';
import { loadHint } from '../engine/progression';
import { buildSteps, fmtNum, plannedKm, type Step } from '../engine/steps';
import { beep, vibrate } from '../lib/feedback';
import { formatClock } from '../lib/share';
import { keepAwake, releaseAwake } from '../lib/wakelock';
import type { ActiveSession, AppState, SessionLog, SetLog } from '../store/types';
import { discardActive, saveSession, updateActive } from './actions';
import { FEELINGS, Segmented, Stepper } from './common';

const exerciseById = new Map(Object.values(STRENGTH).flatMap((w) => w.exercises.map((e) => [e.id, e] as const)));

function useNow(ms = 250) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    const onVis = () => setNow(Date.now());
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [ms]);
  return now;
}

function upsertSet(sets: SetLog[], exerciseId: string, set: number, patch: Partial<SetLog>): SetLog[] {
  const i = sets.findIndex((s) => s.exerciseId === exerciseId && s.set === set);
  if (i < 0) return [...sets, { exerciseId, set, ...patch }];
  const next = [...sets];
  next[i] = { ...next[i], ...patch };
  return next;
}

export function Player(props: { state: AppState }) {
  const { state } = props;
  const a = state.active!;
  const steps = useMemo(
    () =>
      buildSteps(a.workout, {
        cycleWeek: a.cycleWeek,
        short: a.short,
        tiroSpeed: a.tiroSpeed,
        easySpeed: a.easySpeed,
        restCompoundSec: state.settings.restCompoundSec,
        restIsolationSec: state.settings.restIsolationSec,
      }),
    [a.workout, a.cycleWeek, a.short, a.tiroSpeed, a.easySpeed, state.settings.restCompoundSec, state.settings.restIsolationSec],
  );

  useEffect(() => {
    keepAwake();
    return releaseAwake;
  }, []);

  if (a.finished || a.stepIndex >= steps.length) return <Finish state={state} active={a} steps={steps} />;
  return <StepView state={state} active={a} steps={steps} />;
}

function StepView(props: { state: AppState; active: ActiveSession; steps: Step[] }) {
  const { state, active: a, steps } = props;
  const now = useNow();
  const [menu, setMenu] = useState(false);
  const step = steps[a.stepIndex];
  const paused = a.pausedElapsed !== undefined;
  const elapsed = paused ? a.pausedElapsed! : (now - a.stepStartedAt) / 1000;
  const duration = step.durationSec !== undefined ? step.durationSec + a.extraSec : undefined;
  const remaining = duration !== undefined ? duration - elapsed : undefined;
  const lastBeep = useRef<number>(-1);
  const advancing = useRef(false);

  const goTo = (index: number) => {
    advancing.current = false;
    lastBeep.current = -1;
    updateActive((x) => ({
      ...x,
      stepIndex: Math.max(0, index),
      stepStartedAt: Date.now(),
      extraSec: 0,
      pausedElapsed: undefined,
      finished: index >= steps.length,
    }));
  };

  const next = () => {
    const s = steps[a.stepIndex];
    if (s.kind === 'set' && s.loggable && s.exerciseId) {
      const exists = a.sets.some((x) => x.exerciseId === s.exerciseId && x.set === s.set);
      if (!exists) updateActive((x) => ({ ...x, sets: upsertSet(x.sets, s.exerciseId!, s.set!, { kg: defaultKg(s), reps: s.repsDefault }) }));
    }
    if (s.kind === 'open') updateActive((x) => ({ ...x, testSec: Math.round(elapsed) }));
    goTo(a.stepIndex + 1);
  };

  // Bipes nos 3 s finais e avanço automático ao zerar.
  useEffect(() => {
    if (remaining === undefined || paused) return;
    const sec = Math.ceil(remaining);
    if (remaining > 0 && sec <= 3 && sec !== lastBeep.current) {
      lastBeep.current = sec;
      if (state.settings.sound) beep(660, 120);
      if (state.settings.vibrate) vibrate(80);
    }
    if (remaining <= 0 && !advancing.current) {
      advancing.current = true;
      if (state.settings.sound) beep(990, 400);
      if (state.settings.vibrate) vibrate([200, 100, 200]);
      next();
    }
  });

  const togglePause = () =>
    updateActive((x) =>
      x.pausedElapsed !== undefined
        ? { ...x, stepStartedAt: Date.now() - x.pausedElapsed * 1000, pausedElapsed: undefined }
        : { ...x, pausedElapsed: (Date.now() - x.stepStartedAt) / 1000 },
    );

  const hintCtx = { deload: progressionFor(a.cycleWeek).halfSets, holdLegs: holdLegsInWeek(state.settings.cycleStart, a.date) };
  const exercise = step.exerciseId ? exerciseById.get(step.exerciseId) : undefined;
  const hint = step.kind === 'set' && exercise ? loadHint(exercise, state.logs, hintCtx) : null;

  /** Carga padrão: valor já digitado na série anterior desta sessão > sugestão > última carga. */
  function defaultKg(s: Step): number | undefined {
    if (!s.exerciseId || s.bodyweight) return undefined;
    const prevInSession = a.sets.filter((x) => x.exerciseId === s.exerciseId && x.kg !== undefined).sort((x, y) => y.set - x.set)[0];
    if (prevInSession) return prevInSession.kg;
    const ex = exerciseById.get(s.exerciseId);
    const h = ex ? loadHint(ex, state.logs, hintCtx) : null;
    return h?.suggestKg ?? h?.lastKg;
  }

  const currentSet = step.exerciseId && step.set ? a.sets.find((x) => x.exerciseId === step.exerciseId && x.set === step.set) : undefined;
  const progress = (a.stepIndex + (duration ? Math.min(1, elapsed / duration) : 0)) / steps.length;
  const tone = step.tone ?? 'work';
  const nextWork = steps.slice(a.stepIndex + 1).find((s) => s.kind !== 'rest');

  return (
    <div class={`player tone-${tone}`}>
      <div class="player-progress"><div style={{ width: `${progress * 100}%` }} /></div>
      <header class="player-top">
        <button class="icon-btn" onClick={() => setMenu(true)} aria-label="Sair">✕</button>
        <div class="player-meta">
          <span>{workoutName(a.workout)}</span>
          <span class="muted">{[step.group, step.setLabel].filter(Boolean).join(' · ')}</span>
        </div>
        <button class="icon-btn" onClick={togglePause} aria-label={paused ? 'Continuar' : 'Pausar'}>{paused ? '▶' : '❚❚'}</button>
      </header>

      <main class="player-main">
        {step.kind === 'rest' ? (
          <>
            <p class="player-kicker">Descanso</p>
            <div class="player-clock">{formatClock(Math.max(0, remaining ?? 0))}</div>
            <div class="row gap center">
              <button class="btn ghost" onClick={() => updateActive((x) => ({ ...x, extraSec: x.extraSec - 15 }))}>−15 s</button>
              <button class="btn ghost" onClick={() => updateActive((x) => ({ ...x, extraSec: x.extraSec + 15 }))}>+15 s</button>
            </div>
            {currentSet && step.exerciseId && (
              <div class="log-box">
                <p class="muted small">Registre a série que acabou</p>
                <div class="row gap">
                  {!exerciseById.get(step.exerciseId)?.bodyweight && (
                    <Stepper label="Carga" unit="kg" step={1} value={currentSet.kg}
                      onChange={(kg) => updateActive((x) => ({ ...x, sets: upsertSet(x.sets, step.exerciseId!, step.set!, { kg }) }))} />
                  )}
                  <Stepper label="Reps" step={1} value={currentSet.reps}
                    onChange={(reps) => updateActive((x) => ({ ...x, sets: upsertSet(x.sets, step.exerciseId!, step.set!, { reps }) }))} />
                </div>
              </div>
            )}
            {step.next && <p class="player-next">A seguir: <strong>{step.next}</strong></p>}
          </>
        ) : (
          <>
            <h1 class="player-title">{step.title}</h1>
            {step.target && <p class="player-target">{step.target}</p>}
            {step.detail && <p class="player-detail">{step.detail}</p>}
            {step.tip && <p class="player-tip">💡 {step.tip}</p>}
            {remaining !== undefined ? (
              <div class="player-clock">{formatClock(Math.max(0, remaining))}</div>
            ) : (
              <div class="player-clock small">{formatClock(elapsed)}</div>
            )}
            {step.kind === 'set' && step.loggable && !step.bodyweight && (
              <div class="log-box">
                {hint && <p class="hint">{hint.message}</p>}
                <Stepper label="Carga desta série" unit="kg" step={1}
                  value={currentSet?.kg ?? defaultKg(step)}
                  onChange={(kg) => updateActive((x) => ({ ...x, sets: upsertSet(x.sets, step.exerciseId!, step.set!, { kg, reps: currentSet?.reps ?? step.repsDefault }) }))} />
              </div>
            )}
            {step.kind === 'timed' && step.next && <p class="player-next">Depois: <strong>{step.next}</strong></p>}
            {step.kind === 'timed' && !step.next && nextWork && <p class="player-next">Depois: <strong>{nextWork.title}</strong></p>}
          </>
        )}
      </main>

      <footer class="player-actions">
        <button class="btn ghost" disabled={a.stepIndex === 0} onClick={() => goTo(a.stepIndex - 1)}>‹ Voltar</button>
        <button class="btn primary big grow" onClick={next}>
          {step.kind === 'set' && remaining === undefined ? 'Feito ✓' : step.kind === 'open' ? 'Terminei ✓' : 'Pular ›'}
        </button>
      </footer>

      {paused && <div class="paused-badge">Pausado</div>}

      {menu && (
        <div class="sheet-backdrop" onClick={() => setMenu(false)}>
          <div class="sheet" onClick={(e) => e.stopPropagation()}>
            <h3>Sair do treino?</h3>
            <button class="btn primary big" onClick={() => setMenu(false)}>Continuar treinando</button>
            <button class="btn ghost big" onClick={() => updateActive((x) => ({ ...x, finished: true }))}>Encerrar e salvar o que fiz</button>
            <button class="btn danger big" onClick={() => confirm('Descartar este treino?') && discardActive()}>Descartar treino</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Finish(props: { state: AppState; active: ActiveSession; steps: Step[] }) {
  const { active: a, steps } = props;
  const run = isRun(a.workout);
  const manual = !!a.manual;
  const partial = !manual && a.stepIndex < steps.length;
  const [feeling, setFeeling] = useState<SessionLog['feeling']>();
  const [notes, setNotes] = useState('');
  const [km, setKm] = useState<number | undefined>(run ? plannedKm(a.workout, a.cycleWeek) : undefined);
  const [tiroFeedback, setTiroFeedback] = useState<SessionLog['tiroFeedback']>('ok');
  const [testMin, setTestMin] = useState<number | undefined>(a.testSec ? Math.round(a.testSec / 6) / 10 : undefined);
  const isTest = a.workout === 'tiros' && !progressionFor(a.cycleWeek).tiros;
  const strengthSets = a.sets.length;

  // Última série da sessão não tem descanso depois: deixa ajustar reps aqui.
  const lastStep = [...steps].reverse().find((s) => s.kind === 'set' && s.loggable);
  const lastLogged = lastStep && a.sets.find((s) => s.exerciseId === lastStep.exerciseId && s.set === lastStep.set);

  const save = () => {
    const finishedAt = Date.now();
    saveSession({
      date: a.date,
      dayType: a.dayType,
      slot: a.slot,
      workout: a.workout,
      cycleWeek: a.cycleWeek,
      startedAt: a.startedAt,
      finishedAt,
      partial: partial || undefined,
      short: a.short || undefined,
      sets: a.sets,
      runKm: run ? km : undefined,
      runSec: run && !manual ? Math.round((finishedAt - a.startedAt) / 1000) : undefined,
      testSec: isTest && testMin ? Math.round(testMin * 60) : undefined,
      feeling,
      notes: notes.trim() || undefined,
      tiroFeedback: a.workout === 'tiros' && !isTest ? tiroFeedback : undefined,
    });
  };

  const totalMin = Math.round((Date.now() - a.startedAt) / 60000);

  return (
    <div class="player tone-done finish">
      <main class="player-main scroll">
        <p class="player-kicker">{manual ? 'Registrar treino' : partial ? 'Treino encerrado' : 'Treino concluído! 🎉'}</p>
        <h1 class="player-title">{workoutName(a.workout)}</h1>
        {!manual && (
          <p class="player-detail">
            {totalMin} min{isStrength(a.workout) ? ` · ${strengthSets} séries registradas` : ''}
          </p>
        )}

        {lastStep && lastLogged && !manual && (
          <div class="log-box">
            <p class="muted small">Última série — {lastStep.title}</p>
            <Stepper label="Reps" step={1} value={lastLogged.reps}
              onChange={(reps) => updateActive((x) => ({ ...x, sets: upsertSet(x.sets, lastStep.exerciseId!, lastStep.set!, { reps }) }))} />
          </div>
        )}

        {run && (
          <div class="log-box">
            <Stepper label="Distância total" unit="km" step={0.5} value={km} onChange={setKm} />
          </div>
        )}

        {isTest && (
          <div class="log-box">
            <Stepper label="Tempo do teste de 5 km" unit="min" step={0.5} value={testMin} onChange={setTestMin} />
            <p class="muted small">Ao salvar, as velocidades de tiros e rodagem são recalibradas por este tempo para o próximo ciclo.</p>
          </div>
        )}

        {a.workout === 'tiros' && !isTest && (
          <div class="log-box">
            <p class="muted small">Como foi o último tiro? (ajusta a velocidade a {fmtNum(a.tiroSpeed)} km/h)</p>
            <Segmented
              value={tiroFeedback ?? 'ok'}
              options={[
                { value: 'facil', label: 'Fácil +0,5' },
                { value: 'ok', label: 'Ok' },
                { value: 'nao-terminei', label: 'Não terminei −0,5' },
              ]}
              onChange={setTiroFeedback}
            />
          </div>
        )}

        <div class="log-box">
          <p class="muted small">Sensação</p>
          <div class="feelings">
            {FEELINGS.map((f) => (
              <button class={feeling === f.v ? 'on' : ''} onClick={() => setFeeling(f.v)} aria-label={f.l}>
                <span>{f.e}</span>
                <small>{f.l}</small>
              </button>
            ))}
          </div>
        </div>

        <textarea class="notes" placeholder="Observações (dor, energia, carga…)" value={notes}
          onInput={(e) => setNotes((e.target as HTMLTextAreaElement).value)} />
      </main>
      <footer class="player-actions">
        {!manual && a.stepIndex < steps.length && (
          <button class="btn ghost" onClick={() => updateActive((x) => ({ ...x, finished: false }))}>‹ Voltar</button>
        )}
        {manual && <button class="btn ghost" onClick={discardActive}>Cancelar</button>}
        <button class="btn primary big grow" onClick={save}>Salvar</button>
      </footer>
    </div>
  );
}
