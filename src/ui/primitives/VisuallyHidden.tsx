import type { ReactNode } from 'react';

/** Visible para lectores de pantalla, invisible en pantalla. */
export const VisuallyHidden = ({ children }: { readonly children: ReactNode }) => (
  <span className="sr-only">{children}</span>
);
