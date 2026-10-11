// Conteúdo do método (fonte: docs/treino-hibrido.md). Trocar o plano = mexer só neste arquivo.

export type DayTypeId =
  | 'casa-1'
  | 'casa-2'
  | 'casa-2-consecutivo'
  | 'escritorio-1'
  | 'escritorio-2'
  | 'flexivel'
  | 'longo'
  | 'sabado-com-pernas'
  | 'descanso';

export type StrengthWorkoutId = 'superior-a' | 'superior-b' | 'peito-extra' | 'pernas-a' | 'pernas-b';
export type RunWorkoutId = 'tiros' | 'rodagem-leve' | 'longo';
export type WorkoutId = StrengthWorkoutId | RunWorkoutId | 'mobilidade';

export type Slot = 'manha' | 'tarde' | 'noite';

export const SLOT_LABEL: Record<Slot, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };

export interface SessionPlan {
  slot: Slot;
  workout: WorkoutId;
  optional?: boolean;
}

export interface DayType {
  id: DayTypeId;
  name: string;
  sessions: SessionPlan[];
  note?: string;
}

export const DAY_TYPES: Record<DayTypeId, DayType> = {
  'casa-1': {
    id: 'casa-1',
    name: 'Casa 1',
    sessions: [
      { slot: 'manha', workout: 'tiros' },
      { slot: 'noite', workout: 'pernas-a' },
    ],
  },
  'casa-2': {
    id: 'casa-2',
    name: 'Casa 2',
    sessions: [
      { slot: 'manha', workout: 'rodagem-leve' },
      { slot: 'noite', workout: 'pernas-b' },
    ],
  },
  'casa-2-consecutivo': {
    id: 'casa-2-consecutivo',
    name: 'Casa 2 (dia seguido)',
    sessions: [
      { slot: 'manha', workout: 'rodagem-leve' },
      { slot: 'noite', workout: 'superior-a' },
    ],
  },
  'escritorio-1': {
    id: 'escritorio-1',
    name: 'Escritório 1',
    sessions: [{ slot: 'noite', workout: 'superior-a' }],
  },
  'escritorio-2': {
    id: 'escritorio-2',
    name: 'Escritório 2',
    sessions: [{ slot: 'noite', workout: 'superior-b' }],
  },
  flexivel: {
    id: 'flexivel',
    name: 'Flexível',
    sessions: [{ slot: 'noite', workout: 'peito-extra', optional: true }],
    note: 'Peito extra só se tiver energia; senão, descanso.',
  },
  longo: {
    id: 'longo',
    name: 'Longo',
    sessions: [{ slot: 'manha', workout: 'longo' }],
  },
  'sabado-com-pernas': {
    id: 'sabado-com-pernas',
    name: 'Sábado com pernas',
    sessions: [
      { slot: 'manha', workout: 'longo' },
      { slot: 'tarde', workout: 'pernas-b' },
    ],
  },
  descanso: {
    id: 'descanso',
    name: 'Descanso',
    sessions: [{ slot: 'manha', workout: 'mobilidade', optional: true }],
    note: 'Dia de recuperar. Sono de 7–9 h.',
  },
};

// ---------- Musculação ----------

export interface Exercise {
  id: string;
  name: string;
  equipment: string;
  sets: number;
  /** Faixa de reps (ou segundos, se `unit === 's'`). `null` = "até faltar 2 reps". */
  min: number | null;
  max: number | null;
  unit: 'reps' | 's';
  perSide?: boolean;
  compound: boolean;
  /** Usa halteres (limite de 10 kg em casa). */
  dumbbell?: boolean;
  /** Kettlebell: carga em saltos grandes, progride por reps/tempo. */
  kettlebell?: boolean;
  /** Exercício só de peso corporal / sem carga a registrar. */
  bodyweight?: boolean;
  tip?: string;
}

export interface StrengthWorkout {
  id: StrengthWorkoutId;
  name: string;
  subtitle: string;
  minutes: string;
  exercises: Exercise[];
}

const ex = (e: Exercise) => e;

