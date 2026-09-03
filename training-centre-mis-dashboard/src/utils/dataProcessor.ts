import {
  StudentRecord,
  BatchRecord,
  TrainerRecord,
  CentreRecord,
  RawStudentRow,
  ColumnMapping,
  ConfigThresholds,
  DataQualityReport,
  ManagementInsight,
  ActionAlert,
  FilterState,
} from '../types';

export function parseNumeric(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).replace(/%/g, '').replace(/,/g, '').trim();
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

export function parsePct(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') {
    // If between 0 and 1 (exclusive), e.g. 0.85 -> 85
    return val > 0 && val <= 1 ? val * 100 : val;
  }
  const str = String(val).replace(/%/g, '').replace(/,/g, '').trim();
  const parsed = parseFloat(str);
  if (isNaN(parsed)) return 0;
  return parsed > 0 && parsed <= 1 ? parsed * 100 : parsed;
}

// Module-level caches for fast date & month conversion across thousands of rows
const dateCache = new Map<string, string>();
const monthCache = new Map<string, string>();

/**
 * Formats an Excel serial date number (e.g. 46113.2) or date string to YYYY-MM-DD.
 * Converts Excel serial numbers cleanly for display without modifying the raw row source.
 */
export function formatExcelDate(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (!str) return '';

  const cached = dateCache.get(str);
  if (cached !== undefined) return cached;

  let result = str;
  const num = Number(str);
  // Check if it's an Excel serial date (e.g. 20000..75000 corresponds to 1954..2105)
  if (!isNaN(num) && num >= 20000 && num <= 75000) {
    const date = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      result = `${year}-${month}-${day}`;
    }
  } else if (str.includes('T')) {
    // If already standard ISO date or with time (e.g. "2026-04-15T00:00:00.000Z")
    result = str.split('T')[0];
  }

  dateCache.set(str, result);
  return result;
}

/**
 * Returns clean readable month string like "Apr 2026" from a date string or Excel serial number.
 */
export function getMonthLabel(dateVal: any): string {
  if (!dateVal) return '';
  const str = String(dateVal).trim();
  if (!str) return '';

  const cached = monthCache.get(str);
  if (cached !== undefined) return cached;

  const formatted = formatExcelDate(str);
  let result = formatted;
  const match = formatted.match(/^(\d{4})[-/](\d{1,2})/);
  if (match) {
    const year = match[1];
    const monthNum = parseInt(match[2], 10);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (monthNum >= 1 && monthNum <= 12) {
      result = `${monthNames[monthNum - 1]} ${year}`;
    } else {
      result = `${year}-${String(monthNum).padStart(2, '0')}`;
    }
  }

  monthCache.set(str, result);
  return result;
}

