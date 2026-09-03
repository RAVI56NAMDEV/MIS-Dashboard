import React, { useMemo } from 'react';
import { ManagementInsight } from '../../types';
import { Sparkles, CheckCircle2, AlertTriangle, TrendingUp, HelpCircle, ArrowRight } from 'lucide-react';

interface ManagementInsightsViewProps {
  insights: ManagementInsight[];
}

export const ManagementInsightsView: React.FC<ManagementInsightsViewProps> = React.memo(({ insights }) => {
  const { critical, warning, positive } = useMemo(() => {
    const c: ManagementInsight[] = [];
    const w: ManagementInsight[] = [];
    const p: ManagementInsight[] = [];
    for (let i = 0; i < insights.length; i++) {
      const ins = insights[i];
      if (ins.type === 'critical') c.push(ins);
      else if (ins.type === 'warning') w.push(ins);
      else if (ins.type === 'positive') p.push(ins);
    }
    return { critical: c, warning: w, positive: p };
  }, [insights]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold border border-blue-400/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">Automated Management Intelligence Briefing</h2>
            <p className="text-xs text-slate-300">Synthesized insights derived from live dataset processing</p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl mt-2">
          This panel dynamically generates strategic observations regarding operational bottlenecks, high-performing hubs,
          faculty efficiency, and placement readiness to support executive decision making.
        </p>
      </div>

      {/* Critical Items Section */}
      {critical.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" /> High Priority Strategic Bottlenecks ({critical.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {critical.map((ins) => (
              <div key={ins.id} className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-2xs space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-neutral-900">{ins.title}</h4>
                  <span className="text-xs font-bold font-mono bg-rose-100 text-rose-800 px-2 py-0.5 rounded-lg">
                    {ins.metricValue}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">{ins.description}</p>
                {ins.actionRecommendation && (
                  <div className="pt-2 border-t border-neutral-100 text-xs text-rose-900 font-medium flex items-start gap-1.5 bg-rose-50/50 p-2.5 rounded-xl">
                    <ArrowRight className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>Action: {ins.actionRecommendation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Trends Section */}
      {warning.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-600" /> Operational Warning & Trend Observations ({warning.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warning.map((ins) => (
              <div key={ins.id} className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-neutral-900">{ins.title}</h4>
                  <span className="text-xs font-bold font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg">
                    {ins.metricValue}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">{ins.description}</p>
                {ins.actionRecommendation && (
                  <div className="pt-2 border-t border-neutral-100 text-xs text-amber-900 font-medium flex items-start gap-1.5 bg-amber-50/50 p-2.5 rounded-xl">
                    <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>Action: {ins.actionRecommendation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positive Achievements Section */}
      {positive.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Operational Highlights & Victories ({positive.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {positive.map((ins) => (
              <div key={ins.id} className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-neutral-900">{ins.title}</h4>
                  <span className="text-xs font-bold font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg">
                    {ins.metricValue}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">{ins.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
