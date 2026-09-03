import React, { useState, useMemo } from 'react';
import { ActionAlert, StudentRecord } from '../../types';
import { AlertOctagon, AlertTriangle, Info, CheckCircle2, Download, Eye, ArrowRight } from 'lucide-react';

interface AlertsActionRequiredViewProps {
  alerts: ActionAlert[];
  students: StudentRecord[];
  onExportCsv: () => void;
}

export const AlertsActionRequiredView: React.FC<AlertsActionRequiredViewProps> = React.memo(({
  alerts,
  students,
  onExportCsv,
}) => {
  const [selectedAlert, setSelectedAlert] = useState<ActionAlert | null>(null);

  const { criticals, warnings, infos } = useMemo(() => {
    const c: ActionAlert[] = [];
    const w: ActionAlert[] = [];
    const i: ActionAlert[] = [];
    for (let j = 0; j < alerts.length; j++) {
      const a = alerts[j];
      if (a.severity === 'high') c.push(a);
      else if (a.severity === 'medium') w.push(a);
      else if (a.severity === 'low') i.push(a);
    }
    return { criticals: c, warnings: w, infos: i };
  }, [alerts]);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">Operational Action Center</h2>
            <p className="text-xs text-neutral-500">
              Active operational flags requiring management intervention
            </p>
          </div>
        </div>

        <button
          onClick={onExportCsv}
          className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" /> Export Flagged Action Roster
        </button>
      </div>

      {/* Critical Alerts */}
      {criticals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-600" /> Critical Severity Items ({criticals.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criticals.map((alt) => (
              <div
                key={alt.id}
                className="bg-white p-5 rounded-2xl border border-rose-200 shadow-2xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-neutral-900">{alt.title}</h4>
                    <span className="text-xs font-extrabold bg-rose-100 text-rose-800 font-mono px-2 py-0.5 rounded-lg">
                      {alt.count} Records
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">{alt.description}</p>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex justify-between items-center text-xs">
                  <span className="text-rose-900 font-semibold bg-rose-50 px-2 py-1 rounded-lg">
                    Action: {alt.actionRequired || 'Review affected records'}
                  </span>
                  <button
                    onClick={() => setSelectedAlert(alt)}
                    className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                  >
                    Inspect <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Alerts */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Warning Level Items ({warnings.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warnings.map((alt) => (
              <div
                key={alt.id}
                className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-neutral-900">{alt.title}</h4>
                    <span className="text-xs font-extrabold bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded-lg">
                      {alt.count} Records
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">{alt.description}</p>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex justify-between items-center text-xs">
                  <span className="text-amber-900 font-semibold bg-amber-50 px-2 py-1 rounded-lg">
                    Action: {alt.actionRequired || 'Review affected records'}
                  </span>
                  <button
                    onClick={() => setSelectedAlert(alt)}
                    className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                  >
                    Inspect <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Alerts */}
      {infos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600" /> Operational Information ({infos.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {infos.map((alt) => (
              <div
                key={alt.id}
                className="bg-white p-5 rounded-2xl border border-blue-200 shadow-2xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-neutral-900">{alt.title}</h4>
                    <span className="text-xs font-extrabold bg-blue-100 text-blue-800 font-mono px-2 py-0.5 rounded-lg">
                      {alt.count} Records
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">{alt.description}</p>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex justify-between items-center text-xs">
                  <span className="text-blue-900 font-semibold bg-blue-50 px-2 py-1 rounded-lg">
                    Action: {alt.actionRequired || 'Review affected records'}
                  </span>
                  <button
                    onClick={() => setSelectedAlert(alt)}
                    className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                  >
                    Inspect <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert Inspection Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex justify-between items-start border-b border-neutral-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                  {selectedAlert.severity} Severity Alert
                </span>
                <h3 className="text-lg font-bold text-neutral-900">{selectedAlert.title}</h3>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">{selectedAlert.description}</p>

            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 text-xs">
              <span className="font-bold text-neutral-800 block mb-1">Recommended Corrective Action:</span>
              <p className="text-neutral-700 leading-relaxed">{selectedAlert.actionRequired || 'Conduct immediate operational review and counseling.'}</p>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 text-xs font-semibold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