export function processRawRows(
  rows: RawStudentRow[],
  mapping: ColumnMapping,
  thresholds: ConfigThresholds
): StudentRecord[] {
  return rows.map((row, idx) => {
    const getValue = (fieldKey: keyof ColumnMapping): string => {
      const colName = mapping[fieldKey];
      if (!colName || row[colName] === undefined || row[colName] === null) return '';
      return String(row[colName]).trim();
    };

    const studentId = getValue('studentId');
    const studentName = getValue('studentName');
    const batchCode = getValue('batchCode');
    const courseAlias = getValue('courseAlias');
    
    // In this MIS dashboard, the single actual Training Centre is MPKND.
    // Do NOT use Job Location, Placement Location, Company Location, Student Location, Location, Address, or City.
    const centre = 'MPKND';
    const trainer = getValue('trainer');
    const region = getValue('region');
    const project = getValue('project');
    const gender = getValue('gender');

    const rawStartDate = getValue('startDate');
    const startDate = formatExcelDate(rawStartDate);
    const rawEndDate = getValue('endDate');
    const endDate = formatExcelDate(rawEndDate);
    const rawActualEndDate = getValue('actualEndDate');
    const actualEndDate = formatExcelDate(rawActualEndDate);
    const startMonth = getMonthLabel(startDate);

    const batchStatus = getValue('batchStatus');

    // Dropout detection
    const rawDropoutDate = getValue('dropoutDate');
    const dropoutDate = formatExcelDate(rawDropoutDate);
    const dropoutType = getValue('dropoutType');
    const dropoutDesc = getValue('dropoutDesc');
    const isDropout = Boolean(dropoutDate || (dropoutType && dropoutType.toLowerCase() !== 'none' && dropoutType.trim() !== ''));

    // Student Status
    let studentStatus: 'Active' | 'Completed' | 'Dropped Out';
    const rawStudentStatus = getValue('studentStatus');
    if (rawStudentStatus) {
      const lower = rawStudentStatus.toLowerCase();
      if (lower.includes('drop')) studentStatus = 'Dropped Out';
      else if (lower.includes('comp')) studentStatus = 'Completed';
      else studentStatus = 'Active';
    } else {
      if (isDropout) {
        studentStatus = 'Dropped Out';
      } else if (batchStatus.toLowerCase() === 'complete' || batchStatus.toLowerCase() === 'completed') {
        studentStatus = 'Completed';
      } else {
        studentStatus = 'Active';
      }
    }

    // Exam
    const rawExamDate = getValue('examDate');
    const examDate = formatExcelDate(rawExamDate);
    const examMarksRaw = getValue('examMarks');
    const examMarks = examMarksRaw ? parseNumeric(examMarksRaw) : null;

    // Placement
    const companyName = getValue('companyName');
    const post = getValue('post');
    const salaryRaw = getValue('salary');
    const salary = salaryRaw ? parseNumeric(salaryRaw) : null;
    const rawDoj = getValue('doj');
    const doj = formatExcelDate(rawDoj);
    const isPlaced = Boolean(companyName || (salary && salary > 0) || post);

    const eligibilityRaw = getValue('eligibility').toLowerCase();
    let isEligibleForPlacement = true;
    if (eligibilityRaw) {
      if (eligibilityRaw.includes('not') || eligibilityRaw.includes('ineligible') || eligibilityRaw === 'no') {
        isEligibleForPlacement = false;
      }
    } else {
      // Default: completed non-dropped students are eligible
      isEligibleForPlacement = studentStatus === 'Completed' || studentStatus === 'Active';
    }

    // Attendance Calculations
    const attPctRaw = parsePct(getValue('attendancePct'));
    const attHoursRaw = parseNumeric(getValue('attendanceHours'));
    const reqAttHoursRaw = parseNumeric(getValue('requiredAttendanceHours'));

    let attendanceHours = attHoursRaw;
    let requiredAttendanceHours = reqAttHoursRaw || 100;
    let attendancePct = attPctRaw;

    if (attHoursRaw > 0 && reqAttHoursRaw > 0) {
      attendancePct = (attHoursRaw / reqAttHoursRaw) * 100;
    } else if (attendancePct > 0 && reqAttHoursRaw > 0) {
      attendanceHours = (attendancePct / 100) * reqAttHoursRaw;
    } else if (attendancePct === 0 && attPctRaw > 0) {
      attendancePct = attPctRaw;
    }

    const meetsAttendanceReq = attendancePct >= thresholds.attendanceReqPct;

    // ILT / Training Hours Calculations
    const iltDurationHours = parseNumeric(getValue('iltDuration')) || 90;
    const requiredIltHours = iltDurationHours * (thresholds.iltReqPct / 100);
    
    let iltAttendancePctRaw = parsePct(getValue('iltAttendancePct'));
    let iltCompletionPct = iltAttendancePctRaw;

    if (!iltCompletionPct && attendanceHours > 0 && requiredIltHours > 0) {
      iltCompletionPct = (attendanceHours / requiredIltHours) * 100;
    } else if (!iltCompletionPct && attendancePct > 0) {
      iltCompletionPct = (attendancePct / thresholds.iltReqPct) * 100;
    }

    const meetsIltReq = iltCompletionPct >= 100 || (requiredIltHours > 0 && attendanceHours >= requiredIltHours);

    // Additional Verification Statuses
    const rawLinkedin = getValue('linkedinStatus');
    const isLinkedinDone = checkIsDone(rawLinkedin);
    const linkedinStatus = rawLinkedin;

    const rawValidation = getValue('validationStatus');
    const isValidationDone = checkIsDone(rawValidation);
    const validationStatus = rawValidation;

    const rawEmail = getValue('emailStatus');
    const isEmailDone = checkIsDone(rawEmail);
    const emailStatus = rawEmail;

    const rawIchat = getValue('ichatStatus');
    const isIchatDone = checkIsDone(rawIchat);
    const ichatStatus = rawIchat;

    // Session Monitoring (AF, AG, AH, AI)
    const sessionsConductedFaculty = parseOptionalNumber(getValue('sessionsConductedFaculty'));
    const sessionsAttendedStudent = parseOptionalNumber(getValue('sessionsAttendedStudent'));
    const totalScheduleHours = parseOptionalNumber(getValue('totalScheduleHours'));
    const sessionHourDifference = parseOptionalNumber(getValue('sessionHourDifference'));
    const overallClassHours = parseOptionalNumber(getValue('overallClassHours')) ?? (requiredAttendanceHours > 0 ? requiredAttendanceHours : null);
    const totalScheduledDays = parseOptionalNumber(getValue('totalScheduledDays'));

    return {
      id: `STU-${idx + 1}-${studentId}`,
      studentId,
      studentName,
      batchCode,
      courseAlias,
      centre,
      trainer,
      region,
      project,
      gender,
      startDate,
      endDate,
      actualEndDate,
      startMonth,
      batchStatus,
      studentStatus,
      examDate,
      examMarks,
      isDropout,
      dropoutType,
      dropoutDate,
      dropoutDesc,
      isPlaced,
      isEligibleForPlacement,
      companyName,
      post,
      salary,
      doj,
      attendanceHours,
      requiredAttendanceHours,
      attendancePct,
      meetsAttendanceReq,
      iltDurationHours,
      requiredIltHours,
      iltCompletionPct,
      meetsIltReq,
      linkedinStatus,
      isLinkedinDone,
      validationStatus,
      isValidationDone,
      emailStatus,
      isEmailDone,
      ichatStatus,
      isIchatDone,
      sessionsConductedFaculty,
      sessionsAttendedStudent,
      totalScheduleHours,
      sessionHourDifference,
      overallClassHours,
      totalScheduledDays,
      raw: row,
    };
  });
}

function parseOptionalNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).trim();
  if (str === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'na') return null;
  const clean = str.replace(/[^0-9.-]/g, '').trim();
  if (clean === '' || isNaN(Number(clean))) return null;
  return Number(clean);
}

function getBatchLevelUniqueValue(students: StudentRecord[], field: (s: StudentRecord) => number | null): number | null {
  const validVals = students.map(field).filter((v): v is number => v !== null && !isNaN(v));
  if (validVals.length === 0) return null;
  return validVals[0];
}

function checkIsDone(status?: string | null): boolean {
  if (!status || String(status).trim() === '') return false;
  const s = String(status).trim().toLowerCase();
  return (
    s === 'done' ||
    s === 'complete' ||
    s === 'completed' ||
    s === 'yes' ||
    s === 'verified' ||
    s === 'approved' ||
    s === 'pass' ||
    s === 'eligible' ||
    s === 'y' ||
    s === 'true' ||
    s === '1'
  );
}

export function filterStudents(students: StudentRecord[], filters: FilterState): StudentRecord[] {
  return students.filter((s) => {
    // Search query
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        s.studentName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.batchCode.toLowerCase().includes(q) ||
        s.centre.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Date range
    if (filters.dateRange.start && s.startDate < filters.dateRange.start) return false;
    if (filters.dateRange.end && s.startDate > filters.dateRange.end) return false;

    // Month
    if (filters.selectedMonth && filters.selectedMonth !== 'All' && s.startMonth !== filters.selectedMonth) {
      return false;
    }

    // Centre
    if (filters.selectedCentres.length > 0 && !filters.selectedCentres.includes(s.centre)) {
      return false;
    }

    // Region
    if (filters.selectedRegions.length > 0 && !filters.selectedRegions.includes(s.region)) {
      return false;
    }

    // Trainer
    if (filters.selectedTrainers.length > 0 && !filters.selectedTrainers.includes(s.trainer)) {
      return false;
    }

    // Batch Code
    if (filters.selectedBatchCodes.length > 0 && !filters.selectedBatchCodes.includes(s.batchCode)) {
      return false;
    }

    // Program / Course Alias
    if (filters.selectedPrograms.length > 0 && !filters.selectedPrograms.includes(s.courseAlias)) {
      return false;
    }

    // Project
    if (filters.selectedProjects.length > 0 && !filters.selectedProjects.includes(s.project)) {
      return false;
    }

    // Batch Status
    if (filters.selectedBatchStatuses.length > 0 && !filters.selectedBatchStatuses.includes(s.batchStatus)) {
      return false;
    }

    // Student Status
    if (filters.selectedStudentStatuses.length > 0 && !filters.selectedStudentStatuses.includes(s.studentStatus)) {
      return false;
    }

    // Gender
    if (filters.selectedGenders.length > 0 && !filters.selectedGenders.includes(s.gender)) {
      return false;
    }

    // Placement Status
    if (filters.selectedPlacementStatuses.length > 0) {
      const isPlacedStr = s.isPlaced ? 'Placed' : 'Unplaced';
      if (!filters.selectedPlacementStatuses.includes(isPlacedStr)) return false;
    }

    return true;
  });
}

