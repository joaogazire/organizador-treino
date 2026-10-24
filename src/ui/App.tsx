import { useState } from 'preact/hooks';
import { Icon, type IconName } from './common';
import { useStore } from '../store/useStore';
import { Onboarding } from './Onboarding';
import { Player } from './Player';
import { ReportScreen } from './ReportScreen';
import { SettingsScreen } from './SettingsScreen';
import { Today } from './Today';
import { WeekScreen } from './WeekScreen';

type Tab = 'hoje' | 'semana' | 'relatorio' | 'ajustes';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'hoje', label: 'Hoje', icon: 'today' },
  { id: 'semana', label: 'Semana', icon: 'week' },
  { id: 'relatorio', label: 'Relatório', icon: 'report' },
  { id: 'ajustes', label: 'Ajustes', icon: 'settings' },
];

export function App() {
  const state = useStore();
  const [tab, setTab] = useState<Tab>('hoje');
  const [dir, setDir] = useState<'l' | 'r'>('r');
  const idx = TABS.findIndex((t) => t.id === tab);
  const go = (id: Tab) => {
    setDir(TABS.findIndex((t) => t.id === id) > idx ? 'r' : 'l');
    setTab(id);
  };

  if (!state.onboarded) return <Onboarding state={state} />;
  if (state.active) return <Player state={state} />;

  return (
    <div class="app">
      <div class={`stage from-${dir}`} key={tab}>
        {tab === 'hoje' && <Today state={state} onReport={() => go('relatorio')} />}
        {tab === 'semana' && <WeekScreen state={state} />}
        {tab === 'relatorio' && <ReportScreen state={state} />}
        {tab === 'ajustes' && <SettingsScreen state={state} />}
      </div>
      <nav class="tabbar" style={{ '--i': idx }}>
        <span class="tab-pill" aria-hidden="true" />
        {TABS.map((t) => (
          <button class={tab === t.id ? 'on' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => go(t.id)}>
            <Icon name={t.icon} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
