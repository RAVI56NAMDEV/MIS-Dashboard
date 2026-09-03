import React, { useState } from 'react';
import { ActiveTab } from '../types';
import {
  Menu,
  Gauge,
  Users,
  CalendarCheck,
  UserX,
  Layers,
  Building2,
  Briefcase,
  Clock,
  Table,
  Sparkles,
  AlertOctagon,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  alertCount: number;
}

const TABS: Array<{
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  section?: string;
}> = [
  { id: 'overview', label: 'Executive Overview', icon: Gauge, section: 'Core Dashboard' },
  { id: 'students', label: 'Student Performance', icon: Users },
  { id: 'attendance', label: 'Attendance Analysis', icon: CalendarCheck },
  { id: 'dropout', label: 'Dropout Analysis', icon: UserX },
  { id: 'batches', label: 'Batch Performance', icon: Layers, section: 'Operations & Staff' },
  { id: 'centres', label: 'Centre Performance', icon: Building2 },
  { id: 'placement', label: 'Placement Analysis', icon: Briefcase, section: 'Outcomes & Training' },
  { id: 'ilt', label: 'Training Hours / ILT', icon: Clock },
  { id: 'insights', label: 'Management Insights', icon: Sparkles, section: 'Analytics & Audit' },
  { id: 'alerts', label: 'Action Required', icon: AlertOctagon },
  { id: 'datatable', label: 'Detailed Data Table', icon: Table },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, alertCount }) => {
  // DEFAULT HIDE / COLLAPSED STATE as explicitly requested by user
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside
      className={`bg-white border border-neutral-200/90 rounded-2xl shadow-2xs transition-all duration-300 shrink-0 p-2.5 h-fit ${
        isExpanded ? 'w-full lg:w-64' : 'w-full lg:w-20'
      }`}
    >
      {/* Top Slide Bar Control Header with Hamburger Menu Icon (≡) */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-100">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-2 rounded-xl text-teal-700 bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200/60 transition cursor-pointer select-none group"
          title={isExpanded ? 'Collapse Slide Bar Menu' : 'Expand Slide Bar Menu'}
        >
          <div className="flex items-center gap-2.5">
            {/* Hamburger Icon ≡ */}
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs group-hover:bg-teal-700 transition-colors">
              <Menu className="w-5 h-5" />
            </div>
            {isExpanded && (
              <span className="font-bold text-xs text-teal-950 uppercase tracking-wider">
                Dashboard Menu
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-teal-700 font-bold text-xs">
            {isExpanded ? (
              <ChevronLeft className="w-4 h-4 text-teal-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-teal-600 group-hover:translate-x-0.5 transition-transform" />
            )}
          </div>
        </button>
      </div>

      {/* Navigation Items (Collapsed vertical rail vs Expanded full panel) */}
      <div className="pt-2">
        {/* COLLAPSED RAIL VIEW (Default Mode) */}
        {!isExpanded && (
          <div className="flex lg:flex-col flex-wrap justify-center items-center gap-2 py-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  title={tab.label}
                  className={`relative group p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 scale-105'
                      : 'text-teal-600 hover:bg-teal-50 hover:text-teal-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />

                  {/* Red dot indicator for alerts */}
                  {tab.id === 'alerts' && alertCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                  )}

                  {/* Tooltip on hover */}
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-neutral-900 text-white text-[11px] font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 hidden lg:block">
                    {tab.label}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* EXPANDED FULL SIDEBAR VIEW */}
        {isExpanded && (
          <div className="flex flex-col gap-1 max-h-[75vh] overflow-y-auto no-scrollbar pr-0.5">
            {TABS.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const showSectionHeader =
                tab.section && (idx === 0 || TABS[idx - 1]?.section !== tab.section);

              return (
                <React.Fragment key={tab.id}>
                  {showSectionHeader && (
                    <div className="pt-3 pb-1 px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-teal-800/60 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      <span>{tab.section}</span>
                    </div>
                  )}

                  <button
                    onClick={() => onSelectTab(tab.id)}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                        : 'text-neutral-700 hover:bg-teal-50 hover:text-teal-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-teal-50 text-teal-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="truncate">{tab.label}</span>
                    </div>

                    {tab.id === 'alerts' && alertCount > 0 && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isActive
                            ? 'bg-white text-teal-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {alertCount}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};


