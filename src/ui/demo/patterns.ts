// Padrões de movimento do ExerciseDemo: esqueleto de traços (lado ou frente) resolvido por cinemática
// direta + IK de 2 ossos ("plant" = pé/mão fixos no chão). O resultado é uma árvore de grupos SVG
// desenhada na pose A; cada osso gira (CSS `rotate`) em torno da própria articulação até a pose B,
// passando por uma pose intermediária exata (M) para o contato com o chão não "escorregar".
// Módulo puro (sem JSX/DOM) para poder ser testado em node.

export interface Pt {
  x: number;
  y: number;
}

export type Timing = 'ft' | 'st' | 'sp' | 'sw' | 'run';
// ft = vai a B rápido, volta devagar; st = vai a B devagar (descida), volta rápido;
// sp = como st, com pausa embaixo; sw = pendular simétrico; run = ciclo contínuo de corrida.

export type PatternId =
  | 'press-flat'
  | 'press-incline'
  | 'press-incline-m'
  | 'press-overhead'
  | 'fly'
  | 'lateral-raise'
  | 'pushdown'
  | 'pulldown'
  | 'row-seated'
  | 'row-bent'
  | 'face-pull'
  | 'curl'
  | 'pushup'
  | 'squat'
  | 'goblet'
  | 'bulgarian'
  | 'leg-curl'
  | 'calf-raise'
  | 'plank'
  | 'rdl'
  | 'hip-thrust'
  | 'abductor'
  | 'kb-swing'
  | 'crunch'
  | 'run-fast'
  | 'run-easy'
  | 'run-long'
  | 'stretch';

/** exerciseId (plan.ts) -> padrão de movimento. */
export const EXERCISE_PATTERN: Record<string, PatternId> = {
  'supino-inclinado-barra': 'press-incline',
  'supino-reto-barra': 'press-flat',
  'crucifixo-halteres': 'fly',
  'desenvolvimento-maquina': 'press-overhead',
  'elevacao-lateral': 'lateral-raise',
  'triceps-polia': 'pushdown',
  'puxada-aberta': 'pulldown',
  'supino-maquina-inclinado': 'press-incline-m',
  'remada-baixa': 'row-seated',
  'remada-curvada': 'row-bent',
  'face-pull': 'face-pull',
  'rosca-direta': 'curl',
  'supino-maquina': 'press-incline-m',
  'flexao-declinada': 'pushup',
  'crucifixo-inclinado': 'fly',
  'agachamento-livre': 'squat',
  'afundo-bulgaro': 'bulgarian',
  'goblet-pausa': 'goblet',
  'mesa-flexora': 'leg-curl',
  'panturrilha-unilateral': 'calf-raise',
  prancha: 'plank',
  'terra-romeno': 'rdl',
  'hip-thrust': 'hip-thrust',
  flexora: 'leg-curl',
  abdutora: 'abductor',
  'kb-swing': 'kb-swing',
  abdominal: 'crunch',
};

const WORKOUT_PATTERN: Record<string, PatternId> = {
  tiros: 'run-fast',
  'rodagem-leve': 'run-easy',
  longo: 'run-long',
  mobilidade: 'stretch',
};

export function demoPatternFor(exerciseId: string): PatternId | undefined {
  return Object.prototype.hasOwnProperty.call(EXERCISE_PATTERN, exerciseId) ? EXERCISE_PATTERN[exerciseId] : undefined;
}

export function demoPatternForWorkout(workout: string): PatternId | undefined {
  return Object.prototype.hasOwnProperty.call(WORKOUT_PATTERN, workout) ? WORKOUT_PATTERN[workout] : undefined;
}

// ---------- Esqueleto ----------

type AngSpec = number | [number, number] | { r: number | [number, number] };
type HoldKind = 'plate' | 'db' | 'kb' | 'bar' | 'handle';

interface BoneDef {
  len: number;
  parent?: string;
  off?: [number, number];
}

