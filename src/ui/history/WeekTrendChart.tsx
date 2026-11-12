import type { TrendPoint } from '../../domain';
import { formatDayShort } from '../../lib/format';

const WIDTH = 700;
const HEIGHT = 200;
const PAD = { top: 12, right: 8, bottom: 26, left: 28 };

interface WeekTrendChartProps {
  readonly points: readonly TrendPoint[];
}

/**
 * SVG a mano en vez de una librería de gráficas: para ≤31 puntos no justifica
 * ~95 kB de bundle, y así usa los tokens del design system y controlamos la
 * accesibilidad. Los días cumplidos se distinguen por color **y** por trama.
 */
export const WeekTrendChart = ({ points }: WeekTrendChartProps) => {
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const top = Math.max(1, ...points.map((p) => Math.max(p.delivered, p.goal)));
  const step = plotW / Math.max(1, points.length);
  const barW = Math.min(44, step * 0.56);
  const y = (value: number): number => PAD.top + plotH - (value / top) * plotH;

  return (
    <svg
      className="grafica"
      viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`}
      role="img"
      aria-label={`Entregados por día frente a la meta, ${String(points.length)} días`}
    >
      <defs>
        <pattern id="trama-ok" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" className="grafica__barra--ok" />
          <line x1="0" y1="0" x2="0" y2="6" className="grafica__trama" />
        </pattern>
      </defs>

      <line x1={PAD.left} y1={PAD.top + plotH} x2={WIDTH - PAD.right} y2={PAD.top + plotH} className="grafica__eje" />

      {points.map((point, index) => {
        const cx = PAD.left + index * step + step / 2;
        const barTop = y(point.delivered);
        return (
          <g key={point.date}>
            <rect
              x={cx - barW / 2}
              y={barTop}
              width={barW}
              height={Math.max(0, PAD.top + plotH - barTop)}
              rx="2"
              fill={point.met ? 'url(#trama-ok)' : undefined}
              className={point.met ? undefined : 'grafica__barra'}
            >
              <title>{`${formatDayShort(point.date)}: ${String(point.delivered)} de ${String(point.goal)}`}</title>
            </rect>
            <line x1={cx - barW / 2 - 4} y1={y(point.goal)} x2={cx + barW / 2 + 4} y2={y(point.goal)} className="grafica__meta" />
            <text x={cx} y={HEIGHT - 8} textAnchor="middle" className="grafica__etiqueta">
              {formatDayShort(point.date)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
