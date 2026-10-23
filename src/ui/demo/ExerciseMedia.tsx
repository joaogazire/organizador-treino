import { STRENGTH, type Exercise } from '../../data/plan';
import { ExerciseDemo } from './ExerciseDemo';

const workoutOf = (e: Exercise) => Object.values(STRENGTH).find((w) => w.exercises.includes(e))?.id ?? '';

/** GIF da execução; sem `gif` no plano, cai na animação SVG. */
export function ExerciseMedia({ exercise }: { exercise: Exercise }) {
  const src = exercise.gif && (/^https?:/.test(exercise.gif) ? exercise.gif : `${import.meta.env.BASE_URL}${exercise.gif}`);
  return (
    <div class="media">
      {src ? (
        <img src={src} alt={`Execução: ${exercise.name}`} loading="lazy" decoding="async" />
      ) : (
        <ExerciseDemo exerciseId={exercise.id} workout={workoutOf(exercise)} />
      )}
    </div>
  );
}