export function computeBatches(students: StudentRecord[]): BatchRecord[] {
  const map = new Map<string, StudentRecord[]>();
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const list = map.get(s.batchCode);
    if (list) {
      list.push(s);
    } else {
      map.set(s.batchCode, [s]);
    }
  }

  const batches: BatchRecord[] = [];
  map.forEach((list, batchCode) => {
    const first = list[0];
    const total = list.length;
    let active = 0;
    let completed = 0;
    let dropouts = 0;
    let placed = 0;
    let eligible = 0;
    let totalAtt = 0;
    let totalIlt = 0;
    let linkedinDoneCount = 0;
    let validationDoneCount = 0;
    let emailDoneCount = 0;
    let ichatDoneCount = 0;

    let totalScheduledHours: number | null = null;
    let actualClassHours: number | null = null;
    let directDiff: number | null = null;
    let sessionsConducted: number | null = null;
    let iltDurationHours: number | null = null;
    let totalScheduledDaysVal: number | null = null;

    let sessionsAttendedTotal = 0;
    let sessionsAttendedCount = 0;
    let minAttended = Infinity;
    let maxAttended = -Infinity;
    let minStudentObj: StudentRecord | null = null;
    let maxStudentObj: StudentRecord | null = null;

    const criticalStudents: StudentRecord[] = [];

    for (let i = 0; i < total; i++) {
      const s = list[i];
      if (s.studentStatus === 'Active') active++;
      else if (s.studentStatus === 'Completed') completed++;

      if (s.isDropout) dropouts++;
      if (s.isPlaced) placed++;
      if (s.isEligibleForPlacement) eligible++;

      totalAtt += s.attendancePct;
      totalIlt += s.iltCompletionPct;

      if (s.isLinkedinDone) linkedinDoneCount++;
      if (s.isValidationDone) validationDoneCount++;
      if (s.isEmailDone) emailDoneCount++;
      if (s.isIchatDone) ichatDoneCount++;

      // Extract unique non-null batch level fields
      if (totalScheduledHours === null && s.totalScheduleHours !== null && !isNaN(s.totalScheduleHours)) {
        totalScheduledHours = s.totalScheduleHours;
      }
      if (actualClassHours === null) {
        const ach = s.overallClassHours ?? (s.requiredAttendanceHours > 0 ? s.requiredAttendanceHours : null);
        if (ach !== null && !isNaN(ach)) actualClassHours = ach;
      }
      if (directDiff === null && s.sessionHourDifference !== null && !isNaN(s.sessionHourDifference)) {
        directDiff = s.sessionHourDifference;
      }
      if (sessionsConducted === null && s.sessionsConductedFaculty !== null && !isNaN(s.sessionsConductedFaculty)) {
        sessionsConducted = s.sessionsConductedFaculty;
      }
      if (iltDurationHours === null && s.iltDurationHours > 0) {
        iltDurationHours = s.iltDurationHours;
      }
      if (totalScheduledDaysVal === null && s.totalScheduledDays !== null && !isNaN(s.totalScheduledDays)) {
        totalScheduledDaysVal = s.totalScheduledDays;
      }

      // Attended sessions computation
      const attended = s.sessionsAttendedStudent !== null ? s.sessionsAttendedStudent : (s.attendanceHours > 0 ? s.attendanceHours : null);
      if (attended !== null && !isNaN(attended)) {
        sessionsAttendedTotal += attended;
        sessionsAttendedCount++;
        if (attended < minAttended) {
          minAttended = attended;
          minStudentObj = s;
        }
        if (attended > maxAttended) {
          maxAttended = attended;
          maxStudentObj = s;
        }
      }
    }

    if (iltDurationHours === null) {
      iltDurationHours = first?.iltDurationHours || null;
    }

    const avgAtt = totalAtt / (total || 1);
    const avgIlt = totalIlt / (total || 1);

    const sessionHourDifference = directDiff !== null 
      ? directDiff 
      : (totalScheduledHours !== null && actualClassHours !== null ? totalScheduledHours - actualClassHours : null);

    let sessionCompletionPct: number | null = null;
    if (totalScheduledHours !== null && totalScheduledHours > 0 && actualClassHours !== null) {
      sessionCompletionPct = Math.round((actualClassHours / totalScheduledHours) * 1000) / 10;
    }

    let studentSessionsAttendedTotal: number | null = null;
    let studentSessionsAttendedAvg: number | null = null;
    let studentSessionsAttendedMin: number | null = null;
    let studentSessionsAttendedMax: number | null = null;
    let studentSessionsAttendedMinStudent: string | null = null;
    let studentSessionsAttendedMaxStudent: string | null = null;

    if (sessionsAttendedCount > 0) {
      studentSessionsAttendedTotal = Math.round(sessionsAttendedTotal * 10) / 10;
      studentSessionsAttendedAvg = Math.round((studentSessionsAttendedTotal / sessionsAttendedCount) * 10) / 10;
      studentSessionsAttendedMin = Math.round(minAttended * 10) / 10;
      studentSessionsAttendedMax = Math.round(maxAttended * 10) / 10;
      if (minStudentObj) {
        studentSessionsAttendedMinStudent = `${minStudentObj.studentName} (${studentSessionsAttendedMin} sessions)`;
      }
      if (maxStudentObj) {
        studentSessionsAttendedMaxStudent = `${maxStudentObj.studentName} (${studentSessionsAttendedMax} sessions)`;
      }
    }

    // Critical Session Attendance: students taking very few classes (<50% sessions / attendance)
    for (let i = 0; i < total; i++) {
      const s = list[i];
      const att = s.sessionsAttendedStudent !== null ? s.sessionsAttendedStudent : (s.attendanceHours > 0 ? s.attendanceHours : null);
      if (sessionsConducted !== null && sessionsConducted > 0 && att !== null) {
        if (att < (sessionsConducted * 0.5)) {
          criticalStudents.push(s);
          continue;
        }
      } else if (att !== null && att <= 3 && totalScheduledHours !== null && totalScheduledHours > 10) {
        criticalStudents.push(s);
        continue;
      }
      if (s.attendancePct < 50) {
        criticalStudents.push(s);
      }
    }

    const criticalAttendanceCount = criticalStudents.length;
    const criticalAttendanceStudents = criticalStudents.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      studentName: s.studentName,
      sessionsAttended: s.sessionsAttendedStudent ?? (s.attendanceHours > 0 ? s.attendanceHours : null),
      sessionsConducted: sessionsConducted,
      attendancePct: s.attendancePct,
    }));

    const scheduledDays = totalScheduledDaysVal !== null ? totalScheduledDaysVal : 'N/A';

    let sessionStatus: 'Shortfall' | 'Completed' | 'Above Schedule' | 'No data' = 'No data';
    if (sessionHourDifference !== null) {
      if (sessionHourDifference > 0) {
        sessionStatus = 'Shortfall';
      } else if (sessionHourDifference === 0) {
        sessionStatus = 'Completed';
      } else {
        sessionStatus = 'Above Schedule';
      }
    }

    batches.push({
      batchCode,
      centre: first.centre,
      trainer: first.trainer,
      courseAlias: first.courseAlias,
      startDate: first.startDate,
      endDate: first.endDate,
      actualEndDate: first.actualEndDate,
      batchStatus: first.batchStatus,
      totalStudents: total,
      activeStudents: active,
      completedStudents: completed,
      dropoutCount: dropouts,
      placedCount: placed,
      eligibleCount: eligible,
      avgAttendancePct: Math.round(avgAtt * 10) / 10,
      avgIltCompletionPct: Math.round(avgIlt * 10) / 10,
      dropoutPct: Math.round((dropouts / (total || 1)) * 1000) / 10,
      placementPct: Math.round((placed / (eligible || completed || total || 1)) * 1000) / 10,
      linkedinDoneCount,
      linkedinDonePct: Math.round((linkedinDoneCount / (total || 1)) * 1000) / 10,
      validationDoneCount,
      validationDonePct: Math.round((validationDoneCount / (total || 1)) * 1000) / 10,
      emailDoneCount,
      emailDonePct: Math.round((emailDoneCount / (total || 1)) * 1000) / 10,
      ichatDoneCount,
      ichatDonePct: Math.round((ichatDoneCount / (total || 1)) * 1000) / 10,
      iltDurationHours,
      totalScheduledHours,
      actualClassHours,
      sessionHourDifference,
      sessionCompletionPct,
      sessionsConducted,
      studentSessionsAttendedTotal,
      studentSessionsAttendedAvg,
      studentSessionsAttendedMin,
      studentSessionsAttendedMax,
      studentSessionsAttendedMinStudent,
      studentSessionsAttendedMaxStudent,
      criticalAttendanceCount,
      criticalAttendanceStudents,
      scheduledDays,
      sessionStatus,
    });
  });

  return batches.sort((a, b) => b.totalStudents - a.totalStudents);
}

