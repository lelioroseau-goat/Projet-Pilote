import React, { useState, useMemo } from 'react';
import { Task, Status } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { useI18n } from '../contexts/i18n';
import { isTaskArchived, getDaysSinceCompletion } from '../utils/archiveUtils';
import { 
  ArchiveBoxIcon, 
  ArrowPathIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  CalendarDaysIcon, 
  ClockIcon, 
  TagIcon, 
  CheckCircleIcon, 
  DocumentTextIcon, 
  PaperClipIcon, 
  KanbanIcon 
} from './icons';

interface ArchivesViewProps {
  onBackToBoard: () => void;
}

const ArchivesView: React.FC<ArchivesViewProps> = ({ onBackToBoard }) => {
  const { visibleTasks, users, categories, handleSelectTask, handleUpdateTask } = useAppContext();
  const { t, language } = useI18n();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // All archived tasks
  const allArchivedTasks = useMemo(() => {
    return visibleTasks.filter(task => isTaskArchived(task));
  }, [visibleTasks]);

  // Filtered and sorted tasks
  const filteredArchivedTasks = useMemo(() => {
    return allArchivedTasks
      .filter(task => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const categoryName = categories.find(c => c.id === task.categoryId)?.name.toLowerCase() || '';
          const assigneeName = users.find(u => u.id === task.assigneeId)?.firstName.toLowerCase() || '';
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = task.description.toLowerCase().includes(q);
          const matchProject = task.projectCode ? task.projectCode.toLowerCase().includes(q) : false;
          if (!matchTitle && !matchDesc && !matchProject && !categoryName.includes(q) && !assigneeName.includes(q)) {
            return false;
          }
        }

        // Assignee filter
        if (selectedAssignee !== 'all') {
          if (selectedAssignee === 'unassigned') {
            if (task.assigneeId) return false;
          } else if (task.assigneeId !== selectedAssignee) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'all') {
          if (task.categoryId !== selectedCategory) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.completionDate || a.dueDate || a.startDate).getTime();
        const dateB = new Date(b.completionDate || b.dueDate || b.startDate).getTime();
        return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
      });
  }, [allArchivedTasks, searchQuery, selectedAssignee, selectedCategory, sortOrder, categories, users]);

  // Statistics
  const totalArchivedHours = useMemo(() => {
    return allArchivedTasks.reduce((sum, task) => sum + (task.durationHours || 0), 0);
  }, [allArchivedTasks]);

  const archivedThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return allArchivedTasks.filter(task => {
      const refDateStr = task.completionDate || task.dueDate || task.startDate;
      if (!refDateStr) return false;
      const d = new Date(refDateStr);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }, [allArchivedTasks]);

  const handleRestoreTask = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    handleUpdateTask({
      ...task,
      isArchived: false,
    });
    setToastMessage(t('archives.restoredNotice'));
    setTimeout(() => setToastMessage(null), 3500);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString(language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg animate-bounce duration-300">
          <CheckCircleIcon className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-xl shadow-xs shrink-0">
            <ArchiveBoxIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                {t('archives.title')}
              </h1>
              <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
                {allArchivedTasks.length}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              {t('archives.subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={onBackToBoard}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-xs transition-colors self-start md:self-auto"
        >
          <KanbanIcon className="w-4 h-4 text-blue-600" />
          <span>{t('archives.backToBoard')}</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('archives.totalArchived')}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{allArchivedTasks.length}</p>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
            <ArchiveBoxIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('archives.totalHours')}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{totalArchivedHours} h</p>
          </div>
          <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
            <ClockIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('archives.thisMonth')}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{archivedThisMonth}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
            <CalendarDaysIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('archives.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-1 sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto py-2 px-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('archives.allCategories')}</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Assignee Filter */}
        <div className="flex items-center space-x-1 sm:w-auto">
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="w-full sm:w-auto py-2 px-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('archives.allAssignees')}</option>
            <option value="unassigned">{t('form.select.unassigned')}</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div className="flex items-center space-x-1 sm:w-auto">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'recent' | 'oldest')}
            className="w-full sm:w-auto py-2 px-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">{t('archives.sortRecent')}</option>
            <option value="oldest">{t('archives.sortOldest')}</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {filteredArchivedTasks.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
          <div className="mx-auto w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
            <ArchiveBoxIcon className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {allArchivedTasks.length === 0 ? t('archives.noTasks') : t('archives.noResults')}
          </h3>
          <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            {allArchivedTasks.length === 0 
              ? t('archives.noTasksSubtitle') 
              : 'Essayez d\'ajuster ou de réinitialiser vos termes de recherche.'}
          </p>
          {(searchQuery || selectedAssignee !== 'all' || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedAssignee('all');
                setSelectedCategory('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
            >
              {t('column.clearFilter')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArchivedTasks.map(task => {
            const assignee = users.find(u => u.id === task.assigneeId);
            const category = categories.find(c => c.id === task.categoryId);
            const daysAgo = getDaysSinceCompletion(task);
            const completedSubtasks = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
            const totalSubtasks = task.subtasks ? task.subtasks.length : 0;

            const priorityBadgeClasses = {
              LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
              HIGH: 'bg-rose-50 text-rose-700 border-rose-200',
            }[task.priority] || 'bg-slate-100 text-slate-700 border-slate-200';

            return (
              <div
                key={task.id}
                onClick={() => handleSelectTask(task)}
                className="bg-white/90 backdrop-blur-xs rounded-xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Category, Priority & Project Code */}
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {category && (
                        <span 
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-md border"
                          style={{
                            backgroundColor: `${category.color || '#3b82f6'}15`,
                            color: category.color || '#1d4ed8',
                            borderColor: `${category.color || '#3b82f6'}30`
                          }}
                        >
                          {category.name}
                        </span>
                      )}
                      {task.projectCode && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {task.projectCode}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityBadgeClasses}`}>
                      {t(`priority.${task.priority}`)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-slate-800 text-sm sm:text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {task.title}
                  </h3>

                  {/* Description preview */}
                  {task.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Footer details */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                  {/* Closure date & days elapsed */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="inline-flex items-center space-x-1">
                      <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t('archives.closedOn')} {formatDate(task.completionDate || task.dueDate || task.startDate)}</span>
                    </span>
                    <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md text-[11px]">
                      {t('archives.daysAgo', { days: daysAgo.toString() })}
                    </span>
                  </div>

                  {/* Subtasks, Files & Notes Badges */}
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    {totalSubtasks > 0 && (
                      <span className="inline-flex items-center space-x-1 text-slate-600">
                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{completedSubtasks}/{totalSubtasks}</span>
                      </span>
                    )}
                    {task.files && task.files.length > 0 && (
                      <span className="inline-flex items-center space-x-1 text-slate-600">
                        <PaperClipIcon className="w-3.5 h-3.5 text-blue-500" />
                        <span>{task.files.length}</span>
                      </span>
                    )}
                    {task.notes && task.notes.length > 0 && (
                      <span className="inline-flex items-center space-x-1 text-slate-600">
                        <DocumentTextIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>{task.notes.length}</span>
                      </span>
                    )}
                  </div>

                  {/* Assignee & Restore Action */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2">
                      {assignee ? (
                        <>
                          <img
                            src={assignee.avatar}
                            alt={`${assignee.firstName} ${assignee.lastName}`}
                            className="w-6 h-6 rounded-full object-cover border border-slate-200"
                          />
                          <span className="text-xs font-medium text-slate-700">
                            {assignee.firstName} {assignee.lastName}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs italic text-slate-400">
                          {t('form.select.unassigned')}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleRestoreTask(e, task)}
                      title={t('archives.restore')}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors border border-blue-200"
                    >
                      <ArrowPathIcon className="w-3.5 h-3.5" />
                      <span>{t('archives.restore')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ArchivesView;
