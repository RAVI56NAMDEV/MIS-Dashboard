import React, { useState, useMemo } from 'react';
import { StudentRecord } from '../../types';
import { Search, Download, ArrowUpDown, ChevronLeft, ChevronRight, SlidersHorizontal, Layers } from 'lucide-react';

interface DetailedTableViewProps {
  students: StudentRecord[];
  onExportExcel: () => void;
  onExportCsv: () => void;
}

export const DetailedTableView: React.FC<DetailedTableViewProps> = ({
  students,
  onExportExcel,
  onExportCsv,
}) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof StudentRecord>('studentName');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const filtered = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter((s) => {
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.batchCode.toLowerCase().includes(q) ||
        s.centre.toLowerCase().includes(q) ||
        s.trainer.toLowerCase().includes(q) ||
        s.courseAlias.toLowerCase().includes(q) ||
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
      {/* Search & Export Actions */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search across all MIS attributes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            className="px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-neutral-500" /> Export CSV
          </button>
          <button
            onClick={onExportExcel}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-2xs transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Download Full Excel
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-100/90 text-neutral-800 font-bold border-b border-neutral-200">
              <tr>
                <th className="p-2.5 cursor-pointer" onClick={() => handleSort('studentId')}>
                  <div className="flex items-center gap-1">Student ID <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                </th>
                <th className="p-2.5 cursor-pointer" onClick={() => handleSort('studentName')}>
                  <div className="flex items-center gap-1">Student Name <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                </th>
                <th className="p-2.5 cursor-pointer" onClick={() => handleSort('centre')}>
                  <div className="flex items-center gap-1">Centre <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                </th>
                <th className="p-2.5 cursor-pointer" onClick={() => handleSort('trainer')}>
                  <div className="flex items-center gap-1">Trainer <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                </th>
                <th className="p-2.5 cursor-pointer" onClick={() => handleSort('batchCode')}>
                  <div className="flex items-center gap-1">Batch Code <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                </th>
                <th className="p-2.5 cursor-pointer" onClick={() => handleSort('courseAlias')}>
                  <div className="flex items-center gap-1">Program <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                </th>
                <th className="p-2.5 cursor-pointer text-center" onClick={() => handleSort('attendancePct')}>
                  <div className="flex items-center justify-center gap-1">Att. % <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                </th>
                <th className="p-2.5 cursor-pointer text-center" onClick={() => handleSort('iltCompletionPct')}>
                  <div className="flex items-center justify-center gap-1">ILT % <ArrowUpDown className="w-3 h-3 text-neutral-400" /></div>
                </th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5">Company</th>
                <th className="p-2.5 text-right">Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginated.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50/80 font-medium">
                  <td className="p-2.5 font-mono text-neutral-600">{s.studentId}</td>
                  <td className="p-2.5 font-bold text-neutral-900">{s.studentName}</td>
                  <td className="p-2.5 text-neutral-700">{s.centre}</td>
                  <td className="p-2.5 text-neutral-700">{s.trainer}</td>
                  <td className="p-2.5 font-mono text-neutral-600">{s.batchCode}</td>
                  <td className="p-2.5 text-neutral-700">{s.courseAlias}</td>
                  <td className="p-2.5 text-center font-bold text-blue-600">{Math.round(s.attendancePct)}%</td>
                  <td className="p-2.5 text-center font-bold text-indigo-600">{Math.round(s.iltCompletionPct)}%</td>
                  <td className="p-2.5 text-center">
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
                  <td className="p-2.5 text-neutral-800 font-semibold">{s.companyName || '-'}</td>
                  <td className="p-2.5 text-right font-mono text-emerald-600 font-bold">
                    {s.salary ? s.salary.toLocaleString() : '-'}
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-neutral-400 font-medium">
                    No records found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-neutral-500">
            Showing <strong className="text-neutral-900">{paginated.length}</strong> of{' '}
            <strong className="text-neutral-900">{sorted.length}</strong> records (Page {currentPage} of {totalPages})
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
    </div>
  );
};
