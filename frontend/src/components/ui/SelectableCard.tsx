import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Check } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SelectableCardProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  selected?: boolean;
  completed?: boolean;
  variant?: 'green' | 'blue' | 'coral' | 'gold';
  badge?: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const SelectableCard: React.FC<SelectableCardProps> = ({
  icon,
  title,
  subtitle,
  selected = false,
  completed = false,
  variant = 'blue',
  badge,
  onClick,
  className,
  children,
}) => {
  const borderVariants = {
    green: selected
      ? 'border-duo-green border-b-duo-greenDark bg-green-50/40'
      : 'border-duo-gray border-b-duo-grayDark hover:border-duo-green/60',
    blue: selected
      ? 'border-duo-blue border-b-duo-blueDark bg-blue-50/40'
      : 'border-duo-gray border-b-duo-grayDark hover:border-duo-blue/60',
    coral: selected
      ? 'border-duo-coral border-b-duo-coralDark bg-red-50/40'
      : 'border-duo-gray border-b-duo-grayDark hover:border-duo-coral/60',
    gold: selected
      ? 'border-duo-gold border-b-duo-goldDark bg-amber-50/40'
      : 'border-duo-gray border-b-duo-grayDark hover:border-duo-gold/60',
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'relative bg-white rounded-2xl border-2 border-b-4 p-4 transition-all duration-100 select-none text-left',
        onClick && 'cursor-pointer active:translate-y-0.5 active:border-b-2',
        borderVariants[variant],
        className
      )}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center p-2 text-gray-700 shadow-sm border border-gray-100">
            {icon}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-base text-gray-800 truncate">
              {title}
            </h3>
            {badge && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-duo-gold/20 text-duo-goldDark">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-duo-grayText font-semibold mt-0.5 line-clamp-2">
              {subtitle}
            </p>
          )}
          {children}
        </div>

        {completed && (
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-duo-green text-white flex items-center justify-center shadow-sm">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
        )}
      </div>
    </div>
  );
};