export function computeTrainers(students: StudentRecord[], thresholds: ConfigThresholds): TrainerRecord[] {
  const map = new Map<string, StudentRecord[]>();
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const list = map.get(s.trainer);
    if (list) {
      list.push(s);
    } else {
      map.set(s.trainer, [s]);
    }
  }

  const trainers: TrainerRecord[] = [];
  map.forEach((list, trainer) => {
    const first = list[0];
    const total = list.length;
    let active = 0;
    let completed = 0;
    let dropouts = 0;
    let placed = 0;
    let eligible = 0;
    let totalAtt = 0;
    let totalIlt = 0;
    const batchCodes = new Set<string>();

    for (let i = 0; i < total; i++) {
      const s = list[i];
      if (s.studentStatus === 'Active') active++;
      else if (s.studentStatus === 'Completed') completed++;

      if (s.isDropout) dropouts++;
      if (s.isPlaced) placed++;
      if (s.isEligibleForPlacement) eligible++;

      totalAtt += s.attendancePct;
      totalIlt += s.iltCompletionPct;
      if (s.batchCode) batchCodes.add(s.batchCode);
    }

    const avgAtt = totalAtt / (total || 1);
    const avgIlt = totalIlt / (total || 1);
    const dropoutPct = (dropouts / (total || 1)) * 100;
    const placementPct = (placed / (eligible || completed || total || 1)) * 100;
    const retentionPct = Math.max(0, 100 - dropoutPct);

    // Score Formula: Weighted combination of Attendance, Placement, and Retention
    const score =
      (avgAtt * thresholds.trainerScoreWeightAttendance +
        placementPct * thresholds.trainerScoreWeightPlacement +
        retentionPct * thresholds.trainerScoreWeightRetention) /
      100;

    trainers.push({
      trainer,
      centre: first.centre,
      batchCount: batchCodes.size,
      totalStudents: total,
      activeStudents: active,
      completedStudents: completed,
      dropoutCount: dropouts,
      placedCount: placed,
      eligibleCount: eligible,
      avgAttendancePct: Math.round(avgAtt * 10) / 10,
      avgIltCompletionPct: Math.round(avgIlt * 10) / 10,
      dropoutPct: Math.round(dropoutPct * 10) / 10,
      placementPct: Math.round(placementPct * 10) / 10,
      performanceScore: Math.round(score * 10) / 10,
    });
  });

  return trainers.sort((a, b) => b.performanceScore - a.performanceScore);
}

