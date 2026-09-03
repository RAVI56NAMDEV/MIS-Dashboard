import React, { useState } from 'react';

interface BarChartItem {
  label: string;
  value: number;
  color?: string;
  subValue?: string;
}

interface BarChartProps {
  data: BarChartItem[];
  title?: string;
  subtitle?: string;
  height?: number;
  valueSuffix?: string;
  horizontal?: boolean;
  targetLine?: number;
  targetLabel?: string;
  onClickItem?: (item: BarChartItem) => void;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  subtitle,
  height = 240,
  valueSuffix = '%',
  horizontal = false,
  targetLine,
  targetLabel,
  onClickItem,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-200 text-neutral-400 text-xs font-medium">
        No chart data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), targetLine || 0, 100);

  if (horizontal) {
    return (
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-2xs">
        {title && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
          </div>
        )}
        <div className="space-y-3.5 mt-2">
          {data.map((item, idx) => {
            const pct = Math.min(100, Math.max(0, (item.value / maxValue) * 100));
            const barColor = item.color || '#3b82f6';
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onClickItem?.(item)}
              >
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-medium text-neutral-700 truncate max-w-[180px] sm:max-w-[240px]">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                    <span>
                      {item.value}
                      {valueSuffix}
                    </span>
                    {item.subValue && <span className="text-[10px] text-neutral-400">({item.subValue})</span>}
                  </div>
                </div>
                <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: barColor,
                      opacity: isHovered ? 0.9 : 1,
                      transform: isHovered ? 'scaleY(1.1)' : 'scaleY(1)',
                    }}
                  />
                  {targetLine !== undefined && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-neutral-900 z-10"
                      style={{ left: `${(targetLine / maxValue) * 100}%` }}
                      title={`Target: ${targetLine}${valueSuffix}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
      {title && (
        <div className="mb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">{title}</h3>
            {targetLabel && targetLine !== undefined && (
              <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-neutral-800 inline-block rounded-full"></span>
                {targetLabel}: {targetLine}{valueSuffix}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
        </div>
      )}

      <div className="relative mt-3 pt-4 pb-2" style={{ height: `${height}px` }}>
        {/* Target Line overlay */}
        {targetLine !== undefined && (
          <div
            className="absolute left-0 right-0 border-t border-dashed border-neutral-800 z-10 flex justify-end"
            style={{ bottom: `${(targetLine / maxValue) * 100}%` }}
          >
            <span className="bg-neutral-800 text-white text-[9px] px-1.5 py-0.5 rounded -mt-2.5 shadow-2xs font-mono">
              {targetLine}{valueSuffix}
            </span>
          </div>
        )}

        <div className="w-full h-full flex items-end justify-between gap-1.5 sm:gap-3">
          {data.map((item, idx) => {
            const heightPct = Math.min(100, Math.max(3, (item.value / maxValue) * 100));
            const barColor = item.color || '#3b82f6';
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onClickItem?.(item)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-10 z-20 bg-neutral-900 text-white text-[10px] py-1 px-2.5 rounded-lg whitespace-nowrap shadow-md font-medium animate-in fade-in zoom-in-95">
                    {item.label}: <span className="font-bold">{item.value}{valueSuffix}</span>
                    {item.subValue && <span className="text-neutral-300 ml-1">({item.subValue})</span>}
                  </div>
                )}

                {/* Top value */}
                <span className={`text-[10px] font-medium transition-colors mb-1 ${isHovered ? 'text-neutral-900 font-bold' : 'text-neutral-500'}`}>
                  {item.value}{valueSuffix}
                </span>

                {/* Bar */}
                <div className="w-full max-w-[36px] bg-neutral-100 rounded-t-lg overflow-hidden flex items-end">
                  <div
                    className="w-full rounded-t-lg transition-all duration-300 ease-out"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: barColor,
                      opacity: isHovered ? 0.85 : 1,
                    }}
                  />
                </div>

                {/* X Axis Label */}
                <span className="text-[10px] text-neutral-600 truncate w-full text-center mt-2 font-medium tracking-tight">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
