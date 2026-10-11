import './demo.css';
import { demoModel, demoPatternFor, demoPatternForWorkout, type DemoModel, type NodeModel } from './patterns';

export { demoPatternFor, demoPatternForWorkout, EXERCISE_PATTERN } from './patterns';
export type { PatternId } from './patterns';

function Hold({ h }: { h: NodeModel['holds'][number] }) {
  if (h.kind === 'kb') {
    return (
      <g class="dm-h">
        <circle cx={h.cx} cy={h.cy + 2} r={h.r} />
        <path d={`M${h.cx - 4.5} ${h.cy - 5}a4.5 4.5 0 0 1 9 0`} />
      </g>
    );
  }
  return <circle class="dm-h" cx={h.cx} cy={h.cy} r={h.r} />;
}

function Bone({ n, m }: { n: NodeModel; m: DemoModel }) {
  const body = (
    <>
      <line x1={n.sx} y1={n.sy} x2={n.ex} y2={n.ey} />
      {n.head && <circle cx={n.head.cx} cy={n.head.cy} r={n.head.r} />}
      {n.holds.map((h, i) => (
        <Hold key={i} h={h} />
      ))}
      {n.kids.map((k) => (
        <Bone key={k.name} n={k} m={m} />
      ))}
    </>
  );
  if (n.run) {
    return (
      <g class={`dm-a dm-n-${n.run.kind}`} style={`transform-origin:${n.sx}px ${n.sy}px;--ph:${n.run.ph}`}>
        {body}
      </g>
    );
  }
  if (Math.abs(n.r) < 0.05 && Math.abs(n.rm) < 0.05) return <g>{body}</g>;
  return (
    <g class="dm-a" style={`transform-origin:${n.sx}px ${n.sy}px;--rm:${n.rm}deg;--r:${n.r}deg;--xm:0px;--ym:0px;--x:0px;--y:0px`}>
      {body}
    </g>
  );
}

function Figure({ m }: { m: DemoModel }) {
  const c = m.cable;
  const rootStyle = m.timing === 'run' ? '' : `--xm:${m.root.xm}px;--ym:${m.root.ym}px;--x:${m.root.x}px;--y:${m.root.y}px`;
  const rootClass = m.timing === 'run' ? 'dm-a dm-n-bob' : m.root.x || m.root.y || m.root.xm || m.root.ym ? 'dm-a' : '';
  return (
    <g transform={m.tx || m.ty ? `translate(${m.tx} ${m.ty})` : undefined}>
      <path class="dm-s" d={m.scene.join('')} />
      {m.belt && (
        <g clip-path="url(#dm-belt)">
          <path class="dm-s dm-belt" d={Array.from({ length: 8 }, (_, i) => `M${72 + i * 38} 177h14`).join('')} style={`--bd:${m.belt.dur}s`} />
        </g>
      )}
      {c && (
        <g transform={`translate(${c.ax} ${c.ay}) rotate(${c.angle})`}>
          <g class="dm-a" style={`--rm:${c.rm}deg;--r:${c.r}deg;--sm:${c.sm};--s:${c.s};--xm:0px;--ym:0px;--x:0px;--y:0px`}>
            <line class="dm-c" x1="0" y1="0" x2={c.len} y2="0" />
          </g>
        </g>
      )}
      <g class={rootClass} style={rootStyle}>
        {m.nodes.map((n) => (
          <Bone key={n.name} n={n} m={m} />
        ))}
      </g>
    </g>
  );
}

/**
 * Fundo animado (SVG + CSS) com um exemplo do movimento. Posicionado em `absolute; inset:0`,
 * então o pai precisa ser `position: relative` (ou outro contexto de posicionamento).
 * Sem `exerciseId`, usa o `workout` (corrida/mobilidade). `exerciseId` desconhecido = nada.
 */
export function ExerciseDemo({ exerciseId, workout, paused, tone }: { exerciseId?: string; workout: string; paused?: boolean; tone?: string }) {
  const id = exerciseId !== undefined ? demoPatternFor(exerciseId) : demoPatternForWorkout(workout);
  if (!id) return null;
  const m = demoModel(id);
  return (
    <div
      key={`${exerciseId ?? workout}`}
      class={`dm-root dm-${m.timing}${paused ? ' dm-paused' : ''}${tone === 'rest' ? ' dm-rest' : ''}`}
      style={`--dur:${m.dur}s;--still:${m.still}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 240 200" focusable="false">
        <defs>
          <clipPath id="dm-belt">
            <rect x="66" y="172" width="128" height="12" />
          </clipPath>
        </defs>
        <Figure m={m} />
      </svg>
    </div>
  );
}