export function computeCentres(students: StudentRecord[], thresholds: ConfigThresholds): CentreRecord[] {
  const map = new Map<string, StudentRecord[]>();
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const list = map.get(s.centre);
    if (list) {
      list.push(s);
    } else {
      map.set(s.centre, [s]);
    }
  }

  const listCentres: Array<Omit<CentreRecord, 'rank'>> = [];
  map.forEach((list, centre) => {
    const first = list[0];
    const total = list.length;
    let active = 0;
    let completed = 0;
    let dropouts = 0;
    let placed = 0;
    let eligible = 0;
    let totalAtt = 0;
    let totalIlt = 0;
    const batchCodes = new Set<string>();
    const trainersSet = new Set<string>();

    for (let i = 0; i < total; i++) {
      const s = list[i];
      if (s.studentStatus === 'Active') active++;
      else if (s.studentStatus === 'Completed') completed++;

      if (s.isDropout) dropouts++;
      if (s.isPlaced) placed++;
      if (s.isEligibleForPlacement) eligible++;

      totalAtt += s.attendancePct;
      totalIlt += s.iltCompletionPct;
      if (s.batchCode) batchCodes.add(s.batchCode);
      if (s.trainer) trainersSet.add(s.trainer);
    }

    const avgAtt = totalAtt / (total || 1);
    const avgIlt = totalIlt / (total || 1);
    const dropoutPct = (dropouts / (total || 1)) * 100;
    const placementPct = (placed / (eligible || completed || total || 1)) * 100;
    const completionPct = (completed / (total || 1)) * 100;

    let statusGrade: 'Good' | 'Needs Attention' | 'Critical' = 'Good';
    if (dropoutPct > thresholds.highDropoutThresholdPct || avgAtt < thresholds.attendanceReqPct) {
      statusGrade = 'Critical';
    } else if (
      avgAtt < thresholds.goodAttendanceThresholdPct ||
      placementPct < thresholds.lowPlacementThresholdPct
    ) {
      statusGrade = 'Needs Attention';
    }

    listCentres.push({
      centre,
      region: first.region,
      batchCount: batchCodes.size,
      trainerCount: trainersSet.size,
      totalStudents: total,
      activeStudents: active,
      completedStudents: completed,
      dropoutCount: dropouts,
      placedCount: placed,
      eligibleCount: eligible,
      avgAttendancePct: Math.round(avgAtt * 10) / 10,
      avgIltCompletionPct: Math.round(avgIlt * 10) / 10,
      dropoutPct: Math.round(dropoutPct * 10) / 10,
      placementPct: Math.round(placementPct * 10) / 10,
      completionPct: Math.round(completionPct * 10) / 10,
      statusGrade,
    });
  });

  // Sort by combination of Attendance & Placement
  listCentres.sort((a, b) => b.avgAttendancePct + b.placementPct - (a.avgAttendancePct + a.placementPct));

  return listCentres.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

