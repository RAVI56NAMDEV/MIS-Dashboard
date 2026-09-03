import React, { useState, useMemo } from 'react';
import { StudentRecord, ConfigThresholds } from '../../types';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Eye, Download, CheckCircle, AlertTriangle, UserX, Briefcase } from 'lucide-react';

interface StudentMisViewProps {
  students: StudentRecord[];
  thresholds: ConfigThresholds;
  onExportCsv: () => void;
}

export const StudentMisView: React.FC<StudentMisViewProps> = ({ students, thresholds, onExportCsv }) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof StudentRecord>('studentName');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.batchCode.toLowerCase().includes(q) ||
        s.centre.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q)
      );
    });
  }, [students, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: any = a[sortField];
      let vb: any = b[sortField];

      if (va === null || va === undefined) va = '';
      if (vb === null || vb === undefined) vb = '';

      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();

      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortAsc]);

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: keyof StudentRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Search & Actions Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student name, code, batch, centre, company..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-neutral-500 font-medium">
            Showing <strong className="text-neutral-900">{filtered.length}</strong> Students
          </span>
          <button
            onClick={onExportCsv}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export Student MIS
          </button>
        </div>
      </div>

      {/* Main Student Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-100/80 text-neutral-800 font-semibold border-b border-neutral-200">
              <tr>
                <th className="p-3 cursor-pointer" onClick={() => handleSort('studentId')}>
                  <div className="flex items-center gap-1">Code <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                </th>
                <th className="p-3 cursor-pointer" onClick={() => handleSort('studentName')}>
                  <div className="flex items-center gap-1">Student Name <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                </th>
                <th className="p-3 cursor-pointer" onClick={() => handleSort('centre')}>
                  <div className="flex items-center gap-1">Centre <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                </th>
                <th className="p-3 cursor-pointer" onClick={() => handleSort('batchCode')}>
                  <div className="flex items-center gap-1">Batch <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                </th>
                <th className="p-3 cursor-pointer" onClick={() => handleSort('courseAlias')}>
                  <div className="flex items-center gap-1">Program <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                </th>
                <th className="p-3 cursor-pointer text-center" onClick={() => handleSort('attendancePct')}>
                  <div className="flex items-center justify-center gap-1">Attendance % <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                </th>
                <th className="p-3 cursor-pointer text-center" onClick={() => handleSort('iltCompletionPct')}>
                  <div className="flex items-center justify-center gap-1">ILT Comp % <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                </th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Placement</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginated.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50/80 transition">
                  <td className="p-3 font-mono text-neutral-600">{s.studentId}</td>
                  <td className="p-3 font-bold text-neutral-900">{s.studentName}</td>
                  <td className="p-3 font-medium text-neutral-700">{s.centre}</td>
                  <td className="p-3 font-mono text-neutral-600">{s.batchCode}</td>
                  <td className="p-3 text-neutral-700">{s.courseAlias}</td>
                  <td className="p-3 text-center font-bold">
                    <span
                      className={`px-2 py-0.5 rounded-md ${
                        s.meetsAttendanceReq ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-rose-50 text-rose-700 font-bold'
                      }`}
                    >
                      {Math.round(s.attendancePct * 10) / 10}%
                    </span>
                  </td>
                  <td className="p-3 text-center font-medium text-neutral-800">
                    {Math.round(s.iltCompletionPct * 10) / 10}%
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.studentStatus === 'Active'
                          ? 'bg-blue-100 text-blue-700'
                          : s.studentStatus === 'Completed'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {s.studentStatus}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {s.isPlaced ? (
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full flex items-center justify-center gap-1 w-fit mx-auto">
                        <Briefcase className="w-3 h-3" /> {s.companyName || 'Placed'}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-neutral-100 text-neutral-500 font-medium px-2 py-0.5 rounded-full">
                        Unplaced
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedStudent(s)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="View Student Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-neutral-400 font-medium">
                    No student records matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-neutral-500">
            Page <strong className="text-neutral-900">{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex justify-between items-start border-b border-neutral-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  {selectedStudent.studentId}
                </span>
                <h3 className="text-lg font-bold text-neutral-900">{selectedStudent.studentName}</h3>
                <p className="text-xs text-neutral-500">
                  {selectedStudent.courseAlias} • {selectedStudent.batchCode}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-neutral-400 block text-[10px]">Centre</span>
                <span className="font-semibold text-neutral-800">{selectedStudent.centre}</span>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-neutral-400 block text-[10px]">Trainer</span>
                <span className="font-semibold text-neutral-800">{selectedStudent.trainer}</span>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-neutral-400 block text-[10px]">Batch Status</span>
                <span className="font-semibold text-neutral-800">{selectedStudent.batchStatus}</span>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-neutral-400 block text-[10px]">Attendance %</span>
                <span className="font-bold text-blue-600">{Math.round(selectedStudent.attendancePct)}%</span>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-neutral-400 block text-[10px]">ILT Completion %</span>
                <span className="font-bold text-indigo-600">{Math.round(selectedStudent.iltCompletionPct)}%</span>
              </div>
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-neutral-400 block text-[10px]">Placement Eligibility</span>
                <span className="font-semibold text-neutral-800">
                  {selectedStudent.isEligibleForPlacement ? 'Eligible' : 'Not Eligible'}
                </span>
              </div>
            </div>

            {selectedStudent.isPlaced && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
                <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-600" /> Corporate Placement Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-neutral-700 pt-1">
                  <div>Company: <strong>{selectedStudent.companyName}</strong></div>
                  <div>Role: <strong>{selectedStudent.post || 'N/A'}</strong></div>
                  <div>Salary: <strong>{selectedStudent.salary ? `INR ${selectedStudent.salary}` : 'N/A'}</strong></div>
                  <div>DOJ: <strong>{selectedStudent.doj || 'N/A'}</strong></div>
                </div>
              </div>
            )}

            {selectedStudent.isDropout && (
              <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs space-y-1">
                <h4 className="font-bold text-rose-900 flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-rose-600" /> Dropout Log
                </h4>
                <div className="text-neutral-700">
                  <div>Type: <strong>{selectedStudent.dropoutType || 'Exit'}</strong></div>
                  <div>Date: <strong>{selectedStudent.dropoutDate || 'N/A'}</strong></div>
                  {selectedStudent.dropoutDesc && <div>Reason: {selectedStudent.dropoutDesc}</div>}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 text-xs font-semibold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
