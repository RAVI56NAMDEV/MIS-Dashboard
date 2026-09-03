import React, { useMemo } from 'react';
import { StudentRecord, BatchRecord, CentreRecord, TrainerRecord, ConfigThresholds } from '../../types';
import { BarChart } from '../charts/BarChart';
import { LineChart } from '../charts/LineChart';
import { DonutChart } from '../charts/DonutChart';
import { UserX, UserCheck, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DropoutAnalysisViewProps {
  students: StudentRecord[];
  batches: BatchRecord[];
  centres: CentreRecord[];
  trainers: TrainerRecord[];
  thresholds: ConfigThresholds;
}

export const DropoutAnalysisView: React.FC<DropoutAnalysisViewProps> = React.memo(({
  students,
  batches,
  centres,
  trainers,
  thresholds,
}) => {
  const totalStudents = students.length;

  const {
    dropoutCount,
    dropoutPct,
    activeStudents,
    completedStudents,
    monthlyDropoutTrend,
    dropoutReasonData,
  } = useMemo(() => {
    let dropouts = 0;
    let active = 0;
    let completed = 0;
    const mmap = new Map<string, { total: number; dropouts: number }>();
    const typeMap = new Map<string, number>();

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (s.studentStatus === 'Active') active++;
      else if (s.studentStatus === 'Completed') completed++;

      const m = s.startMonth || '2026-04';
      const curr = mmap.get(m) || { total: 0, dropouts: 0 };
      curr.total += 1;

      if (s.isDropout) {
        dropouts++;
        curr.dropouts += 1;
        const reason = s.dropoutType || s.dropoutDesc || 'Unspecified Exit';
        typeMap.set(reason, (typeMap.get(reason) || 0) + 1);
      }
      mmap.set(m, curr);
    }

    const calculatedDropoutPct = totalStudents > 0 ? Math.round((dropouts / totalStudents) * 1000) / 10 : 0;

    const calculatedMonthlyTrend = Array.from(mmap.keys())
      .sort()
      .map((m) => {
        const item = mmap.get(m)!;
        return {
          label: m,
          value: Math.round((item.dropouts / item.total) * 1000) / 10,
        };
      });

    const calculatedDropoutReasonData = Array.from(typeMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    return {
      dropoutCount: dropouts,
      dropoutPct: calculatedDropoutPct,
      activeStudents: active,
      completedStudents: completed,
      monthlyDropoutTrend: calculatedMonthlyTrend,
      dropoutReasonData: calculatedDropoutReasonData,
    };
  }, [students, totalStudents]);

  // Batch-wise Dropout
  const batchDropoutData = useMemo(() => {
    return batches.slice(0, 10).map((b) => ({
      label: b.batchCode,
      value: b.dropoutPct,
      color: b.dropoutPct >= thresholds.highDropoutThresholdPct ? '#ea4335' : '#4285f4',
    }));
  }, [batches, thresholds.highDropoutThresholdPct]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Dropout KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Total Dropouts</span>
          <span className="text-2xl font-extrabold text-rose-600 mt-1 block">{dropoutCount}</span>
          <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
            Confirmed Exits
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Overall Dropout Rate %</span>
          <span className="text-2xl font-extrabold text-neutral-900 mt-1 block">{dropoutPct}%</span>
          <span className="text-[10px] text-neutral-500">
            Alert Threshold: {thresholds.highDropoutThresholdPct}%
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Active Students</span>
          <span className="text-2xl font-extrabold text-blue-600 mt-1 block">{activeStudents}</span>
          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-semibold">
            Currently Enrolled
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Completed Students</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{completedStudents}</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold">
            Graduated Learners
          </span>
        </div>
      </div>

      {/* Row 1: Monthly Trend & Reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          title="Monthly Dropout Trend (%)"
          subtitle="Percentage of cohort students exiting by intake month"
          data={monthlyDropoutTrend}
          lineColor="#ea4335"
        />

        <BarChart
          title="Primary Reasons for Dropout"
          subtitle="Breakdown of exit categories (e.g. M&E, Auto-attendance dropout, Qualification)"
          data={dropoutReasonData}
          valueSuffix=" Learners"
          horizontal={true}
        />
      </div>

      {/* Row 2: Batch Dropouts */}
      <BarChart
        title="Batch-Wise Dropout Rate (%)"
        subtitle="Individual batch exit rates with threshold indicator"
        data={batchDropoutData}
        targetLine={thresholds.highDropoutThresholdPct}
        targetLabel="Alert Trigger"
      />
    </div>
  );
});
