import React, { useState, useMemo } from 'react';
import { FilterState, StudentRecord } from '../types';
import { Search, Filter, X, Calendar, ChevronDown, Check } from 'lucide-react';

interface GlobalFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  students: StudentRecord[];
  onResetFilters: () => void;
}

export const GlobalFilters: React.FC<GlobalFiltersProps> = React.memo(({
  filters,
  onFilterChange,
  students,
  onResetFilters,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Derive unique filter options from dataset in a single fast pass
  const { centres, trainers, programs, batches, months, batchStatuses } = useMemo(() => {
    const centresSet = new Set<string>();
    const trainersSet = new Set<string>();
    const programsSet = new Set<string>();
    const batchesSet = new Set<string>();
    const monthsSet = new Set<string>();
    const batchStatusesSet = new Set<string>();

    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (s.centre) centresSet.add(s.centre);
      if (s.trainer) trainersSet.add(s.trainer);
      if (s.courseAlias) programsSet.add(s.courseAlias);
      if (s.batchCode) batchesSet.add(s.batchCode);
      if (s.startMonth) monthsSet.add(s.startMonth);
      if (s.batchStatus) batchStatusesSet.add(s.batchStatus);
    }

    return {
      centres: Array.from(centresSet).sort(),
      trainers: Array.from(trainersSet).sort(),
      programs: Array.from(programsSet).sort(),
      batches: Array.from(batchesSet).sort(),
      months: Array.from(monthsSet).sort(),
      batchStatuses: Array.from(batchStatusesSet).sort(),
    };
  }, [students]);

  const activeFilterCount =
    (filters.selectedMonth && filters.selectedMonth !== 'All' ? 1 : 0) +
    filters.selectedCentres.length +
    filters.selectedTrainers.length +
    filters.selectedPrograms.length +
    filters.selectedBatchCodes.length +
    filters.selectedBatchStatuses.length +
    filters.selectedStudentStatuses.length +
    filters.selectedPlacementStatuses.length +
    (filters.dateRange.start || filters.dateRange.end ? 1 : 0);

  const toggleMultiSelect = (key: keyof FilterState, value: string) => {
    const list = (filters[key] as string[]) || [];
    const exists = list.includes(value);
    const updated = exists ? list.filter((v) => v !== value) : [...list, value];
    onFilterChange({ ...filters, [key]: updated });
  };

  const clearKey = (key: keyof FilterState) => {
    if (Array.isArray(filters[key])) {
      onFilterChange({ ...filters, [key]: [] });
    } else if (key === 'selectedMonth') {
      onFilterChange({ ...filters, selectedMonth: 'All' });
    }
  };

  return (
    <div className="bg-white border-b border-neutral-200/80 p-3 sm:p-4 shadow-2xs">
      <div className="max-w-[1700px] mx-auto flex flex-col gap-3">
        {/* Top Row: Search & Active Filter Summary */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student, code, batch, centre, company..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              className="w-full text-xs pl-9 pr-8 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Active Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-neutral-500 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              Global Filters ({activeFilterCount})
            </span>

            {activeFilterCount > 0 && (
              <button
                onClick={onResetFilters}
                className="text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters Grid */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Filter */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-2 transition ${
                filters.selectedMonth && filters.selectedMonth !== 'All'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {filters.selectedMonth && filters.selectedMonth !== 'All'
                  ? `Month: ${filters.selectedMonth}`
                  : 'All Months'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {openDropdown === 'month' && (
              <div className="absolute top-full left-0 mt-1 z-30 w-44 bg-white border border-neutral-200 rounded-xl shadow-lg p-1 space-y-1 text-xs">
                <button
                  onClick={() => {
                    onFilterChange({ ...filters, selectedMonth: 'All' });
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 font-medium"
                >
                  All Months
                </button>
                {months.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      onFilterChange({ ...filters, selectedMonth: m });
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium flex justify-between items-center ${
                      filters.selectedMonth === m ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-neutral-100'
                    }`}
                  >
                    <span>{m}</span>
                    {filters.selectedMonth === m && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Centre Filter */}
          <FilterDropdown
            label="Centre"
            selectedList={filters.selectedCentres}
            options={centres}
            isOpen={openDropdown === 'centre'}
            onToggleOpen={() => setOpenDropdown(openDropdown === 'centre' ? null : 'centre')}
            onToggleOption={(val) => toggleMultiSelect('selectedCentres', val)}
            onClear={() => clearKey('selectedCentres')}
          />

          {/* Trainer Filter */}
          <FilterDropdown
            label="Trainer"
            selectedList={filters.selectedTrainers}
            options={trainers}
            isOpen={openDropdown === 'trainer'}
            onToggleOpen={() => setOpenDropdown(openDropdown === 'trainer' ? null : 'trainer')}
            onToggleOption={(val) => toggleMultiSelect('selectedTrainers', val)}
            onClear={() => clearKey('selectedTrainers')}
          />

          {/* Program / Course Filter */}
          <FilterDropdown
            label="Program"
            selectedList={filters.selectedPrograms}
            options={programs}
            isOpen={openDropdown === 'program'}
            onToggleOpen={() => setOpenDropdown(openDropdown === 'program' ? null : 'program')}
            onToggleOption={(val) => toggleMultiSelect('selectedPrograms', val)}
            onClear={() => clearKey('selectedPrograms')}
          />

          {/* Batch Filter */}
          <FilterDropdown
            label="Batch Code"
            selectedList={filters.selectedBatchCodes}
            options={batches}
            isOpen={openDropdown === 'batch'}
            onToggleOpen={() => setOpenDropdown(openDropdown === 'batch' ? null : 'batch')}
            onToggleOption={(val) => toggleMultiSelect('selectedBatchCodes', val)}
            onClear={() => clearKey('selectedBatchCodes')}
          />

          {/* Batch Status Filter */}
          <FilterDropdown
            label="Batch Status"
            selectedList={filters.selectedBatchStatuses}
            options={batchStatuses}
            isOpen={openDropdown === 'bstatus'}
            onToggleOpen={() => setOpenDropdown(openDropdown === 'bstatus' ? null : 'bstatus')}
            onToggleOption={(val) => toggleMultiSelect('selectedBatchStatuses', val)}
            onClear={() => clearKey('selectedBatchStatuses')}
          />

          {/* Student Status Filter */}
          <FilterDropdown
            label="Student Status"
            selectedList={filters.selectedStudentStatuses}
            options={['Active', 'Completed', 'Dropped Out']}
            isOpen={openDropdown === 'sstatus'}
            onToggleOpen={() => setOpenDropdown(openDropdown === 'sstatus' ? null : 'sstatus')}
            onToggleOption={(val) => toggleMultiSelect('selectedStudentStatuses', val)}
            onClear={() => clearKey('selectedStudentStatuses')}
          />

          {/* Placement Status Filter */}
          <FilterDropdown
            label="Placement"
            selectedList={filters.selectedPlacementStatuses}
            options={['Placed', 'Unplaced']}
            isOpen={openDropdown === 'placement'}
            onToggleOpen={() => setOpenDropdown(openDropdown === 'placement' ? null : 'placement')}
            onToggleOption={(val) => toggleMultiSelect('selectedPlacementStatuses', val)}
            onClear={() => clearKey('selectedPlacementStatuses')}
          />
        </div>
      </div>
    </div>
  );
});

interface FilterDropdownProps {
  label: string;
  selectedList: string[];
  options: string[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onToggleOption: (val: string) => void;
  onClear: () => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  selectedList,
  options,
  isOpen,
  onToggleOpen,
  onToggleOption,
  onClear,
}) => {
  const isFiltered = selectedList.length > 0;

  return (
    <div className="relative">
      <button
        onClick={onToggleOpen}
        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-2 transition ${
          isFiltered
            ? 'bg-blue-50 border-blue-300 text-blue-700'
            : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
        }`}
      >
        <span>
          {isFiltered
            ? `${label}: ${selectedList.length === 1 ? selectedList[0] : `${selectedList.length} Selected`}`
            : label}
        </span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-30 w-52 bg-white border border-neutral-200 rounded-xl shadow-xl p-2 max-h-60 overflow-y-auto space-y-1 text-xs">
          <div className="flex justify-between items-center border-b border-neutral-100 pb-1 mb-1 px-1">
            <span className="font-bold text-neutral-500 uppercase text-[10px]">{label} Filter</span>
            {isFiltered && (
              <button onClick={onClear} className="text-[10px] text-rose-600 hover:underline">
                Clear
              </button>
            )}
          </div>
          {options.length === 0 ? (
            <div className="p-2 text-neutral-400 text-center">No options available</div>
          ) : (
            options.map((opt) => {
              const checked = selectedList.includes(opt);
              return (
                <div
                  key={opt}
                  onClick={() => onToggleOption(opt)}
                  className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition ${
                    checked ? 'bg-blue-50 font-bold text-blue-700' : 'hover:bg-neutral-50 text-neutral-800'
                  }`}
                >
                  <span className="truncate pr-2">{opt}</span>
                  {checked && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
