import React from 'react';
import { DataQualityReport } from '../types';
import { X, ShieldCheck, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

interface DataQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DataQualityReport;
}

export const DataQualityModal: React.FC<DataQualityModalProps> = ({ isOpen, onClose, report }) => {
  if (!isOpen) return null;

  const scoreColor =
    report.qualityScorePct >= 90
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : report.qualityScorePct >= 75
      ? 'text-amber-600 bg-amber-50 border-amber-200'
      : 'text-rose-600 bg-rose-50 border-rose-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-neutral-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Data Quality & Health Audit</h2>
              <p className="text-xs text-neutral-500">Automated structural integrity check on uploaded dataset</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quality Score Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${scoreColor}`}>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider block opacity-80">
                Data Quality Score
              </span>
              <span className="text-3xl font-extrabold tracking-tight">{report.qualityScorePct}%</span>
              <p className="text-xs mt-1 font-medium">
                {report.qualityScorePct >= 90
                  ? 'Excellent dataset readiness for executive reporting.'
                  : 'Moderate data issues detected. Review recommendations below.'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">{report.validRows} / {report.totalRows}</span>
              <span className="text-xs block opacity-80">Valid Records</span>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase">Total Rows</span>
              <p className="text-lg font-bold text-neutral-900 mt-0.5">{report.totalRows}</p>
            </div>
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase">Duplicate IDs</span>
              <p className={`text-lg font-bold mt-0.5 ${report.duplicateRows > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {report.duplicateRows}
              </p>
            </div>
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase">Invalid Dates</span>
              <p className={`text-lg font-bold mt-0.5 ${report.invalidDatesCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {report.invalidDatesCount}
              </p>
            </div>
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              <span className="text-[10px] font-semibold text-neutral-500 uppercase">Out-of-range %</span>
              <p className={`text-lg font-bold mt-0.5 ${report.invalidPctCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {report.invalidPctCount}
              </p>
            </div>
          </div>

          {/* Detected Issues */}
          {report.issues.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Detected Data Quality Findings
              </h3>
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                {report.issues.map((iss, idx) => (
                  <div key={idx} className="text-xs text-amber-900 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    <span>{iss}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Column Audit Table */}
          <div>
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2.5">
              Mapped Column Health Audit
            </h3>
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-700 font-semibold border-b border-neutral-200">
                  <tr>
                    <th className="p-2.5">Domain Field</th>
                    <th className="p-2.5">Source Column</th>
                    <th className="p-2.5">Populated Rows</th>
                    <th className="p-2.5">Empty Rows</th>
                    <th className="p-2.5">Populated %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {report.columnAudit.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="p-2.5 font-medium text-neutral-900">{item.mappedTo}</td>
                      <td className="p-2.5 font-mono text-neutral-600">{item.columnName}</td>
                      <td className="p-2.5 text-neutral-700">{item.nonEmptyCount}</td>
                      <td className="p-2.5 text-neutral-500">{item.emptyCount}</td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${item.healthPct}%` }}
                            />
                          </div>
                          <span className="font-semibold text-neutral-800">{item.healthPct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition shadow-xs"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