export const STRENGTH: Record<StrengthWorkoutId, StrengthWorkout> = {
  'superior-a': {
    id: 'superior-a',
    name: 'Superior A',
    subtitle: 'Peito em foco',
    minutes: '50 min',
    exercises: [
      ex({ id: 'supino-inclinado-barra', name: 'Supino inclinado com barra', equipment: 'Rack + banco livre a 30° + barra longa', sets: 4, min: 6, max: 8, unit: 'reps', compound: true }),
      ex({ id: 'supino-reto-barra', name: 'Supino reto com barra', equipment: 'Rack + banco livre + barra longa', sets: 3, min: 6, max: 8, unit: 'reps', compound: true }),
      ex({ id: 'crucifixo-halteres', name: 'Crucifixo com halteres', equipment: 'Banco livre plano + halteres', sets: 3, min: 12, max: 15, unit: 'reps', compound: false, dumbbell: true, tip: 'Descida em 3 s' }),
      ex({ id: 'desenvolvimento-maquina', name: 'Desenvolvimento', equipment: 'Supino máquina a 90°', sets: 2, min: 8, max: 10, unit: 'reps', compound: true }),
      ex({ id: 'elevacao-lateral', name: 'Elevação lateral', equipment: 'Halteres', sets: 3, min: 12, max: 20, unit: 'reps', compound: false, dumbbell: true }),
      ex({ id: 'triceps-polia', name: 'Tríceps na polia', equipment: 'Puxada alta + corda', sets: 3, min: 10, max: 15, unit: 'reps', compound: false }),
    ],
  },
  'superior-b': {
    id: 'superior-b',
    name: 'Superior B',
    subtitle: 'Puxar + peito',
    minutes: '50 min',
    exercises: [
      ex({ id: 'puxada-aberta', name: 'Puxada alta pegada aberta', equipment: 'Polia + barra reta', sets: 4, min: 8, max: 10, unit: 'reps', compound: true }),
      ex({ id: 'supino-maquina-inclinado', name: 'Supino máquina inclinado', equipment: 'Supino máquina a 30–45°', sets: 3, min: 8, max: 12, unit: 'reps', compound: true }),
      ex({ id: 'remada-baixa', name: 'Remada baixa', equipment: 'Polia + triângulo', sets: 3, min: 8, max: 12, unit: 'reps', compound: true }),
      ex({ id: 'remada-curvada', name: 'Remada curvada', equipment: 'Barra livre + anilhas', sets: 3, min: 8, max: 10, unit: 'reps', compound: true }),
      ex({ id: 'face-pull', name: 'Face pull', equipment: 'Polia alta + corda', sets: 3, min: 12, max: 15, unit: 'reps', compound: false }),
      ex({ id: 'rosca-direta', name: 'Rosca direta', equipment: 'Barra curta + anilhas', sets: 3, min: 8, max: 12, unit: 'reps', compound: false }),
    ],
  },
  'peito-extra': {
    id: 'peito-extra',
    name: 'Peito extra',
    subtitle: 'Opcional',
    minutes: '25–30 min',
    exercises: [
      ex({ id: 'supino-maquina', name: 'Supino máquina', equipment: 'Supino máquina a 30°', sets: 3, min: 10, max: 12, unit: 'reps', compound: true }),
      ex({ id: 'flexao-declinada', name: 'Flexão declinada', equipment: 'Pés no banco livre', sets: 3, min: null, max: null, unit: 'reps', compound: false, bodyweight: true, tip: 'Até faltar 2 reps' }),
      ex({ id: 'crucifixo-inclinado', name: 'Crucifixo inclinado com halteres', equipment: 'Banco livre a 30° + halteres', sets: 2, min: 15, max: 15, unit: 'reps', compound: false, dumbbell: true }),
    ],
  },
  'pernas-a': {
    id: 'pernas-a',
    name: 'Pernas A',
    subtitle: 'Força, quadríceps',
    minutes: '55–65 min',
    exercises: [
      ex({ id: 'agachamento-livre', name: 'Agachamento livre', equipment: 'Rack + barra longa', sets: 4, min: 5, max: 7, unit: 'reps', compound: true }),
      ex({ id: 'afundo-bulgaro', name: 'Afundo búlgaro', equipment: 'Banco + halteres de 10 kg', sets: 3, min: 10, max: 12, unit: 'reps', perSide: true, compound: true, dumbbell: true, tip: 'Ficou fácil: barra nas costas' }),
      ex({ id: 'goblet-pausa', name: 'Agachamento goblet com pausa', equipment: 'Kettlebell', sets: 3, min: 12, max: 15, unit: 'reps', compound: false, kettlebell: true, tip: 'Pausa de 2 s embaixo' }),
      ex({ id: 'mesa-flexora', name: 'Mesa flexora', equipment: 'Máquina', sets: 3, min: 10, max: 12, unit: 'reps', compound: false }),
      ex({ id: 'panturrilha-unilateral', name: 'Panturrilha unilateral em degrau', equipment: 'Halter de 10 kg', sets: 4, min: 12, max: 15, unit: 'reps', perSide: true, compound: false, dumbbell: true }),
      ex({ id: 'prancha', name: 'Prancha', equipment: 'Estofado', sets: 3, min: 40, max: 60, unit: 's', compound: false, bodyweight: true }),
    ],
  },
  'pernas-b': {
    id: 'pernas-b',
    name: 'Pernas B',
    subtitle: 'Posterior, glúteo, core',
    minutes: '55–65 min',
    exercises: [
      ex({ id: 'terra-romeno', name: 'Levantamento terra romeno', equipment: 'Barra longa + anilhas', sets: 4, min: 6, max: 8, unit: 'reps', compound: true }),
      ex({ id: 'hip-thrust', name: 'Elevação pélvica (hip thrust)', equipment: 'Banco livre + barra + estofado no quadril', sets: 3, min: 8, max: 10, unit: 'reps', compound: true }),
      ex({ id: 'flexora', name: 'Cadeira ou mesa flexora', equipment: 'Máquina', sets: 3, min: 10, max: 12, unit: 'reps', compound: false }),
      ex({ id: 'abdutora', name: 'Abdutora', equipment: 'Máquina', sets: 3, min: 15, max: 20, unit: 'reps', compound: false }),
      ex({ id: 'kb-swing', name: 'Kettlebell swing', equipment: 'Kettlebell', sets: 3, min: 15, max: 15, unit: 'reps', compound: false, kettlebell: true }),
      ex({ id: 'abdominal', name: 'Abdominal declinado + na polia', equipment: 'Banco negativo / polia + corda', sets: 3, min: 12, max: 12, unit: 'reps', compound: false, tip: '12 de cada' }),
    ],
  },
};

