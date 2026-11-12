import type { TrendPoint } from '../../domain';
import { formatDayLong } from '../../lib/format';

/**
 * Los mismos números de la gráfica, en tabla. No es un extra: es lo que leen
 * los lectores de pantalla, y de paso es la superficie que asertan las pruebas
 * (una barra SVG no se puede afirmar; una celda sí).
 */
export const TrendDataTable = ({ points }: { readonly points: readonly TrendPoint[] }) => (
  <table className="tabla-datos">
    <caption>Conceptos entregados por día frente a la meta</caption>
    <thead>
      <tr>
        <th scope="col">Día</th>
        <th scope="col">Entregados</th>
        <th scope="col">Meta</th>
      </tr>
    </thead>
    <tbody>
      {points.map((point) => (
        <tr key={point.date}>
          <th scope="row">{formatDayLong(point.date)}</th>
          <td className="num">{point.delivered}</td>
          <td className="num">{point.goal}</td>
        </tr>
      ))}
    </tbody>
  </table>
);
