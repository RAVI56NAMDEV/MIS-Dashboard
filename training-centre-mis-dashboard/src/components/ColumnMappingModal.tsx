import React, { useState } from 'react';
import { ColumnMapping } from '../types';
import { X, Check, RefreshCw, Layers } from 'lucide-react';

interface ColumnMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableColumns: string[];
  mapping: ColumnMapping;
  onSaveMapping: (newMapping: ColumnMapping) => void;
  onAutoDetect: () => void;
}

const FIELD_LABELS: Record<keyof ColumnMapping, { label: string; desc: string; required?: boolean }> = {
  studentId: { label: 'Student ID / Code', desc: 'Unique identifier for learner', required: true },
  studentName: { label: 'Student Name', desc: 'Full name of candidate', required: true },
  batchCode: { label: 'Batch Code', desc: 'Batch identification code', required: true },
  courseAlias: { label: 'Program / Course Alias', desc: 'Course or module name', required: true },
  centre: { label: 'Centre / Location', desc: 'Training centre location', required: true },
  trainer: { label: 'Trainer / Faculty', desc: 'Assigned instructor name' },
  startDate: { label: 'Batch Start Date', desc: 'Commencement date' },
  endDate: { label: 'Batch End Date', desc: 'Scheduled completion date' },
  actualEndDate: { label: 'Actual End Date', desc: 'Actual completion date' },
  batchStatus: { label: 'Batch Status', desc: 'running / complete / upcoming' },
  studentStatus: { label: 'Student Status', desc: 'Active / Completed / Dropped Out' },
  examDate: { label: 'Final Exam Date', desc: 'Assessment date' },
  examMarks: { label: 'Final Exam Marks', desc: 'Score or exam percentage' },
  dropoutType: { label: 'Dropout Type', desc: 'Category of exit/dropout' },
  dropoutDate: { label: 'Dropout Date', desc: 'Date candidate dropped out' },
  dropoutDesc: { label: 'Dropout Description', desc: 'Reason or remarks for dropout' },
  companyName: { label: 'Company Name', desc: 'Placed employer name' },
  post: { label: 'Post / Role', desc: 'Placed designation' },
  salary: { label: 'Salary / Package', desc: 'Monthly/annual CTC' },
  doj: { label: 'Date of Joining', desc: 'DOJ at employer' },
  attendanceHours: { label: 'Attended Hours', desc: 'Actual student attendance hours' },
  requiredAttendanceHours: { label: 'Required Attendance Hours', desc: 'Total expected class hours' },
  attendancePct: { label: 'Attendance %', desc: 'Direct attendance percentage' },
  iltAttendancePct: { label: 'ILT Completion %', desc: 'Direct ILT attendance percentage' },
  iltDuration: { label: 'ILT Duration Hours', desc: 'Total course ILT duration' },
  eligibility: { label: 'Placement Eligibility', desc: 'eligible / not_eligible' },
  gender: { label: 'Gender', desc: 'Male / Female / Other' },
  region: { label: 'Region / Territory', desc: 'State or operational region' },
  project: { label: 'Project / Scheme', desc: 'Sponsoring project or client' },
  linkedinStatus: { label: 'LinkedIn Status', desc: 'Done / Pending / In Progress' },
  validationStatus: { label: 'Validation Status', desc: 'Done / Pending / In Progress' },
  emailStatus: { label: 'Email Status', desc: 'Done / Pending / In Progress' },
  ichatStatus: { label: 'IChat Report Status', desc: 'Done / Pending / In Progress' },
  sessionsConductedFaculty: { label: 'Sessions Conducted (AF)', desc: 'Number of sessions conducted by faculty for beneficiary' },
  sessionsAttendedStudent: { label: 'Student Sessions Attended (AG)', desc: 'Number of sessions attended by student' },
  totalScheduleHours: { label: 'Total Schedule Hours (AH)', desc: 'Total scheduled hours for the batch/course' },
  sessionHourDifference: { label: 'Session Hour Difference (AI)', desc: 'Difference between scheduled and actual hours' },
  overallClassHours: { label: 'Actual / Overall Class Hours', desc: 'Overall Class Hours (Course Level)' },
  totalScheduledDays: { label: 'Total Scheduled Days', desc: 'Total scheduled days if present in source sheet' },
};

export const ColumnMappingModal: React.FC<ColumnMappingModalProps> = ({
  isOpen,
  onClose,
  availableColumns,
  mapping,
  onSaveMapping,
  onAutoDetect,
}) => {
  const [currentMapping, setCurrentMapping] = useState<ColumnMapping>({ ...mapping });

  if (!isOpen) return null;

  const handleChange = (field: keyof ColumnMapping, value: string) => {
    setCurrentMapping((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSaveMapping(currentMapping);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-neutral-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Smart Column Mapping</h2>
              <p className="text-xs text-neutral-500">Map fields from your uploaded file to dashboard metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAutoDetect}
              className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Auto-Detect
            </button>
            <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(FIELD_LABELS) as Array<keyof ColumnMapping>).map((field) => {
            const meta = FIELD_LABELS[field];
            const isMapped = Boolean(currentMapping[field]);

            return (
              <div
                key={field}
                className={`p-3.5 rounded-xl border transition-all ${
                  isMapped ? 'border-neutral-200 bg-white' : 'border-amber-200 bg-amber-50/30'
                }`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <label className="text-xs font-semibold text-neutral-800 flex items-center gap-1">
                    {meta.label}
                    {meta.required && <span className="text-red-500 font-bold">*</span>}
                  </label>
                  {isMapped ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Mapped
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
                      Unmapped
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 mb-2">{meta.desc}</p>
                <select
                  value={currentMapping[field] || ''}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Not Mapped / Ignore --</option>
                  {availableColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
          >
            Save & Apply Mapping
          </button>
        </div>
      </div>
    </div>
  );
};