/** Exercícios de peito (para contar volume semanal). */
export const CHEST_EXERCISES = new Set([
  'supino-inclinado-barra',
  'supino-reto-barra',
  'crucifixo-halteres',
  'supino-maquina-inclinado',
  'supino-maquina',
  'flexao-declinada',
  'crucifixo-inclinado',
]);

export const LEG_WORKOUTS = new Set<WorkoutId>(['pernas-a', 'pernas-b']);

const LEG_EXERCISES = new Set(Object.values(STRENGTH).filter((w) => LEG_WORKOUTS.has(w.id)).flatMap((w) => w.exercises.map((e) => e.id)));
export const isLegExercise = (exerciseId: string) => LEG_EXERCISES.has(exerciseId);

/** Base de calibração do método: 5 km em 30 min (10 km/h). */
export const BASE_5K_SPEED = 10;
export const BASE_TIRO_SPEED = 12.25;
export const BASE_EASY_SPEED = 9.25;
/** Aumento de km semanal acima disso conta como "corrida aumentou" para a regra de ouro. */
export const RUN_JUMP_THRESHOLD = 0.1;

export const DUMBBELL_MAX_KG = 10;

// ---------- Corrida ----------

export const RUN_INFO: Record<RunWorkoutId, { name: string; zone: string; note: string }> = {
  tiros: { name: 'Tiros', zone: 'Z4 — só palavras soltas', note: 'Esteira com inclinação 1%. Descanso entre tiros: caminhada a 5–6 km/h.' },
  'rodagem-leve': { name: 'Rodagem leve', zone: 'Z2 — conversa em frases completas', note: 'Canela ou joelho reclamando: troque por 40–50 min de elíptico ou bike na mesma zona.' },
  longo: { name: 'Longo', zone: 'Z2, sem passar da Z3', note: 'Esteira ou rua.' },
};

