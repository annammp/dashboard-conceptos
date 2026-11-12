import type { ReactNode } from 'react';

interface CardProps {
  readonly title?: string;
  readonly action?: ReactNode;
  readonly children: ReactNode;
}

export const Card = ({ title, action, children }: CardProps) => (
  <section className="card">
    {title === undefined ? null : (
      <header className="card__head">
        <h2 className="card__title">{title}</h2>
        {action}
      </header>
    )}
    {children}
  </section>
);
