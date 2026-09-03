import React, { useMemo } from 'react';
import { StudentRecord, BatchRecord, CentreRecord, ConfigThresholds } from '../../types';
import { BarChart } from '../charts/BarChart';
import { DonutChart } from '../charts/DonutChart';
import { GaugeChart } from '../charts/GaugeChart';
import { Clock, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react';

interface IltAnalysisViewProps {
  students: StudentRecord[];
  batches: BatchRecord[];
  centres: CentreRecord[];
  thresholds: ConfigThresholds;
}

export const IltAnalysisView: React.FC<IltAnalysisViewProps> = React.memo(({ students, batches, centres, thresholds }) => {
  const total = students.length;

  const {
    avgIltPct,
    totalAttendedHours,
    totalRequiredHours,
    meetingIltCount,
    belowIltCount,
    programIltData,
    iltBucketData,
  } = useMemo(() => {
    let iltSum = 0;
    let attendedHours = 0;
    let requiredHours = 0;
    let meetingCount = 0;
    let belowCount = 0;
    let b0_50 = 0, b50_70 = 0, b70_90 = 0, b90_100 = 0;
    const pmap = new Map<string, { totalHours: number; attendedHours: number; count: number }>();

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      iltSum += s.iltCompletionPct;
      attendedHours += s.attendanceHours;
      requiredHours += s.requiredAttendanceHours;

      if (s.meetsIltReq) meetingCount++;
      else belowCount++;

      const p = s.courseAlias || 'General Training';
      const curr = pmap.get(p) || { totalHours: 0, attendedHours: 0, count: 0 };
      curr.totalHours += s.iltDurationHours;
      curr.attendedHours += s.attendanceHours;
      curr.count += 1;
      pmap.set(p, curr);

      if (s.iltCompletionPct < 50) b0_50++;
      else if (s.iltCompletionPct < 70) b50_70++;
      else if (s.iltCompletionPct < 90) b70_90++;
      else b90_100++;
    }

    const calcAvgIltPct = total > 0 ? Math.round((iltSum / total) * 10) / 10 : 0;

    const progData = Array.from(pmap.entries()).map(([prog, data]) => {
      const avgAttHours = Math.round((data.attendedHours / data.count) * 10) / 10;
      return {
        label: prog,
        value: avgAttHours,
        color: '#4285f4',
      };
    });

    const bucketData = [
      { label: '< 50% (Critical Lag)', value: b0_50, color: '#ea4335' },
      { label: '50% - 70% (Below Target)', value: b50_70, color: '#fbbc04' },
      { label: '70% - 90% (Compliant)', value: b70_90, color: '#4285f4' },
      { label: '90% - 100% (Fully Complete)', value: b90_100, color: '#34a853' },
    ];

    return {
      avgIltPct: calcAvgIltPct,
      totalAttendedHours: attendedHours,
      totalRequiredHours: requiredHours,
      meetingIltCount: meetingCount,
      belowIltCount: belowCount,
      programIltData: progData,
      iltBucketData: bucketData,
    };
  }, [students, total]);

  // Centre-wise ILT Completion %
  const centreIltData = useMemo(() => {
    return centres.map((c) => ({
      label: c.centre,
      value: c.avgIltCompletionPct,
      color: c.avgIltCompletionPct >= thresholds.iltReqPct ? '#34a853' : '#ea4335',
    }));
  }, [centres, thresholds.iltReqPct]);

  // Batch-wise ILT Completion %
  const batchIltData = useMemo(() => {
    return batches.slice(0, 10).map((b) => ({
      label: b.batchCode,
      value: b.avgIltCompletionPct,
      color: '#4285f4',
    }));
  }, [batches]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* ILT Calculation Formula Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 sm:p-5 text-xs text-blue-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-900">Instructor-Led Training (ILT) Calculation Formula</h4>
            <p className="text-blue-700/90 text-xs mt-0.5">
              Measures classroom attendance compliance by comparing hours actually attended against scheduled curriculum hours.
            </p>
          </div>
        </div>
        <div className="bg-white border border-blue-200 rounded-xl p-3 px-4 shadow-2xs text-center shrink-0 w-full sm:w-auto">
          <span className="text-neutral-500 text-[10px] uppercase font-sans font-bold block mb-0.5">ILT Formula</span>
          <span className="text-xs sm:text-sm font-extrabold text-blue-700 font-mono">
            ILT % = (<span className="text-emerald-600">Attended Hours</span> ÷ <span className="text-neutral-800">Required Hours</span>) × 100
          </span>
        </div>
      </div>

      {/* ILT Core KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Avg ILT Completion %</span>
          <span className="text-2xl font-extrabold text-blue-600 mt-1 block">{avgIltPct}%</span>
          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold">
            Target: {thresholds.iltReqPct}%
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Meeting ILT Target</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{meetingIltCount}</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
            &gt;= {thresholds.iltReqPct}% Hours Met
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Below ILT Target</span>
          <span className="text-2xl font-extrabold text-rose-600 mt-1 block">{belowIltCount}</span>
          <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold">
            Under-attended
          </span>
        </div>

        <GaugeChart value={avgIltPct} title="ILT Completion Gauge" threshold={thresholds.iltReqPct} />
      </div>

      {/* Row 1: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="Program-Wise Average Attended Hours"
          subtitle="Actual attended training hours by course curriculum"
          data={programIltData}
          valueSuffix=" Hours"
          horizontal={true}
        />

        <DonutChart
          title="ILT Completion Rate Buckets"
          subtitle="Categorizing learners by percentage of required hours completed"
          data={iltBucketData}
          centerText={total.toString()}
          centerLabel="Students"
        />
      </div>

      {/* Row 2: Batch ILT Completion */}
      <div className="w-full">
        <BarChart
          title="Batch-Wise ILT Completion %"
          subtitle="Classroom delivery progress across training batches"
          data={batchIltData}
          targetLine={thresholds.iltReqPct}
          targetLabel="Configured Target"
        />
      </div>
    </div>
  );
});
