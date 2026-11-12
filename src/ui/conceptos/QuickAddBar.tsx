import type { Editor } from '../../domain';
import { Button } from '../primitives/Button';

interface QuickAddBarProps {
  readonly editors: readonly Editor[];
  readonly onAdd: (editorId: Editor['id'], count: number) => void;
}

/**
 * Registrar tiene que ser tan rápido como escribir un número. "+1" crea la
 * tarjeta al instante y el título se pone después (o nunca: lo que cuenta es
 * el conteo).
 */
export const QuickAddBar = ({ editors, onAdd }: QuickAddBarProps) => (
  <div className="quickadd">
    <h2 className="quickadd__title">Registrar concepto</h2>
    <div className="quickadd__grupos">
      {editors.map((editor) => (
        <div className="quickadd__grupo" key={editor.id}>
          <span className="quickadd__nombre">{editor.name}</span>
          <Button
            variant="primary"
            aria-label={`+1 concepto para ${editor.name}`}
            onClick={() => {
              onAdd(editor.id, 1);
            }}
          >
            +1
          </Button>
          <Button
            aria-label={`+4 conceptos para ${editor.name}`}
            onClick={() => {
              onAdd(editor.id, 4);
            }}
          >
            +4
          </Button>
        </div>
      ))}
    </div>
  </div>
);
