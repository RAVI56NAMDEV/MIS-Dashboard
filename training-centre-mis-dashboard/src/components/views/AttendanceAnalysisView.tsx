import React, { useMemo } from 'react';
import { StudentRecord, BatchRecord, CentreRecord, TrainerRecord, ConfigThresholds } from '../../types';
import { BarChart } from '../charts/BarChart';
import { LineChart } from '../charts/LineChart';
import { DonutChart } from '../charts/DonutChart';
import { GaugeChart } from '../charts/GaugeChart';
import { CalendarCheck, CheckCircle2, AlertTriangle, TrendingUp, Building2 } from 'lucide-react';

interface AttendanceAnalysisViewProps {
  students: StudentRecord[];
  batches: BatchRecord[];
  centres: CentreRecord[];
  trainers: TrainerRecord[];
  thresholds: ConfigThresholds;
}

export const AttendanceAnalysisView: React.FC<AttendanceAnalysisViewProps> = React.memo(({
  students,
  batches,
  centres,
  trainers,
  thresholds,
}) => {
  const total = students.length;

  const { overallAttPct, meetingReqCount, belowReqCount, monthlyTrend, distData } = useMemo(() => {
    let attSum = 0;
    let meeting = 0;
    let below = 0;
    let b0_25 = 0, b25_50 = 0, b50_75 = 0, b75_100 = 0;
    const mmap = new Map<string, { sum: number; count: number }>();

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      attSum += s.attendancePct;
      if (s.meetsAttendanceReq) meeting++;
      else below++;

      const m = s.startMonth || '2026-04';
      const curr = mmap.get(m) || { sum: 0, count: 0 };
      curr.sum += s.attendancePct;
      curr.count += 1;
      mmap.set(m, curr);

      if (s.attendancePct < 25) b0_25++;
      else if (s.attendancePct < 50) b25_50++;
      else if (s.attendancePct < 75) b50_75++;
      else b75_100++;
    }

    const calculatedOverallAttPct = students.length > 0 ? Math.round((attSum / students.length) * 10) / 10 : 0;

    const calculatedMonthlyTrend = Array.from(mmap.keys())
      .sort()
      .map((m) => {
        const item = mmap.get(m)!;
        return {
          label: m,
          value: Math.round((item.sum / item.count) * 10) / 10,
        };
      });

    const calculatedDistData = [
      { label: '0% - 25% (Critical)', value: b0_25, color: '#ea4335' },
      { label: '25% - 50% (Lagging)', value: b25_50, color: '#fbbc04' },
      { label: '50% - 75% (Meeting Req)', value: b50_75, color: '#4285f4' },
      { label: '75% - 100% (High Performer)', value: b75_100, color: '#34a853' },
    ];

    return {
      overallAttPct: calculatedOverallAttPct,
      meetingReqCount: meeting,
      belowReqCount: below,
      monthlyTrend: calculatedMonthlyTrend,
      distData: calculatedDistData,
    };
  }, [students]);

  const highestAttCentre = centres.length > 0 ? centres[0] : null;
  const lowestAttCentre = centres.length > 0 ? centres[centres.length - 1] : null;

  // Centre-wise Attendance Chart
  const centreAttData = useMemo(() => {
    return centres.map((c) => ({
      label: c.centre,
      value: c.avgAttendancePct,
      color: c.avgAttendancePct >= thresholds.attendanceReqPct ? '#34a853' : '#ea4335',
    }));
  }, [centres, thresholds.attendanceReqPct]);

  // Trainer-wise Attendance Chart
  const trainerAttData = useMemo(() => {
    return trainers.slice(0, 10).map((t) => ({
      label: t.trainer,
      value: t.avgAttendancePct,
      color: '#4285f4',
    }));
  }, [trainers]);

  // Batch-wise Attendance Chart
  const batchAttData = useMemo(() => {
    return batches.slice(0, 10).map((b) => ({
      label: b.batchCode,
      value: b.avgAttendancePct,
      color: b.avgAttendancePct >= thresholds.attendanceReqPct ? '#4285f4' : '#fbbc04',
    }));
  }, [batches, thresholds.attendanceReqPct]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Attendance KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Overall Attendance %</span>
          <span className="text-2xl font-extrabold text-neutral-900 mt-1 block">{overallAttPct}%</span>
          <span className="text-[10px] text-neutral-400">Across all {total} learners</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Meeting Requirement</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{meetingReqCount}</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
            &gt;= {thresholds.attendanceReqPct}% Threshold
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Below Requirement</span>
          <span className="text-2xl font-extrabold text-rose-600 mt-1 block">{belowReqCount}</span>
          <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold">
            &lt; {thresholds.attendanceReqPct}% Flagged
          </span>
        </div>

        <GaugeChart
          value={overallAttPct}
          title="Attendance Gauge"
          threshold={thresholds.attendanceReqPct}
        />
      </div>

      {/* Row 1: Trend & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          title="Monthly Attendance Trend (%)"
          subtitle="Monthly average attendance progression across intake months"
          data={monthlyTrend}
          lineColor="#34a853"
        />

        <DonutChart
          title="Attendance Distribution Buckets"
          subtitle="Count of students categorized by attendance percentage brackets"
          data={distData}
          centerText={total.toString()}
          centerLabel="Students"
        />
      </div>

      {/* Row 2: Centre & Trainer Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="Centre-Wise Average Attendance (%)"
          subtitle="Location comparison with configurable requirement target"
          data={centreAttData}
          targetLine={thresholds.attendanceReqPct}
          targetLabel="Configured Threshold"
        />

        <BarChart
          title="Trainer-Wise Average Attendance (%)"
          subtitle="Top faculty performance by student class attendance"
          data={trainerAttData}
          targetLine={thresholds.attendanceReqPct}
          targetLabel="Configured Threshold"
        />
      </div>

      {/* Row 3: Batch Attendance Breakdown */}
      <BarChart
        title="Batch-Wise Attendance Performance (%)"
        subtitle="Individual batch level attendance averages"
        data={batchAttData}
        targetLine={thresholds.attendanceReqPct}
        targetLabel="Minimum Requirement"
      />
    </div>
  );
});