const BONES: Record<string, BoneDef> = {
  // vista lateral
  torso: { len: 46 },
  thigh: { len: 38 },
  shin: { len: 36, parent: 'thigh' },
  foot: { len: 13, parent: 'shin' },
  uarm: { len: 26, parent: 'torso' },
  farm: { len: 25, parent: 'uarm' },
  thigh2: { len: 38 },
  shin2: { len: 36, parent: 'thigh2' },
  foot2: { len: 13, parent: 'shin2' },
  uarm2: { len: 26, parent: 'torso' },
  farm2: { len: 25, parent: 'uarm2' },
  // vista frontal (ombros e quadris afastados)
  uR: { len: 26, parent: 'torso', off: [13, 0] },
  fR: { len: 25, parent: 'uR' },
  uL: { len: 26, parent: 'torso', off: [-13, 0] },
  fL: { len: 25, parent: 'uL' },
  tR: { len: 38, off: [9, 0] },
  sR: { len: 36, parent: 'tR' },
  ftR: { len: 10, parent: 'sR' },
  tL: { len: 38, off: [-9, 0] },
  sL: { len: 36, parent: 'tL' },
  ftL: { len: 10, parent: 'sL' },
};

const DEF_ANG: Record<string, number> = {
  torso: -90, thigh: 90, shin: 90, foot: 0, uarm: 90, farm: 90, thigh2: 90, shin2: 90, foot2: 0, uarm2: 90, farm2: 90,
  uR: 80, fR: 80, uL: 100, fL: 100, tR: 90, sR: 90, ftR: 0, tL: 90, sL: 90, ftL: 180,
};

const SIDE = ['torso', 'thigh', 'shin', 'foot', 'uarm', 'farm'];
const SIDE_LEG = ['torso', 'thigh', 'shin', 'foot'];
const FRONT = ['torso', 'uR', 'fR', 'uL', 'fL', 'tR', 'sR', 'ftR', 'tL', 'sL', 'ftL'];

interface Plant {
  a: string;
  b: string;
  target: Pt | [Pt, Pt];
  bend: 1 | -1;
}

interface Hold {
  kind: HoldKind;
  r?: number;
  at?: 'start' | 'end';
}

interface Spec {
  bones: string[];
  root: Pt | [Pt, Pt];
  ang?: Record<string, AngSpec>;
  plant?: Plant[];
  lens?: Record<string, number>;
  holds?: Record<string, Hold>;
  scene?: string[];
  ground: number;
  tx?: number;
  ty?: number;
  cable?: { anchor: Pt; bone: string };
  timing: Timing;
  dur: number;
  still: number;
}

// ---------- Modelo resolvido ----------

export interface NodeModel {
  name: string;
  sx: number;
  sy: number;
  ex: number;
  ey: number;
  rm: number;
  r: number;
  head?: { cx: number; cy: number; r: number };
  holds: { kind: HoldKind; cx: number; cy: number; r: number }[];
  kids: NodeModel[];
  run?: { kind: 'thigh' | 'knee' | 'arm' | 'elbow'; ph: number };
}

export interface DemoModel {
  id: PatternId;
  timing: Timing;
  dur: number;
  still: number;
  tx: number;
  ty: number;
  ground: number;
  scene: string[];
  root: { xm: number; ym: number; x: number; y: number };
  nodes: NodeModel[];
  cable?: { ax: number; ay: number; angle: number; len: number; rm: number; r: number; sm: number; s: number };
  belt?: { dur: number };
}

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const at = (p: Pt, len: number, ang: number): Pt => ({ x: p.x + len * Math.cos(rad(ang)), y: p.y + len * Math.sin(rad(ang)) });
const norm = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const r1 = (n: number) => Math.round(n * 100) / 100;
const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const P = (x: number, y: number): Pt => ({ x, y });

function ik(o: Pt, t: Pt, l1: number, l2: number, bend: number): [number, number] {
  const dx = t.x - o.x;
  const dy = t.y - o.y;
  const d = Math.hypot(dx, dy);
  const base = Math.atan2(dy, dx);
  const dd = Math.min(Math.max(d, Math.abs(l1 - l2) + 1e-3), l1 + l2 - 1e-3);
  const c = Math.max(-1, Math.min(1, (l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd)));
  const a1 = base + bend * Math.acos(c);
  const e = { x: o.x + l1 * Math.cos(a1), y: o.y + l1 * Math.sin(a1) };
  return [deg(a1), deg(Math.atan2(t.y - e.y, t.x - e.x))];
}

interface Solved {
  s: Pt;
  e: Pt;
  abs: number;
}

function val(v: number | [number, number], t: number) {
  return typeof v === 'number' ? v : lerp(v[0], v[1], t);
}

