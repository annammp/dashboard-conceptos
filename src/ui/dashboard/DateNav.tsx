import { addDays, type IsoDate } from '../../domain';
import { formatDayLong } from '../../lib/format';
import { Button } from '../primitives/Button';

interface DateNavProps {
  readonly date: IsoDate;
  readonly today: IsoDate;
  readonly onChange: (date: IsoDate) => void;
}

export const DateNav = ({ date, today, onChange }: DateNavProps) => (
  <div className="fechanav">
    <Button
      variant="ghost"
      aria-label="Día anterior"
      onClick={() => {
        onChange(addDays(date, -1));
      }}
    >
      ←
    </Button>

    <div className="fechanav__centro">
      <h1 className="fechanav__fecha">{formatDayLong(date)}</h1>
      {date === today ? <span className="fechanav__hoy">Hoy</span> : null}
    </div>

    <Button
      variant="ghost"
      aria-label="Día siguiente"
      disabled={date >= today}
      onClick={() => {
        onChange(addDays(date, 1));
      }}
    >
      →
    </Button>

    {date === today ? null : (
      <Button
        onClick={() => {
          onChange(today);
        }}
      >
        Volver a hoy
      </Button>
    )}
  </div>
);
