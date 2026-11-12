import { useState } from 'react';
import { DEFAULT_DAILY_GOAL, MAX_DAILY_GOAL } from '../../config/defaults';
import { Button } from '../primitives/Button';
import { NumberField } from '../primitives/NumberField';

interface AddEditorFormProps {
  readonly onAdd: (name: string, dailyGoal: number) => void;
}

export const AddEditorForm = ({ onAdd }: AddEditorFormProps) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState(DEFAULT_DAILY_GOAL);
  const trimmed = name.trim();

  return (
    <form
      className="alta-editor"
      onSubmit={(event) => {
        event.preventDefault();
        if (trimmed === '') return;
        onAdd(trimmed, goal);
        setName('');
        setGoal(DEFAULT_DAILY_GOAL);
      }}
    >
      <label className="field">
        <span className="field__label">Nombre del editor</span>
        <input
          className="field__input field__input--ancho"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
      </label>
      <NumberField label="Meta diaria" value={goal} max={MAX_DAILY_GOAL} onChange={setGoal} />
      <Button type="submit" variant="primary" disabled={trimmed === ''}>
        Agregar editor
      </Button>
    </form>
  );
};