function solve(spec: Spec, t: number): Map<string, Solved> {
  const out = new Map<string, Solved>();
  const root = Array.isArray(spec.root) ? lerpPt(spec.root[0], spec.root[1], t) : spec.root;
  const forced = new Map<string, number>();
  const plantByHead = new Map(spec.plant?.map((p) => [p.a, p]) ?? []);
  for (const name of spec.bones) {
    const def = BONES[name];
    const len = spec.lens?.[name] ?? def.len;
    const parent = def.parent ? out.get(def.parent) : undefined;
    const origin = parent ? parent.e : root;
    const s = def.off ? P(origin.x + def.off[0], origin.y + def.off[1]) : origin;
    const pAbs = parent ? parent.abs : 0;
    let abs: number;
    const pl = plantByHead.get(name);
    if (pl) {
      const target = Array.isArray(pl.target) ? lerpPt(pl.target[0], pl.target[1], t) : pl.target;
      const lb = spec.lens?.[pl.b] ?? BONES[pl.b].len;
      const [a1, a2] = ik(s, target, len, lb, pl.bend);
      abs = a1;
      forced.set(pl.b, a2);
    } else if (forced.has(name)) {
      abs = forced.get(name)!;
    } else {
      const sp = spec.ang?.[name];
      if (sp === undefined) abs = DEF_ANG[name];
      else if (typeof sp === 'number' || Array.isArray(sp)) abs = val(sp, t);
      else abs = pAbs + val(sp.r, t);
    }
    out.set(name, { s, e: at(s, len, abs), abs });
  }
  return out;
}

const HOLD_R: Record<HoldKind, number> = { plate: 11, db: 6, kb: 8, bar: 5, handle: 3.5 };

function build(id: PatternId, spec: Spec): DemoModel {
  const A = solve(spec, 0);
  const M = solve(spec, 0.5);
  const B = solve(spec, 1);
  const rootAt = (t: number) => (Array.isArray(spec.root) ? lerpPt(spec.root[0], spec.root[1], t) : spec.root);
  const r0 = rootAt(0);
  const dOf = (t: number) => ({ x: rootAt(t).x - r0.x, y: rootAt(t).y - r0.y });

  const rel = (m: Map<string, Solved>, n: string) => {
    const p = BONES[n].parent;
    return m.get(n)!.abs - (p ? m.get(p)!.abs : 0);
  };

  const make = (name: string): NodeModel => {
    const a = A.get(name)!;
    const sp = spec.holds?.[name];
    const node: NodeModel = {
      name,
      sx: r1(a.s.x),
      sy: r1(a.s.y),
      ex: r1(a.e.x),
      ey: r1(a.e.y),
      rm: r1(norm(rel(M, name) - rel(A, name))),
      r: r1(norm(rel(B, name) - rel(A, name))),
      holds: [],
      kids: [],
    };
    if (name === 'torso') {
      const h = at(a.e, 12, a.abs);
      node.head = { cx: r1(h.x), cy: r1(h.y), r: 9 };
    }
    if (sp) {
      const p = sp.at === 'start' ? a.s : a.e;
      node.holds.push({ kind: sp.kind, cx: r1(p.x), cy: r1(p.y), r: sp.r ?? HOLD_R[sp.kind] });
    }
    for (const k of spec.bones) if (BONES[k].parent === name) node.kids.push(make(k));
    return node;
  };
  const nodes = spec.bones.filter((n) => !BONES[n].parent).map(make);

  const dm = dOf(0.5);
  const d1 = dOf(1);
  const model: DemoModel = {
    id,
    timing: spec.timing,
    dur: spec.dur,
    still: spec.still,
    tx: spec.tx ?? 0,
    ty: spec.ty ?? 0,
    ground: spec.ground,
    scene: spec.scene ?? [],
    root: { xm: r1(dm.x), ym: r1(dm.y), x: r1(d1.x), y: r1(d1.y) },
    nodes,
  };
  if (spec.cable) {
    const hand = (m: Map<string, Solved>, t: number) => {
      const e = m.get(spec.cable!.bone)!.e;
      const d = dOf(t);
      return P(e.x + d.x, e.y + d.y);
    };
    const an = spec.cable.anchor;
    const info = (h: Pt) => ({ ang: deg(Math.atan2(h.y - an.y, h.x - an.x)), len: Math.max(1, Math.hypot(h.x - an.x, h.y - an.y)) });
    const ia = info(hand(A, 0));
    const im = info(hand(M, 0.5));
    const ib = info(hand(B, 1));
    model.cable = {
      ax: an.x,
      ay: an.y,
      angle: r1(ia.ang),
      len: r1(ia.len),
      rm: r1(norm(im.ang - ia.ang)),
      r: r1(norm(ib.ang - ia.ang)),
      sm: r1(im.len / ia.len),
      s: r1(ib.len / ia.len),
    };
  }
  return model;
}

