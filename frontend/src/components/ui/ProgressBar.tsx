import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  variant?: 'green' | 'blue' | 'gold' | 'coral';
  className?: string;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'green',
  className = '',
  showLabel = false,
}) => {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const colors = {
    green: 'bg-duo-green',
    blue: 'bg-duo-blue',
    gold: 'bg-duo-gold',
    coral: 'bg-duo-coral',
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-black text-gray-500 mb-1">
          <span>Progresso</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className="h-4 w-full bg-duo-gray rounded-full overflow-hidden p-0.5 border border-duo-grayDark/30">
        <div
          className={`h-full rounded-full transition-all duration-300 relative ${colors[variant]}`}
          style={{ width: `${percentage}%` }}
        >
          {/* Glossy shine highlight */}
          <div className="absolute top-0.5 left-1 right-1 h-1 bg-white/40 rounded-full" />
        </div>
      </div>
    </div>
  );
};
