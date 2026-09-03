import React, { useState } from 'react';

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  title?: string;
  subtitle?: string;
  centerText?: string;
  centerLabel?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  subtitle,
  centerText,
  centerLabel,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((acc, d) => acc + d.value, 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-neutral-400 text-xs font-medium">
        No distribution data
      </div>
    );
  }

  const radius = 48;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;

  let accumulatedAngle = 0;

  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const dashArray = `${pct * circumference} ${circumference}`;
    const dashOffset = -accumulatedAngle * circumference;
    accumulatedAngle += pct;

    return {
      ...d,
      pct: Math.round(pct * 100),
      dashArray,
      dashOffset,
      index: i,
    };
  });

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-2xs flex flex-col h-full justify-between overflow-hidden w-full min-w-0">
      {title && (
        <div className="mb-2 w-full min-w-0">
          <h3 className="text-sm font-semibold text-neutral-900 tracking-tight truncate">{title}</h3>
          {subtitle && <p className="text-xs text-neutral-500 truncate">{subtitle}</p>}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-around gap-3 sm:gap-4 my-2 w-full min-w-0 overflow-hidden">
        {/* SVG Circle */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 130 130" className="w-full h-full transform -rotate-90">
            {slices.map((slice) => {
              const isHovered = hoveredIdx === slice.index;
              return (
                <circle
                  key={slice.index}
                  cx="65"
                  cy="65"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={slice.dashArray}
                  strokeDashoffset={slice.dashOffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(slice.index)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
            <span className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight leading-none">
              {hoveredIdx !== null ? slices[hoveredIdx].value : centerText || total}
            </span>
            <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold mt-0.5">
              {hoveredIdx !== null ? slices[hoveredIdx].label : centerLabel || 'Total'}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 w-full sm:w-auto min-w-0 shrink">
          {slices.map((slice) => {
            const isHovered = hoveredIdx === slice.index;
            return (
              <div
                key={slice.index}
                className={`flex items-center justify-between gap-3 text-xs p-1.5 rounded-lg cursor-pointer transition-colors w-full min-w-0 ${
                  isHovered ? 'bg-neutral-100 font-semibold' : 'hover:bg-neutral-50'
                }`}
                onMouseEnter={() => setHoveredIdx(slice.index)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className="flex items-center gap-2 min-w-0 truncate">
                  <span className="w-2.5 h-2.5 rounded-md shrink-0" style={{ backgroundColor: slice.color }} />
                  <span className="text-neutral-700 font-medium truncate text-xs">{slice.label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-xs ml-2">
                  <span className="font-bold text-neutral-900">{slice.value}</span>
                  <span className="text-[10px] text-neutral-400 font-normal">({slice.pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
