import { useState } from 'preact/hooks';
import { formatShort, mondayOf, todayISO } from '../engine/dates';
import { downloadFile } from '../lib/share';
import { defaultState, exportBackup, importBackup } from '../store/storage';
import type { AppState, Settings } from '../store/types';
import { replaceState, setState } from '../store/useStore';
import { Card, Header, Stepper } from './common';

export function SettingsForm(props: { settings: Settings; onChange: (s: Settings) => void }) {
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
      <Stepper label="Descanso compostos" unit="s" step={15} min={30} value={s.restCompoundSec} onChange={(v) => set('restCompoundSec', v)} />
      <Stepper label="Descanso isolados" unit="s" step={15} min={15} value={s.restIsolationSec} onChange={(v) => set('restIsolationSec', v)} />
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

  return (
    <div class="screen">
      <Header title="Ajustes" />
      <Card>
        <SettingsForm settings={state.settings} onChange={update} />
        <label class="check">
          <input type="checkbox" checked={state.settings.sound} onChange={(e) => update({ ...state.settings, sound: (e.target as HTMLInputElement).checked })} />
          Bipes no countdown
        </label>
        <label class="check">
          <input type="checkbox" checked={state.settings.vibrate} onChange={(e) => update({ ...state.settings, vibrate: (e.target as HTMLInputElement).checked })} />
          Vibrar (Android)
        </label>
      </Card>

      <Card>
        <h3>Seus dados</h3>
        <p class="muted small">Tudo fica salvo só neste celular ({state.logs.length} treinos registrados). Faça backup de vez em quando.</p>
        <div class="row gap wrap">
          <button class="btn quiet" onClick={() => downloadFile(`coach-backup-${todayISO()}.json`, exportBackup(state), 'application/json')}>Exportar backup</button>
          <label class="btn quiet">
            Importar backup
            <input type="file" accept="application/json,.json" hidden onChange={onImport} />
          </label>
        </div>
        <button class="btn danger" onClick={() => confirm('Apagar todos os dados deste celular?') && replaceState(defaultState())}>Apagar tudo</button>
        {msg && <p class="muted small">{msg}</p>}
      </Card>

      <p class="muted small center">Coach Híbrido v0.1 · nome e visual provisórios</p>
    </div>
  );
}