// ---------- Padrões ----------

const floor = (y: number, x1 = 20, x2 = 220) => `M${x1} ${y}H${x2}`;
const bench = (x1: number, x2: number, top: number, ground: number) =>
  `M${x1} ${top}H${x2}M${x1 + 6} ${top}V${ground}M${x2 - 6} ${top}V${ground}`;

function pressLying(hold: HoldKind): Spec {
  return {
    bones: SIDE,
    root: P(125, 118),
    ang: { torso: 180, shin: 88, uarm: [-82, 8], farm: [-88, -86] },
    plant: [{ a: 'thigh', b: 'shin', target: P(164, 151), bend: -1 }],
    holds: { farm: { kind: hold } },
    scene: [floor(156), bench(50, 140, 124, 156)],
    ground: 156,
    timing: 'st',
    dur: 3,
    still: 0.62,
  };
}

function pressIncline(hold: HoldKind): Spec {
  const Pp = P(138, 124);
  const dir = { x: Math.cos(rad(-128)), y: Math.sin(rad(-128)) };
  const n = { x: -dir.y, y: dir.x }; // normal (atrás do corpo)
  const b1 = P(Pp.x + 7 * n.x, Pp.y + 7 * n.y);
  const b2 = P(Pp.x + 7 * n.x + 62 * dir.x, Pp.y + 7 * n.y + 62 * dir.y);
  return {
    bones: SIDE,
    root: Pp,
    ang: { torso: -128, uarm: [-88, 55], farm: [-90, -90] },
    plant: [{ a: 'thigh', b: 'shin', target: P(176, 163), bend: -1 }],
    holds: { farm: { kind: hold } },
    scene: [floor(168), `M${b1.x} ${b1.y}L${b2.x} ${b2.y}`, `M${Pp.x - 16} 131H${Pp.x + 40}M${Pp.x + 14} 131V168`],
    ground: 168,
    timing: 'st',
    dur: 3,
    still: 0.62,
  };
}

const SEAT_FRONT = (py: number) => [floor(py + 64), `M84 ${py + 8}H156M120 ${py + 8}V${py + 64}`];

const frontShoulders = (py: number) => `M107 ${py - 46}H133M111 ${py}H129`;

function runSpec(lean: number, dur: number): Spec {
  return {
    bones: ['torso', 'thigh', 'shin', 'foot', 'thigh2', 'shin2', 'foot2', 'uarm', 'farm', 'uarm2', 'farm2'],
    root: P(120, 92),
    ang: { torso: lean, farm: { r: -80 }, farm2: { r: -80 }, foot: { r: -90 }, foot2: { r: -90 } },
    scene: [`M70 172H190M190 172V104H168`],
    ground: 172,
    timing: 'run',
    dur,
    still: 0.3,
  };
}

