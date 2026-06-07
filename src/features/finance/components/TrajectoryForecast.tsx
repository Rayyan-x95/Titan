import { useMemo, useState, useRef } from 'react';
import { TrendingUp, Info } from 'lucide-react';
import { useStore } from '@/core/store';
import { useSettings, formatMoney } from '@/core/settings';
import { generateProjections } from '@/lib/core/projectionEngine';

export function TrajectoryForecast() {
  const accounts = useStore((s) => s.accounts);
  const expenses = useStore((s) => s.expenses);
  const budgets = useStore((s) => s.budgets);
  const sharedExpenses = useStore((s) => s.sharedExpenses);
  const currency = useSettings((s) => s.currency);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Generate 180-day forecast points
  const points = useMemo(() => {
    return generateProjections({
      accounts,
      expenses,
      budgets,
      sharedExpenses,
      daysToProject: 180,
    });
  }, [accounts, expenses, budgets, sharedExpenses]);

  // 2. Math for mapping SVG points
  const { minVal, maxVal } = useMemo(() => {
    if (points.length === 0) return { minVal: 0, maxVal: 100000 };
    let min = Infinity;
    let max = -Infinity;
    points.forEach((p) => {
      min = Math.min(min, p.optimisticBalance, p.pessimisticBalance);
      max = Math.max(max, p.optimisticBalance, p.pessimisticBalance);
    });
    // Add 10% padding to bounds to look cleaner
    const diff = max - min || 100000;
    return {
      minVal: Math.max(0, min - diff * 0.1),
      maxVal: max + diff * 0.1,
    };
  }, [points]);

  const width = 600;
  const height = 220;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const svgPoints = useMemo(() => {
    if (points.length === 0) return { optPath: '', pesPath: '', optFill: '', pesFill: '' };

    const getCoords = (idx: number, val: number) => {
      const x = paddingLeft + (idx / (points.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
      return { x, y };
    };

    const optCoords = points.map((p, idx) => getCoords(idx, p.optimisticBalance));
    const pesCoords = points.map((p, idx) => getCoords(idx, p.pessimisticBalance));

    const optPath = optCoords.reduce(
      (path, c, i) => `${path} ${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`,
      '',
    );
    const pesPath = pesCoords.reduce(
      (path, c, i) => `${path} ${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`,
      '',
    );

    // Fills underneath paths
    const optFill = `${optPath} L ${paddingLeft + chartWidth} ${paddingTop + chartHeight} L ${paddingLeft} ${paddingTop + chartHeight} Z`;
    const pesFill = `${pesPath} L ${paddingLeft + chartWidth} ${paddingTop + chartHeight} L ${paddingLeft} ${paddingTop + chartHeight} Z`;

    return { optPath, pesPath, optFill, pesFill, optCoords, pesCoords };
  }, [points, minVal, maxVal, chartWidth, chartHeight]);

  // 3. Grid line values and labels
  const yGridLines = useMemo(() => {
    const lines = 4;
    const result = [];
    for (let i = 0; i <= lines; i++) {
      const val = minVal + (i / lines) * (maxVal - minVal);
      const y = paddingTop + chartHeight - (i / lines) * chartHeight;
      result.push({ val, y });
    }
    return result;
  }, [minVal, maxVal, chartHeight]);

  // Month labels on X axis
  const xGridLines = useMemo(() => {
    const result = [];
    const step = 30; // Every 30 days (~month)
    for (let i = 0; i < points.length; i += step) {
      const p = points[i];
      const x = paddingLeft + (i / (points.length - 1)) * chartWidth;
      const date = new Date(p.date);
      const label = date.toLocaleDateString(undefined, { month: 'short' });
      result.push({ label, x, idx: i });
    }
    return result;
  }, [points, chartWidth]);

  // 4. Hover handlers
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!containerRef.current || points.length === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert screen coordinates to SVG coordinate ratio
    const svgRatioX = mouseX / rect.width;
    const svgX = svgRatioX * width;

    // Find nearest point index based on SVG X coordinate
    const relativeX = svgX - paddingLeft;
    const ratioX = relativeX / chartWidth;
    const index = Math.max(
      0,
      Math.min(points.length - 1, Math.round(ratioX * (points.length - 1))),
    );

    setHoverIndex(index);
    setTooltipPos({ x: mouseX, y: mouseY });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div
      ref={containerRef}
      className="rounded-[2.5rem] glass-panel p-7 border-white/5 relative overflow-visible"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </span>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              6-Month Cash-Flow Trajectory
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-bold">
            Simulated liquidity curves factoring recurring schedules, splits, and budgets.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-glow" />
            <span className="text-slate-300">Optimistic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-glow-blue" />
            <span className="text-slate-300">Pessimistic</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full h-[220px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="pesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Y Axis Gridlines & Labels */}
          {yGridLines.map((gl, i) => (
            <g key={i} className="opacity-60">
              <line
                x1={paddingLeft}
                y1={gl.y}
                x2={width - paddingRight}
                y2={gl.y}
                className="stroke-white/[0.03]"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={gl.y + 4}
                textAnchor="end"
                className="fill-slate-500 text-[12px] sm:text-[10px] font-bold tracking-tighter"
              >
                {formatMoney(gl.val, currency).split('.')[0]}
              </text>
            </g>
          ))}

          {/* X Axis Labels */}
          {xGridLines.map((gl, i) => (
            <g key={i}>
              <line
                x1={gl.x}
                y1={paddingTop}
                x2={gl.x}
                y2={paddingTop + chartHeight}
                className="stroke-white/[0.015]"
                strokeWidth="1"
              />
              <text
                x={gl.x}
                y={paddingTop + chartHeight + 16}
                textAnchor="middle"
                className="fill-slate-500 text-[12px] sm:text-[10px] font-black uppercase tracking-wider"
              >
                {gl.label}
              </text>
            </g>
          ))}

          {/* Trajectory Curves */}
          {svgPoints.pesPath && (
            <>
              {/* Pessimistic Area */}
              <path d={svgPoints.pesFill} fill="url(#pesGrad)" />
              {/* Pessimistic Stroke */}
              <path
                d={svgPoints.pesPath}
                fill="none"
                className="stroke-blue-500/80 shadow-glow-blue"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Optimistic Area */}
          {svgPoints.optPath && (
            <>
              <path d={svgPoints.optFill} fill="url(#optGrad)" />
              {/* Optimistic Stroke */}
              <path
                d={svgPoints.optPath}
                fill="none"
                className="stroke-cyan-400/90 shadow-glow"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Hover Guides */}
          {hoverIndex !== null && svgPoints.optCoords && svgPoints.pesCoords && (
            <>
              {/* Vertical guideline */}
              <line
                x1={svgPoints.optCoords[hoverIndex].x}
                y1={paddingTop}
                x2={svgPoints.optCoords[hoverIndex].x}
                y2={paddingTop + chartHeight}
                className="stroke-white/10"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Pessimistic Dot */}
              <circle
                cx={svgPoints.pesCoords[hoverIndex].x}
                cy={svgPoints.pesCoords[hoverIndex].y}
                r="5"
                className="fill-blue-500 stroke-slate-950"
                strokeWidth="1.5"
              />

              {/* Optimistic Dot */}
              <circle
                cx={svgPoints.optCoords[hoverIndex].x}
                cy={svgPoints.optCoords[hoverIndex].y}
                r="5"
                className="fill-cyan-400 stroke-slate-950"
                strokeWidth="1.5"
              />
            </>
          )}
        </svg>

        {/* Hover Tooltip Popup Card */}
        {activePoint && (
          <div
            className="absolute z-30 pointer-events-none rounded-2xl border border-white/10 bg-black/80 px-4 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col gap-1 w-44"
            style={{
              left: `${Math.min(tooltipPos.x + 15, containerRef.current ? containerRef.current.clientWidth - 190 : 300)}px`,
              top: `${Math.min(tooltipPos.y - 10, 120)}px`,
            }}
          >
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              {new Date(activePoint.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] font-bold text-slate-400">Optimistic</span>
              <span className="text-xs font-black text-cyan-400">
                {formatMoney(activePoint.optimisticBalance, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-white/5 pt-1 mt-1">
              <span className="text-[9px] font-bold text-slate-400">Pessimistic</span>
              <span className="text-xs font-black text-blue-400">
                {formatMoney(activePoint.pessimisticBalance, currency)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-white/[0.02] border border-white/5 p-3 text-[10px] text-slate-400">
        <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          The <span className="text-cyan-400 font-bold">Optimistic</span> curve assumes variable
          spend is capped under budgets and receivables are fully settled. The{' '}
          <span className="text-blue-400 font-bold">Pessimistic</span> curve simulates a 20% budget
          overrun and ignores pending debt repayments.
        </p>
      </div>
    </div>
  );
}