export function generateDataQualityReport(
  rawRows: RawStudentRow[],
  mapping: ColumnMapping
): DataQualityReport {
  const totalRows = rawRows.length;
  if (totalRows === 0) {
    return {
      totalRows: 0,
      validRows: 0,
      duplicateRows: 0,
      missingValuesCount: 0,
      invalidDatesCount: 0,
      invalidPctCount: 0,
      qualityScorePct: 100,
      columnAudit: [],
      issues: ['No dataset uploaded yet.'],
    };
  }

  let duplicateRows = 0;
  let missingValuesCount = 0;
  let invalidDatesCount = 0;
  let invalidPctCount = 0;
  const issues: string[] = [];

  const seenIds = new Set<string>();

  const mappedKeys = (Object.keys(mapping) as Array<keyof ColumnMapping>).filter((k) => mapping[k]);

  const columnAudit = mappedKeys.map((k) => {
    const colName = mapping[k];
    let nonEmp = 0;
    rawRows.forEach((row) => {
      if (row[colName] !== undefined && row[colName] !== null && String(row[colName]).trim() !== '') {
        nonEmp++;
      }
    });
    return {
      columnName: colName,
      mappedTo: k,
      nonEmptyCount: nonEmp,
      emptyCount: totalRows - nonEmp,
      healthPct: Math.round((nonEmp / totalRows) * 100),
    };
  });

  rawRows.forEach((row, i) => {
    const idCol = mapping.studentId;
    if (idCol && row[idCol]) {
      const idVal = String(row[idCol]).trim();
      if (seenIds.has(idVal)) duplicateRows++;
      else seenIds.add(idVal);
    } else {
      missingValuesCount++;
    }

    const dateCol = mapping.startDate;
    if (dateCol && row[dateCol]) {
      const dStr = String(row[dateCol]).trim();
      if (dStr && isNaN(Date.parse(dStr))) invalidDatesCount++;
    }

    const attCol = mapping.attendancePct;
    if (attCol && row[attCol]) {
      const num = parseNumeric(row[attCol]);
      if (num < 0 || num > 100) invalidPctCount++;
    }
  });

  if (duplicateRows > 0) issues.push(`Found ${duplicateRows} duplicate student code(s).`);
  if (invalidDatesCount > 0) issues.push(`Found ${invalidDatesCount} invalid date formats.`);
  if (invalidPctCount > 0) issues.push(`Found ${invalidPctCount} out-of-range percentage values.`);
  if (!mapping.studentName) issues.push('Warning: Student Name column is not mapped.');
  if (!mapping.centre) issues.push('Warning: Centre/Location column is not mapped.');

  const penalty = duplicateRows * 2 + invalidDatesCount * 2 + invalidPctCount * 2 + (issues.length > 2 ? 10 : 0);
  const qualityScorePct = Math.max(10, Math.min(100, 100 - penalty));

  return {
    totalRows,
    validRows: Math.max(0, totalRows - duplicateRows),
    duplicateRows,
    missingValuesCount,
    invalidDatesCount,
    invalidPctCount,
    qualityScorePct,
    columnAudit,
    issues,
  };
}

export function generateManagementInsights(
  students: StudentRecord[],
  centres: CentreRecord[],
  trainers: TrainerRecord[],
  batches: BatchRecord[]
): ManagementInsight[] {
  const insights: ManagementInsight[] = [];
  if (students.length === 0) return insights;

  // Best Centre
  if (centres.length > 0) {
    const bestCentre = centres[0];
    insights.push({
      id: 'ins-best-centre',
      category: 'Centre',
      type: 'positive',
      title: 'Top Performing Centre',
      description: `${bestCentre.centre} ranks #1 with ${bestCentre.avgAttendancePct}% average attendance and ${bestCentre.placementPct}% placement rate across ${bestCentre.totalStudents} enrolled learners.`,
      metricLabel: 'Top Centre Attendance',
      metricValue: `${bestCentre.avgAttendancePct}%`,
      actionRecommendation: 'Replicate curriculum delivery and attendance engagement practices from this centre across regional hubs.',
    });

    const lowestCentre = centres[centres.length - 1];
    if (lowestCentre.centre !== bestCentre.centre) {
      insights.push({
        id: 'ins-lowest-centre',
        category: 'Centre',
        type: lowestCentre.statusGrade === 'Critical' ? 'critical' : 'warning',
        title: 'Centre Needing Focus',
        description: `${lowestCentre.centre} recorded lower relative attendance (${lowestCentre.avgAttendancePct}%) and a dropout rate of ${lowestCentre.dropoutPct}%.`,
        metricLabel: 'Dropout Rate',
        metricValue: `${lowestCentre.dropoutPct}%`,
        actionRecommendation: 'Schedule an immediate review with Centre Operations Manager to audit student attendance logs and counseling.',
      });
    }
  }

  // Top Trainer
  if (trainers.length > 0) {
    const topTrainer = trainers[0];
    insights.push({
      id: 'ins-top-trainer',
      category: 'Trainer',
      type: 'positive',
      title: 'Leading Trainer Benchmark',
      description: `${topTrainer.trainer} achieved an overall performance score of ${topTrainer.performanceScore}/100, maintaining ${topTrainer.avgAttendancePct}% student attendance and ${topTrainer.placementPct}% placement rate.`,
      metricLabel: 'Trainer Score',
      metricValue: `${topTrainer.performanceScore}`,
      actionRecommendation: 'Involve top trainers in peer mentoring and faculty workshop sessions.',
    });
  }

  // Attendance & Dropout Insights
  const totalStudents = students.length;
  const dropouts = students.filter((s) => s.isDropout);
  const dropoutPct = Math.round((dropouts.length / totalStudents) * 1000) / 10;

  if (dropoutPct > 10) {
    insights.push({
      id: 'ins-dropout-alert',
      category: 'Dropout',
      type: 'critical',
      title: 'Dropout Mitigation Required',
      description: `Overall dropout rate stands at ${dropoutPct}% (${dropouts.length} learners out of ${totalStudents}). Primary reason categories include initial session attendance drops and age/qualification mismatch.`,
      metricLabel: 'Total Dropouts',
      metricValue: `${dropouts.length} (${dropoutPct}%)`,
      actionRecommendation: 'Enforce early counseling intervention within the first 10 days of batch commencement.',
    });
  }

  // Placement Analysis
  const eligibleStudents = students.filter((s) => s.isEligibleForPlacement);
  const placedStudents = students.filter((s) => s.isPlaced);
  const placementRate = Math.round((placedStudents.length / (eligibleStudents.length || 1)) * 1000) / 10;

  insights.push({
    id: 'ins-placement-rate',
    category: 'Placement',
    type: placementRate >= 50 ? 'positive' : 'warning',
    title: 'Placement Conversion',
    description: `Placed ${placedStudents.length} learners out of ${eligibleStudents.length} eligible candidates, representing a ${placementRate}% placement rate.`,
    metricLabel: 'Placement Rate',
    metricValue: `${placementRate}%`,
    actionRecommendation: 'Expand corporate tie-ups and conduct mock interviewer sessions for eligible unplaced students.',
  });

  return insights;
}

