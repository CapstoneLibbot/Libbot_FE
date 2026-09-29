import { ButtonHTMLAttributes, PropsWithChildren } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'success' | 'ghost';
}

export function Button({ variant = 'default', className = '', children, ...props }: PropsWithChildren<ButtonProps>) {
  const classes = ['button', variant, className].filter(Boolean).join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
