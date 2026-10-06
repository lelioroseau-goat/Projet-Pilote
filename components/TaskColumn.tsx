import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Task, User, Status } from '../types';
import TaskCard from './TaskCard';
import { useI18n } from '../contexts/i18n';
import { FunnelIcon, CalendarDaysIcon, ArchiveBoxIcon } from './icons';
import { isTaskOnOrAfterDate } from '../utils/archiveUtils';

interface TaskColumnProps {
  title: Status;
  tasks: Task[];
  users: User[];
  onSelectTask: (task: Task) => void;
  onDrop: (taskId: string, newStatus: Status) => void;
  onViewArchives?: () => void;
  archivedTasksCount?: number;
}

const TaskColumn: React.FC<TaskColumnProps> = ({ 
  title, 
  tasks, 
  users, 
  onSelectTask, 
  onDrop,
  onViewArchives,
  archivedTasksCount = 0,
}) => {
  const { t, language } = useI18n();
  const [isDragOver, setIsDragOver] = useState(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  // Close filter popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  const statusColorMap: { [key: string]: string } = {
    [Status.TODO]: 'border-t-blue-500',
    [Status.IN_PROGRESS]: 'border-t-yellow-500',
    [Status.ON_HOLD]: 'border-t-slate-500',
    [Status.DONE]: 'border-t-green-500',
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      onDrop(taskId, title);
    }
  };

  // Preset date helpers
  const setPreset = (daysAgo: number) => {
    const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    setFromDate(d.toISOString().split('T')[0]);
    setIsFilterOpen(false);
  };

  const setMonthPreset = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setFromDate(firstDay.toISOString().split('T')[0]);
    setIsFilterOpen(false);
  };

  // Filter tasks on date
  const filteredTasks = useMemo(() => {
    if (!fromDate) return tasks;
    return tasks.filter(task => isTaskOnOrAfterDate(task, fromDate));
  }, [tasks, fromDate]);

  const formatFilterDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div 
      className={`w-full flex flex-col rounded-xl shadow-sm ${statusColorMap[title] || 'border-t-gray-500'} border-t-4 transition-all duration-200 ${isDragOver ? 'bg-blue-100/70 ring-2 ring-blue-400' : 'bg-slate-200/70'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-4 flex-1 flex flex-col">
        {/* Column Header */}
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-slate-700 flex items-center space-x-2 truncate mr-1">
              <span className="truncate">{t(`status.${title}`)}</span>
            </h2>

            <div className="flex items-center space-x-1.5 shrink-0">
              {/* Date Filter Trigger Button */}
              <div className="relative" ref={filterPopoverRef}>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  title={t('column.filterDate')}
                  className={`p-1.5 rounded-lg transition-colors text-xs flex items-center justify-center ${
                    fromDate 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-500 hover:bg-slate-300/80 hover:text-slate-800'
                  }`}
                >
                  <FunnelIcon className="w-3.5 h-3.5" />
                </button>

                {/* Date Filter Dropdown Popover */}
                {isFilterOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-30 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-700">{t('column.filterDate')}</span>
                      {fromDate && (
                        <button
                          type="button"
                          onClick={() => {
                            setFromDate('');
                            setIsFilterOpen(false);
                          }}
                          className="text-[11px] text-rose-600 hover:text-rose-700 font-medium"
                        >
                          {t('column.clearFilter')}
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        {t('column.from')}
                      </label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>

                    {/* Quick presets */}
                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Raccourcis</p>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPreset(0)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-left"
                        >
                          {t('column.today')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreset(7)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-left"
                        >
                          {t('column.last7Days')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreset(30)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-left"
                        >
                          {t('column.last30Days')}
                        </button>
                        <button
                          type="button"
                          onClick={setMonthPreset}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-left"
                        >
                          {t('column.thisMonth')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Task Count Badge */}
              <span className={`text-xs font-semibold rounded-full px-2 py-0.5 shrink-0 ${
                fromDate && filteredTasks.length !== tasks.length
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-300 text-slate-700'
              }`}>
                {fromDate && filteredTasks.length !== tasks.length 
                  ? `${filteredTasks.length}/${tasks.length}` 
                  : tasks.length}
              </span>
            </div>
          </div>

          {/* Active Filter Pill */}
          {fromDate && (
            <div className="mt-2 flex items-center justify-between bg-blue-50/90 border border-blue-200/80 px-2 py-1 rounded-md text-[11px] text-blue-800">
              <span className="flex items-center space-x-1 truncate">
                <CalendarDaysIcon className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="truncate">{t('column.activeFilter', { date: formatFilterDate(fromDate) })}</span>
              </span>
              <button
                type="button"
                onClick={() => setFromDate('')}
                className="ml-1 text-blue-600 hover:text-rose-600 font-bold px-1"
                title={t('column.clearFilter')}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Task Cards Container */}
        <div className="space-y-3 flex-1 min-h-[220px]">
          {filteredTasks.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-center p-3 rounded-lg border border-dashed border-slate-300/80 bg-slate-100/50">
              <p className="text-xs text-slate-500 font-medium">
                {fromDate ? 'Aucune tâche à partir de cette date' : 'Aucune tâche'}
              </p>
              {fromDate && (
                <button
                  type="button"
                  onClick={() => setFromDate('')}
                  className="mt-1.5 text-[11px] text-blue-600 hover:underline font-semibold"
                >
                  {t('column.clearFilter')}
                </button>
              )}
            </div>
          ) : (
            filteredTasks.map(task => {
              const assignee = users.find(user => user.id === task.assigneeId);
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  assignee={assignee}
                  onSelectTask={onSelectTask}
                />
              );
            })
          )}
        </div>

        {/* Archived Tasks Notice for DONE Column */}
        {title === Status.DONE && archivedTasksCount > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-300/60">
            <div className="p-2 bg-amber-50/90 border border-amber-200/90 rounded-lg text-[11px] text-amber-900 flex items-center justify-between gap-1">
              <div className="flex items-center space-x-1.5 truncate">
                <ArchiveBoxIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate font-medium">
                  {t('column.archivedNotice', { count: archivedTasksCount.toString() })}
                </span>
              </div>
              {onViewArchives && (
                <button
                  type="button"
                  onClick={onViewArchives}
                  className="px-2 py-0.5 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-semibold shrink-0 transition-colors"
                >
                  {t('column.viewArchives')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskColumn;