export function generateActionAlerts(
  students: StudentRecord[],
  batches: BatchRecord[],
  thresholds: ConfigThresholds
): ActionAlert[] {
  const alerts: ActionAlert[] = [];
  if (students.length === 0) return alerts;

  // 1. Low Attendance Alert
  const lowAttStudents = students.filter((s) => !s.meetsAttendanceReq && !s.isDropout);
  if (lowAttStudents.length > 0) {
    alerts.push({
      id: 'alt-low-att',
      severity: 'high',
      title: 'Students Below Attendance Threshold',
      description: `${lowAttStudents.length} active students currently have attendance below the required ${thresholds.attendanceReqPct}% requirement.`,
      category: 'Attendance',
      count: lowAttStudents.length,
      affectedItems: lowAttStudents.map((s) => `${s.studentName} (${s.batchCode})`),
    });
  }

  // 2. High Dropout Batches
  const highDropoutBatches = batches.filter((b) => b.dropoutPct >= thresholds.highDropoutThresholdPct);
  if (highDropoutBatches.length > 0) {
    alerts.push({
      id: 'alt-high-dropout-batch',
      severity: 'high',
      title: 'Batches Exceeding Dropout Threshold',
      description: `${highDropoutBatches.length} batch(es) have dropout rates exceeding ${thresholds.highDropoutThresholdPct}%.`,
      category: 'Dropout',
      count: highDropoutBatches.length,
      affectedItems: highDropoutBatches.map((b) => `${b.batchCode} (${b.centre}) - ${b.dropoutPct}% Dropouts`),
    });
  }

  // 3. Low ILT Completion
  const lowIltStudents = students.filter((s) => !s.meetsIltReq && !s.isDropout);
  if (lowIltStudents.length > 0) {
    alerts.push({
      id: 'alt-low-ilt',
      severity: 'medium',
      title: 'Learners Lagging on ILT Requirements',
      description: `${lowIltStudents.length} learners have completed less than the required ${thresholds.iltReqPct}% ILT training hours.`,
      category: 'ILT',
      count: lowIltStudents.length,
      affectedItems: lowIltStudents.map((s) => `${s.studentName} - ${Math.round(s.iltCompletionPct)}% ILT`),
    });
  }

  // 4. Completed but Unplaced Eligible Students
  const unplacedEligible = students.filter((s) => s.studentStatus === 'Completed' && s.isEligibleForPlacement && !s.isPlaced);
  if (unplacedEligible.length > 0) {
    alerts.push({
      id: 'alt-unplaced-eligible',
      severity: 'medium',
      title: 'Eligible Completed Students Awaiting Placement',
      description: `${unplacedEligible.length} completed eligible students are not yet placed in industry roles.`,
      category: 'Placement',
      count: unplacedEligible.length,
      affectedItems: unplacedEligible.map((s) => `${s.studentName} (${s.centre})`),
    });
  }

  return alerts;
}

export function processDataset(
  rawRows: RawStudentRow[],
  mapping: ColumnMapping,
  thresholds: ConfigThresholds,
  filters: FilterState
) {
  const allStudents = processRawRows(rawRows, mapping, thresholds);
  const filteredStudents = filterStudents(allStudents, filters);
  const batches = computeBatches(filteredStudents);
  const trainers = computeTrainers(filteredStudents, thresholds);
  const centres = computeCentres(filteredStudents, thresholds);
  const insights = generateManagementInsights(filteredStudents, centres, trainers, batches);
  const alerts = generateActionAlerts(filteredStudents, batches, thresholds);
  const qualityReport = generateDataQualityReport(rawRows, mapping);

  return {
    allStudents,
    filteredStudents,
    batches,
    trainers,
    centres,
    insights,
    alerts,
    qualityReport,
  };
}

