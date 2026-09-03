import React from 'react';

interface GaugeChartProps {
  value: number; // 0 to 100
  title: string;
  subtitle?: string;
  threshold?: number;
  color?: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  title,
  subtitle,
  threshold = 50,
  color,
}) => {
  const boundedVal = Math.min(100, Math.max(0, value));
  const autoColor = color || (boundedVal >= threshold ? '#34a853' : '#ea4335');

  const radius = 50;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (boundedVal / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-2xs flex flex-col items-center justify-between text-center">
      <div>
        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{title}</h4>
        {subtitle && <p className="text-[11px] text-neutral-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="relative w-36 h-20 my-3 flex items-end justify-center overflow-hidden">
        <svg viewBox="0 0 120 65" className="w-full h-full">
          {/* Background Arc */}
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Progress Arc */}
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke={autoColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute bottom-0 text-center">
          <span className="text-2xl font-bold text-neutral-900 tracking-tight">{Math.round(boundedVal * 10) / 10}%</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: autoColor }} />
        <span>Target: {threshold}%</span>
      </div>
    </div>
  );
};
