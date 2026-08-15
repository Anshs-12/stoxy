import { useEffect, useState } from 'react';

/* ─────────────────────────────────────────────────────────
 * LOADING STATE — pixel-grid loader for long-running work
 *
 * Variants:
 *   Drive  — square cells, chevron wavefront driving right
 *   Dots   — same wavefront, circular cells
 *   Orbit  — a comet lapping the grid perimeter
 *
 * Paired with a shimmering label that rotates through a
 * vocabulary of analytical verbs and a live elapsed timer
 * in mono tabular figures. Reduced motion freezes the grid
 * to its dim state; the timer still ticks.
 * ───────────────────────────────────────────────────────── */

const chevron = Array.from({ length: 9 }, (_, i) => {
  const r = Math.floor(i / 3),
    c = i % 3;
  return (c + Math.abs(r - 1)) * 90;
});

const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3];
const orbit = Array.from({ length: 9 }, (_, i) => {
  const k = ORBIT_ORDER.indexOf(i);
  return k === -1 ? null : k * 110;
});

const PATTERNS: Record<string, { delays: (number | null)[]; dur: number; round: boolean }> = {
  Drive: { delays: chevron, dur: 650, round: false },
  Dots: { delays: chevron, dur: 650, round: true },
  Orbit: { delays: orbit, dur: 950, round: false },
};

/* Verbs that describe what the model is allegedly doing right now.
 * Picked at random each ~1.6s so the label feels alive without
 * being distracting. Capitalised for the shimmer-text gradient. */
const VOCAB = [
  'Thinking', 'Working', 'Analyzing', 'Reasoning', 'Synthesizing',
  'Refining', 'Resolving', 'Percolating', 'Parsing', 'Inferring',
  'Correlating', 'Decomposing', 'Reconstructing', 'Converging',
  'Calibrating', 'Distilling', 'Churning', 'Sifting', 'Untangling',
  'Weighing', 'Connecting', 'Reconciling', 'Formulating',
];

function useElapsed() {
  const [ds, setDs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDs((d) => d + 1), 100);
    return () => clearInterval(t);
  }, []);
  const total = ds / 10;
  if (total < 60) return `${total.toFixed(1)}s`;
  return `${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s`;
}

function useRotatingWord(): string {
  const [word, setWord] = useState(() => VOCAB[Math.floor(Math.random() * VOCAB.length)]);
  useEffect(() => {
    const id = setInterval(() => {
      setWord(VOCAB[Math.floor(Math.random() * VOCAB.length)]);
    }, 1600);
    return () => clearInterval(id);
  }, []);
  return word;
}

export function LoadingState({
  variant = 'Drive',
}: {
  variant?: 'Drive' | 'Dots' | 'Orbit';
}) {
  const elapsed = useElapsed();
  const word = useRotatingWord();
  const pattern = PATTERNS[variant] ?? PATTERNS.Drive;
  const { delays, dur, round } = pattern;

  return (
    <div className="flex w-fit items-center gap-2.5">
      <span aria-hidden className="grid grid-cols-[repeat(3,4px)] gap-[1.5px]">
        {delays.map((d, i) => (
          <span
            key={i}
            className={`size-[4px] bg-ink ${round ? 'rounded-full' : 'rounded-[1px]'}`}
            style={{
              opacity: d === null ? 0.07 : 0.15,
              animation: d === null ? 'none' : `pixel-on ${dur}ms ease-in-out ${d}ms infinite`,
            }}
          />
        ))}
      </span>
      <span
        key={word /* re-mount on change so the shimmer animation restarts */}
        className="bg-clip-text text-[13px] font-medium text-transparent"
        style={{
          backgroundImage:
            'linear-gradient(90deg, var(--color-text-muted) 35%, var(--color-text-primary) 50%, var(--color-text-muted) 65%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer-text 1.4s linear infinite',
        }}
      >
        {word}
      </span>
      <span className="font-mono text-[12px] text-muted tabular-nums">{elapsed}</span>
    </div>
  );
}