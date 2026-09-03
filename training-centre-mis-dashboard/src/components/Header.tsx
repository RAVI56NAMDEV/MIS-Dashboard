import React, { useState } from 'react';
import {
  Upload,
  RotateCcw,
  Sliders,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Layers,
  LogOut,
} from 'lucide-react';
import { User } from '../lib/firebase';

interface HeaderProps {
  filename?: string;
  currentRowCount: number;
  onUploadExcelClick: () => void;
  onResetFilters: () => void;
  onOpenMappingModal: () => void;
  onOpenQualityModal: () => void;
  onOpenThresholdsModal: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  qualityScore: number;
  user?: User | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  filename,
  currentRowCount,
  onUploadExcelClick,
  onResetFilters,
  onOpenMappingModal,
  onOpenQualityModal,
  onOpenThresholdsModal,
  onExportExcel,
  onExportPdf,
  qualityScore,
  user,
  onLogout,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-2xs transition-all duration-300">
      {/* Main Bar Always Visible */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Title & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
                MPKND Training Centre MIS Dashboard
              </h1>

              {/* Data Source Indicator */}
              <div className="hidden md:inline-flex items-center gap-1.5 bg-neutral-100/90 text-neutral-700 font-medium text-[11px] px-2.5 py-0.5 rounded-full border border-neutral-200">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                  DATA SOURCE:
                </span>
                <span className="font-semibold text-neutral-900">
                  {filename ? filename : 'Excel Upload'}
                </span>
                {currentRowCount > 0 && (
                  <>
                    <span className="text-neutral-400">&bull;</span>
                    <span className="text-neutral-600 font-mono">{currentRowCount.toLocaleString()} rows</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Upload Button, User Profile & Options Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Upload Excel File Button */}
          <button
            onClick={onUploadExcelClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-2xs"
            title="Upload MIS Excel File (.xlsx, .xls)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Excel File</span>
          </button>

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/90 rounded-full pl-1.5 pr-2.5 py-1 shadow-2xs transition">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full ring-1 ring-neutral-300 shrink-0 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="hidden sm:flex flex-col text-left text-xs leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-neutral-800 max-w-[110px] truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[9px] font-bold bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded uppercase tracking-wider">
                    @anudip.org
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition cursor-pointer ml-0.5"
                  title="Sign Out / Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Slide Bar Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer select-none border ${
              isExpanded
                ? 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                : 'bg-[#009688] hover:bg-[#00897b] text-white border-[#00897b]'
            }`}
            title={
              isExpanded
                ? 'Click to hide header options & controls'
                : 'Click to show header settings, column mapping & export options'
            }
          >
            <span>{isExpanded ? 'Hide Options' : 'Show Options'}</span>
            <div
              className={`w-4 h-4 rounded-md flex items-center justify-center transition-transform duration-300 font-mono font-bold text-xs ${
                isExpanded
                  ? 'bg-blue-200/70 text-blue-800 rotate-90'
                  : 'bg-neutral-700 text-white group-hover:translate-x-0.5'
              }`}
            >
              {isExpanded ? '∨' : '>'}
            </div>
          </button>
        </div>
      </div>

      {/* Expandable Slide Section (Hidden by default, expands on click) */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out border-t ${
          isExpanded
            ? 'max-h-96 opacity-100 border-neutral-200/80 bg-neutral-50/80 py-3.5'
            : 'max-h-0 opacity-0 border-transparent py-0'
        }`}
      >
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Metadata Section */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="bg-blue-100/80 text-blue-800 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-blue-200/80 uppercase tracking-wider">
              Anudip MIS Portal
            </span>
            <div className="flex items-center gap-1.5 text-neutral-600 bg-white px-3 py-1 rounded-lg border border-neutral-200/80 shadow-2xs">
              <span className="text-neutral-400">File:</span>
              <strong className="text-neutral-800 font-semibold truncate max-w-[200px]">
                {filename || 'No file uploaded'}
              </strong>
            </div>
            {currentRowCount > 0 && (
              <div className="flex items-center gap-1.5 text-neutral-600 bg-white px-3 py-1 rounded-lg border border-neutral-200/80 shadow-2xs">
                <span className="text-neutral-400">Loaded Records:</span>
                <strong className="text-neutral-800 font-semibold">
                  {currentRowCount.toLocaleString()}
                </strong>
              </div>
            )}
          </div>

          {/* Actions Bar Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenMappingModal}
              disabled={currentRowCount === 0}
              className="px-3 py-2 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 rounded-xl border border-neutral-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              title="Column Mapping"
            >
              <Layers className="w-3.5 h-3.5 text-neutral-500" />
              Column Mapping
            </button>

            <button
              onClick={onOpenQualityModal}
              disabled={currentRowCount === 0}
              className="px-3 py-2 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 rounded-xl border border-neutral-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              title="Data Quality Check"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              Data Quality ({qualityScore}%)
            </button>

            <button
              onClick={onOpenThresholdsModal}
              className="p-2 text-neutral-600 bg-white hover:bg-neutral-100 rounded-xl border border-neutral-200 transition cursor-pointer shadow-2xs"
              title="Configure Rules & Thresholds"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              onClick={onResetFilters}
              className="px-3 py-2 text-xs font-medium text-neutral-600 bg-white hover:bg-neutral-100 rounded-xl border border-neutral-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Reset All Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>

            {/* Export Group */}
            <div className="flex items-center gap-1.5 border-l border-neutral-300 pl-2 ml-1">
              <button
                onClick={onExportExcel}
                disabled={currentRowCount === 0}
                className="px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                title="Download Filtered Excel Dataset"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel
              </button>
              <button
                onClick={onExportPdf}
                disabled={currentRowCount === 0}
                className="px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                title="Export PDF Management Executive Summary"
              >
                <FileText className="w-3.5 h-3.5" />
                PDF Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
