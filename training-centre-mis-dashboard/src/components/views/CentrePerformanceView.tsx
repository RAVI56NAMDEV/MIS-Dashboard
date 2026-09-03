import React, { useState, useMemo } from 'react';
import { CentreRecord, BatchRecord, StudentRecord, ConfigThresholds } from '../../types';
import { BarChart } from '../charts/BarChart';
import { DonutChart } from '../charts/DonutChart';
import { Building2, AlertTriangle, Search, Briefcase, Users, CheckCircle2 } from 'lucide-react';

interface CentrePerformanceViewProps {
  centres: CentreRecord[];
  batches: BatchRecord[];
  students: StudentRecord[];
  thresholds: ConfigThresholds;
}

export const CentrePerformanceView: React.FC<CentrePerformanceViewProps> = React.memo(({
  centres,
  batches,
  students,
  thresholds,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');

  const mainCentreName = 'MPKND';
  const mpkndStudents = students; // Single centre dataset
  const totalStudents = mpkndStudents.length;

  const {
    avgAttendance,
    placedCount,
    placementPct,
    dropoutCount,
    fullVerified,
    statusDonutData,
    verificationDonutData,
    belowAttendanceStudents,
  } = useMemo(() => {
    let attSum = 0;
    let placed = 0;
    let dropouts = 0;
    let completed = 0;
    let active = 0;
    let fullVerifiedCount = 0;
    const belowAtt: StudentRecord[] = [];

    for (let i = 0; i < totalStudents; i++) {
      const s = mpkndStudents[i];
      attSum += s.attendancePct;
      if (s.isPlaced) placed++;
      if (s.isDropout) dropouts++;
      if (s.studentStatus === 'Completed') completed++;
      else if (s.studentStatus === 'Active') active++;
      if (s.isValidationDone) fullVerifiedCount++;
      if (!s.meetsAttendanceReq) belowAtt.push(s);
    }

    const calcAvgAtt = totalStudents > 0 ? Math.round((attSum / totalStudents) * 10) / 10 : 0;
    const calcPlacePct = totalStudents > 0 ? Math.round((placed / totalStudents) * 1000) / 10 : 0;

    const sDonutData = [
      { label: 'Completed', value: completed, color: '#34a853' },
      { label: 'Active', value: active, color: '#4285f4' },
      { label: 'Dropped Out', value: dropouts, color: '#ea4335' },
    ];

    const vDonutData = [
      { label: 'Validation Completed', value: fullVerifiedCount, color: '#10b981' },
      { label: 'Pending Verification', value: totalStudents - fullVerifiedCount, color: '#f59e0b' },
    ];

    return {
      avgAttendance: calcAvgAtt,
      placedCount: placed,
      placementPct: calcPlacePct,
      dropoutCount: dropouts,
      fullVerified: fullVerifiedCount,
      statusDonutData: sDonutData,
      verificationDonutData: vDonutData,
      belowAttendanceStudents: belowAtt,
    };
  }, [mpkndStudents, totalStudents]);

  // MPKND Batch-wise Attendance Bar Chart
  const mpkndBatchAttendanceBar = useMemo(() => {
    return batches.map((b) => ({
      label: b.batchCode,
      value: b.avgAttendancePct,
      color: b.avgAttendancePct >= thresholds.attendanceReqPct ? '#4285f4' : '#ea4335',
    }));
  }, [batches, thresholds.attendanceReqPct]);

  // Search & Batch filter for below attendance students
  const filteredActionStudents = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return belowAttendanceStudents.filter((s) => {
      const matchesSearch =
        !term ||
        s.studentName.toLowerCase().includes(term) ||
        s.studentId.toLowerCase().includes(term) ||
        s.batchCode.toLowerCase().includes(term);
      const matchesBatch = selectedBatch === 'all' || s.batchCode === selectedBatch;
      return matchesSearch && matchesBatch;
    });
  }, [belowAttendanceStudents, searchTerm, selectedBatch]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Centre Primary Operational Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5 text-neutral-500 mb-1">
            <Building2 className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium">Centre Location</span>
          </div>
          <span className="text-2xl font-extrabold text-neutral-900 block truncate">
            {mainCentreName}
          </span>
          <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">
            Primary Training Hub
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Enrolled Candidates</span>
          <span className="text-2xl font-extrabold text-blue-600 mt-1 block">{totalStudents}</span>
          <span className="text-[10px] text-neutral-400">{batches.length} Active Batches</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Average Attendance %</span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{avgAttendance}%</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
            Classroom Delivery
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-xs font-medium text-neutral-500 block">Placement Rate %</span>
          <span className="text-2xl font-extrabold text-indigo-600 mt-1 block">{placementPct}%</span>
          <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold">
            Corporate Hires
          </span>
        </div>
      </div>

      {/* Centre Performance Summary Table */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-neutral-900">Centre Performance Summary</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200">
              <tr>
                <th className="p-3">Centre Location</th>
                <th className="p-3 text-center">Students</th>
                <th className="p-3 text-center">Attendance %</th>
                <th className="p-3 text-center">Placement %</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {centres.map((c) => (
                <tr key={c.centre} className="hover:bg-neutral-50/80">
                  <td className="p-3 font-bold text-neutral-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    {c.centre}
                  </td>
                  <td className="p-3 text-center font-medium text-neutral-800">{c.totalStudents}</td>
                  <td className="p-3 text-center font-bold text-blue-600">{c.avgAttendancePct}%</td>
                  <td className="p-3 text-center font-bold text-emerald-600">{c.placementPct}%</td>
                  <td className="p-3 text-right">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        c.statusGrade === 'Good'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : c.statusGrade === 'Needs Attention'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-rose-100 text-rose-700 border border-rose-200'
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

      {/* MPKND Single-Centre Placement Performance Visualization */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-neutral-900">Placement Performance (MPKND)</h3>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Corporate placement conversion metrics for MPKND Training Centre
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
            Centre Placement: {placementPct}%
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Supporting Metrics Panel */}
          <div className="space-y-2.5">
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200/70 flex justify-between items-center">
              <span className="text-xs font-medium text-neutral-600">Training Centre</span>
              <span className="text-xs font-extrabold text-neutral-900 font-mono bg-white px-2 py-0.5 rounded border border-neutral-200">
                MPKND
              </span>
            </div>
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200/70 flex justify-between items-center">
              <span className="text-xs font-medium text-neutral-600">Total Students</span>
              <span className="text-xs font-extrabold text-neutral-900">{totalStudents}</span>
            </div>
            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/60 flex justify-between items-center">
              <span className="text-xs font-medium text-emerald-800">Placed Students</span>
              <span className="text-xs font-extrabold text-emerald-700">{placedCount}</span>
            </div>
            <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200/60 flex justify-between items-center">
              <span className="text-xs font-medium text-blue-800">Placement %</span>
              <span className="text-xs font-extrabold text-blue-700">{placementPct}%</span>
            </div>
          </div>

          {/* Clean Horizontal Progress Visualization for MPKND */}
          <div className="lg:col-span-2 space-y-4 bg-neutral-50/60 p-5 rounded-2xl border border-neutral-200/60">
            <div>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  MPKND Placement Progress
                </span>
                <span className="font-extrabold text-sm text-emerald-600 font-mono">
                  {placementPct}%
                </span>
              </div>

              {/* Clean Horizontal Bar */}
              <div className="w-full h-6 bg-neutral-200 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${Math.max(Math.min(placementPct, 100), 2)}%` }}
                >
                  {placementPct >= 12 && (
                    <span className="text-[11px] font-extrabold text-white leading-none font-mono">
                      {placementPct}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 bg-white rounded-xl border border-neutral-200/80">
                <span className="text-[11px] text-neutral-500 block">Placed vs Total Students</span>
                <span className="text-sm font-extrabold text-neutral-900 mt-0.5 block">
                  {placedCount} / {totalStudents}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-neutral-200/80">
                <span className="text-[11px] text-neutral-500 block">Performance Status</span>
                <span className="text-sm font-extrabold text-emerald-600 mt-0.5 block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" />
                  {placementPct >= thresholds.lowPlacementThresholdPct ? 'Target Met' : 'Active Driving'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MPKND Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full min-w-0">
        <DonutChart
          title="Candidate Status Breakdown (MPKND)"
          subtitle="Enrolment stage distribution for MPKND centre"
          data={statusDonutData}
          centerText={totalStudents.toString()}
          centerLabel="Candidates"
        />

        <DonutChart
          title="Validation & Verification Status (MPKND)"
          subtitle="Data quality & profile validation readiness"
          data={verificationDonutData}
          centerText={`${fullVerified}/${totalStudents}`}
          centerLabel="Verified"
        />
      </div>

      {/* MPKND Batch Attendance Performance */}
      <div className="w-full">
        <BarChart
          title="Batch-Wise Attendance Average (MPKND)"
          subtitle="Classroom delivery performance per operational batch in MPKND"
          data={mpkndBatchAttendanceBar}
          targetLine={thresholds.attendanceReqPct}
          targetLabel="Required Threshold"
        />
      </div>

      {/* Action Required: Students Below Attendance Requirement */}
      <div className="bg-white rounded-2xl border border-rose-200/80 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-neutral-900">
                Action Required: Students Below Attendance Threshold
              </h3>
              <span className="text-xs font-extrabold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-mono">
                {belowAttendanceStudents.length} Flagged
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Learners in MPKND falling below the required {thresholds.attendanceReqPct}% attendance target
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 w-44"
              />
            </div>

            {/* Batch Filter */}
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-neutral-200 bg-white text-neutral-700 font-semibold focus:outline-none"
            >
              <option value="all">All Batches</option>
              {batches.map((b) => (
                <option key={b.batchCode} value={b.batchCode}>
                  {b.batchCode}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Flagged Students Table with Batch Code Column */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-rose-50/60 text-rose-950 font-semibold border-b border-rose-200">
              <tr>
                <th className="p-2.5">Student ID</th>
                <th className="p-2.5">Student Name</th>
                <th className="p-2.5 text-center">Batch Code</th>
                <th className="p-2.5">Course Name</th>
                <th className="p-2.5 text-center">Attendance %</th>
                <th className="p-2.5 text-center">ILT Completion %</th>
                <th className="p-2.5 text-center">Verification</th>
                <th className="p-2.5 text-right">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredActionStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-neutral-400 font-medium">
                    No students currently below attendance requirement in selected filter.
                  </td>
                </tr>
              ) : (
                filteredActionStudents.map((s) => (
                  <tr key={s.studentId} className="hover:bg-rose-50/30 transition-colors">
                    <td className="p-2.5 font-mono text-neutral-500 font-medium">{s.studentId}</td>
                    <td className="p-2.5 font-bold text-neutral-900">{s.studentName}</td>
                    <td className="p-2.5 text-center">
                      <span className="font-extrabold font-mono text-[11px] bg-purple-50 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-md">
                        {s.batchCode}
                      </span>
                    </td>
                    <td className="p-2.5 text-neutral-600 truncate max-w-[140px]">{s.courseAlias}</td>
                    <td className="p-2.5 text-center">
                      <span className="font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg">
                        {s.attendancePct}%
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-bold text-neutral-700">{s.iltCompletionPct}%</td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          s.isValidationDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {s.isValidationDone ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg inline-block">
                        Counseling & Guardian Alert
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
