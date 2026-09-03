import { StudentRecord, BatchRecord, TrainerRecord, CentreRecord } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          let val = row[h] ?? '';
          if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadExcel(filename: string, sheets: { sheetName: string; data: Record<string, any>[] }[]) {
  const wb = XLSX.utils.book_new();
  sheets.forEach((s) => {
    const ws = XLSX.utils.json_to_sheet(s.data);
    XLSX.utils.book_append_sheet(wb, ws, s.sheetName);
  });
  XLSX.writeFile(wb, filename);
}

export function exportToCsv(students: StudentRecord[], filename: string = 'MIS_Student_Roster') {
  const data = students.map((s) => ({
    'Student ID': s.studentId,
    'Student Name': s.studentName,
    'Batch Code': s.batchCode,
    'Program/Course': s.courseAlias,
    Centre: s.centre,
    Trainer: s.trainer,
    'Batch Status': s.batchStatus,
    'Student Status': s.studentStatus,
    'Start Date': s.startDate,
    'Attendance %': s.attendancePct ? `${Math.round(s.attendancePct * 10) / 10}%` : '',
    'Attendance Req Met': s.meetsAttendanceReq ? 'Yes' : 'No',
    'ILT Completion %': s.iltCompletionPct ? `${Math.round(s.iltCompletionPct * 10) / 10}%` : '',
    'LinkedIn Status': s.linkedinStatus,
    'Validation Status': s.validationStatus,
    'Email Status': s.emailStatus,
    'IChat Report Status': s.ichatStatus,
    Dropout: s.isDropout ? 'Yes' : '',
    'Dropout Type': s.dropoutType,
    'Dropout Date': s.dropoutDate,
    'Placement Status': s.isPlaced ? 'Placed' : '',
    Company: s.companyName,
    Role: s.post,
    Salary: s.salary ? `INR ${s.salary}` : '',
    Eligibility: s.isEligibleForPlacement ? 'Eligible' : 'Not Eligible',
  }));
  downloadCsv(`${filename}.csv`, data);
}

export function exportToExcel(students: StudentRecord[], filename: string = 'MIS_Filtered_Dataset') {
  const data = students.map((s) => ({
    'Student ID': s.studentId,
    'Student Name': s.studentName,
    'Batch Code': s.batchCode,
    'Program/Course': s.courseAlias,
    Centre: s.centre,
    Trainer: s.trainer,
    'Batch Status': s.batchStatus,
    'Student Status': s.studentStatus,
    'Start Date': s.startDate,
    'Attendance %': s.attendancePct ? `${Math.round(s.attendancePct * 10) / 10}%` : '',
    'Attendance Req Met': s.meetsAttendanceReq ? 'Yes' : 'No',
    'ILT Completion %': s.iltCompletionPct ? `${Math.round(s.iltCompletionPct * 10) / 10}%` : '',
    'LinkedIn Status': s.linkedinStatus,
    'Validation Status': s.validationStatus,
    'Email Status': s.emailStatus,
    'IChat Report Status': s.ichatStatus,
    Dropout: s.isDropout ? 'Yes' : '',
    'Dropout Type': s.dropoutType,
    'Dropout Date': s.dropoutDate,
    'Placement Status': s.isPlaced ? 'Placed' : '',
    Company: s.companyName,
    Role: s.post,
    Salary: s.salary ? `INR ${s.salary}` : '',
    Eligibility: s.isEligibleForPlacement ? 'Eligible' : 'Not Eligible',
  }));

  downloadExcel(`${filename}.xlsx`, [
    { sheetName: 'Students MIS', data },
  ]);
}

export function exportStudentDataToExcel(students: StudentRecord[]) {
  exportToExcel(students, `Training_MIS_Students_${new Date().toISOString().slice(0, 10)}`);
}

export function exportPdfReport(
  students: StudentRecord[],
  batches: BatchRecord[] = [],
  centres: CentreRecord[] = [],
  trainersOrInsights: any = [],
  title: string = 'Current Period Report'
) {
  const trainers: TrainerRecord[] = Array.isArray(trainersOrInsights) && trainersOrInsights.length > 0 && 'trainer' in trainersOrInsights[0]
    ? trainersOrInsights
    : [];

  const doc = new jsPDF('landscape', 'mm', 'a4');


  // Title & Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TRAINING CENTRE MIS EXECUTIVE SUMMARY REPORT', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 220, 15);

  // Executive KPI Summary Table
  const totalStudents = students.length;
  const activeCount = students.filter((s) => s.studentStatus === 'Active').length;
  const completedCount = students.filter((s) => s.studentStatus === 'Completed').length;
  const dropouts = students.filter((s) => s.isDropout).length;
  const placed = students.filter((s) => s.isPlaced).length;

  const avgAtt = students.reduce((acc, s) => acc + s.attendancePct, 0) / (totalStudents || 1);
  const avgIlt = students.reduce((acc, s) => acc + s.iltCompletionPct, 0) / (totalStudents || 1);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Executive Key Performance Indicators', 14, 34);

  autoTable(doc, {
    startY: 38,
    head: [['Total Students', 'Active', 'Completed', 'Dropouts', 'Dropout %', 'Placed', 'Avg Attendance %', 'Avg ILT Completion %']],
    body: [
      [
        totalStudents,
        activeCount,
        completedCount,
        dropouts,
        `${Math.round((dropouts / (totalStudents || 1)) * 1000) / 10}%`,
        placed,
        `${Math.round(avgAtt * 10) / 10}%`,
        `${Math.round(avgIlt * 10) / 10}%`,
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, halign: 'center' },
  });

  // Centre Performance
  doc.text('2. Centre Performance Ranking', 14, (doc as any).lastAutoTable.finalY + 12);

  const centreRows = centres.map((c) => [
    c.rank,
    c.centre,
    c.batchCount,
    c.totalStudents,
    `${c.avgAttendancePct}%`,
    `${c.dropoutPct}%`,
    `${c.placementPct}%`,
    `${c.completionPct}%`,
    c.statusGrade,
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 16,
    head: [['Rank', 'Centre', 'Batches', 'Students', 'Attendance %', 'Dropout %', 'Placement %', 'Completion %', 'Status']],
    body: centreRows,
    theme: 'striped',
    headStyles: { fillColor: [71, 85, 105], textColor: 255 },
    styles: { fontSize: 9 },
  });

  // Trainer Scorecard
  if ((doc as any).lastAutoTable.finalY > 150) {
    doc.addPage();
    doc.text('3. Trainer Scorecard', 14, 20);
  } else {
    doc.text('3. Trainer Scorecard', 14, (doc as any).lastAutoTable.finalY + 12);
  }

  const trainerRows = trainers.slice(0, 10).map((t) => [
    t.trainer,
    t.centre,
    t.batchCount,
    t.totalStudents,
    `${t.avgAttendancePct}%`,
    `${t.dropoutPct}%`,
    `${t.placementPct}%`,
    t.performanceScore,
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY ? (doc as any).lastAutoTable.finalY + 6 : 26,
    head: [['Trainer', 'Centre', 'Batches', 'Students', 'Attendance %', 'Dropout %', 'Placement %', 'Performance Score']],
    body: trainerRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    styles: { fontSize: 9 },
  });

  doc.save(`Training_MIS_Executive_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
