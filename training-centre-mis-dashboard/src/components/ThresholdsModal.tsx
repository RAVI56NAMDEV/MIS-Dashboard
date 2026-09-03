import React, { useState } from 'react';
import { ConfigThresholds } from '../types';
import { X, Sliders, RotateCcw, Save } from 'lucide-react';

interface ThresholdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: ConfigThresholds;
  onSaveThresholds: (newThresholds: ConfigThresholds) => void;
}

export const DEFAULT_THRESHOLDS: ConfigThresholds = {
  attendanceReqPct: 50,
  iltReqPct: 70,
  highDropoutThresholdPct: 15,
  lowPlacementThresholdPct: 50,
  goodAttendanceThresholdPct: 75,
  trainerScoreWeightAttendance: 40,
  trainerScoreWeightPlacement: 30,
  trainerScoreWeightRetention: 30,
};

export const ThresholdsModal: React.FC<ThresholdsModalProps> = ({
  isOpen,
  onClose,
  thresholds,
  onSaveThresholds,
}) => {
  const [values, setValues] = useState<ConfigThresholds>({ ...thresholds });

  if (!isOpen) return null;

  const handleReset = () => {
    setValues({ ...DEFAULT_THRESHOLDS });
  };

  const handleSave = () => {
    onSaveThresholds(values);
    onClose();
  };

  const weightSum =
    values.trainerScoreWeightAttendance +
    values.trainerScoreWeightPlacement +
    values.trainerScoreWeightRetention;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-neutral-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Configure Rules & Thresholds</h2>
              <p className="text-xs text-neutral-500">Customize target requirements, alert triggers, and formulas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Attendance Requirement */}
          <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50">
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-neutral-800">Minimum Required Attendance Threshold</label>
              <span className="font-mono font-bold text-blue-600 text-sm">{values.attendanceReqPct}%</span>
            </div>
            <p className="text-neutral-500 text-[11px] mb-2">
              Default is 50%. Students below this threshold are flagged as non-compliant.
            </p>
            <input
              type="range"
              min="30"
              max="90"
              step="5"
              value={values.attendanceReqPct}
              onChange={(e) => setValues({ ...values, attendanceReqPct: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* ILT Duration % Requirement */}
          <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50">
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-neutral-800">Required ILT Duration Percentage</label>
              <span className="font-mono font-bold text-blue-600 text-sm">{values.iltReqPct}%</span>
            </div>
            <p className="text-neutral-500 text-[11px] mb-2">
              Default is 70%. Required ILT Hours = Total Duration × {values.iltReqPct}%.
            </p>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={values.iltReqPct}
              onChange={(e) => setValues({ ...values, iltReqPct: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* High Dropout Alert Threshold */}
          <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50">
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-neutral-800">High Dropout Alert Trigger (%)</label>
              <span className="font-mono font-bold text-rose-600 text-sm">{values.highDropoutThresholdPct}%</span>
            </div>
            <p className="text-neutral-500 text-[11px] mb-2">
              Batches and centres exceeding this dropout rate generate critical alerts.
            </p>
            <input
              type="range"
              min="5"
              max="40"
              step="1"
              value={values.highDropoutThresholdPct}
              onChange={(e) => setValues({ ...values, highDropoutThresholdPct: Number(e.target.value) })}
              className="w-full accent-rose-600 cursor-pointer"
            />
          </div>

          {/* Trainer Score Formula Weights */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-neutral-900">Trainer Performance Formula Weights</h4>
              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${weightSum === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                Sum: {weightSum}%
              </span>
            </div>
            <p className="text-neutral-500 text-[11px]">
              Trainer Score = (Attendance × W1) + (Placement × W2) + ((100 - Dropout) × W3)
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Attendance Weight</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={values.trainerScoreWeightAttendance}
                  onChange={(e) => setValues({ ...values, trainerScoreWeightAttendance: Number(e.target.value) })}
                  className="w-full border border-neutral-300 rounded-lg p-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Placement Weight</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={values.trainerScoreWeightPlacement}
                  onChange={(e) => setValues({ ...values, trainerScoreWeightPlacement: Number(e.target.value) })}
                  className="w-full border border-neutral-300 rounded-lg p-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Retention Weight</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={values.trainerScoreWeightRetention}
                  onChange={(e) => setValues({ ...values, trainerScoreWeightRetention: Number(e.target.value) })}
                  className="w-full border border-neutral-300 rounded-lg p-2 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex justify-between items-center">
          <button
            onClick={handleReset}
            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
