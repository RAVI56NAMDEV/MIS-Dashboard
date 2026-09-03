import React from 'react';
import { BatchRecord, ConfigThresholds } from '../../types';
import { BarChart } from '../charts/BarChart';
import { DonutChart } from '../charts/DonutChart';
import { StackedBarChart } from '../charts/StackedBarChart';
import { TrainerSessionMonitoringSection } from './TrainerSessionMonitoringSection';
import { Layers, Users, Calendar, CheckCircle2, Linkedin, MessageSquare, ShieldCheck, Mail, AlertCircle } from 'lucide-react';

interface BatchPerformanceViewProps {
  batches: BatchRecord[];
  thresholds: ConfigThresholds;
}

export const BatchPerformanceView: React.FC<BatchPerformanceViewProps> = React.memo(({ batches, thresholds }) => {
  const [selectedBatchFilter, setSelectedBatchFilter] = React.useState<string>('ALL');

  const displayBatches = React.useMemo(() => {
    if (selectedBatchFilter === 'ALL') return batches;
    const matched = batches.filter((b) => b.batchCode === selectedBatchFilter);
    return matched.length > 0 ? matched : batches;
  }, [batches, selectedBatchFilter]);

  const {
    totalBatches,
    runningBatches,
    completedBatches,
    upcomingBatches,
    totalStudentsInBatches,
    avgStudentsPerBatch,
    avgBatchAttendance,
    totalLinkedinDone,
    overallLinkedinPct,
    totalIchatDone,
    overallIchatPct,
    totalValidationDone,
    overallValidationPct,
    totalEmailDone,
    overallEmailPct,
    statusDonut,
    stackedData,
    verificationStackedData,
  } = React.useMemo(() => {
    const totalB = displayBatches.length;
    let running = 0;
    let completed = 0;
    let upcoming = 0;
    let totalStudents = 0;
    let attSum = 0;
    let linkedinDone = 0;
    let ichatDone = 0;
    let validationDone = 0;
    let emailDone = 0;

    for (let i = 0; i < totalB; i++) {
      const b = displayBatches[i];
      if (b.batchStatus === 'running') running++;
      else if (b.batchStatus === 'complete' || b.batchStatus === 'completed') completed++;
      else if (b.batchStatus === 'upcoming') upcoming++;

      totalStudents += b.totalStudents;
      attSum += b.avgAttendancePct;
      linkedinDone += (b.linkedinDoneCount || 0);
      ichatDone += (b.ichatDoneCount || 0);
      validationDone += (b.validationDoneCount || 0);
      emailDone += (b.emailDoneCount || 0);
    }

    const calculatedAvgStudents = totalB > 0 ? Math.round((totalStudents / totalB) * 10) / 10 : 0;
    const calculatedAvgBatchAtt = totalB > 0 ? Math.round((attSum / totalB) * 10) / 10 : 0;
    const calcLinkedinPct = totalStudents > 0 ? Math.round((linkedinDone / totalStudents) * 1000) / 10 : 0;
    const calcIchatPct = totalStudents > 0 ? Math.round((ichatDone / totalStudents) * 1000) / 10 : 0;
    const calcValPct = totalStudents > 0 ? Math.round((validationDone / totalStudents) * 1000) / 10 : 0;
    const calcEmailPct = totalStudents > 0 ? Math.round((emailDone / totalStudents) * 1000) / 10 : 0;

    const sDonut = [
      { label: 'Running / Active', value: running, color: '#4285f4' },
      { label: 'Completed', value: completed, color: '#34a853' },
      { label: 'Upcoming', value: upcoming, color: '#fbbc04' },
    ];

    const sData = displayBatches.slice(0, 8).map((b) => ({
      category: b.batchCode,
      values: {
        active: b.activeStudents,
        completed: b.completedStudents,
        dropout: b.dropoutCount,
      },
    }));

    const vData = displayBatches.slice(0, 8).map((b) => ({
      category: b.batchCode,
      values: {
        linkedin: b.linkedinDonePct || 0,
        ichat: b.ichatDonePct || 0,
        validation: b.validationDonePct || 0,
        email: b.emailDonePct || 0,
      },
    }));

    return {
      totalBatches: totalB,
      runningBatches: running,
      completedBatches: completed,
      upcomingBatches: upcoming,
      totalStudentsInBatches: totalStudents,
      avgStudentsPerBatch: calculatedAvgStudents,
      avgBatchAttendance: calculatedAvgBatchAtt,
      totalLinkedinDone: linkedinDone,
      overallLinkedinPct: calcLinkedinPct,
      totalIchatDone: ichatDone,
      overallIchatPct: calcIchatPct,
      totalValidationDone: validationDone,
      overallValidationPct: calcValPct,
      totalEmailDone: emailDone,
      overallEmailPct: calcEmailPct,
      statusDonut: sDonut,
      stackedData: sData,
      verificationStackedData: vData,
    };
  }, [displayBatches]);

  const verificationSeries = [
    { key: 'linkedin', label: 'LinkedIn Status %', color: '#0077b5' },
    { key: 'ichat', label: 'IChat Status %', color: '#8e44ad' },
    { key: 'validation', label: 'Validation Status %', color: '#16a085' },
    { key: 'email', label: 'Email Status %', color: '#e67e22' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Batch Selector Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Batch Performance & Operational Verification Dashboard
          </h2>
          <p className="text-xs text-neutral-500">
            {selectedBatchFilter === 'ALL'
              ? `Showing aggregated metrics across all ${batches.length} batches`
              : `Showing performance breakdown for Batch: ${selectedBatchFilter}`}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="batch-select-filter" className="text-xs font-semibold text-neutral-700 shrink-0">Filter Batch:</label>
          <select
            id="batch-select-filter"
            value={selectedBatchFilter}
            onChange={(e) => setSelectedBatchFilter(e.target.value)}
            className="text-xs font-medium bg-neutral-50 border border-neutral-300 text-neutral-900 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-auto cursor-pointer"
          >
            <option value="ALL">All Batches ({batches.length})</option>
            {batches.map((b) => (
              <option key={b.batchCode} value={b.batchCode}>
                {b.batchCode} ({b.totalStudents} learners)
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Primary Batch Operational KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-500 block">Total Batches</span>
          <span className="text-xl font-extrabold text-neutral-900 mt-0.5 block">{totalBatches}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-500 block">Active Batches</span>
          <span className="text-xl font-extrabold text-blue-600 mt-0.5 block">{runningBatches}</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-500 block">Avg Attendance %</span>
          <span className="text-xl font-extrabold text-blue-600 mt-0.5 block">{avgBatchAttendance}%</span>
        </div>

        {/* Verification Status KPIs for each Batch */}
        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center gap-1 text-sky-700">
            <Linkedin className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">LinkedIn Status</span>
          </div>
          <div className="mt-1 flex flex-col">
            <span className="text-xl font-extrabold text-sky-700">{overallLinkedinPct}%</span>
            <div className="text-[10px] font-semibold bg-sky-50/80 p-1.5 rounded-lg mt-1 flex flex-col gap-0.5 border border-sky-100">
              <span className="text-sky-900"><strong className="font-bold text-sky-700">{totalLinkedinDone}</strong> Done</span>
              <span className="text-neutral-600"><strong className="font-bold text-amber-700">{totalStudentsInBatches - totalLinkedinDone}</strong> Pending</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center gap-1 text-purple-700">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">IChat Status</span>
          </div>
          <div className="mt-1 flex flex-col">
            <span className="text-xl font-extrabold text-purple-700">{overallIchatPct}%</span>
            <div className="text-[10px] font-semibold bg-purple-50/80 p-1.5 rounded-lg mt-1 flex flex-col gap-0.5 border border-purple-100">
              <span className="text-purple-900"><strong className="font-bold text-purple-700">{totalIchatDone}</strong> Done</span>
              <span className="text-neutral-600"><strong className="font-bold text-amber-700">{totalStudentsInBatches - totalIchatDone}</strong> Pending</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center gap-1 text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">Validation Status</span>
          </div>
          <div className="mt-1 flex flex-col">
            <span className="text-xl font-extrabold text-emerald-700">{overallValidationPct}%</span>
            <div className="text-[10px] font-semibold bg-emerald-50/80 p-1.5 rounded-lg mt-1 flex flex-col gap-0.5 border border-emerald-100">
              <span className="text-emerald-900"><strong className="font-bold text-emerald-700">{totalValidationDone}</strong> Done</span>
              <span className="text-neutral-600"><strong className="font-bold text-amber-700">{totalStudentsInBatches - totalValidationDone}</strong> Pending</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <div className="flex items-center gap-1 text-amber-700">
            <Mail className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">Email Status</span>
          </div>
          <div className="mt-1 flex flex-col">
            <span className="text-xl font-extrabold text-amber-700">{overallEmailPct}%</span>
            <div className="text-[10px] font-semibold bg-amber-50/80 p-1.5 rounded-lg mt-1 flex flex-col gap-0.5 border border-amber-100">
              <span className="text-amber-900"><strong className="font-bold text-amber-700">{totalEmailDone}</strong> Done</span>
              <span className="text-neutral-600"><strong className="font-bold text-amber-700">{totalStudentsInBatches - totalEmailDone}</strong> Pending</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-medium text-neutral-500 block">Avg Learners / Batch</span>
          <span className="text-xl font-extrabold text-neutral-800 mt-0.5 block">{avgStudentsPerBatch}</span>
        </div>
      </div>

      {/* Trainer Session Monitoring Section */}
      <TrainerSessionMonitoringSection
        batches={displayBatches}
        selectedBatchCode={selectedBatchFilter}
      />

      {/* Row 1: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full min-w-0">
        <DonutChart
          title="Batch Status Distribution"
          subtitle="Breakdown of operational stages"
          data={statusDonut}
          centerText={totalBatches.toString()}
          centerLabel="Batches"
        />

        <StackedBarChart
          title="Batch Verification Compliance Rate"
          subtitle="LinkedIn, IChat, Validation & Email completion % by batch"
          data={verificationStackedData}
          series={verificationSeries}
        />
      </div>

      {/* Row 2: Comprehensive Batch Performance Matrix Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Batch Performance & Status Verification Matrix</h3>
            <p className="text-xs text-neutral-500">Tracking core performance and operational verification KPIs per batch</p>
          </div>
          <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-lg">
            {totalBatches} total batches
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-100/80 text-neutral-800 font-semibold border-b border-neutral-200">
              <tr>
                <th className="p-2.5">Batch Code</th>
                <th className="p-2.5">Centre</th>
                <th className="p-2.5">Trainer</th>
                <th className="p-2.5">Program</th>
                <th className="p-2.5 text-center">Total</th>
                <th className="p-2.5 text-center">Att %</th>
                <th className="p-2.5 text-center bg-sky-50/60 border-l border-neutral-200">
                  <div className="flex items-center justify-center gap-1 text-sky-800">
                    <Linkedin className="w-3 h-3" /> LinkedIn
                  </div>
                </th>
                <th className="p-2.5 text-center bg-purple-50/60">
                  <div className="flex items-center justify-center gap-1 text-purple-800">
                    <MessageSquare className="w-3 h-3" /> IChat Status
                  </div>
                </th>
                <th className="p-2.5 text-center bg-emerald-50/60">
                  <div className="flex items-center justify-center gap-1 text-emerald-800">
                    <ShieldCheck className="w-3 h-3" /> Validation
                  </div>
                </th>
                <th className="p-2.5 text-center bg-amber-50/60 border-r border-neutral-200">
                  <div className="flex items-center justify-center gap-1 text-amber-800">
                    <Mail className="w-3 h-3" /> Email Status
                  </div>
                </th>
                <th className="p-2.5 text-center">Placement %</th>
                <th className="p-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {displayBatches.map((b) => (
                <tr key={b.batchCode} className="hover:bg-neutral-50/80">
                  <td className="p-2.5 font-mono font-bold text-neutral-900">{b.batchCode}</td>
                  <td className="p-2.5 font-medium text-neutral-700">{b.centre}</td>
                  <td className="p-2.5 text-neutral-700">{b.trainer}</td>
                  <td className="p-2.5 text-neutral-700">{b.courseAlias}</td>
                  <td className="p-2.5 text-center font-bold">{b.totalStudents}</td>
                  <td className="p-2.5 text-center font-bold text-blue-600">{b.avgAttendancePct}%</td>
                  
                  {/* LinkedIn Status KPI */}
                  <td className="p-2.5 text-center bg-sky-50/20 border-l border-neutral-200">
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold rounded-lg ${
                          b.linkedinDonePct >= 80
                            ? 'bg-sky-100 text-sky-800'
                            : b.linkedinDonePct >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {b.linkedinDoneCount} Done ({b.linkedinDonePct}%)
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-500">
                        {b.totalStudents - b.linkedinDoneCount} Pending
                      </span>
                    </div>
                  </td>

                  {/* IChat Status KPI */}
                  <td className="p-2.5 text-center bg-purple-50/20">
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold rounded-lg ${
                          b.ichatDonePct >= 80
                            ? 'bg-purple-100 text-purple-800'
                            : b.ichatDonePct >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {b.ichatDoneCount} Done ({b.ichatDonePct}%)
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-500">
                        {b.totalStudents - b.ichatDoneCount} Pending
                      </span>
                    </div>
                  </td>

                  {/* Validation Status KPI */}
                  <td className="p-2.5 text-center bg-emerald-50/20">
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold rounded-lg ${
                          b.validationDonePct >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.validationDonePct >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {b.validationDoneCount} Done ({b.validationDonePct}%)
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-500">
                        {b.totalStudents - b.validationDoneCount} Pending
                      </span>
                    </div>
                  </td>

                  {/* Email Status KPI */}
                  <td className="p-2.5 text-center bg-amber-50/20 border-r border-neutral-200">
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold rounded-lg ${
                          b.emailDonePct >= 80
                            ? 'bg-amber-100 text-amber-900'
                            : b.emailDonePct >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {b.emailDoneCount} Done ({b.emailDonePct}%)
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-500">
                        {b.totalStudents - b.emailDoneCount} Pending
                      </span>
                    </div>
                  </td>

                  <td className="p-2.5 text-center font-bold text-emerald-600">{b.placementPct}%</td>
                  <td className="p-2.5 text-right">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
