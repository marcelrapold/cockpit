/**
 * Stateless inline-SVG Sparkline.
 * Server-renderbar, kein Client-JS, kein Chart.js. Pure path data.
 */

type Props = {
  values: number[] | null | undefined;
  width?: number;
  height?: number;
  className?: string;
  ariaLabel?: string;
};

export function Sparkline({
  values,
  width = 64,
  height = 22,
  className = 'text-sky-400/60',
  ariaLabel,
}: Props) {
  if (!values || values.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={className}
        aria-hidden={!ariaLabel}
        aria-label={ariaLabel}
      />
    );
  }
  const pad = 1;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (1 - (v - min) / range) * (height - pad * 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
