export interface RawStudentRow {
  [key: string]: any;
}

export interface ColumnMapping {
  studentId: string;
  studentName: string;
  batchCode: string;
  courseAlias: string; // Program / Course
  centre: string; // Location / Centre
  trainer: string;
  startDate: string;
  endDate: string;
  actualEndDate: string;
  batchStatus: string;
  studentStatus: string; // Active, Completed, Dropped Out
  examDate: string;
  examMarks: string;
  dropoutType: string;
  dropoutDate: string;
  dropoutDesc: string;
  companyName: string;
  post: string;
  salary: string;
  doj: string;
  attendanceHours: string;
  requiredAttendanceHours: string;
  attendancePct: string;
  iltAttendancePct: string;
  iltDuration: string;
  eligibility: string;
  gender: string;
  region: string;
  project: string;
  linkedinStatus: string;
  validationStatus: string;
  emailStatus: string;
  ichatStatus: string;
  // Trainer / Batch Session Monitoring (AF, AG, AH, AI)
  sessionsConductedFaculty: string;
  sessionsAttendedStudent: string;
  totalScheduleHours: string;
  sessionHourDifference: string;
  overallClassHours: string;
  totalScheduledDays: string;
}

export interface StudentRecord {
  id: string;
  studentId: string;
  studentName: string;
  batchCode: string;
  courseAlias: string; // Program
  centre: string; // Location / Centre
  trainer: string;
  region: string;
  project: string;
  gender: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  actualEndDate: string;
  startMonth: string; // YYYY-MM
  batchStatus: 'running' | 'complete' | 'upcoming' | string;
  studentStatus: 'Active' | 'Completed' | 'Dropped Out';
  examDate: string;
  examMarks: number | null;
  
  // Dropout
  isDropout: boolean;
  dropoutType: string;
  dropoutDate: string;
  dropoutDesc: string;
  
  // Placement
  isPlaced: boolean;
  isEligibleForPlacement: boolean;
  companyName: string;
  post: string;
  salary: number | null;
  doj: string;
  
  // Attendance & Hours
  attendanceHours: number;
  requiredAttendanceHours: number;
  attendancePct: number; // 0 to 100
  meetsAttendanceReq: boolean;
  
  // ILT / Training Hours
  iltDurationHours: number; // e.g. 146
  requiredIltHours: number; // iltDurationHours * reqIltPct (default 70%)
  iltCompletionPct: number; // (attendanceHours / requiredIltHours) * 100
  meetsIltReq: boolean;

  // Additional Verification KPIs
  linkedinStatus: string;
  isLinkedinDone: boolean;
  validationStatus: string;
  isValidationDone: boolean;
  emailStatus: string;
  isEmailDone: boolean;
  ichatStatus: string;
  isIchatDone: boolean;

  // Trainer / Batch Session Monitoring Fields (Google Sheet AF, AG, AH, AI)
  sessionsConductedFaculty: number | null; // AF: Number Of Sessions Conducted By Faculty For Beneficiary
  sessionsAttendedStudent: number | null; // AG: Number of Sessions Attended By The Student
  totalScheduleHours: number | null; // AH: Total Schedule Hours
  sessionHourDifference: number | null; // AI: Session Hour Difference
  overallClassHours: number | null; // Overall Class Hours(Course Level) / Actual Class Hours
  totalScheduledDays: number | null; // Total Scheduled Days (or null if not available)

  // Raw original row reference
  raw: RawStudentRow;
}

export interface BatchRecord {
  batchCode: string;
  centre: string;
  trainer: string;
  courseAlias: string;
  startDate: string;
  endDate: string;
  actualEndDate: string;
  batchStatus: string;
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  dropoutCount: number;
  placedCount: number;
  eligibleCount: number;
  avgAttendancePct: number;
  avgIltCompletionPct: number;
  dropoutPct: number;
  placementPct: number;

  // Verification KPIs
  linkedinDoneCount: number;
  linkedinDonePct: number;
  validationDoneCount: number;
  validationDonePct: number;
  emailDoneCount: number;
  emailDonePct: number;
  ichatDoneCount: number;
  ichatDonePct: number;