const SPECS: Record<PatternId, Spec> = {
  'press-flat': pressLying('plate'),
  'press-incline': pressIncline('plate'),
  'press-incline-m': pressIncline('handle'),

  // vista frontal sentada: cotovelos abertos (B) -> braços estendidos (A)
  'press-overhead': {
    bones: FRONT,
    root: P(120, 112),
    ang: { uR: [-80, 8], fR: [-92, -84], uL: [260, 172], fL: [272, 264], tR: 78, sR: 90, tL: 102, sL: 90 },
    lens: { tR: 26, tL: 26 },
    holds: { fR: { kind: 'handle' }, fL: { kind: 'handle' } },
    scene: [...SEAT_FRONT(112), frontShoulders(112)],
    ground: 176,
    timing: 'st',
    dur: 3,
    still: 0.62,
  },

  // crucifixo: braços fechados (A) -> abertos (B)
  fly: {
    bones: FRONT,
    root: P(120, 112),
    ang: { uR: [-86, 14], fR: [-92, -14], uL: [266, 166], fL: [272, 194], tR: 78, sR: 90, tL: 102, sL: 90 },
    lens: { tR: 26, tL: 26 },
    holds: { fR: { kind: 'db' }, fL: { kind: 'db' } },
    scene: [...SEAT_FRONT(112), frontShoulders(112)],
    ground: 176,
    timing: 'st',
    dur: 3.2,
    still: 0.62,
  },

  'lateral-raise': {
    bones: FRONT,
    root: P(120, 94),
    ang: { uR: [80, -4], fR: [82, -6], uL: [100, 184], fL: [98, 186], tR: 93, sR: 90, tL: 87, sL: 90 },
    holds: { fR: { kind: 'db' }, fL: { kind: 'db' } },
    scene: [floor(170), frontShoulders(94)],
    ground: 170,
    timing: 'ft',
    dur: 2.8,
    still: 0.39,
  },

  pushdown: {
    bones: SIDE,
    root: P(110, 94),
    ang: { torso: -88, uarm: 95, farm: [-5, 88] },
    holds: { farm: { kind: 'handle' } },
    cable: { anchor: P(134, 8), bone: 'farm' },
    scene: [floor(170), 'M122 8H146'],
    ground: 170,
    timing: 'ft',
    dur: 2.6,
    still: 0.39,
  },

  pulldown: {
    bones: SIDE,
    root: P(104, 122),
    ang: { torso: -98, thigh: 3, shin: 90 },
    plant: [{ a: 'uarm', b: 'farm', target: [P(114, 26), P(118, 80)], bend: 1 }],
    holds: { farm: { kind: 'handle' } },
    cable: { anchor: P(128, 8), bone: 'farm' },
    scene: [floor(164), `M80 129H140M104 129V164`, 'M112 8H144'],
    ground: 164,
    timing: 'ft',
    dur: 2.8,
    still: 0.39,
  },

  'row-seated': {
    bones: SIDE,
    root: P(70, 124),
    ang: { torso: [-72, -98], thigh: -8, shin: 8, foot: -80 },
    plant: [{ a: 'uarm', b: 'farm', target: [P(140, 80), P(90, 118)], bend: 1 }],
    holds: { farm: { kind: 'handle' } },
    cable: { anchor: P(228, 88), bone: 'farm' },
    scene: [floor(130), 'M158 96V130'],
    ground: 130,
    tx: 8,
    timing: 'ft',
    dur: 2.8,
    still: 0.39,
  },

  'row-bent': {
    bones: SIDE,
    root: P(96, 98),
    ang: { torso: -42, foot: 0 },
    plant: [
      { a: 'thigh', b: 'shin', target: P(106, 166), bend: -1 },
      { a: 'uarm', b: 'farm', target: [P(130, 118), P(122, 104)], bend: 1 },
    ],
    holds: { farm: { kind: 'plate', r: 10 } },
    scene: [floor(170)],
    ground: 170,
    timing: 'ft',
    dur: 2.8,
    still: 0.39,
  },

  'face-pull': {
    bones: SIDE,
    root: P(100, 94),
    ang: { uarm: [0, 168], farm: [0, -8] },
    holds: { farm: { kind: 'handle' } },
    cable: { anchor: P(228, 48), bone: 'farm' },
    scene: [floor(170), 'M222 30V66'],
    ground: 170,
    timing: 'ft',
    dur: 2.6,
    still: 0.39,
  },

  curl: {
    bones: SIDE,
    root: P(110, 94),
    ang: { uarm: 92, farm: [88, -62] },
    holds: { farm: { kind: 'bar' } },
    scene: [floor(170)],
    ground: 170,
    timing: 'ft',
    dur: 2.6,
    still: 0.39,
  },

  // flexão declinada: corpo rígido gira em torno dos pés (no banco); mãos fixas no chão
  pushup: (() => {
    const ankle = P(30, 124);
    const hand = P(150, 170);
    const phiA = deg(Math.atan2(-5, 119.9));
    const phiB = 11.5;
    const pel = (phi: number) => at(ankle, 74, phi);
    return {
      bones: SIDE,
      root: [pel(phiA), pel(phiB)] as [Pt, Pt],
      ang: { torso: [phiA, phiB], thigh: [180 + phiA, 180 + phiB], shin: [180 + phiA, 180 + phiB], foot: 90 },
      plant: [{ a: 'uarm', b: 'farm', target: hand, bend: 1 as const }],
      scene: [floor(172), `M14 137H70M20 137V172M64 137V172`],
      ground: 172,
      tx: 26,
      timing: 'st',
      dur: 3,
      still: 0.62,
    } as Spec;
  })(),

  squat: {
    bones: SIDE,
    root: [P(100, 92), P(82, 128)],
    ang: { torso: [-90, -55], uarm: { r: 190 }, farm: { r: -187 } },
    plant: [{ a: 'thigh', b: 'shin', target: P(100, 166), bend: -1 }],
    scene: [floor(170)],
    ground: 170,
    timing: 'st',
    dur: 3.2,
    still: 0.62,
  },

  goblet: {
    bones: SIDE,
    root: [P(100, 92), P(86, 126)],
    ang: { torso: [-90, -72], uarm: { r: 170 }, farm: { r: -120 } },
    plant: [{ a: 'thigh', b: 'shin', target: P(100, 166), bend: -1 }],
    holds: { farm: { kind: 'kb' } },
    scene: [floor(170)],
    ground: 170,
    timing: 'sp',
    dur: 3.6,
    still: 0.6,
  },

  bulgarian: {
    bones: ['torso', 'thigh', 'shin', 'foot', 'thigh2', 'shin2', 'foot2', 'uarm', 'farm'],
    root: [P(136, 100), P(142, 130)],
    ang: { torso: [-85, -75], foot: 0, foot2: 175 },
    plant: [
      { a: 'thigh', b: 'shin', target: P(172, 166), bend: -1 },
      { a: 'thigh2', b: 'shin2', target: P(92, 132), bend: -1 },
    ],
    holds: { farm: { kind: 'db' } },
    scene: [floor(170), bench(50, 96, 138, 170)],
    ground: 170,
    timing: 'st',
    dur: 3.2,
    still: 0.62,
  },

  'leg-curl': {
    bones: SIDE_LEG,
    root: P(112, 126),
    ang: { torso: 180, thigh: 0, shin: [0, -105], foot: { r: 90 } },
    holds: { shin: { kind: 'handle', r: 4.5 } },
    scene: [floor(168), bench(36, 160, 134, 168)],
    ground: 168,
    tx: 6,
    timing: 'ft',
    dur: 2.8,
    still: 0.39,
  },

  'calf-raise': (() => {
    // sobe na ponta do pé: o pé gira 40 graus em torno da ponta (fixa no degrau)
    const ankle = P(110, 166);
    const toe = at(ankle, 13, 0);
    const ankleB = P(toe.x - 13 * Math.cos(rad(40)), toe.y - 13 * Math.sin(rad(40)));
    return {
      bones: SIDE,
      root: [P(ankle.x, ankle.y - 74), P(ankleB.x, ankleB.y - 74)] as [Pt, Pt],
      ang: { foot: [0, 40] },
      holds: { farm: { kind: 'db' } },
      scene: [floor(190), 'M104 170H200V190M104 170V190'],
      ground: 190,
      timing: 'ft',
      dur: 2.2,
      still: 0.39,
    } as Spec;
  })(),

  // prancha (isométrico): corpo reto apoiado em antebraços e pontas dos pés; respiração sutil
  plank: (() => {
    const ankle = P(36, 160);
    const phi = deg(Math.atan2(-16, 114));
    const pel = at(ankle, 74, phi);
    return {
      bones: SIDE,
      root: [pel, P(pel.x, pel.y - 1.8)] as [Pt, Pt],
      ang: { torso: [phi, phi - 1.2], thigh: 180 + phi, shin: 180 + phi, foot: 90, uarm: 90, farm: 0 },
      scene: [floor(174)],
      ground: 174,
      tx: 6,
      timing: 'sw',
      dur: 3.6,
      still: 0.5,
    } as Spec;
  })(),

  rdl: {
    bones: SIDE,
    root: [P(110, 94), P(80, 100)],
    ang: { torso: [-90, -28] },
    plant: [{ a: 'thigh', b: 'shin', target: P(110, 166), bend: -1 }],
    holds: { farm: { kind: 'plate', r: 10 } },
    scene: [floor(170)],
    ground: 170,
    timing: 'st',
    dur: 3.2,
    still: 0.62,
  },

  'hip-thrust': (() => {
    const S = P(70, 124);
    const pA = P(109, 148);
    const pB = P(116, 124);
    const aim = (p: Pt) => {
      const a = deg(Math.atan2(S.y - p.y, S.x - p.x));
      return a < 0 ? a + 360 : a;
    };
    return {
      bones: SIDE_LEG,
      root: [pA, pB] as [Pt, Pt],
      ang: { torso: [aim(pA), aim(pB)], foot: 0 },
      plant: [{ a: 'thigh', b: 'shin', target: P(162, 164), bend: -1 as const }],
      holds: { torso: { kind: 'plate', r: 10, at: 'start' as const } },
      scene: [floor(168), bench(28, 78, 130, 168)],
      ground: 168,
      tx: 6,
      timing: 'ft',
      dur: 3,
      still: 0.39,
    } as Spec;
  })(),

  // abdutora (vista frontal): joelhos abrem (B) e voltam (A)
  abductor: {
    bones: FRONT,
    root: P(120, 104),
    ang: {
      uR: 80, fR: 80, uL: 100, fL: 100,
      tR: [82, 48], sR: [92, 112], tL: [98, 132], sL: [88, 68],
    },
    lens: { tR: 28, tL: 28 },
    holds: { sR: { kind: 'handle', r: 4, at: 'start' }, sL: { kind: 'handle', r: 4, at: 'start' } },
    scene: [...SEAT_FRONT(104), frontShoulders(104)],
    ground: 168,
    timing: 'ft',
    dur: 2.8,
    still: 0.39,
  },

  'kb-swing': {
    bones: SIDE,
    root: [P(84, 100), P(110, 92)],
    ang: { torso: [-38, -92], uarm: [120, 0], farm: [120, -2] },
    plant: [{ a: 'thigh', b: 'shin', target: P(110, 166), bend: -1 }],
    holds: { farm: { kind: 'kb' } },
    scene: [floor(170)],
    ground: 170,
    timing: 'sw',
    dur: 2,
    still: 0.5,
  },

  crunch: {
    bones: SIDE,
    root: P(150, 127),
    ang: { torso: [180, 222], uarm: { r: 25 }, farm: { r: 75 } },
    plant: [{ a: 'thigh', b: 'shin', target: P(192, 128), bend: -1 }],
    scene: [floor(134)],
    ground: 134,
    tx: -24,
    timing: 'ft',
    dur: 2.6,
    still: 0.39,
  },

  'run-fast': runSpec(-72, 0.56),
  'run-easy': runSpec(-82, 0.78),
  'run-long': runSpec(-84, 0.9),

  // mobilidade: de braços para cima até a flexão de tronco, bem devagar
  stretch: {
    bones: SIDE,
    root: [P(110, 94), P(88, 98)],
    ang: { torso: [-90, 30], uarm: [-90, 90], farm: [-90, 90] },
    plant: [{ a: 'thigh', b: 'shin', target: P(110, 166), bend: -1 }],
    scene: [floor(170)],
    ground: 170,
    ty: 22,
    timing: 'sw',
    dur: 7,
    still: 0.5,
  },
};

const RUN_ANIM: Record<string, { kind: 'thigh' | 'knee' | 'arm' | 'elbow'; ph: number }> = {
  thigh: { kind: 'thigh', ph: 0 },
  shin: { kind: 'knee', ph: 0 },
  thigh2: { kind: 'thigh', ph: 0.5 },
  shin2: { kind: 'knee', ph: 0.5 },
  uarm: { kind: 'arm', ph: 0.5 },
  farm: { kind: 'elbow', ph: 0.5 },
  uarm2: { kind: 'arm', ph: 0 },
  farm2: { kind: 'elbow', ph: 0 },
};

function tagRun(nodes: NodeModel[]) {
  for (const n of nodes) {
    n.run = RUN_ANIM[n.name];
    tagRun(n.kids);
  }
}

const cache = new Map<PatternId, DemoModel>();

export function demoModel(id: PatternId): DemoModel {
  let m = cache.get(id);
  if (!m) {
    m = build(id, SPECS[id]);
    if (m.timing === 'run') {
      tagRun(m.nodes);
      m.belt = { dur: r1(m.dur * 0.3) };
    }
    cache.set(id, m);
  }
  return m;
}
