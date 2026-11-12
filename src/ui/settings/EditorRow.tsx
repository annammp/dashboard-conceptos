import type { Editor } from '../../domain';
import { MAX_DAILY_GOAL } from '../../config/defaults';
import { NumberField } from '../primitives/NumberField';
import { Button } from '../primitives/Button';

interface EditorRowProps {
  readonly editor: Editor;
  readonly canWrite: boolean;
  readonly onUpdate: (id: Editor['id'], patch: Partial<Omit<Editor, 'id'>>) => void;
}

export const EditorRow = ({ editor, canWrite, onUpdate }: EditorRowProps) => (
  <li className={`editor-row ${editor.active ? '' : 'editor-row--inactivo'}`}>
    <label className="field editor-row__nombre">
      <span className="field__label">Nombre</span>
      <input
        className="field__input field__input--ancho"
        value={editor.name}
        disabled={!canWrite}
        onChange={(event) => {
          onUpdate(editor.id, { name: event.target.value });
        }}
      />
    </label>

    <NumberField
      label="Meta diaria"
      value={editor.dailyGoal}
      max={MAX_DAILY_GOAL}
      disabled={!canWrite}
      onChange={(dailyGoal) => {
        onUpdate(editor.id, { dailyGoal });
      }}
    />

    {canWrite ? (
      <Button
        onClick={() => {
          onUpdate(editor.id, { active: !editor.active });
        }}
      >
        {editor.active ? 'Desactivar' : 'Reactivar'}
      </Button>
    ) : null}
  </li>
);
