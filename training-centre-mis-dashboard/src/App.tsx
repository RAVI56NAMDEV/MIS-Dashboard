import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ActiveTab,
  ColumnMapping,
  ConfigThresholds,
  FilterState,
} from './types';
import { autoDetectColumnMapping } from './utils/columnMapper';
import { parseExcelFile } from './utils/excelParser';
import {
  processRawRows,
  filterStudents,
  computeBatches,
  computeTrainers,
  computeCentres,
  generateManagementInsights,
  generateActionAlerts,
  generateDataQualityReport,
} from './utils/dataProcessor';
import {
  exportToExcel,
  exportToCsv,
  exportPdfReport,
} from './utils/exporter';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

import { auth, onAuthStateChanged, firebaseSignOut, User } from './lib/firebase';
import { isAllowedDomain } from './config/authConfig';
import { LoginPage } from './components/LoginPage';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GlobalFilters } from './components/GlobalFilters';
import { KpiCards } from './components/KpiCards';

// Tab Views
import { ExecutiveOverviewView } from './components/views/ExecutiveOverviewView';
import { StudentMisView } from './components/views/StudentMisView';
import { AttendanceAnalysisView } from './components/views/AttendanceAnalysisView';
import { DropoutAnalysisView } from './components/views/DropoutAnalysisView';
import { BatchPerformanceView } from './components/views/BatchPerformanceView';
import { CentrePerformanceView } from './components/views/CentrePerformanceView';
import { PlacementAnalysisView } from './components/views/PlacementAnalysisView';
import { IltAnalysisView } from './components/views/IltAnalysisView';
import { DetailedTableView } from './components/views/DetailedTableView';
import { ManagementInsightsView } from './components/views/ManagementInsightsView';
import { AlertsActionRequiredView } from './components/views/AlertsActionRequiredView';

// Modals
import { ColumnMappingModal } from './components/ColumnMappingModal';
import { DataQualityModal } from './components/DataQualityModal';
import { ThresholdsModal, DEFAULT_THRESHOLDS } from './components/ThresholdsModal';

const DEFAULT_FILTERS: FilterState = {
  selectedMonth: 'All',
  selectedCentres: [],
  selectedRegions: [],
  selectedTrainers: [],
  selectedPrograms: [],
  selectedProjects: [],
  selectedBatchCodes: [],
  selectedBatchStatuses: [],
  selectedStudentStatuses: [],
  selectedGenders: [],
  selectedPlacementStatuses: [],
  searchQuery: '',
  dateRange: { start: '', end: '' },
};

