// Small decorative SVGs. All are aria-hidden (purely decorative) and use theme tokens.

export function Flower({ size = 48, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse
          key={r}
          cx="24"
          cy="12"
          rx="7"
          ry="11"
          fill="var(--primary)"
          opacity="0.85"
          transform={`rotate(${r} 24 24)`}
        />
      ))}
      <circle cx="24" cy="24" r="6" fill="var(--butter-300)" />
    </svg>
  );
}

export function Sparkle({ size = 20, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6Z" fill="var(--butter-300)" />
    </svg>
  );
}

export function Heart({ size = 18, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="var(--rose-400)" />
    </svg>
  );
}