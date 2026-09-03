import React, { useState } from 'react';

interface LinePoint {
  label: string;
  value: number;
  subValue?: string;
}

interface LineChartProps {
  data: LinePoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  valueSuffix?: string;
  lineColor?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  subtitle,
  height = 220,
  valueSuffix = '%',
  lineColor = '#4285f4',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-neutral-400 text-xs font-medium">
        No trend data available
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(100, ...values);
  const range = maxVal - minVal || 1;

  const paddingX = 30;
  const paddingY = 25;
  const chartWidth = 500;
  const chartHeight = height;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(1, data.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((d.value - minVal) / range) * (chartHeight - paddingY * 2);
    return { x, y, ...d, index: i };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-2xs">
      {title && (
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
        </div>
      )}

      <div className="relative w-full overflow-x-auto no-scrollbar">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[320px]">
          <defs>
            <linearGradient id={`gradient-${lineColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((pct, idx) => {
            const y = paddingY + pct * (chartHeight - paddingY * 2);
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill={`url(#gradient-${lineColor.replace('#', '')})`} />

          {/* Main Line */}
          <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((p, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill="#ffffff"
                  stroke={lineColor}
                  strokeWidth="2.5"
                  className="transition-all duration-200"
                />
                <text
                  x={p.x}
                  y={chartHeight - 6}
                  textAnchor="middle"
                  className="fill-neutral-500 text-[9px] font-medium"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[11px] py-1 px-3 rounded-lg shadow-md font-medium z-10 flex items-center gap-1.5"
          >
            <span>{points[hoveredIdx].label}:</span>
            <span className="font-bold text-blue-300">
              {points[hoveredIdx].value}
              {valueSuffix}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
