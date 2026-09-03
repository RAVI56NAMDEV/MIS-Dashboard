import React, { useMemo } from 'react';
import {
  StudentRecord,
  BatchRecord,
  TrainerRecord,
  CentreRecord,
  ManagementInsight,
  ActionAlert,
  ActiveTab,
  ConfigThresholds,
} from '../../types';
import { BarChart } from '../charts/BarChart';
import { LineChart } from '../charts/LineChart';
import { DonutChart } from '../charts/DonutChart';
import { StackedBarChart } from '../charts/StackedBarChart';
import { Sparkles, AlertOctagon, ArrowUpRight, Award, Building2, Users } from 'lucide-react';

interface ExecutiveOverviewViewProps {
  students: StudentRecord[];
  batches: BatchRecord[];
  trainers: TrainerRecord[];
  centres: CentreRecord[];
  insights: ManagementInsight[];
  alerts: ActionAlert[];
  thresholds: ConfigThresholds;
  onSelectTab: (tab: ActiveTab) => void;
}

export const ExecutiveOverviewView: React.FC<ExecutiveOverviewViewProps> = React.memo(({
  students,
  batches,
  trainers,
  centres,
  insights,
  alerts,
  thresholds,
  onSelectTab,
}) => {
  // Monthly Trends
  const { monthlyAttendanceData, monthlyDropoutData, statusDonutData, topCompanies } = useMemo(() => {
    const monthsMap = new Map<string, { total: number; attSum: number; dropouts: number; placed: number }>();
    const compMap = new Map<string, number>();
    let activeCount = 0;
    let completedCount = 0;
    let dropoutCount = 0;

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const m = s.startMonth || '2026-04';
      const curr = monthsMap.get(m) || { total: 0, attSum: 0, dropouts: 0, placed: 0 };
      curr.total += 1;
      curr.attSum += s.attendancePct;
      if (s.isDropout) curr.dropouts += 1;
      if (s.isPlaced) curr.placed += 1;
      monthsMap.set(m, curr);

      if (s.studentStatus === 'Active') activeCount++;
      else if (s.studentStatus === 'Completed') completedCount++;
      if (s.isDropout) dropoutCount++;

      if (s.companyName) {
        compMap.set(s.companyName, (compMap.get(s.companyName) || 0) + 1);
      }
    }

    const monthsSorted = Array.from(monthsMap.keys()).sort();

    const monthlyAttData = monthsSorted.map((m) => {
      const item = monthsMap.get(m)!;
      return {
        label: m,
        value: Math.round((item.attSum / item.total) * 10) / 10,
      };
    });

    const monthlyDropData = monthsSorted.map((m) => {
      const item = monthsMap.get(m)!;
      return {
        label: m,
        value: Math.round((item.dropouts / item.total) * 1000) / 10,
      };
    });

    const sDonutData = [
      { label: 'Active', value: activeCount, color: '#4285f4' },
      { label: 'Completed', value: completedCount, color: '#34a853' },
      { label: 'Dropped Out', value: dropoutCount, color: '#ea4335' },
    ];

    const topComps = Array.from(compMap.entries())
      .map(([company, count]) => ({ label: company, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      monthlyAttendanceData: monthlyAttData,
      monthlyDropoutData: monthlyDropData,
      statusDonutData: sDonutData,
      topCompanies: topComps,
    };
  }, [students]);

  // Centre Attendance Chart Data
  const centreAttendanceChartData = useMemo(() => {
    return centres.slice(0, 8).map((c) => ({
      label: c.centre,
      value: c.avgAttendancePct,
      color: c.avgAttendancePct >= thresholds.attendanceReqPct ? '#34a853' : '#ea4335',
    }));
  }, [centres, thresholds.attendanceReqPct]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Insights & Alerts Highlights Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Management Insights Highlight Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold border border-blue-400/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold tracking-tight text-white">Automated Management Insights</h3>
              </div>
              <button
                onClick={() => onSelectTab('insights')}
                className="text-xs text-blue-300 hover:text-white flex items-center gap-1 font-semibold transition"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {insights.length > 0 ? (
              <div className="space-y-2.5 my-2">
                {insights.slice(0, 2).map((ins) => (
                  <div key={ins.id} className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-blue-200">{ins.title}</span>
                      <span className="text-[10px] bg-blue-500/30 font-bold px-2 py-0.5 rounded-md text-blue-300">
                        {ins.metricValue}
                      </span>
                    </div>
                    <p className="text-slate-200 leading-relaxed text-[11px]">{ins.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs">Upload dataset to view management insights.</p>
            )}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-2 border-t border-white/10 mt-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Calculated from live uploaded student records</span>
          </div>
        </div>

        {/* Priority Action Alerts Box */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900">Priority Alerts ({alerts.length})</h3>
              </div>
              <button
                onClick={() => onSelectTab('alerts')}
                className="text-xs text-rose-600 font-semibold hover:underline"
              >
                Action Center
              </button>
            </div>

            <div className="space-y-2.5">
              {alerts.slice(0, 3).map((alt) => (
                <div key={alt.id} className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/60 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-rose-900">{alt.title}</span>
                    <span className="bg-rose-200 text-rose-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                      {alt.count}
                    </span>
                  </div>
                  <p className="text-neutral-600 text-[11px] mt-0.5 truncate">{alt.description}</p>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="p-4 text-center text-xs text-emerald-600 font-semibold bg-emerald-50 rounded-xl">
                  ✓ No operational alerts. All parameters normal.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onSelectTab('alerts')}
            className="w-full mt-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition text-center"
          >
            Review Operational Action Items
          </button>
        </div>
      </div>

      {/* Row 1: Charts - Monthly Attendance Trend & Centre Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          title="Monthly Attendance Trend (%)"
          subtitle="Cohort average attendance percentage over training start dates"
          data={monthlyAttendanceData}
          lineColor="#4285f4"
        />

        <BarChart
          title="Centre Attendance Benchmark (%)"
          subtitle="Location average attendance compared with requirement"
          data={centreAttendanceChartData}
          targetLine={thresholds.attendanceReqPct}
          targetLabel="Requirement Threshold"
          onClickItem={() => onSelectTab('centres')}
        />
      </div>

      {/* Row 2: Student Status & Placement Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DonutChart
          title="Student Status Distribution"
          subtitle="Breakdown of Active, Completed and Dropped Out learners"
          data={statusDonutData}
          centerText={students.length.toString()}
          centerLabel="Learners"
        />

        <BarChart
          title="Monthly Dropout Rate Trend (%)"
          subtitle="Dropout percentage by cohort start month"
          data={monthlyDropoutData}
          valueSuffix="%"
          horizontal={true}
          onClickItem={() => onSelectTab('dropout')}
        />

        <BarChart
          title="Top Hiring Partners"
          subtitle="Most active employers recruiting placed candidates"
          data={topCompanies}
          valueSuffix=" Students"
          horizontal={true}
          onClickItem={() => onSelectTab('placement')}
        />
      </div>

      {/* Row 3: Centre Summary Preview Table */}
      <div className="w-full">
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-neutral-900">Centre Performance Summary</h3>
            </div>
            <button
              onClick={() => onSelectTab('centres')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              View Details
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
                <tr>
                  <th className="p-2">Centre Location</th>
                  <th className="p-2 text-center">Students</th>
                  <th className="p-2 text-center">Attendance %</th>
                  <th className="p-2 text-center">Placement %</th>
                  <th className="p-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {centres.map((c) => (
                  <tr key={c.centre} className="hover:bg-neutral-50">
                    <td className="p-2 font-semibold text-neutral-900">{c.centre}</td>
                    <td className="p-2 text-center font-medium">{c.totalStudents}</td>
                    <td className="p-2 text-center font-bold text-blue-600">{c.avgAttendancePct}%</td>
                    <td className="p-2 text-center font-bold text-emerald-600">{c.placementPct}%</td>
                    <td className="p-2 text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.statusGrade === 'Good'
                            ? 'bg-emerald-100 text-emerald-700'
                            : c.statusGrade === 'Needs Attention'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {c.statusGrade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
});
