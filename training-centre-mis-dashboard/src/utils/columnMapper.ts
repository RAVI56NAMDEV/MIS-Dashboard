import { ColumnMapping } from '../types';

const COLUMN_ALIASES: Record<keyof ColumnMapping, string[]> = {
  studentId: ['student code', 'student id', 'learner id', 'candidate id', 'id', 'code', 'enrollment no', 'registration no'],
  studentName: ['student name', 'name', 'learner name', 'candidate name', 'student'],
  batchCode: ['batch code', 'batch', 'batch no', 'batch id', 'batch name'],
  courseAlias: ['course alias', 'course', 'program', 'program name', 'course name', 'stream', 'module'],
  centre: ['training centre', 'training center', 'centre name', 'center name', 'training branch', 'training hub', 'centre', 'center'],
  trainer: ['trainer name', 'trainer', 'faculty', 'instructor', 'faculty name', 'mentor'],
  startDate: ['start date', 'batch start date', 'commencement date', 'joined date'],
  endDate: ['end date', 'batch end date', 'expected end date'],
  actualEndDate: ['actual end date', 'completion date'],
  batchStatus: ['batch status', 'batch state'],
  studentStatus: ['student status', 'status', 'learner status', 'current status'],
  examDate: ['final exam date', 'exam date', 'assessment date'],
  examMarks: ['final exam marks', 'exam marks', 'marks', 'score', 'assessment score'],
  dropoutType: ['dropout type', 'dropout category', 'exit type', 'withdrawal type'],
  dropoutDate: ['dropout date', 'drop out date', 'exit date', 'withdrawal date'],
  dropoutDesc: ['dropout description', 'dropout reason', 'reason', 'remarks'],
  companyName: ['company name', 'company', 'employer', 'placed at', 'placement company'],
  post: ['post', 'designation', 'role', 'job title', 'job role'],
  salary: ['salary', 'ctc', 'package', 'annual salary', 'monthly salary'],
  doj: ['doj', 'date of joining', 'joining date'],
  attendanceHours: ['attendance hours', 'attended hours', 'present hours', 'total present', 'hours attended'],
  requiredAttendanceHours: ['overall class hours(course level)', 'overall class hours', 'required attendance hours', 'required hours', 'total class hours'],
  attendancePct: ['running_attendance%', 'course level attendance %', 'attendance %', 'attendance percentage', 'running attendance'],
  iltAttendancePct: ['ilt attendance %', 'ilt completion %'],
  iltDuration: ['ilt duration for specific course', 'ilt duration', 'ilt hours', 'total ilt'],
  eligibility: ['student course level eligibility', 'placement eligibility', 'eligibility', 'eligible'],
  gender: ['gender', 'sex'],
  region: ['region', 'zone', 'territory', 'state'],
  project: ['project', 'scheme', 'client', 'sponsor'],
  linkedinStatus: ['linkdin status', 'linkedin status', 'linkedin', 'linkdin', 'linkedin state', 'linkedin profile', 'linkdin stat', 'linkedin stat'],
  validationStatus: ['validation stauts', 'validation status', 'validation', 'validation state', 'validation check', 'validation stat', 'validation staut'],
  emailStatus: ['email status', 'email', 'email verification', 'email status state', 'email stat'],
  ichatStatus: ['ichat report status', 'ichat status', 'ichat report', 'ichat', 'ichat state', 'ichat report stat', 'ichat stat'],
  sessionsConductedFaculty: [
    'number of sessions conducted by faculty for beneficiary',
    'number of sessions conducted by faculty',
    'sessions conducted by faculty for beneficiary',
    'sessions conducted by faculty',
    'number of sessions conducted',
    'faculty conducted sessions',
    'sessions conducted',
  ],
  sessionsAttendedStudent: [
    'number of sessions attended by the student',
    'number of sessions attended by student',
    'number of sessions attended',
    'sessions attended by the student',
    'sessions attended by student',
    'sessions attended',
    'student sessions attended',
  ],
  totalScheduleHours: [
    'total schedule hours',
    'total scheduled hours',
    'schedule hours',
    'scheduled hours',
    'total schedule hrs',
    'total scheduled hrs',
  ],
  sessionHourDifference: [
    'session hour difference',
    'session hours difference',
    'hour difference',
    'session difference',
    'hours difference',
  ],
  overallClassHours: [
    'overall class hours(course level)',
    'overall class hours (course level)',
    'overall class hours',
    'actual class hours',
    'actual hours',
  ],
  totalScheduledDays: [
    'total scheduled days',
    'scheduled days',
    'total schedule days',
    'schedule days',
  ],
};

export function autoDetectColumnMapping(availableColumns: string[]): ColumnMapping {
  return autoDetectColumns(availableColumns);
}

export function autoDetectColumns(availableColumns: string[]): ColumnMapping {
  const mapping: Partial<ColumnMapping> = {};
  const normalizedAvailable = availableColumns.map(col => ({
    original: col,
    clean: col.trim().toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' '),
  }));

  (Object.keys(COLUMN_ALIASES) as Array<keyof ColumnMapping>).forEach((field) => {
    const aliases = COLUMN_ALIASES[field];

    if (field === 'centre') {
      // Do NOT map Job Location, Placement Location, Company Location, Address, or City to Training Centre
      const validCentreCols = normalizedAvailable.filter(col => {
        const c = col.clean;
        return (
          !c.includes('job') &&
          !c.includes('placement') &&
          !c.includes('company') &&
          !c.includes('address') &&
          !c.includes('city') &&
          !c.includes('post') &&
          !c.includes('work') &&
          !c.includes('hiring') &&
          !c.includes('employer')
        );
      });

      let matched = validCentreCols.find(col => aliases.includes(col.clean));
      if (!matched) {
        matched = validCentreCols.find(col =>
          aliases.some(alias => col.clean === alias || col.clean.startsWith(alias) || col.clean.endsWith(alias))
        );
      }
      mapping[field] = matched ? matched.original : '';
      return;
    }

    // Exact match search
    let matched = normalizedAvailable.find(col => aliases.includes(col.clean));
    
    // Partial match search if exact match fails
    if (!matched) {
      matched = normalizedAvailable.find(col => 
        aliases.some(alias => col.clean.includes(alias) || alias.includes(col.clean))
      );
    }

    mapping[field] = matched ? matched.original : '';
  });

  return mapping as ColumnMapping;
}
