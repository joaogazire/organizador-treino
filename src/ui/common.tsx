import type { ComponentChildren } from 'preact';

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
  { v: 1, e: '😫', l: 'Péssimo' },
  { v: 2, e: '😕', l: 'Ruim' },
  { v: 3, e: '😐', l: 'Ok' },
  { v: 4, e: '🙂', l: 'Bom' },
  { v: 5, e: '🔥', l: 'Ótimo' },
] as const;
