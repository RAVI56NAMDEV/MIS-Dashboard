import React, { useState, useMemo } from 'react';
import { BatchRecord } from '../../types';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  Layers,
  ArrowUpRight,
  Search,
  BarChart3,
  UserX,
  X,
  Eye,
  Info,
  ShieldAlert,
  ArrowDown,
  ArrowUp,
  SlidersHorizontal,
  BookOpen,
} from 'lucide-react';

interface TrainerSessionMonitoringSectionProps {
  batches: BatchRecord[];
  selectedBatchCode?: string;
}

export const TrainerSessionMonitoringSection: React.FC<TrainerSessionMonitoringSectionProps> = ({
  batches,
  selectedBatchCode,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Shortfall' | 'Completed' | 'Above Schedule' | 'Critical'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'difference' | 'critical' | 'completion' | 'scheduled' | 'iltDuration' | 'batchCode'>('difference');
  const [isCriticalModalOpen, setIsCriticalModalOpen] = useState(false);
  const [selectedBatchForCriticalModal, setSelectedBatchForCriticalModal] = useState<BatchRecord | null>(null);

  // Filter batches based on batchCode if passed, plus local search and status filters
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      // Local status filter
      if (statusFilter === 'Critical') {
        if (b.criticalAttendanceCount <= 0) return false;
      } else if (statusFilter !== 'ALL' && b.sessionStatus !== statusFilter) {
        return false;
      }
      // Local search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          b.batchCode.toLowerCase().includes(q) ||
          b.courseAlias.toLowerCase().includes(q) ||
          b.trainer.toLowerCase().includes(q) ||
          b.centre.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [batches, statusFilter, searchQuery]);

  // Sort batches
  const sortedBatches = useMemo(() => {
    return [...filteredBatches].sort((a, b) => {
      if (sortBy === 'difference') {
        const diffA = a.sessionHourDifference ?? -999;
        const diffB = b.sessionHourDifference ?? -999;
        return diffB - diffA; // Highest shortfall first
      }
      if (sortBy === 'critical') {
        return b.criticalAttendanceCount - a.criticalAttendanceCount; // Most critical students first
      }
      if (sortBy === 'completion') {
        const compA = a.sessionCompletionPct ?? 0;
        const compB = b.sessionCompletionPct ?? 0;
        return compA - compB; // Lowest completion first
      }
      if (sortBy === 'scheduled') {
        const schA = a.totalScheduledHours ?? 0;
        const schB = b.totalScheduledHours ?? 0;
        return schB - schA;
      }
      if (sortBy === 'iltDuration') {
        const iltA = a.iltDurationHours ?? 0;
        const iltB = b.iltDurationHours ?? 0;
        return iltB - iltA;
      }
      return a.batchCode.localeCompare(b.batchCode);
    });
  }, [filteredBatches, sortBy]);

  // -------------------------------------------------------------
  // DEDUPLICATED AGGREGATION ACROSS FILTERED BATCHES
  // (Avoid double-counting student rows)
  // -------------------------------------------------------------
  const totalBatchesCount = filteredBatches.length;

  const {
    totalIltDurationSum,
    avgIltDuration,
    hasIltDurationData,
    totalScheduledHoursSum,
    hasScheduledHoursData,
    totalActualHoursSum,
    hasActualHoursData,
    totalSessionHourShortfall,
    overallSessionCompletionPct,
    totalSessionsConductedSum,
    hasConductedData,
    totalStudentSessionsAttendedSum,
    hasAttendedData,
    overallMinSession,
    overallMaxSession,
    totalCriticalStudentsCount,
    allCriticalStudents,
    shortfallBatchesCount,
    completedBatchesCount,
    aboveScheduleBatchesCount,
    criticalBatchesCount,
  } = useMemo(() => {
    let iltSum = 0;
    let iltCount = 0;
    let scheduledSum = 0;
    let scheduledCount = 0;
    let actualSum = 0;
    let actualCount = 0;
    let conductedSum = 0;
    let conductedCount = 0;
    let attendedSum = 0;
    let attendedCount = 0;
    let minSession: { val: number; student: string | null; batch: string } | null = null;
    let maxSession: { val: number; student: string | null; batch: string } | null = null;
    let totalCritStudents = 0;
    const criticalList: Array<{
      batchCode: string;
      courseAlias: string;
      trainer: string;
      studentId: string;
      studentName: string;
      sessionsAttended: number | null;
      sessionsConducted: number | null;
      attendancePct: number;
    }> = [];
    let shortfallB = 0;
    let completedB = 0;
    let aboveB = 0;
    let criticalB = 0;

    for (let i = 0; i < filteredBatches.length; i++) {
      const b = filteredBatches[i];

      if (b.iltDurationHours !== null && !isNaN(b.iltDurationHours)) {
        iltSum += b.iltDurationHours;
        iltCount++;
      }

      if (b.totalScheduledHours !== null && !isNaN(b.totalScheduledHours)) {
        scheduledSum += b.totalScheduledHours;
        scheduledCount++;
      }

      if (b.actualClassHours !== null && !isNaN(b.actualClassHours)) {
        actualSum += b.actualClassHours;
        actualCount++;
      }

      if (b.sessionsConducted !== null && !isNaN(b.sessionsConducted)) {
        conductedSum += b.sessionsConducted;
        conductedCount++;
      }

      if (b.studentSessionsAttendedTotal !== null && !isNaN(b.studentSessionsAttendedTotal)) {
        attendedSum += b.studentSessionsAttendedTotal;
        attendedCount++;
      }

      if (b.studentSessionsAttendedMin !== null && !isNaN(b.studentSessionsAttendedMin)) {
        if (!minSession || b.studentSessionsAttendedMin < minSession.val) {
          minSession = { val: b.studentSessionsAttendedMin, student: b.studentSessionsAttendedMinStudent, batch: b.batchCode };
        }
      }

      if (b.studentSessionsAttendedMax !== null && !isNaN(b.studentSessionsAttendedMax)) {
        if (!maxSession || b.studentSessionsAttendedMax > maxSession.val) {
          maxSession = { val: b.studentSessionsAttendedMax, student: b.studentSessionsAttendedMaxStudent, batch: b.batchCode };
        }
      }

      totalCritStudents += (b.criticalAttendanceCount || 0);

      if (b.criticalAttendanceStudents && b.criticalAttendanceStudents.length > 0) {
        for (let j = 0; j < b.criticalAttendanceStudents.length; j++) {
          const s = b.criticalAttendanceStudents[j];
          criticalList.push({
            batchCode: b.batchCode,
            courseAlias: b.courseAlias,
            trainer: b.trainer,
            studentId: s.studentId,
            studentName: s.studentName,
            sessionsAttended: s.sessionsAttended,
            sessionsConducted: s.sessionsConducted,
            attendancePct: s.attendancePct,
          });
        }
      }

      if (b.sessionStatus === 'Shortfall') shortfallB++;
      else if (b.sessionStatus === 'Completed') completedB++;
      else if (b.sessionStatus === 'Above Schedule') aboveB++;
      if (b.criticalAttendanceCount > 0) criticalB++;
    }

    const hasIlt = iltCount > 0;
    const totIltSum = hasIlt ? Math.round(iltSum * 10) / 10 : null;
    const avgIlt = hasIlt ? Math.round((totIltSum! / iltCount) * 10) / 10 : null;

    const hasSch = scheduledCount > 0;
    const totSchSum = hasSch ? Math.round(scheduledSum * 10) / 10 : null;

    const hasAct = actualCount > 0;
    const totActSum = hasAct ? Math.round(actualSum * 10) / 10 : null;

    const totShortfall =
      totSchSum !== null && totActSum !== null
        ? Math.round((totSchSum - totActSum) * 10) / 10
        : null;

    const overallCompPct =
      totSchSum !== null && totSchSum > 0 && totActSum !== null
        ? Math.round((totActSum / totSchSum) * 1000) / 10
        : null;

    const hasCond = conductedCount > 0;
    const totCondSum = hasCond ? conductedSum : null;

    const hasAtt = attendedCount > 0;
    const totAttSum = hasAtt ? attendedSum : null;

    return {
      totalIltDurationSum: totIltSum,
      avgIltDuration: avgIlt,
      hasIltDurationData: hasIlt,
      totalScheduledHoursSum: totSchSum,
      hasScheduledHoursData: hasSch,
      totalActualHoursSum: totActSum,
      hasActualHoursData: hasAct,
      totalSessionHourShortfall: totShortfall,
      overallSessionCompletionPct: overallCompPct,
      totalSessionsConductedSum: totCondSum,
      hasConductedData: hasCond,
      totalStudentSessionsAttendedSum: totAttSum,
      hasAttendedData: hasAtt,
      overallMinSession: minSession,
      overallMaxSession: maxSession,
      totalCriticalStudentsCount: totalCritStudents,
      allCriticalStudents: criticalList,
      shortfallBatchesCount: shortfallB,
      completedBatchesCount: completedB,
      aboveScheduleBatchesCount: aboveB,
      criticalBatchesCount: criticalB,
    };
  }, [filteredBatches]);

  return (
    <section className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden p-5 sm:p-6 space-y-6">
      {/* Section Header */}
      <div className="border-b border-neutral-200/80 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 tracking-tight">
                Trainer Session Monitoring
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Monitoring scheduled training hours vs. actual completed class hours, shortfall tracking, min/max student sessions & critical attendance
              </p>
            </div>
          </div>
        </div>

        {/* Status Count Badges */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Shortfall: <strong className="font-bold text-amber-700">{shortfallBatchesCount}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-900 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Completed: <strong className="font-bold text-emerald-700">{completedBatchesCount}</strong>
          </span>
          {aboveScheduleBatchesCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-900 font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Above Schedule: <strong className="font-bold text-blue-700">{aboveScheduleBatchesCount}</strong>
            </span>
          )}
          {totalCriticalStudentsCount > 0 && (
            <button
              onClick={() => {
                setSelectedBatchForCriticalModal(null);
                setIsCriticalModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200/80 text-rose-900 font-semibold hover:bg-rose-100 transition cursor-pointer"
            >
              <UserX className="w-3 h-3 text-rose-600" />
              Critical Learners: <strong className="font-bold text-rose-700">{totalCriticalStudentsCount}</strong>
            </button>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 1. TRAINER SESSION MONITORING KPI CARDS                          */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {/* KPI 0: Course ILT Duration */}
        <div className="bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-semibold">Course ILT Duration</span>
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-indigo-900 block">
              {filteredBatches.length === 1 && filteredBatches[0].iltDurationHours !== null
                ? `${filteredBatches[0].iltDurationHours} hrs`
                : totalIltDurationSum !== null
                ? `${totalIltDurationSum} hrs`
                : 'No data'}
            </span>
            <span className="text-[10px] text-neutral-500 font-medium block mt-0.5" title="ILT Duration for Specific Course">
              {filteredBatches.length > 1 && avgIltDuration !== null
                ? `Avg ${avgIltDuration} hrs/batch`
                : 'For Specific Course'}
            </span>
          </div>
        </div>

        {/* KPI 1: Total Scheduled Hours (AH) */}
        <div className="bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-semibold">Total Scheduled Hours</span>
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-neutral-900 block">
              {totalScheduledHoursSum !== null ? `${totalScheduledHoursSum} hrs` : 'No data'}
            </span>
            <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">
              Source: Total Schedule Hours (AH)
            </span>
          </div>
        </div>

        {/* KPI 2: Actual Class Hours */}
        <div className="bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-semibold">Actual Class Hours</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-blue-700 block">
              {totalActualHoursSum !== null ? `${totalActualHoursSum} hrs` : 'No data'}
            </span>
            <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">
              Overall Class Hours (Course Level)
            </span>
          </div>
        </div>

        {/* KPI 3: Session Hour Shortfall (Shown in minus way e.g. -10.5 hrs for deficit) */}
        <div
          className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
            totalSessionHourShortfall === null
              ? 'bg-neutral-50/80 border-neutral-200/80 text-neutral-900'
              : totalSessionHourShortfall > 0
              ? 'bg-amber-50/70 border-amber-300/80 text-amber-950'
              : totalSessionHourShortfall === 0
              ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-900'
              : 'bg-blue-50/60 border-blue-200/80 text-blue-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold">Session Hour Shortfall</span>
            {totalSessionHourShortfall !== null && totalSessionHourShortfall > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-xl font-extrabold tracking-tight ${
                  totalSessionHourShortfall === null
                    ? 'text-neutral-700'
                    : totalSessionHourShortfall > 0
                    ? 'text-amber-800'
                    : totalSessionHourShortfall === 0
                    ? 'text-emerald-700'
                    : 'text-blue-700'
                }`}
              >
                {totalSessionHourShortfall !== null
                  ? totalSessionHourShortfall > 0
                    ? `-${totalSessionHourShortfall} hrs`
                    : totalSessionHourShortfall === 0
                    ? '0 hrs'
                    : `+${Math.abs(totalSessionHourShortfall)} hrs`
                  : 'No data'}
              </span>
            </div>
            <span className="text-[10px] font-medium block mt-0.5 text-neutral-600">
              {totalSessionHourShortfall === null
                ? 'Source: AI Column'
                : totalSessionHourShortfall > 0
                ? 'Shortfall deficit (hours not conducted)'
                : totalSessionHourShortfall === 0
                ? 'Schedule completed on time'
                : 'Actual hours exceeded schedule'}
            </span>
          </div>
        </div>

        {/* KPI 4: Session Completion % */}
        <div className="bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-semibold">Session Completion %</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span
              className={`text-xl font-extrabold block ${
                overallSessionCompletionPct === null
                  ? 'text-neutral-700'
                  : overallSessionCompletionPct >= 90
                  ? 'text-emerald-700'
                  : overallSessionCompletionPct >= 70
                  ? 'text-blue-700'
                  : 'text-amber-700'
              }`}
            >
              {overallSessionCompletionPct !== null ? `${overallSessionCompletionPct}%` : 'No data'}
            </span>
            <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">
              Actual Hours / Scheduled Hours
            </span>
          </div>
        </div>

        {/* KPI 5: Sessions Conducted (AF) */}
        <div className="bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-semibold">Sessions Conducted</span>
            <Layers className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-extrabold text-purple-700 block">
              {totalSessionsConductedSum !== null ? totalSessionsConductedSum : 'No data'}
            </span>
            <span className="text-[10px] text-neutral-500 font-medium block mt-0.5">
              Faculty for Beneficiary (AF)
            </span>
          </div>
        </div>

        {/* KPI 6: Student Sessions Attended (AG) - Exclusively shows Max & Min Classes Attended */}
        <div className="bg-neutral-50/80 p-3.5 rounded-2xl border border-neutral-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-semibold">Sessions Attended</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between gap-2">
              {/* Max Classes Attended */}
              <div className="flex-1 bg-emerald-50/80 p-1.5 px-2 rounded-xl border border-emerald-200/80">
                <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Max Classes
                </span>
                <span className="text-lg font-extrabold text-emerald-700 block leading-tight">
                  {overallMaxSession !== null ? `${overallMaxSession.val}` : '0'}
                  <span className="text-[10px] font-medium text-emerald-800 ml-0.5">cls</span>
                </span>
              </div>

              {/* Min Classes Attended */}
              <div className="flex-1 bg-amber-50/80 p-1.5 px-2 rounded-xl border border-amber-200/80">
                <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider block">
                  Min Classes
                </span>
                <span className="text-lg font-extrabold text-amber-700 block leading-tight">
                  {overallMinSession !== null ? `${overallMinSession.val}` : '0'}
                  <span className="text-[10px] font-medium text-amber-800 ml-0.5">cls</span>
                </span>
              </div>
            </div>

            <span className="text-[10px] text-neutral-500 font-medium block mt-1.5 text-center">
              Min & Max Attended by Students (AG)
            </span>
          </div>
        </div>

        {/* KPI 7: Critical Session Attendance (Replacing Scheduled Days) */}
        <div
          className={`p-3.5 rounded-2xl border flex flex-col justify-between cursor-pointer transition ${
            totalCriticalStudentsCount > 0
              ? 'bg-rose-50/80 border-rose-200/90 hover:border-rose-300'
              : 'bg-emerald-50/60 border-emerald-200/80 hover:border-emerald-300'
          }`}
          onClick={() => {
            setSelectedBatchForCriticalModal(null);
            setIsCriticalModalOpen(true);
          }}
          title="Click to view students taking critically few classes"
        >
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-semibold text-neutral-800">Critical Attendance</span>
            <UserX className={`w-3.5 h-3.5 ${totalCriticalStudentsCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
          </div>
          <div className="mt-2">
            <span
              className={`text-xl font-extrabold block ${
                totalCriticalStudentsCount > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {totalCriticalStudentsCount} Learners
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-neutral-600 font-medium">
                {totalCriticalStudentsCount > 0 ? 'Taking very few classes (<50%)' : 'All students regular'}
              </span>
              {totalCriticalStudentsCount > 0 && (
                <span className="text-[9px] font-bold text-rose-700 underline flex items-center gap-0.5">
                  View <Eye className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 2. VISUALIZATION: HORIZONTAL BAR COMPARISON (SCHEDULED VS ACTUAL) */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-neutral-50/50 rounded-2xl border border-neutral-200/80 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Batch Scheduled vs. Actual Completed Class Hours Comparison
            </h3>
            <p className="text-xs text-neutral-500">
              Visual comparison showing shortfall deficit in minus (-X hrs), min/max student attendance, and critical attendance load
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-neutral-300"></span>
              <span className="text-neutral-600 font-medium">Scheduled Hours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600"></span>
              <span className="text-neutral-600 font-medium">Actual Hours (Completed)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500"></span>
              <span className="text-neutral-600 font-medium">Shortfall (-Deficit)</span>
            </div>
          </div>
        </div>

        {sortedBatches.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            No batch records match the selected filters.
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {sortedBatches.slice(0, 10).map((b) => {
              const scheduled = b.totalScheduledHours ?? 0;
              const actual = b.actualClassHours ?? 0;
              const maxScale = Math.max(scheduled, actual, 100);
              const scheduledPct = Math.min(100, (scheduled / maxScale) * 100);
              const actualPct = Math.min(100, (actual / maxScale) * 100);
              const isShortfall = (b.sessionHourDifference ?? 0) > 0;
              const isCompleted = (b.sessionHourDifference ?? null) === 0;
              const completionPct = b.sessionCompletionPct !== null ? `${b.sessionCompletionPct}%` : 'No data';

              return (
                <div key={b.batchCode} className="space-y-1.5 bg-white p-3 rounded-xl border border-neutral-200/60 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-neutral-900">{b.batchCode}</span>
                      <span className="text-neutral-500 font-medium">({b.courseAlias})</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.sessionStatus === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.sessionStatus === 'Shortfall'
                            ? 'bg-amber-100 text-amber-800'
                            : b.sessionStatus === 'Above Schedule'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {b.sessionStatus}
                      </span>
                      {/* ILT Duration badge */}
                      {b.iltDurationHours !== null && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center gap-1" title="ILT Duration for Specific Course">
                          <BookOpen className="w-2.5 h-2.5 text-indigo-500" />
                          ILT: {b.iltDurationHours} hrs
                        </span>
                      )}
                      {b.criticalAttendanceCount > 0 && (
                        <button
                          onClick={() => {
                            setSelectedBatchForCriticalModal(b);
                            setIsCriticalModalOpen(true);
                          }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 hover:bg-rose-200 transition cursor-pointer flex items-center gap-1"
                        >
                          <UserX className="w-2.5 h-2.5" />
                          {b.criticalAttendanceCount} Critical
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-semibold text-neutral-600 flex-wrap">
                      <span>Course ILT: <strong className="text-indigo-900 font-bold">{b.iltDurationHours !== null ? `${b.iltDurationHours} hrs` : '-'}</strong></span>
                      <span>Scheduled: <strong className="text-neutral-900">{scheduled > 0 ? `${scheduled} hrs` : '-'}</strong></span>
                      <span>Actual: <strong className="text-blue-700">{actual > 0 ? `${actual} hrs` : '-'}</strong></span>
                      <span>
                        Shortfall:{' '}
                        <strong
                          className={
                            isShortfall
                              ? 'text-amber-700 font-extrabold'
                              : isCompleted
                              ? 'text-emerald-700'
                              : 'text-blue-700'
                          }
                        >
                          {b.sessionHourDifference !== null
                            ? b.sessionHourDifference > 0
                              ? `-${b.sessionHourDifference} hrs`
                              : b.sessionHourDifference === 0
                              ? '0 hrs'
                              : `+${Math.abs(b.sessionHourDifference)} hrs`
                            : '-'}
                        </strong>
                      </span>
                      <span className="bg-neutral-100 px-1.5 py-0.5 rounded font-bold text-neutral-800">
                        {completionPct}
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar tracks */}
                  <div className="space-y-1">
                    {/* Scheduled track */}
                    <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden flex">
                      <div
                        className="bg-neutral-300 rounded-full transition-all duration-500"
                        style={{ width: `${scheduledPct}%` }}
                        title={`Scheduled: ${scheduled} hrs`}
                      />
                    </div>
                    {/* Actual track */}
                    <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden flex">
                      <div
                        className={`rounded-full transition-all duration-500 ${
                          isShortfall ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${actualPct}%` }}
                        title={`Actual: ${actual} hrs (${completionPct})`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 3. BATCH-WISE PERFORMANCE TABLE                                 */}
      {/* ---------------------------------------------------------------- */}
      <div className="space-y-3">
        {/* Table Controls (Search, Status Filter, Sort) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-neutral-50/80 p-3 rounded-xl border border-neutral-200/80">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search batch code, program, trainer, or centre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-neutral-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter Buttons */}
            <div className="flex items-center bg-white p-0.5 border border-neutral-200 rounded-lg text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                All ({batches.length})
              </button>
              <button
                onClick={() => setStatusFilter('Shortfall')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  statusFilter === 'Shortfall' ? 'bg-amber-600 text-white' : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                Shortfall ({shortfallBatchesCount})
              </button>
              <button
                onClick={() => setStatusFilter('Completed')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  statusFilter === 'Completed' ? 'bg-emerald-600 text-white' : 'text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                Completed ({completedBatchesCount})
              </button>
              {totalCriticalStudentsCount > 0 && (
                <button
                  onClick={() => setStatusFilter('Critical')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    statusFilter === 'Critical' ? 'bg-rose-600 text-white' : 'text-rose-800 hover:bg-rose-50'
                  }`}
                >
                  Critical ({criticalBatchesCount})
                </button>
              )}
            </div>

            {/* Sort selection */}
            <div className="flex items-center gap-1 text-xs">
              <label htmlFor="sort-session-batches" className="text-neutral-500 text-[11px] font-medium shrink-0">Sort:</label>
              <select
                id="sort-session-batches"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-white border border-neutral-200 rounded-lg px-2 py-1 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="difference">Highest Shortfall</option>
                <option value="critical">Most Critical Students</option>
                <option value="completion">Lowest Completion %</option>
                <option value="scheduled">Scheduled Hours</option>
                <option value="iltDuration">Course ILT Duration</option>
                <option value="batchCode">Batch Code</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exact Performance Table */}
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-100/90 text-neutral-800 font-semibold border-b border-neutral-200">
              <tr>
                <th className="p-2.5">Batch Code</th>
                <th className="p-2.5">Course Alias</th>
                <th className="p-2.5">Batch Status</th>
                <th className="p-2.5 text-center bg-indigo-50/70 border-l border-r border-neutral-200">
                  Course ILT Duration
                </th>
                <th className="p-2.5 text-center">Total Scheduled Hours</th>
                <th className="p-2.5 text-center">Actual Class Hours</th>
                <th className="p-2.5 text-center bg-amber-50/60 border-l border-neutral-200">
                  Session Hour Shortfall (AI)
                </th>
                <th className="p-2.5 text-center">Session Completion %</th>
                <th className="p-2.5 text-center">Sessions Conducted</th>
                <th className="p-2.5 text-center">Student Sessions Attended (AG)</th>
                <th className="p-2.5 text-center bg-rose-50/60">Critical Learners</th>
                <th className="p-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {sortedBatches.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-6 text-center text-xs text-neutral-400">
                    No batch records found matching the query.
                  </td>
                </tr>
              ) : (
                sortedBatches.map((b) => {
                  const isShortfall = (b.sessionHourDifference ?? 0) > 0;
                  const isCompleted = (b.sessionHourDifference ?? null) === 0;

                  return (
                    <tr key={b.batchCode} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="p-2.5 font-mono font-bold text-neutral-900">{b.batchCode}</td>
                      <td className="p-2.5 font-medium text-neutral-700">{b.courseAlias}</td>
                      <td className="p-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            b.batchStatus === 'running'
                              ? 'bg-blue-100 text-blue-700'
                              : b.batchStatus === 'complete' || b.batchStatus === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {b.batchStatus}
                        </span>
                      </td>

                      {/* Course ILT Duration for specific course */}
                      <td className="p-2.5 text-center font-bold text-indigo-950 bg-indigo-50/30 border-l border-r border-neutral-200">
                        {b.iltDurationHours !== null ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-indigo-900">
                            <BookOpen className="w-3 h-3 text-indigo-500" />
                            {b.iltDurationHours} hrs
                          </span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>

                      {/* Scheduled Hours (AH) */}
                      <td className="p-2.5 text-center font-bold text-neutral-900">
                        {b.totalScheduledHours !== null ? `${b.totalScheduledHours} hrs` : '-'}
                      </td>

                      {/* Actual Class Hours */}
                      <td className="p-2.5 text-center font-bold text-blue-700">
                        {b.actualClassHours !== null ? `${b.actualClassHours} hrs` : '-'}
                      </td>

                      {/* Hour Shortfall in minus representation e.g. -10.5 hrs (AI) */}
                      <td className="p-2.5 text-center bg-amber-50/30 border-l border-neutral-200">
                        <span
                          className={`font-bold inline-flex items-center gap-1 ${
                            b.sessionHourDifference === null
                              ? 'text-neutral-500'
                              : isShortfall
                              ? 'text-amber-800 font-extrabold'
                              : isCompleted
                              ? 'text-emerald-700'
                              : 'text-blue-700'
                          }`}
                        >
                          {b.sessionHourDifference !== null
                            ? b.sessionHourDifference > 0
                              ? `-${b.sessionHourDifference} hrs`
                              : b.sessionHourDifference === 0
                              ? '0 hrs'
                              : `+${Math.abs(b.sessionHourDifference)} hrs`
                            : '-'}
                        </span>
                      </td>

                      {/* Completion % */}
                      <td className="p-2.5 text-center font-bold">
                        {b.sessionCompletionPct !== null ? (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] ${
                              b.sessionCompletionPct >= 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.sessionCompletionPct >= 80
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {b.sessionCompletionPct}%
                          </span>
                        ) : (
                          <span className="text-neutral-400">No data</span>
                        )}
                      </td>

                      {/* Sessions Conducted (AF) */}
                      <td className="p-2.5 text-center font-semibold text-neutral-800">
                        {b.sessionsConducted !== null ? b.sessionsConducted : '-'}
                      </td>

                      {/* Sessions Attended (AG) with Min, Max & Avg breakdown */}
                      <td className="p-2.5 text-center font-semibold text-neutral-800">
                        {b.studentSessionsAttendedAvg !== null ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span>
                              {b.studentSessionsAttendedAvg} avg{' '}
                              <span className="text-[10px] text-neutral-400 font-normal">
                                ({b.studentSessionsAttendedTotal} total)
                              </span>
                            </span>
                            {(b.studentSessionsAttendedMin !== null || b.studentSessionsAttendedMax !== null) && (
                              <div className="flex items-center gap-1.5 text-[9px] text-neutral-600 mt-0.5">
                                {b.studentSessionsAttendedMin !== null && (
                                  <span
                                    className="bg-amber-50 text-amber-800 px-1 py-0.2 rounded border border-amber-200"
                                    title={`Min: ${b.studentSessionsAttendedMinStudent || `${b.studentSessionsAttendedMin} sessions`}`}
                                  >
                                    Min: {b.studentSessionsAttendedMin}
                                  </span>
                                )}
                                {b.studentSessionsAttendedMax !== null && (
                                  <span
                                    className="bg-emerald-50 text-emerald-800 px-1 py-0.2 rounded border border-emerald-200"
                                    title={`Max: ${b.studentSessionsAttendedMaxStudent || `${b.studentSessionsAttendedMax} sessions`}`}
                                  >
                                    Max: {b.studentSessionsAttendedMax}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Critical Session Attendance (<50%) */}
                      <td className="p-2.5 text-center bg-rose-50/20">
                        {b.criticalAttendanceCount > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedBatchForCriticalModal(b);
                              setIsCriticalModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 hover:bg-rose-200 font-bold text-[10px] transition cursor-pointer"
                            title={`Click to view ${b.criticalAttendanceCount} students taking very few classes in batch ${b.batchCode}`}
                          >
                            <UserX className="w-2.5 h-2.5 text-rose-600" />
                            {b.criticalAttendanceCount} learners
                          </button>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            0
                          </span>
                        )}
                      </td>

                      {/* Status Tag */}
                      <td className="p-2.5 text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            b.sessionStatus === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.sessionStatus === 'Shortfall'
                              ? 'bg-amber-100 text-amber-800'
                              : b.sessionStatus === 'Above Schedule'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {b.sessionStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 4. CRITICAL LEARNERS MODAL / INSPECTION DIALOG                    */}
      {/* ---------------------------------------------------------------- */}
      {isCriticalModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsCriticalModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] shadow-2xl border border-neutral-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    {selectedBatchForCriticalModal
                      ? `Critical Session Attendance — Batch ${selectedBatchForCriticalModal.batchCode}`
                      : 'Critical Session Attendance — All Filtered Batches'}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Students attending critically few classes (&lt;50% sessions conducted or &le;3 classes)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCriticalModalOpen(false)}
                className="w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4">
              {(() => {
                const studentsToDisplay = selectedBatchForCriticalModal
                  ? (selectedBatchForCriticalModal.criticalAttendanceStudents || []).map((s) => ({
                      batchCode: selectedBatchForCriticalModal.batchCode,
                      courseAlias: selectedBatchForCriticalModal.courseAlias,
                      trainer: selectedBatchForCriticalModal.trainer,
                      studentId: s.studentId,
                      studentName: s.studentName,
                      sessionsAttended: s.sessionsAttended,
                      sessionsConducted: s.sessionsConducted,
                      attendancePct: s.attendancePct,
                    }))
                  : allCriticalStudents;

                if (studentsToDisplay.length === 0) {
                  return (
                    <div className="py-12 text-center text-xs text-neutral-500">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="font-semibold text-neutral-800 text-sm">No critical attendance students found!</p>
                      <p className="text-neutral-400 mt-1">All students in the selected batches maintain regular class attendance.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/80">
                      <span>Total Critical Students: <strong className="font-bold text-rose-700">{studentsToDisplay.length}</strong></span>
                      <span className="text-neutral-400">Showing learners taking very few classes</span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-neutral-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-neutral-100 text-neutral-700 font-semibold border-b border-neutral-200">
                          <tr>
                            <th className="p-2.5">Student Code</th>
                            <th className="p-2.5">Student Name</th>
                            <th className="p-2.5">Batch Code</th>
                            <th className="p-2.5">Trainer</th>
                            <th className="p-2.5 text-center">Sessions Attended (AG)</th>
                            <th className="p-2.5 text-center">Sessions Conducted (AF)</th>
                            <th className="p-2.5 text-center">Attendance %</th>
                            <th className="p-2.5 text-right">Risk Level</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 bg-white">
                          {studentsToDisplay.map((stu, i) => {
                            const isSevere = stu.attendancePct < 30 || (stu.sessionsAttended !== null && stu.sessionsAttended <= 1);
                            return (
                              <tr key={`${stu.studentId}-${i}`} className="hover:bg-neutral-50/80">
                                <td className="p-2.5 font-mono font-bold text-neutral-900">{stu.studentId}</td>
                                <td className="p-2.5 font-medium text-neutral-900">{stu.studentName}</td>
                                <td className="p-2.5 font-mono text-neutral-600">{stu.batchCode}</td>
                                <td className="p-2.5 text-neutral-600">{stu.trainer}</td>
                                <td className="p-2.5 text-center font-bold text-rose-700">
                                  {stu.sessionsAttended !== null ? stu.sessionsAttended : '0'}
                                </td>
                                <td className="p-2.5 text-center font-semibold text-neutral-700">
                                  {stu.sessionsConducted !== null ? stu.sessionsConducted : '-'}
                                </td>
                                <td className="p-2.5 text-center font-bold">
                                  <span className={`px-2 py-0.5 rounded-md ${isSevere ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {stu.attendancePct}%
                                  </span>
                                </td>
                                <td className="p-2.5 text-right">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSevere ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                                    {isSevere ? 'Severe Risk' : 'High Risk'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end">
              <button
                onClick={() => setIsCriticalModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