  // Trainer / Batch Session Monitoring (Batch-level Aggregated without double-counting)
  iltDurationHours: number | null; // ILT Duration for specific course (e.g. 90 hrs, 120 hrs, 146 hrs)
  totalScheduledHours: number | null; // AH: Total Schedule Hours (SUM of batch-level)
  actualClassHours: number | null; // Overall Class Hours(Course Level) / Actual Class Hours
  sessionHourDifference: number | null; // AI: Total Scheduled - Actual Class Hours
  sessionCompletionPct: number | null; // (Actual Class Hours / Total Scheduled Hours) * 100
  sessionsConducted: number | null; // AF: Sessions Conducted by Faculty
  studentSessionsAttendedTotal: number | null; // AG: Total student sessions attended
  studentSessionsAttendedAvg: number | null; // AG: Average student sessions attended in this batch
  studentSessionsAttendedMin: number | null; // AG: Minimum sessions attended by any student
  studentSessionsAttendedMax: number | null; // AG: Maximum sessions attended by any student
  studentSessionsAttendedMinStudent: string | null; // Name/details of student with minimum attendance
  studentSessionsAttendedMaxStudent: string | null; // Name/details of student with maximum attendance
  criticalAttendanceCount: number; // Count of students taking critically few classes (<50% sessions / attendance)
  criticalAttendanceStudents: Array<{
    id: string;
    studentId: string;
    studentName: string;
    sessionsAttended: number | null;
    sessionsConducted: number | null;
    attendancePct: number;
  }>;
  scheduledDays: number | string; // 'N/A' if not in source
  sessionStatus: 'Shortfall' | 'Completed' | 'Above Schedule' | 'No data';
}

export interface TrainerRecord {
  trainer: string;
  centre: string;
  batchCount: number;
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  dropoutCount: number;
  placedCount: number;
  eligibleCount: number;
  avgAttendancePct: number;
  avgIltCompletionPct: number;
  dropoutPct: number;
  placementPct: number;
  performanceScore: number;
}

export interface CentreRecord {
  centre: string;
  region: string;
  rank: number;
  batchCount: number;
  trainerCount?: number;
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  dropoutCount: number;
  placedCount: number;
  eligibleCount: number;
  avgAttendancePct: number;
  avgIltCompletionPct: number;
  dropoutPct: number;
  placementPct: number;
  completionPct: number;
  statusGrade: 'Good' | 'Needs Attention' | 'Critical';
}

export interface FilterState {
  searchQuery: string;
  dateRange: { start: string; end: string };
  selectedMonth: string; // "All" or "2026-04"
  selectedCentres: string[];
  selectedRegions: string[];
  selectedTrainers: string[];
  selectedBatchCodes: string[];
  selectedPrograms: string[];
  selectedProjects: string[];
  selectedBatchStatuses: string[];
  selectedStudentStatuses: string[];
  selectedGenders: string[];
  selectedPlacementStatuses: string[]; // "Placed", "Unplaced"
}

export interface ConfigThresholds {
  attendanceReqPct: number; // default 50%
  iltReqPct: number; // default 70%
  highDropoutThresholdPct: number; // default 15%
  lowPlacementThresholdPct: number; // default 50%
  goodAttendanceThresholdPct: number; // default 75%
  // Trainer Weights for Performance Score (Must sum to 100)
  trainerScoreWeightAttendance: number; // default 40
  trainerScoreWeightPlacement: number; // default 30
  trainerScoreWeightRetention: number; // default 30 (100 - dropout)
}

export interface DataQualityReport {
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  missingValuesCount: number;
  invalidDatesCount: number;
  invalidPctCount: number;
  qualityScorePct: number; // 0 - 100
  columnAudit: Array<{
    columnName: string;
    mappedTo: string;
    nonEmptyCount: number;
    emptyCount: number;
    healthPct: number;
  }>;
  issues: string[];
}

export interface ManagementInsight {
  id: string;
  category: 'Benchmark' | 'Dropout' | 'Attendance' | 'Placement' | 'Trainer' | 'Centre';
  type: 'positive' | 'warning' | 'critical' | 'neutral';
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  actionRecommendation: string;
}

export interface ActionAlert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  category: 'Attendance' | 'Dropout' | 'Placement' | 'ILT' | 'Batch';
  count: number;
  affectedItems: string[];
  actionRequired?: string;
  filterAction?: Partial<FilterState>;
}

export interface AnalysisReport {
  id?: string;
  title?: string;
  dataset_name?: string;
  question?: string;
  executive_summary?: string;
  generated_at?: string;
  metrics?: Record<string, any>;
  [key: string]: any;
}

export type ActiveTab =
  | 'overview'
  | 'students'
  | 'attendance'
  | 'dropout'
  | 'batches'
  | 'trainers'
  | 'centres'
  | 'placement'
  | 'ilt'
  | 'insights'
  | 'alerts'
  | 'datatable';
