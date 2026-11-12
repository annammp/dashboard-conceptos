import type { EncouragementRule } from '../../domain';

interface EncouragementBannerProps {
  readonly message: string;
  readonly tone: EncouragementRule['tone'];
}

/**
 * `aria-live="polite"` para que quien usa lector de pantalla también se entere
 * de que ya casi se cumple la meta, sin interrumpir lo que esté haciendo.
 */
export const EncouragementBanner = ({ message, tone }: EncouragementBannerProps) => (
  <p className={`aliento aliento--${tone}`} aria-live="polite">
    {message}
  </p>
);
