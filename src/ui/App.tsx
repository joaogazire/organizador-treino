import { useState } from 'preact/hooks';
import { useStore } from '../store/useStore';
import { Onboarding } from './Onboarding';
import { Player } from './Player';
import { ReportScreen } from './ReportScreen';
import { SettingsScreen } from './SettingsScreen';
import { Today } from './Today';
import { WeekScreen } from './WeekScreen';

type Tab = 'hoje' | 'semana' | 'relatorio' | 'ajustes';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'hoje', label: 'Hoje', icon: '⚡' },
  { id: 'semana', label: 'Semana', icon: '🗓️' },
  { id: 'relatorio', label: 'Relatório', icon: '📊' },
  { id: 'ajustes', label: 'Ajustes', icon: '⚙️' },
];

export function App() {
  const state = useStore();
  const [tab, setTab] = useState<Tab>('hoje');

  if (!state.onboarded) return <Onboarding state={state} />;
  if (state.active) return <Player state={state} />;

  return (
    <div class="app">
      {tab === 'hoje' && <Today state={state} onReport={() => setTab('relatorio')} />}
      {tab === 'semana' && <WeekScreen state={state} />}
      {tab === 'relatorio' && <ReportScreen state={state} />}
      {tab === 'ajustes' && <SettingsScreen state={state} />}
      <nav class="tabbar">
        {TABS.map((t) => (
          <button class={tab === t.id ? 'on' : ''} onClick={() => { setTab(t.id); window.scrollTo(0, 0); }}>
            <span class="tab-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
