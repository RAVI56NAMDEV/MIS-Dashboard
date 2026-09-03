import React, { useState } from 'react';

export interface StackedSeries {
  key: string;
  label: string;
  color: string;
}

export interface StackedBarItem {
  category: string;
  values: Record<string, number>;
}

interface StackedBarChartProps {
  data: StackedBarItem[];
  series: StackedSeries[];
  title?: string;
  subtitle?: string;
  height?: number;
}

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  data,
  series,
  title,
  subtitle,
  height = 240,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-neutral-400 text-xs font-medium">
        No comparison data
      </div>
    );
  }

  const totals = data.map((d) => series.reduce((sum, s) => sum + (d.values[s.key] || 0), 0));
  const maxTotal = Math.max(...totals, 1);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-2xs">
      {title && (
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
        </div>
      )}

      {/* Series Legend */}
      <div className="flex flex-wrap items-center gap-4 my-2 text-xs">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: s.color }} />
            <span className="text-neutral-600 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="relative mt-4 pt-4 pb-2" style={{ height: `${height}px` }}>
        <div className="w-full h-full flex items-end justify-between gap-2 sm:gap-4">
          {data.map((item, idx) => {
            const itemTotal = totals[idx];
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 z-20 bg-neutral-900 text-white text-[10px] py-1.5 px-3 rounded-lg shadow-lg whitespace-nowrap font-medium">
                    <div className="font-bold border-b border-neutral-700 pb-0.5 mb-1">{item.category}</div>
                    {series.map((s) => (
                      <div key={s.key} className="flex justify-between gap-3 text-neutral-300">
                        <span>{s.label}:</span>
                        <span className="font-semibold text-white">{item.values[s.key] || 0}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total label */}
                <span className="text-[10px] font-semibold text-neutral-600 mb-1">{itemTotal}</span>

                {/* Stacked Bar Container */}
                <div className="w-full max-w-[32px] bg-neutral-100 rounded-t-md overflow-hidden flex flex-col-reverse" style={{ height: `${(itemTotal / maxTotal) * 100}%` }}>
                  {series.map((s) => {
                    const val = item.values[s.key] || 0;
                    if (val <= 0) return null;
                    const pct = (val / itemTotal) * 100;
                    return (
                      <div
                        key={s.key}
                        className="w-full transition-opacity duration-200"
                        style={{
                          height: `${pct}%`,
                          backgroundColor: s.color,
                          opacity: isHovered ? 0.85 : 1,
                        }}
                      />
                    );
                  })}
                </div>

                {/* Label */}
                <span className="text-[10px] text-neutral-600 truncate w-full text-center mt-2 font-medium">
                  {item.category}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
