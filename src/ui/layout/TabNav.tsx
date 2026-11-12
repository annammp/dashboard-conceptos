import { VIEWS, type View } from '../../state/useView';

const LABELS: Readonly<Record<View, string>> = {
  hoy: 'Hoy',
  historial: 'Historial',
  ajustes: 'Ajustes',
};

interface TabNavProps {
  readonly view: View;
  readonly onChange: (view: View) => void;
}

export const TabNav = ({ view, onChange }: TabNavProps) => (
  <nav className="tabs" aria-label="Secciones del dashboard">
    {VIEWS.map((item) => (
      <button
        key={item}
        type="button"
        className="tabs__tab"
        aria-current={item === view ? 'page' : undefined}
        onClick={() => {
          onChange(item);
        }}
      >
        {LABELS[item]}
      </button>
    ))}
  </nav>
);