export function App() {
  // 1. Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setIsCheckingAuth(false);
        setAuthError(null);
      },
      (error) => {
        console.error('Firebase Auth listener error:', error);
        setAuthError('Authentication session error. Please refresh and try again.');
        setIsCheckingAuth(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const isAuthorized = Boolean(user && isAllowedDomain(user.email));

  // 2. Excel Dataset & State (No fake or default data)
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({} as ColumnMapping);
  const [uploadedFilename, setUploadedFilename] = useState<string>('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [thresholds, setThresholds] = useState<ConfigThresholds>({ ...DEFAULT_THRESHOLDS });
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [isThresholdsModalOpen, setIsThresholdsModalOpen] = useState(false);

  // 3. Handle Local Excel File Upload
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const result = await parseExcelFile(file);

      if (!result.isValid) {
        setUploadError(result.error || 'Unable to read this Excel file. Please upload a valid MIS Excel file.');
        return;
      }

      // Load data into existing dashboard
      setRawRows(result.rawRows);
      setAvailableColumns(result.availableColumns);
      setMapping(result.mapping);
      setUploadedFilename(result.filename);
      setUploadError(null);
    } catch (err: any) {
      console.error('Excel upload processing error:', err);
      setUploadError('Unable to read this Excel file. Please upload a valid MIS Excel file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // 4. Memoized Calculations
  // Step 4a: Parse raw rows into normalized student records once
  const allStudents = useMemo(() => {
    if (!isAuthorized || rawRows.length === 0) return [];
    try {
      return processRawRows(rawRows, mapping, thresholds);
    } catch (err) {
      console.error('Error processing raw student rows:', err);
      return [];
    }
  }, [isAuthorized, rawRows, mapping, thresholds]);

  // Step 4b: Compute Data Quality report once per raw dataset/mapping
  const qualityReport = useMemo(() => {
    if (!isAuthorized || rawRows.length === 0) {
      return generateDataQualityReport([], mapping);
    }
    try {
      return generateDataQualityReport(rawRows, mapping);
    } catch (err) {
      console.error('Error generating quality report:', err);
      return generateDataQualityReport([], mapping);
    }
  }, [isAuthorized, rawRows, mapping]);

  // Step 4c: Filter students & aggregate analytics
  const { filteredStudents, batches, trainers, centres, insights, alerts } = useMemo(() => {
    if (allStudents.length === 0) {
      return {
        filteredStudents: [],
        batches: [],
        trainers: [],
        centres: [],
        insights: [],
        alerts: [],
      };
    }
    try {
      const filtered = filterStudents(allStudents, filters);
      const computedBatches = computeBatches(filtered);
      const computedTrainers = computeTrainers(filtered, thresholds);
      const computedCentres = computeCentres(filtered, thresholds);
      const computedInsights = generateManagementInsights(filtered, computedCentres, computedTrainers, computedBatches);
      const computedAlerts = generateActionAlerts(filtered, computedBatches, thresholds);
      return {
        filteredStudents: filtered,
        batches: computedBatches,
        trainers: computedTrainers,
        centres: computedCentres,
        insights: computedInsights,
        alerts: computedAlerts,
      };
    } catch (err) {
      console.error('Error filtering dataset:', err);
      return {
        filteredStudents: [],
        batches: [],
        trainers: [],
        centres: [],
        insights: [],
        alerts: [],
      };
    }
  }, [allStudents, filters, thresholds]);

  // Handlers
  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleResetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
  };

  const handleAutoDetectMapping = () => {
    setMapping(autoDetectColumnMapping(availableColumns));
  };

  const handleExportExcel = () => {
    exportToExcel(filteredStudents, 'MIS_Filtered_Dataset');
  };

  const handleExportCsv = () => {
    exportToCsv(filteredStudents, 'MIS_Student_Roster');
  };

  const handleExportPdf = () => {
    exportPdfReport(
      filteredStudents,
      batches,
      centres,
      insights,
      uploadedFilename || 'Current Period Report'
    );
  };

  // 5. Auth Gatekeepers

  // Auth checking state
  if (isCheckingAuth) {
    return (
      <LoginPage
        user={null}
        isCheckingAuth={true}
      />
    );
  }

  // Auth session error state
  if (authError) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-base font-semibold text-white tracking-wide mb-2">
            Authentication Error
          </h2>
          <p className="text-xs text-neutral-400 mb-6">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="py-2.5 px-5 bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Unauthenticated or Unauthorized domain (@anudip.org requirement failed)
  if (!user || !isAllowedDomain(user.email)) {
    return (
      <LoginPage
        user={user}
        isCheckingAuth={false}
      />
    );
  }

  // 6. Empty State: No Excel file uploaded yet
  if (rawRows.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
        {/* Simple Header */}
        <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-900">MPKND Training Centre MIS Portal</h1>
              <p className="text-xs text-neutral-500">Operational Training & Placement Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-neutral-600 font-medium">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-neutral-700 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition font-medium cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          accept=".xlsx, .xls, .csv"
          className="hidden"
        />

        {/* Empty State Card */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white border border-neutral-200 rounded-3xl p-8 max-w-lg w-full text-center shadow-lg flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-4 shadow-2xs">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <h2 className="text-lg font-bold text-neutral-900 tracking-tight mb-2">
              Upload the MIS Excel file to load dashboard data.
            </h2>
            <p className="text-xs text-neutral-600 mb-6 max-w-md leading-relaxed">
              Upload your official Excel workbook (.xlsx or .xls) to view student attendance, batch analytics, dropouts, and placement reports.
            </p>

            {/* Drag and drop upload box */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-neutral-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl p-6 mb-4 transition cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center">
                {isUploading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>
              <p className="text-xs font-bold text-neutral-800">
                {isUploading ? 'Processing Excel data...' : 'Click to select or drag & drop MIS Excel file'}
              </p>
              <p className="text-[11px] text-neutral-500">
                Supported formats: <span className="font-semibold text-neutral-700">.xlsx, .xls</span>
              </p>
            </div>

            {/* Upload Error Banner */}
            {uploadError && (
              <div className="w-full p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Processing...' : 'Upload Excel File'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 7. Active Dashboard View
  return (
    <div className="min-h-screen bg-neutral-100/60 font-sans text-neutral-900 flex flex-col">
      {/* Hidden File Input for Re-upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Top Header */}
      <Header
        filename={uploadedFilename}
        currentRowCount={rawRows.length}
        onUploadExcelClick={() => fileInputRef.current?.click()}
        onResetFilters={handleResetFilters}
        onOpenMappingModal={() => setIsMappingModalOpen(true)}
        onOpenQualityModal={() => setIsQualityModalOpen(true)}
        onOpenThresholdsModal={() => setIsThresholdsModalOpen(true)}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        qualityScore={qualityReport.qualityScorePct}
        user={user}
        onLogout={handleLogout}
      />

      {/* Upload Error if Re-upload Failed */}
      {uploadError && (
        <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 mt-3">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="text-rose-700 font-bold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Global Interactive Filters */}
      <GlobalFilters
        filters={filters}
        onFilterChange={setFilters}
        students={allStudents}
        onResetFilters={handleResetFilters}
      />

      {/* Main Layout Container */}
      <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          alertCount={alerts.length}
        />

        {/* Primary View Area */}
        <main className="flex-1 min-w-0 space-y-5">
          {/* Top Interactive KPI Cards */}
          <KpiCards
            students={filteredStudents}
            batches={batches}
            thresholds={thresholds}
            onSelectTab={setActiveTab}
          />

          {/* Tab Views */}
          {activeTab === 'overview' && (
            <ExecutiveOverviewView
              students={filteredStudents}
              batches={batches}
              trainers={trainers}
              centres={centres}
              insights={insights}
              alerts={alerts}
              thresholds={thresholds}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'students' && (
            <StudentMisView
              students={filteredStudents}
              thresholds={thresholds}
              onExportCsv={handleExportCsv}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceAnalysisView
              students={filteredStudents}
              batches={batches}
              centres={centres}
              trainers={trainers}
              thresholds={thresholds}
            />
          )}

          {activeTab === 'dropout' && (
            <DropoutAnalysisView
              students={filteredStudents}
              batches={batches}
              centres={centres}
              trainers={trainers}
              thresholds={thresholds}
            />
          )}

          {activeTab === 'batches' && (
            <BatchPerformanceView
              batches={batches}
              thresholds={thresholds}
            />
          )}

          {activeTab === 'centres' && (
            <CentrePerformanceView
              centres={centres}
              batches={batches}
              students={filteredStudents}
              thresholds={thresholds}
            />
          )}

          {activeTab === 'placement' && (
            <PlacementAnalysisView
              students={filteredStudents}
              thresholds={thresholds}
            />
          )}

          {activeTab === 'ilt' && (
            <IltAnalysisView
              students={filteredStudents}
              batches={batches}
              centres={centres}
              thresholds={thresholds}
            />
          )}

          {activeTab === 'insights' && (
            <ManagementInsightsView insights={insights} />
          )}

          {activeTab === 'alerts' && (
            <AlertsActionRequiredView
              alerts={alerts}
              students={filteredStudents}
              onExportCsv={handleExportCsv}
            />
          )}

          {activeTab === 'datatable' && (
            <DetailedTableView
              students={filteredStudents}
              onExportExcel={handleExportExcel}
              onExportCsv={handleExportCsv}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {isMappingModalOpen && (
        <ColumnMappingModal
          isOpen={isMappingModalOpen}
          onClose={() => setIsMappingModalOpen(false)}
          availableColumns={availableColumns}
          mapping={mapping}
          onSaveMapping={setMapping}
          onAutoDetect={handleAutoDetectMapping}
        />
      )}

      {isQualityModalOpen && (
        <DataQualityModal
          isOpen={isQualityModalOpen}
          onClose={() => setIsQualityModalOpen(false)}
          report={qualityReport}
        />
      )}

      {isThresholdsModalOpen && (
        <ThresholdsModal
          isOpen={isThresholdsModalOpen}
          onClose={() => setIsThresholdsModalOpen(false)}
          thresholds={thresholds}
          onSaveThresholds={setThresholds}
        />
      )}
    </div>
  );
}

export default App;
