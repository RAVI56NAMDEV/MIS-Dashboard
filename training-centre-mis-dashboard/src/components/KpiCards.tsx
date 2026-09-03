import React, { useMemo } from 'react';
import { StudentRecord, BatchRecord, ConfigThresholds, ActiveTab } from '../types';
import {
  Users,
  Layers,
  UserCheck,
  GraduationCap,
  Building2,
  CalendarCheck,
  UserX,
  Briefcase,
  Clock,
  AlertTriangle,
  Award,
  HelpCircle,
} from 'lucide-react';

interface KpiCardsProps {
  students: StudentRecord[];
  batches: BatchRecord[];
  thresholds: ConfigThresholds;
  onSelectTab: (tab: ActiveTab) => void;
  onFilterByKpi?: (filterKey: string, filterValue: any) => void;
}

export const KpiCards: React.FC<KpiCardsProps> = React.memo(({
  students,
  batches,
  thresholds,
  onSelectTab,
}) => {
  const totalStudents = students.length;
  const totalBatches = batches.length;

  const {
    activeStudents,
    completedStudents,
    totalTrainers,
    totalCentres,
    avgAttendance,
    dropoutCount,
    dropoutPct,
    eligibleCount,
    placedCount,
    placementPct,
    avgIltCompletion,
    belowAttCount,
    runningBatchesCount,
  } = useMemo(() => {
    let active = 0;
    let completed = 0;
    let attSum = 0;
    let dropouts = 0;
    let eligible = 0;
    let placed = 0;
    let iltSum = 0;
    let belowAtt = 0;
    const trainersSet = new Set<string>();
    const centresSet = new Set<string>();

    for (let i = 0; i < totalStudents; i++) {
      const s = students[i];
      if (s.studentStatus === 'Active') active++;
      else if (s.studentStatus === 'Completed') completed++;

      if (s.trainer) trainersSet.add(s.trainer);
      if (s.centre) centresSet.add(s.centre);

      attSum += s.attendancePct;
      iltSum += s.iltCompletionPct;

      if (s.isDropout) dropouts++;
      if (s.isEligibleForPlacement) eligible++;
      if (s.isPlaced) placed++;
      if (!s.meetsAttendanceReq && !s.isDropout) belowAtt++;
    }

    const calcAvgAtt = totalStudents > 0 ? attSum / totalStudents : 0;
    const calcDropPct = totalStudents > 0 ? (dropouts / totalStudents) * 100 : 0;
    const calcPlacePct =
      eligible > 0
        ? (placed / eligible) * 100
        : completed > 0
        ? (placed / completed) * 100
        : 0;
    const calcAvgIlt = totalStudents > 0 ? iltSum / totalStudents : 0;

    let runningBatches = 0;
    for (let j = 0; j < batches.length; j++) {
      if (batches[j].batchStatus === 'running') runningBatches++;
    }

    return {
      activeStudents: active,
      completedStudents: completed,
      totalTrainers: trainersSet.size,
      totalCentres: centresSet.size,
      avgAttendance: calcAvgAtt,
      dropoutCount: dropouts,
      dropoutPct: calcDropPct,
      eligibleCount: eligible,
      placedCount: placed,
      placementPct: calcPlacePct,
      avgIltCompletion: calcAvgIlt,
      belowAttCount: belowAtt,
      runningBatchesCount: runningBatches,
    };
  }, [students, totalStudents, batches]);

  const kpis = useMemo(() => [
    {
      id: 'kpi-students',
      label: 'Total Enrolled Students',
      value: totalStudents.toLocaleString(),
      tooltip: 'Total registered candidates across all batches & locations',
      icon: Users,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      badge: '100% Enrolled',
      tab: 'students' as ActiveTab,
    },
    {
      id: 'kpi-batches',
      label: 'Total Training Batches',
      value: totalBatches,
      tooltip: 'Total active, running & completed training batches',
      icon: Layers,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      badge: `${runningBatchesCount} Running`,
      tab: 'batches' as ActiveTab,
    },
    {
      id: 'kpi-active',
      label: 'Active Students',
      value: activeStudents,
      tooltip: 'Students currently undergoing active training',
      icon: UserCheck,
      color: 'bg-sky-50 text-sky-600 border-sky-200',
      badge: `${Math.round((activeStudents / (totalStudents || 1)) * 100)}% of Total`,
      tab: 'students' as ActiveTab,
    },
    {
      id: 'kpi-completed',
      label: 'Completed Students',
      value: completedStudents,
      tooltip: 'Candidates who successfully finished training program',
      icon: GraduationCap,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badge: `${Math.round((completedStudents / (totalStudents || 1)) * 100)}% Completed`,
      tab: 'students' as ActiveTab,
    },
    {
      id: 'kpi-attendance',
      label: 'Overall Attendance %',
      value: `${Math.round(avgAttendance * 10) / 10}%`,
      tooltip: 'Average class attendance across all enrolled learners',
      icon: CalendarCheck,
      color: avgAttendance >= thresholds.attendanceReqPct ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200',
      badge: `Req: >= ${thresholds.attendanceReqPct}%`,
      tab: 'attendance' as ActiveTab,
    },
    {
      id: 'kpi-dropout',
      label: 'Dropout Rate %',
      value: `${Math.round(dropoutPct * 10) / 10}%`,
      tooltip: 'Percentage of total students who dropped out or exited',
      icon: UserX,
      color: dropoutPct <= thresholds.highDropoutThresholdPct ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200',
      badge: `${dropoutCount} Dropouts`,
      tab: 'dropout' as ActiveTab,
    },
    {
      id: 'kpi-placement',
      label: 'Placement %',
      value: `${Math.round(placementPct * 10) / 10}%`,
      tooltip: 'Placed Candidates / Placement Eligible Candidates',
      icon: Briefcase,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      badge: `${placedCount} Placed`,
      tab: 'placement' as ActiveTab,
    },
    {
      id: 'kpi-ilt',
      label: 'Avg ILT Completion %',
      value: `${Math.round(avgIltCompletion * 10) / 10}%`,
      tooltip: 'Actual Attended Hours / Required ILT Duration Hours',
      icon: Clock,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      badge: `Target: ${thresholds.iltReqPct}% Duration`,
      tab: 'ilt' as ActiveTab,
    },
    {
      id: 'kpi-below-att',
      label: 'Below Attendance Req',
      value: belowAttCount,
      tooltip: `Active students with attendance below ${thresholds.attendanceReqPct}% requirement`,
      icon: AlertTriangle,
      color: belowAttCount > 0 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badge: 'Action Needed',
      tab: 'attendance' as ActiveTab,
    },
    {
      id: 'kpi-eligible',
      label: 'Placement Eligible',
      value: eligibleCount,
      tooltip: 'Students fulfilling criteria for corporate placement drives',
      icon: Award,
      color: 'bg-teal-50 text-teal-600 border-teal-200',
      badge: `${Math.round((eligibleCount / (totalStudents || 1)) * 100)}% Eligible`,
      tab: 'placement' as ActiveTab,
    },
  ], [
    totalStudents,
    totalBatches,
    runningBatchesCount,
    activeStudents,
    completedStudents,
    totalTrainers,
    totalCentres,
    avgAttendance,
    thresholds.attendanceReqPct,
    dropoutCount,
    dropoutPct,
    thresholds.highDropoutThresholdPct,
    placedCount,
    placementPct,
    thresholds.lowPlacementThresholdPct,
    avgIltCompletion,
    thresholds.iltReqPct,
    belowAttCount,
    eligibleCount,
  ]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 my-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;

        return (
          <div
            key={kpi.id}
            onClick={() => onSelectTab(kpi.tab)}
            className="group bg-white p-3.5 sm:p-4 rounded-2xl border border-neutral-200/80 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full truncate max-w-[100px]">
                  {kpi.badge}
                </span>
              </div>

              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-xs font-medium text-neutral-500 truncate">{kpi.label}</span>
                <span title={kpi.tooltip} className="cursor-help">
                  <HelpCircle className="w-3 h-3 text-neutral-400 hover:text-neutral-600" />
                </span>
              </div>

              <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">
                {kpi.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
