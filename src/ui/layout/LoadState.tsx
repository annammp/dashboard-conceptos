import { useStore } from '../../state/hooks';
import { selectErrorMessage, selectStatus } from '../../state/selectors';
import { Button } from '../primitives/Button';

interface LoadStateProps {
  readonly onRetry: () => void;
}

/**
 * Un tablero vacío y silencioso es indistinguible de "no hay datos". Si la
 * carga falla se dice, y se ofrece reintentar.
 */
export const LoadState = ({ onRetry }: LoadStateProps) => {
  const status = useStore(selectStatus);
  const errorMessage = useStore(selectErrorMessage);

  if (status === 'loading') return <p className="cargando">Cargando el día…</p>;
  if (status === 'error') {
    return (
      <div className="error-estado" role="alert">
        <p>{errorMessage}</p>
        <Button variant="primary" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    );
  }
  return null;
};
