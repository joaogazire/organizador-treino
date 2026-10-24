import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';

export function Stepper(props: {
  label: string;
  value: number | undefined;
  step: number;
  min?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const v = props.value ?? 0;
  const set = (n: number) => props.onChange(Math.max(props.min ?? 0, Math.round(n * 10) / 10));
  return (
    <div class="stepper">
      <span class="stepper-label">{props.label}</span>
      <div class="stepper-row">
        <button type="button" class="stepper-btn" onClick={() => set(v - props.step)} aria-label={`Diminuir ${props.label}`}>−</button>
        <input
          class="stepper-input"
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={props.value ?? ''}
          onInput={(e) => {
            const n = parseFloat((e.target as HTMLInputElement).value.replace(',', '.'));
            if (!Number.isNaN(n)) props.onChange(n);
          }}
        />
        {props.unit && <span class="stepper-unit">{props.unit}</span>}
        <button type="button" class="stepper-btn" onClick={() => set(v + props.step)} aria-label={`Aumentar ${props.label}`}>+</button>
      </div>
    </div>
  );
}

export function Segmented<T extends string>(props: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  small?: boolean;
}) {
  return (
    <div class={`segmented${props.small ? ' small' : ''}`} role="radiogroup">
      {props.options.map((o) => (
        <button
          type="button"
          role="radio"
          aria-checked={o.value === props.value}
          class={o.value === props.value ? 'on' : ''}
          onClick={() => props.onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Card(props: { children: ComponentChildren; class?: string }) {
  return <section class={`card ${props.class ?? ''}`}>{props.children}</section>;
}

export function Header(props: { title: string; subtitle?: string; right?: ComponentChildren }) {
  return (
    <header class="screen-header">
      <div>
        <h1>{props.title}</h1>
        {props.subtitle && <p class="muted">{props.subtitle}</p>}
      </div>
      {props.right}
    </header>
  );
}

export const FEELINGS = [
  { v: 1, l: 'Péssimo' },
  { v: 2, l: 'Ruim' },
  { v: 3, l: 'Ok' },
  { v: 4, l: 'Bom' },
  { v: 5, l: 'Ótimo' },
] as const;

const ICONS = {
  today: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" />,
  week: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M8.5 3v4M15.5 3v4" /></>,
  report: <path d="M5 20V11M12 20V5M19 20v-6" />,
  settings: <path d="M4 8h9M17 8h3M4 16h3M11 16h9M15 5.5v5M9 13.5v5" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  pause: <path d="M9 5v14M15 5v14" />,
  play: <path d="M8 5.5v13l10.5-6.5z" />,
  back: <path d="m14.5 5-7 7 7 7" />,
  prev: <path d="m15 5-7 7 7 7" />,
  next: <path d="m9 5 7 7-7 7" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  minus: <path d="M6 12h12" />,
  dot: <circle cx="12" cy="12" r="1.5" />,
  more: <><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>,
} as const;

export type IconName = keyof typeof ICONS;

/** Ícones de traço (currentColor), todos no mesmo grid 24×24. */
export function Icon(props: { name: IconName; size?: number }) {
  const n = props.size ?? 22;
  return (
    <svg class="icon" width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {ICONS[props.name]}
    </svg>
  );
}

/** Folha de baixo com animação de saída. `children` pode receber `close` para fechar com animação. */
export function Sheet(props: { title?: string; onClose: () => void; children: ComponentChildren | ((close: () => void) => ComponentChildren) }) {
  const [leaving, setLeaving] = useState(false);
  const close = () => {
    setLeaving(true);
    setTimeout(props.onClose, 180);
  };
  return (
    <div class={`sheet-backdrop${leaving ? ' leaving' : ''}`} onClick={close}>
      <div class="sheet" role="dialog" aria-label={props.title} onClick={(e) => e.stopPropagation()}>
        {props.title && <h3 class="sheet-title">{props.title}</h3>}
        {typeof props.children === 'function' ? props.children(close) : props.children}
      </div>
    </div>
  );
}

/** Linha tocável de menu (título + valor + seta). */
export function MenuRow(props: { label: string; value?: string; onClick: () => void }) {
  return (
    <button class="menu-row" onClick={props.onClick}>
      <span>{props.label}</span>
      <span class="muted">{props.value}</span>
      <Icon name="next" size={16} />
    </button>
  );
}

/** Interruptor (substitui checkbox nativo). */
export function Switch(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button class="menu-row switch-row" role="switch" aria-checked={props.checked} onClick={() => props.onChange(!props.checked)}>
      <span>{props.label}</span>
      <span class={`switch${props.checked ? ' on' : ''}`}><i /></span>
    </button>
  );
}
