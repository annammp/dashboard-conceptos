import { useStore } from '../../state/hooks';
import { selectDayProgress, selectEncouragementFor } from '../../state/selectors';
import { renderMessage } from '../../domain';
import { EditorProgressCard } from './EditorProgressCard';
import { TeamProgressCard } from './TeamProgressCard';

export const ProgressSection = () => {
  const day = useStore(selectDayProgress);
  const teamRule = selectEncouragementFor(day.team, 'team');

  return (
    <div className="progreso-seccion">
      <TeamProgressCard
        stat={day.team}
        tally={day.tally}
        message={renderMessage(teamRule, { missing: day.team.missing })}
      />
      <div className="progreso-seccion__editores">
        {day.editors.map((editor) => (
          <EditorProgressCard key={editor.editorId} progress={editor} />
        ))}
      </div>
    </div>
  );
};
