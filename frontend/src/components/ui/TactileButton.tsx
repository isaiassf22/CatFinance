import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TactileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'green' | 'coral' | 'blue' | 'gold' | 'gray' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const TactileButton = React.forwardRef<HTMLButtonElement, TactileButtonProps>(
  (
    {
      className,
      variant = 'green',
      size = 'md',
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'font-extrabold rounded-2xl select-none uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all duration-75 active:translate-y-1 active:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:border-b-4';

    const variantStyles = {
      green:
        'bg-duo-green text-white border-b-4 border-duo-greenDark hover:brightness-105 active:border-b-0',
      coral:
        'bg-duo-coral text-white border-b-4 border-duo-coralDark hover:brightness-105 active:border-b-0',
      blue:
        'bg-duo-blue text-white border-b-4 border-duo-blueDark hover:brightness-105 active:border-b-0',
      gold:
        'bg-duo-gold text-white border-b-4 border-duo-goldDark hover:brightness-105 active:border-b-0',
      gray:
        'bg-white text-gray-700 border-2 border-duo-gray border-b-4 border-b-duo-grayDark hover:bg-gray-50 active:border-b-2',
      ghost:
        'bg-transparent text-gray-600 hover:bg-gray-100 border-b-0 active:translate-y-0',
    };

    const sizeStyles = {
      sm: 'text-xs px-3 py-2 rounded-xl border-b-[3px]',
      md: 'text-sm px-5 py-3 rounded-2xl border-b-4',
      lg: 'text-base px-6 py-4 rounded-2xl border-b-4 text-base tracking-wide',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TactileButton.displayName = 'TactileButton';
