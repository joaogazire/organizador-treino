import { useEffect, useRef, useState } from 'preact/hooks';
import { workoutName } from '../data/plan';
import { buildSetLogs, checklistFor, hasLoad, loadFor, nextOpenSet, restSecFor, type ChecklistItem } from '../engine/checklist';
import { repsLabel } from '../engine/steps';
import { fmtKg } from '../engine/progression';
import { beep, vibrate } from '../lib/feedback';
import { formatClock } from '../lib/share';
import { keepAwake, releaseAwake } from '../lib/wakelock';
import type { AppState } from '../store/types';
import { discardActive, saveSession, updateActive } from './actions';
import { Icon, Stepper } from './common';
import { ExerciseMedia } from './demo/ExerciseMedia';

function useNow(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** Treino de musculação numa tela só: o que fazer, a carga da última vez e um certinho por série. */
export function Checklist(props: { state: AppState }) {
  const { state } = props;
  const a = state.active!;
  const items = checklistFor(a.workout, a);
  const now = useNow(500);
  const [open, setOpen] = useState<ChecklistItem>();
  const [leaving, setLeaving] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    keepAwake();
    return releaseAwake;
  }, []);

  const isDone = (id: string, set: number) => a.sets.some((s) => s.exerciseId === id && s.set === set);
  const total = items.reduce((n, i) => n + i.sets, 0);
  const done = a.sets.length;

  const cur = nextOpenSet(items, a.sets)?.exerciseId;
  const allDone = total > 0 && done >= total;
  const curRow = useRef<HTMLElement | null>(null);

  // O exercício da vez sobe sozinho para o centro da lista.
  useEffect(() => {
    curRow.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [cur]);

  const toggle = (item: ChecklistItem, set: number) => {
    const id = item.exercise.id;
    const wasDone = isDone(id, set);
    updateActive((x) => ({
      ...x,
      sets: wasDone ? x.sets.filter((s) => !(s.exerciseId === id && s.set === set)) : [...x.sets, { exerciseId: id, set }],
      restUntil: wasDone || done + 1 >= total ? undefined : Date.now() + restSecFor(item.exercise, state.settings) * 1000,
    }));
  };

  // Descanso: avisa ao zerar e some sozinho.
  const restLeft = a.restUntil !== undefined ? (a.restUntil - now) / 1000 : undefined;
  useEffect(() => {
    if (restLeft === undefined || restLeft > 0) return;
    if (state.settings.sound) beep(990, 400);
    if (state.settings.vibrate) vibrate([200, 100, 200]);
    updateActive((x) => ({ ...x, restUntil: undefined }));
  }, [restLeft !== undefined && restLeft <= 0]);

  // Tudo marcado: salva sozinho em 4 s, com chance de desfazer.
  useEffect(() => {
    if (!allDone) return;
    const id = setTimeout(finish, 4000);
    return () => clearTimeout(id);
  }, [allDone]);

  // Aviso tátil 3 s antes do descanso acabar, para não precisar olhar a tela.
  const warn = restLeft !== undefined && restLeft > 0 && restLeft <= 3;
  useEffect(() => {
    if (warn && state.settings.vibrate) vibrate(60);
  }, [warn]);

  const undoLast = () => updateActive((x) => ({ ...x, sets: x.sets.slice(0, -1), restUntil: undefined }));

  const finish = () => {
    if (!done) {
      if (confirm('Nenhuma série marcada. Descartar este treino?')) discardActive();
      return;
    }
    saveSession({
      date: a.date,
      dayType: a.dayType,
      slot: a.slot,
      workout: a.workout,
      cycleWeek: a.cycleWeek,
      startedAt: a.startedAt,
      finishedAt: Date.now(),
      partial: done < total || undefined,
      short: a.short || undefined,
      sets: buildSetLogs(a.sets, a.loads, state.logs),
    });
  };

  const close = (setter: (v: boolean) => void, after?: () => void) => {
    setLeaving(true);
    setTimeout(() => { setter(false); after?.(); setLeaving(false); }, 180);
  };

  return (
    <div class="player checklist">
      <header class="player-top">
        <button class="icon-btn" onClick={() => setMenu(true)} aria-label="Sair"><Icon name="close" /></button>
        <div class="player-meta">
          <span>{workoutName(a.workout)}</span>
          <span class="muted">{formatClock((now - a.startedAt) / 1000)} · {done}/{total}</span>
        </div>
        <span class="icon-btn" aria-hidden="true" />
      </header>

      <main class="cl-list">
        {items.map((item) => {
          const e = item.exercise;
          const kg = hasLoad(e) ? loadFor(a.loads, state.logs, e.id) : undefined;
          const marks = Array.from({ length: item.sets }, (_, i) => isDone(e.id, i + 1));
          const all = marks.every(Boolean);
          return (
            <section class={`cl-item${all ? ' all' : ''}${cur === e.id ? ' cur' : ''}`} key={e.id} ref={cur === e.id ? curRow : undefined}>
              <div class="cl-info">
                <button class="cl-name" onClick={() => (all ? setOpen(item) : toggle(item, marks.indexOf(false) + 1))} aria-label={`Marcar próxima série de ${e.name}`}>{e.name}</button>
                <button class="cl-meta" onClick={() => setOpen(item)} aria-label={`Detalhes de ${e.name}`}>
                  {item.sets} × {repsLabel(e)}
                  {hasLoad(e) && <> · <b class={kg === undefined ? 'cl-noload' : ''}>{kg === undefined ? 'carga?' : fmtKg(kg)}</b></>}
                </button>
              </div>
              <div class="cl-sets">
                {marks.map((on, i) => (
                  <button class={`cl-set${on ? ' on' : ''}`} aria-pressed={on} aria-label={`Série ${i + 1}`} onClick={() => toggle(item, i + 1)}>
                    <Icon name="check" size={20} />
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {restLeft !== undefined && restLeft > 0 && (
        <button class="cl-rest" onClick={() => updateActive((x) => ({ ...x, restUntil: undefined }))} aria-label="Dispensar descanso">
          <span>Descanso</span><b role="timer">{formatClock(Math.ceil(restLeft))}</b><Icon name="close" size={16} />
        </button>
      )}

      <footer class="player-actions">
        {allDone ? (
          <>
            <button class="btn primary big grow saving" onClick={finish}>Salvando…</button>
            <button class="icon-btn lg" onClick={undoLast} aria-label="Desfazer última série"><Icon name="back" /></button>
          </>
        ) : (
          <button class="btn big grow" onClick={finish}>Finalizar treino</button>
        )}
      </footer>

      {open && (
        <div class={`sheet-backdrop${leaving ? ' leaving' : ''}`} onClick={() => close(() => setOpen(undefined))}>
          <div class="sheet cl-sheet" role="dialog" aria-label={open.exercise.name} onClick={(ev) => ev.stopPropagation()}>
            <ExerciseMedia exercise={open.exercise} />
            <h3 class="sheet-title">{open.exercise.name}</h3>
            <p class="muted small">{open.sets} × {repsLabel(open.exercise)} · {open.exercise.equipment}</p>
            {open.exercise.tip && <p class="small">{open.exercise.tip}</p>}
            {hasLoad(open.exercise) && (
              <div class="log-box">
                <Stepper label="Carga" unit="kg" step={1}
                  value={loadFor(a.loads, state.logs, open.exercise.id)}
                  onChange={(kg) => updateActive((x) => ({ ...x, loads: { ...x.loads, [open.exercise.id]: kg } }))} />
              </div>
            )}
            <button class="btn quiet big" onClick={() => close(() => setOpen(undefined))}>Fechar</button>
          </div>
        </div>
      )}

      {menu && (
        <div class={`sheet-backdrop${leaving ? ' leaving' : ''}`} onClick={() => close(setMenu)}>
          <div class="sheet" role="dialog" aria-label="Sair do treino" onClick={(ev) => ev.stopPropagation()}>
            <h3 class="sheet-title">Sair do treino?</h3>
            <button class="btn primary big" onClick={() => close(setMenu)}>Continuar treinando</button>
            <button class="btn danger big" onClick={() => confirm('Descartar este treino?') && discardActive()}>Descartar treino</button>
          </div>
        </div>
      )}
    </div>
  );
}
