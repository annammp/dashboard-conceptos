import { computeTeamGoal } from '../../domain';
import { useActions, useStore } from '../../state/hooks';
import { selectCanWrite, selectSortedEditors } from '../../state/selectors';
import { Card } from '../primitives/Card';
import { AddEditorForm } from './AddEditorForm';
import { EditorRow } from './EditorRow';
import { TeamGoalEditor } from './TeamGoalEditor';

export const SettingsView = () => {
  const editors = useStore(selectSortedEditors);
  const settings = useStore((state) => state.settings);
  const canWrite = useStore(selectCanWrite);
  const actions = useActions();

  const derived = computeTeamGoal(
    editors.filter((editor) => editor.active).map((editor) => editor.dailyGoal),
    null,
  );

  return (
    <div className="vista">
      <Card title="Editores">
        <ul className="editor-lista">
          {editors.map((editor) => (
            <EditorRow
              key={editor.id}
              editor={editor}
              canWrite={canWrite}
              onUpdate={(id, patch) => void actions.updateEditor(id, patch)}
            />
          ))}
        </ul>
        <p className="nota">
          Quitar a alguien es desactivarlo: así no se pierde lo que ya entregó.
        </p>
        {canWrite ? (
          <AddEditorForm onAdd={(name, goal) => void actions.addEditor(name, goal)} />
        ) : null}
      </Card>

      <Card title="Meta de equipo">
        <TeamGoalEditor
          derived={derived}
          override={settings.teamGoalOverride}
          canWrite={canWrite}
          onChange={(override) => void actions.setTeamGoalOverride(override)}
        />
      </Card>
    </div>
  );
};
