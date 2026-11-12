import { useActions, useStore } from '../../state/hooks';
import { selectNotice } from '../../state/selectors';

/** Avisos efímeros (un error de escritura). `role="status"` para que se anuncie. */
export const Notice = () => {
  const notice = useStore(selectNotice);
  const actions = useActions();
  if (notice === null) return null;

  return (
    <div className="notice" role="status">
      <span>{notice}</span>
      <button type="button" className="notice__cerrar" onClick={actions.dismissNotice}>
        Cerrar
      </button>
    </div>
  );
};
