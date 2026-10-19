import { useLocation } from 'react-router-dom';

// Petals drift down when the Calendar opens. Pure CSS animation: the overlay is
// re-created for each visit (new location key), never blocks taps, and is hidden
// entirely when the device asks for reduced motion.

const PETALS = Array.from({ length: 16 }, (_, i) => ({
  x: `${(i * 37 + 5) % 100}%`,
  delay: `${(i % 8) * 90}ms`,
  drift: `${((i % 5) - 2) * 40}px`,
  rot: `${200 + ((i * 47) % 260)}deg`,
  tone: i % 3,
}));

export default function PetalTransition() {
  const { pathname, key } = useLocation();

  if (pathname !== '/calendar') return null;

  return (
    <div className="petals" key={key} aria-hidden="true">
      {PETALS.map((p, i) => (
        <span
          key={i}
          className={`petal petal--${p.tone}`}
          style={{
            '--x': p.x,
            '--d': p.delay,
            '--drift': p.drift,
            '--rot': p.rot,
          }}
        />
      ))}
    </div>
  );
}