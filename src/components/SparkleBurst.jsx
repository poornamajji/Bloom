// A one-time burst of sparkles. It plays when mounted, so give it a changing key to replay.

const SPARKS = Array.from({ length: 6 }, (_, i) => {
  const angle = (i / 6) * Math.PI * 2;

  return {
    dx: `${Math.round(Math.cos(angle) * 26)}px`,
    dy: `${Math.round(Math.sin(angle) * 26)}px`,
  };
});

export default function SparkleBurst() {
  return (
    <span className="spark-burst" aria-hidden="true">
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="spark"
          style={{ '--dx': s.dx, '--dy': s.dy }}
        />
      ))}
    </span>
  );
}