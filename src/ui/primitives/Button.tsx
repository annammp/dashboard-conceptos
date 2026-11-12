import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: Variant;
  readonly children: ReactNode;
}

export const Button = ({ variant = 'secondary', children, ...rest }: ButtonProps) => (
  <button {...rest} type={rest.type ?? 'button'} className={`btn btn--${variant}`}>
    {children}
  </button>
);
