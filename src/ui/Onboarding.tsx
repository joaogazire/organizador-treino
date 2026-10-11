import { useState } from 'preact/hooks';
import type { AppState } from '../store/types';
import { setState } from '../store/useStore';
import { SettingsForm } from './SettingsScreen';

export function Onboarding(props: { state: AppState }) {
  const [settings, setSettings] = useState(props.state.settings);
  return (
    <div class="screen onboarding">
      <p class="eyebrow">Bem-vindo</p>
      <h1>Coach Híbrido</h1>
      <p class="muted">
        Seu coach diário: 4 musculações + 3 corridas por semana em um ciclo de 8 semanas. Ajuste o ponto de partida —
        dá para mudar depois em Ajustes.
      </p>
      <div class="card">
        <SettingsForm settings={settings} onChange={setSettings} />
      </div>
      <button class="btn primary big" onClick={() => setState((s) => ({ ...s, settings, onboarded: true }))}>Começar</button>
      <p class="muted small center">Dica: no navegador, use "Adicionar à tela inicial" para abrir como app e funcionar offline.</p>
    </div>
  );
}