export const MOBILITY = { name: 'Mobilidade', minutes: 20, note: 'Opcional — 20 min soltando quadril, tornozelo, coluna torácica e ombros.' };

export interface WeekProgression {
  week: number;
  /** `null` na semana 8 (teste de 5 km). */
  tiros: { reps: number; meters: number; restSec: number } | null;
  rodagemKm: number;
  longoKm: number;
  totalKm: number;
  strength: string;
  /** Semana de deload: metade das séries. */
  halfSets: boolean;
  label?: string;
}

export const PROGRESSION: WeekProgression[] = [
  { week: 1, tiros: { reps: 6, meters: 600, restSec: 120 }, rodagemKm: 6, longoKm: 7, totalKm: 20.5, strength: 'Cargas atuais, RIR 2', halfSets: false },
  { week: 2, tiros: { reps: 5, meters: 800, restSec: 120 }, rodagemKm: 6, longoKm: 8, totalKm: 22, strength: 'RIR 2', halfSets: false },
  { week: 3, tiros: { reps: 4, meters: 1000, restSec: 180 }, rodagemKm: 7, longoKm: 9, totalKm: 24, strength: 'RIR 1–2', halfSets: false },
  { week: 4, tiros: { reps: 6, meters: 400, restSec: 90 }, rodagemKm: 5, longoKm: 6, totalKm: 17.5, strength: 'Metade das séries, mesma carga', halfSets: true, label: 'leve' },
  { week: 5, tiros: { reps: 6, meters: 800, restSec: 120 }, rodagemKm: 7, longoKm: 10, totalKm: 26, strength: 'Cargas acima da semana 3', halfSets: false },
  { week: 6, tiros: { reps: 5, meters: 1000, restSec: 180 }, rodagemKm: 7.5, longoKm: 11, totalKm: 27.5, strength: 'RIR 1–2', halfSets: false },
  { week: 7, tiros: { reps: 3, meters: 1600, restSec: 180 }, rodagemKm: 8, longoKm: 12, totalKm: 29, strength: 'RIR 1 nos compostos', halfSets: false },
  { week: 8, tiros: null, rodagemKm: 5, longoKm: 7, totalKm: 20, strength: 'Metade das séries; anote as cargas máximas da semana 7', halfSets: true, label: 'teste' },
];

export const TIROS_WARMUP_MIN = 10;
export const TIROS_COOLDOWN_MIN = 10;
/** km de aquecimento + desaquecimento dos tiros (para totais). */
export const TIROS_EXTRA_KM = 4;

export const GOLDEN_RULES = [
  'Nunca aumentar corrida e carga de perna na mesma semana.',
  'Leve é leve: a maior parte da corrida em Z2.',
  'Perna nunca em dia de escritório.',
  'Dor de lado: reduza o ritmo e controle a respiração.',
  'Dor que piora durante a corrida ou muda a pisada: pare e procure um profissional.',
  'Sono de 7–9 h.',
  'Proteína 1,6–2,2 g/kg/dia, carbo antes dos tiros e do longo, boa hidratação.',
];

export function workoutName(id: WorkoutId): string {
  if (id === 'mobilidade') return MOBILITY.name;
  if (id in STRENGTH) return STRENGTH[id as StrengthWorkoutId].name;
  return RUN_INFO[id as RunWorkoutId].name;
}

export function isStrength(id: WorkoutId): id is StrengthWorkoutId {
  return id in STRENGTH;
}

export function isRun(id: WorkoutId): id is RunWorkoutId {
  return id in RUN_INFO;
}
