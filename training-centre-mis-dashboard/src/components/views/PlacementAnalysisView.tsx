import React, { useMemo } from 'react';
import { StudentRecord, ConfigThresholds } from '../../types';
import { BarChart } from '../charts/BarChart';
import { DonutChart } from '../charts/DonutChart';
import { Briefcase, DollarSign, Award, Building2, TrendingUp, CheckCircle } from 'lucide-react';

interface PlacementAnalysisViewProps {
  students: StudentRecord[];
  thresholds: ConfigThresholds;
}

export const PlacementAnalysisView: React.FC<PlacementAnalysisViewProps> = React.memo(({ students, thresholds }) => {
  const {
    totalEnrolled,
    completed,
    eligible,
    placedCount,
    placed,
    unplacedCount,
    placementPct,
    avgSalary,
    maxSalary,
    topEmployersData,
    topEmployerName,
    funnelDonutData,
  } = useMemo(() => {
    const total = students.length;
    let comp = 0;
    let elig = 0;
    let placedCountVal = 0;
    const placedStudentsList: StudentRecord[] = [];
    const salaries: number[] = [];
    const empMap = new Map<string, number>();

    for (let i = 0; i < total; i++) {
      const s = students[i];
      if (s.studentStatus === 'Completed') comp++;
      if (s.isEligibleForPlacement) elig++;
      if (s.isPlaced) {
        placedCountVal++;
        placedStudentsList.push(s);
        if (s.salary && s.salary > 0) {
          salaries.push(s.salary);
        }
        if (s.companyName) {
          empMap.set(s.companyName, (empMap.get(s.companyName) || 0) + 1);
        }
      }
    }

    const unplaced = elig > placedCountVal ? elig - placedCountVal : comp > placedCountVal ? comp - placedCountVal : 0;
    const calcPct = elig > 0 ? Math.round((placedCountVal / elig) * 1000) / 10 : comp > 0 ? Math.round((placedCountVal / comp) * 1000) / 10 : 0;
    const calcAvgSal = salaries.length > 0 ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0;
    const calcMaxSal = salaries.length > 0 ? Math.max(...salaries) : 0;

    const topEmpData = Array.from(empMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const topName = topEmpData.length > 0 ? topEmpData[0].label : 'N/A';

    const funnelData = [
      { label: 'Placed', value: placedCountVal, color: '#34a853' },
      { label: 'Unplaced (Eligible)', value: unplaced, color: '#ea4335' },
    ];

    return {
      totalEnrolled: total,
      completed: comp,
      eligible: elig,
      placedCount: placedCountVal,
      placed: placedStudentsList,
      unplacedCount: unplaced,
      placementPct: calcPct,
      avgSalary: calcAvgSal,
      maxSalary: calcMaxSal,
      topEmployersData: topEmpData,
      topEmployerName: topName,
      funnelDonutData: funnelData,
    };
  }, [students]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Placement KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Eligible Candidates</span>
          <span className="text-2xl font-extrabold text-neutral-900 mt-1 block">{eligible}</span>
          <span className="text-[10px] text-neutral-400">Meets Placement Rules</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Placed Candidates</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{placedCount}</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
            Corporate Hired
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Placement %</span>
          <span className="text-2xl font-extrabold text-blue-600 mt-1 block">{placementPct}%</span>
          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold">
            Target: &gt;= {thresholds.lowPlacementThresholdPct}%
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Average Package</span>
          <span className="text-2xl font-extrabold text-neutral-900 mt-1 block">
            {avgSalary > 0 ? `INR ${avgSalary.toLocaleString()}` : 'N/A'}
          </span>
          <span className="text-[10px] text-neutral-400">Monthly / CTC</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Highest Package</span>
          <span className="text-2xl font-extrabold text-indigo-600 mt-1 block">
            {maxSalary > 0 ? `INR ${maxSalary.toLocaleString()}` : 'N/A'}
          </span>
          <span className="text-[10px] text-indigo-700 font-semibold">Max Offer</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Top Employer</span>
          <span className="text-lg font-bold text-neutral-900 mt-1 block truncate">{topEmployerName}</span>
          <span className="text-[10px] text-neutral-400">Leading Hiring Partner</span>
        </div>
      </div>

      {/* Row 1: Funnel, Conversion Ratio & Top Hiring Partners */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 w-full min-w-0">
        {/* Visual Placement Funnel */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-2xs flex flex-col justify-between w-full min-w-0 overflow-hidden">
          <div className="w-full min-w-0">
            <h3 className="text-sm font-bold text-neutral-900 mb-1 truncate">Placement Pipeline Funnel</h3>
            <p className="text-xs text-neutral-500 mb-4 truncate">Progression from enrolment to corporate hiring</p>

            <div className="space-y-2.5 w-full min-w-0">
              <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-200 w-full min-w-0">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="font-bold text-blue-900 truncate min-w-0">1. Total Enrolled</span>
                  <span className="font-extrabold text-blue-900 shrink-0">{totalEnrolled}</span>
                </div>
              </div>

              <div className="bg-indigo-50/80 p-3 rounded-xl border border-indigo-200 w-[96%] sm:w-[96%] min-w-0">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="font-bold text-indigo-900 truncate min-w-0">2. Completed Training</span>
                  <span className="font-extrabold text-indigo-900 shrink-0">{completed}</span>
                </div>
              </div>

              <div className="bg-purple-50/80 p-3 rounded-xl border border-purple-200 w-[92%] sm:w-[92%] min-w-0">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="font-bold text-purple-900 truncate min-w-0">3. Placement Eligible</span>
                  <span className="font-extrabold text-purple-900 shrink-0">{eligible}</span>
                </div>
              </div>

              <div className="bg-emerald-500 text-white p-3 rounded-xl w-[88%] sm:w-[88%] min-w-0 shadow-xs">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="font-bold truncate min-w-0">4. Placed Candidates</span>
                  <span className="font-extrabold text-base shrink-0">{placedCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-between items-center text-xs text-neutral-500 w-full min-w-0">
            <span>Overall Conversion</span>
            <span className="font-bold text-emerald-600">{placementPct}%</span>
          </div>
        </div>

        <div className="w-full min-w-0 overflow-hidden flex flex-col">
          <DonutChart
            title="Placement Conversion Ratio"
            subtitle="Placed vs unplaced eligible candidates"
            data={funnelDonutData}
            centerText={`${placementPct}%`}
            centerLabel="Placed Rate"
          />
        </div>

        <div className="w-full min-w-0 overflow-hidden flex flex-col md:col-span-2 xl:col-span-1">
          <BarChart
            title="Top Hiring Partners"
            subtitle="Employers with highest student hire volume"
            data={topEmployersData}
            valueSuffix=" Hired"
            horizontal={true}
          />
        </div>
      </div>

      {/* Row 2: Placed Candidate Roster Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden p-5 space-y-4">
        <h3 className="text-sm font-bold text-neutral-900">Corporate Placed Candidate Roster</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-100/80 text-neutral-800 font-semibold border-b border-neutral-200">
              <tr>
                <th className="p-2.5">Student ID</th>
                <th className="p-2.5">Candidate Name</th>
                <th className="p-2.5">Hiring Employer</th>
                <th className="p-2.5">Designation / Role</th>
                <th className="p-2.5 text-right">Package (INR)</th>
                <th className="p-2.5">Date of Joining</th>
                <th className="p-2.5">Centre</th>
                <th className="p-2.5">Batch Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {placed.slice(0, 15).map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50/80">
                  <td className="p-2.5 font-mono text-neutral-600">{s.studentId}</td>
                  <td className="p-2.5 font-bold text-neutral-900">{s.studentName}</td>
                  <td className="p-2.5 font-bold text-blue-600">{s.companyName}</td>
                  <td className="p-2.5 text-neutral-700">{s.post || 'Executive Trainee'}</td>
                  <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                    {s.salary ? s.salary.toLocaleString() : 'N/A'}
                  </td>
                  <td className="p-2.5 font-mono text-neutral-600">{s.doj || 'N/A'}</td>
                  <td className="p-2.5 text-neutral-700">{s.centre}</td>
                  <td className="p-2.5 font-mono text-neutral-600">{s.batchCode}</td>
                </tr>
              ))}

              {placed.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-400 font-medium">
                    No placement records found in current selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
