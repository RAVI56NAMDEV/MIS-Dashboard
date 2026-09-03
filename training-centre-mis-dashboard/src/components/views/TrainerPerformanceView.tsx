import React, { useMemo } from 'react';
import { TrainerRecord, ConfigThresholds } from '../../types';
import { BarChart } from '../charts/BarChart';
import { Award, GraduationCap, Info, HelpCircle } from 'lucide-react';

interface TrainerPerformanceViewProps {
  trainers: TrainerRecord[];
  thresholds: ConfigThresholds;
}

export const TrainerPerformanceView: React.FC<TrainerPerformanceViewProps> = React.memo(({ trainers, thresholds }) => {
  const totalTrainers = trainers.length;

  const {
    totalStudents,
    avgStudentsPerTrainer,
    avgAtt,
    avgDrop,
    avgPlace,
    trainerScoreBar,
    trainerAttBar,
    trainerPlaceBar,
  } = useMemo(() => {
    let totStud = 0;
    let attSum = 0;
    let dropSum = 0;
    let placeSum = 0;

    for (let i = 0; i < totalTrainers; i++) {
      const t = trainers[i];
      totStud += t.totalStudents;
      attSum += t.avgAttendancePct;
      dropSum += t.dropoutPct;
      placeSum += t.placementPct;
    }

    const calcAvgStud = totalTrainers > 0 ? Math.round((totStud / totalTrainers) * 10) / 10 : 0;
    const calcAvgAtt = totalTrainers > 0 ? Math.round((attSum / totalTrainers) * 10) / 10 : 0;
    const calcAvgDrop = totalTrainers > 0 ? Math.round((dropSum / totalTrainers) * 10) / 10 : 0;
    const calcAvgPlace = totalTrainers > 0 ? Math.round((placeSum / totalTrainers) * 10) / 10 : 0;

    const scoreBar = trainers.slice(0, 10).map((t) => ({
      label: t.trainer,
      value: t.performanceScore,
      color: '#4285f4',
    }));

    const aBar = trainers.slice(0, 10).map((t) => ({
      label: t.trainer,
      value: t.avgAttendancePct,
      color: '#34a853',
    }));

    const pBar = trainers.slice(0, 10).map((t) => ({
      label: t.trainer,
      value: t.placementPct,
      color: '#4285f4',
    }));

    return {
      totalStudents: totStud,
      avgStudentsPerTrainer: calcAvgStud,
      avgAtt: calcAvgAtt,
      avgDrop: calcAvgDrop,
      avgPlace: calcAvgPlace,
      trainerScoreBar: scoreBar,
      trainerAttBar: aBar,
      trainerPlaceBar: pBar,
    };
  }, [trainers, totalTrainers]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Formula Explanation Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 mt-0.5">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-blue-950 text-sm">Trainer Performance Score Calculation</h4>
            <p className="text-neutral-600 mt-0.5 leading-relaxed">
              Score = (Attendance % × {thresholds.trainerScoreWeightAttendance}%) + (Placement % × {thresholds.trainerScoreWeightPlacement}%) + ((100 - Dropout %) × {thresholds.trainerScoreWeightRetention}%)
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded-lg shadow-2xs">
            Configurable Weights Applied
          </span>
        </div>
      </div>

      {/* Trainer KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Total Faculty</span>
          <span className="text-2xl font-extrabold text-neutral-900 mt-1 block">{totalTrainers}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Students / Trainer</span>
          <span className="text-2xl font-extrabold text-blue-600 mt-1 block">{avgStudentsPerTrainer}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Average Attendance %</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{avgAtt}%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Average Dropout Rate %</span>
          <span className="text-2xl font-extrabold text-rose-600 mt-1 block">{avgDrop}%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Average Placement %</span>
          <span className="text-2xl font-extrabold text-indigo-600 mt-1 block">{avgPlace}%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Batches Handled</span>
          <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
            {trainers.reduce((sum, t) => sum + t.batchCount, 0)}
          </span>
        </div>
      </div>

      {/* Row 1: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BarChart
          title="Trainer Overall Performance Score"
          subtitle="Overall calculated composite score out of 100"
          data={trainerScoreBar}
          valueSuffix=""
        />

        <BarChart
          title="Trainer Attendance Benchmark (%)"
          subtitle="Average student attendance achieved per trainer"
          data={trainerAttBar}
          targetLine={thresholds.attendanceReqPct}
          targetLabel="Required"
        />

        <BarChart
          title="Trainer Placement Rate (%)"
          subtitle="Corporate placement conversion per trainer"
          data={trainerPlaceBar}
          valueSuffix="%"
        />
      </div>

      {/* Trainer Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden p-5 space-y-4">
        <h3 className="text-sm font-bold text-neutral-900">Faculty Scorecard & Ranking</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-100/80 text-neutral-800 font-semibold border-b border-neutral-200">
              <tr>
                <th className="p-2.5">Trainer Name</th>
                <th className="p-2.5">Centre</th>
                <th className="p-2.5 text-center">Batches</th>
                <th className="p-2.5 text-center">Students</th>
                <th className="p-2.5 text-center">Attendance %</th>
                <th className="p-2.5 text-center">Dropout %</th>
                <th className="p-2.5 text-center">Placement %</th>
                <th className="p-2.5 text-right">Performance Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {trainers.map((t, idx) => (
                <tr key={t.trainer} className="hover:bg-neutral-50/80">
                  <td className="p-2.5 font-bold text-neutral-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center text-[10px] font-mono">
                      #{idx + 1}
                    </span>
                    {t.trainer}
                  </td>
                  <td className="p-2.5 text-neutral-700">{t.centre}</td>
                  <td className="p-2.5 text-center font-medium">{t.batchCount}</td>
                  <td className="p-2.5 text-center font-bold">{t.totalStudents}</td>
                  <td className="p-2.5 text-center font-bold text-blue-600">{t.avgAttendancePct}%</td>
                  <td className="p-2.5 text-center font-bold text-rose-600">{t.dropoutPct}%</td>
                  <td className="p-2.5 text-center font-bold text-emerald-600">{t.placementPct}%</td>
                  <td className="p-2.5 text-right">
                    <span className="font-extrabold text-neutral-900 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg">
                      {t.performanceScore} / 100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
