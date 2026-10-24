import { useState } from 'preact/hooks';
import { formatShort, mondayOf, todayISO } from '../engine/dates';
import { downloadFile } from '../lib/share';
import { defaultState, exportBackup, importBackup } from '../store/storage';
import type { AppState, Settings } from '../store/types';
import { replaceState, setState } from '../store/useStore';
import { Header, MenuRow, Sheet, Stepper, Switch } from './common';

export function SettingsForm(props: { settings: Settings; onChange: (s: Settings) => void; basic?: boolean }) {
  const s = props.settings;
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => props.onChange({ ...s, [k]: v });
  return (
    <div class="form">
      <label class="field">
        <span>Início do ciclo (semana 1)</span>
        <input type="date" value={s.cycleStart} onChange={(e) => {
          const v = (e.target as HTMLInputElement).value;
          if (v) set('cycleStart', mondayOf(v));
        }} />
        <small class="muted">Conta a partir da segunda-feira: {formatShort(s.cycleStart)}</small>
      </label>
      <Stepper label="Velocidade dos tiros" unit="km/h" step={0.5} min={6} value={s.tiroSpeed} onChange={(v) => set('tiroSpeed', v)} />
      <Stepper label="Velocidade rodagem / longo" unit="km/h" step={0.25} min={5} value={s.easySpeed} onChange={(v) => set('easySpeed', v)} />
      {!props.basic && <>
      <Stepper label="Descanso compostos" unit="s" step={15} min={30} value={s.restCompoundSec} onChange={(v) => set('restCompoundSec', v)} />
      <Stepper label="Descanso isolados" unit="s" step={15} min={15} value={s.restIsolationSec} onChange={(v) => set('restIsolationSec', v)} />
      </>}
    </div>
  );
}

export function SettingsScreen(props: { state: AppState }) {
  const { state } = props;
  const [msg, setMsg] = useState('');
  const update = (settings: Settings) => setState((s) => ({ ...s, settings }));

  const onImport = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      replaceState(importBackup(await file.text()));
      setMsg('Backup restaurado.');
    } catch (err) {
      setMsg((err as Error).message);
    }
  };

  const [sheet, setSheet] = useState<'ritmos' | 'dados'>();

  return (
    <div class="screen">
      <Header title="Ajustes" />
      <div class="menu">
        <MenuRow label="Ritmos e descansos" value={`${state.settings.tiroSpeed} km/h`} onClick={() => setSheet('ritmos')} />
        <Switch label="Bipes no descanso" checked={state.settings.sound} onChange={(v) => update({ ...state.settings, sound: v })} />
        <Switch label="Vibrar (Android)" checked={state.settings.vibrate} onChange={(v) => update({ ...state.settings, vibrate: v })} />
        <MenuRow label="Dados e backup" value={`${state.logs.length} treinos`} onClick={() => setSheet('dados')} />
      </div>
      <p class="muted small center settings-foot">Coach Híbrido v0.1 · tudo fica salvo só neste celular</p>

      {sheet === 'ritmos' && (
        <Sheet title="Ritmos e descansos" onClose={() => setSheet(undefined)}>
          <SettingsForm settings={state.settings} onChange={update} />
        </Sheet>
      )}
      {sheet === 'dados' && (
        <Sheet title="Dados e backup" onClose={() => setSheet(undefined)}>
          <p class="muted small">{state.logs.length} treinos registrados. Faça backup de vez em quando.</p>
          <button class="btn" onClick={() => downloadFile(`coach-backup-${todayISO()}.json`, exportBackup(state), 'application/json')}>Exportar backup</button>
          <label class="btn">
            Importar backup
            <input type="file" accept="application/json,.json" hidden onChange={onImport} />
          </label>
          <button class="btn danger" onClick={() => confirm('Apagar todos os dados deste celular?') && replaceState(defaultState())}>Apagar tudo</button>
          {msg && <p class="muted small">{msg}</p>}
        </Sheet>
      )}
    </div>
  );
}
