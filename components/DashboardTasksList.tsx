import React, { useState, useMemo } from 'react';
import { Task, User, Priority, Status } from '../types';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  XIcon,
  FlagIcon,
  CalendarIcon,
  TagIcon,
  CheckCircleIcon,
  ClockIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ExclamationTriangleIcon,
  ListBulletIcon,
} from './icons';
import { useI18n } from '../contexts/i18n';
import { useAppContext } from '../contexts/AppContext';

interface DashboardTasksListProps {
  tasks: Task[];
  availableUsers?: User[];
  title?: string;
}

type SortField = 'dueDateAsc' | 'dueDateDesc' | 'priorityDesc' | 'priorityAsc' | 'titleAsc' | 'titleDesc' | 'status';
type DateFilter = 'all' | 'overdue' | 'today' | 'this_week' | 'upcoming';
type ViewMode = 'table' | 'cards';

const priorityOrder: Record<Priority, number> = {
  [Priority.HIGH]: 3,
  [Priority.MEDIUM]: 2,
  [Priority.LOW]: 1,
};

const statusOrder: Record<Status, number> = {
  [Status.IN_PROGRESS]: 1,
  [Status.TODO]: 2,
  [Status.ON_HOLD]: 3,
  [Status.DONE]: 4,
};

const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

export const DashboardTasksList: React.FC<DashboardTasksListProps> = ({
  tasks,
  availableUsers,
  title,
}) => {
  const { t, locale } = useI18n();
  const { categories, users, handleSelectTask } = useAppContext();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('all');
  const [sortBy, setSortBy] = useState<SortField>('dueDateAsc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const usersList = availableUsers || users;

  // Status styling helpers
  const getStatusBadge = (status: Status) => {
    switch (status) {
      case Status.DONE:
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          label: t('status.DONE'),
        };
      case Status.IN_PROGRESS:
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          label: t('status.IN_PROGRESS'),
        };
      case Status.ON_HOLD:
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          label: t('status.ON_HOLD'),
        };
      case Status.TODO:
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          label: t('status.TODO'),
        };
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case Priority.HIGH:
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          flag: 'text-red-600',
          label: t('priority.HIGH'),
        };
      case Priority.MEDIUM:
        return {
          bg: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          flag: 'text-yellow-600',
          label: t('priority.MEDIUM'),
        };
      case Priority.LOW:
      default:
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          flag: 'text-blue-600',
          label: t('priority.LOW'),
        };
    }
  };

  // Status counts for quick filters
  const statusCounts = useMemo(() => {
    const counts = {
      all: tasks.length,
      [Status.TODO]: 0,
      [Status.IN_PROGRESS]: 0,
      [Status.ON_HOLD]: 0,
      [Status.DONE]: 0,
    };
    tasks.forEach((t) => {
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      }
    });
    return counts;
  }, [tasks]);

  // Helper to get effective due date for a task (dueDate, deadline, or startDate)
  const getTaskDueDate = (task: Task): string => {
    return task.dueDate || task.deadline || task.startDate;
  };

  // Is a task overdue?
  const isTaskOverdue = (task: Task): boolean => {
    if (task.status === Status.DONE) return false;
    const due = new Date(getTaskDueDate(task));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Filter & Sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    let result = tasks.filter((task) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = normalizeText(searchQuery);
        const titleMatch = normalizeText(task.title).includes(q);
        const descMatch = normalizeText(task.description || '').includes(q);
        const catName = categories.find((c) => c.id === task.categoryId)?.name || '';
        const catMatch = normalizeText(catName).includes(q);
        const assignee = users.find((u) => u.id === task.assigneeId);
        const assigneeMatch = assignee
          ? normalizeText(`${assignee.firstName} ${assignee.lastName}`).includes(q)
          : false;

        if (!titleMatch && !descMatch && !catMatch && !assigneeMatch) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== 'all' && task.status !== selectedStatus) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && task.categoryId !== selectedCategory) {
        return false;
      }

      // Assignee filter
      if (selectedAssignee !== 'all') {
        if (selectedAssignee === 'unassigned' && task.assigneeId) return false;
        if (selectedAssignee !== 'unassigned' && task.assigneeId !== selectedAssignee) return false;
      }

      // Date filter
      if (selectedDateFilter !== 'all') {
        const dueDate = new Date(getTaskDueDate(task));
        dueDate.setHours(0, 0, 0, 0);

        if (selectedDateFilter === 'overdue') {
          if (task.status === Status.DONE || dueDate >= today) return false;
        } else if (selectedDateFilter === 'today') {
          if (dueDate.getTime() !== today.getTime()) return false;
        } else if (selectedDateFilter === 'this_week') {
          if (dueDate < today || dueDate > endOfWeek) return false;
        } else if (selectedDateFilter === 'upcoming') {
          if (dueDate <= endOfWeek) return false;
        }
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'dueDateAsc':
          return new Date(getTaskDueDate(a)).getTime() - new Date(getTaskDueDate(b)).getTime();
        case 'dueDateDesc':
          return new Date(getTaskDueDate(b)).getTime() - new Date(getTaskDueDate(a)).getTime();
        case 'priorityDesc':
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'priorityAsc':
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'titleAsc':
          return a.title.localeCompare(b.title, locale);
        case 'titleDesc':
          return b.title.localeCompare(a.title, locale);
        case 'status':
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

    return result;
  }, [
    tasks,
    searchQuery,
    selectedStatus,
    selectedPriority,
    selectedCategory,
    selectedAssignee,
    selectedDateFilter,
    sortBy,
    categories,
    users,
    locale,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedStatus !== 'all' ||
    selectedPriority !== 'all' ||
    selectedCategory !== 'all' ||
    selectedAssignee !== 'all' ||
    selectedDateFilter !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setSelectedCategory('all');
    setSelectedAssignee('all');
    setSelectedDateFilter('all');
    setSortBy('dueDateAsc');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header with Title & View Toggles */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ListBulletIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {title || t('dashboard.tasksList.title')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('dashboard.tasksList.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Search bar & View switch */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <MagnifyingGlassIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('dashboard.tasksList.searchPlaceholder')}
              className="block w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                title={t('dashboard.tasksList.resetFilters')}
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={t('dashboard.tasksList.viewTable')}
            >
              <TableCellsIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={t('dashboard.tasksList.viewCards')}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Status Bar */}
      <div className="px-5 pt-3 pb-2 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center space-x-1.5 ${
              selectedStatus === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>{t('dashboard.tasksList.allStatuses')}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedStatus === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {statusCounts.all}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatus(Status.IN_PROGRESS)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center space-x-1.5 ${
              selectedStatus === Status.IN_PROGRESS
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>{t('status.IN_PROGRESS')}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedStatus === Status.IN_PROGRESS
                  ? 'bg-blue-700 text-white'
                  : 'bg-blue-50 text-blue-700'
              }`}
            >
              {statusCounts[Status.IN_PROGRESS]}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatus(Status.TODO)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center space-x-1.5 ${
              selectedStatus === Status.TODO
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>{t('status.TODO')}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedStatus === Status.TODO ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {statusCounts[Status.TODO]}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatus(Status.ON_HOLD)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center space-x-1.5 ${
              selectedStatus === Status.ON_HOLD
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>{t('status.ON_HOLD')}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedStatus === Status.ON_HOLD
                  ? 'bg-amber-700 text-white'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {statusCounts[Status.ON_HOLD]}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatus(Status.DONE)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center space-x-1.5 ${
              selectedStatus === Status.DONE
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{t('status.DONE')}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedStatus === Status.DONE
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {statusCounts[Status.DONE]}
            </span>
          </button>
        </div>

        {/* Count info */}
        <div className="text-xs text-slate-500 font-medium">
          {t('dashboard.tasksList.count', { count: filteredAndSortedTasks.length })}
          {hasActiveFilters && (
            <span className="text-slate-400 ml-1 font-normal">
              ({tasks.length} total)
            </span>
          )}
        </div>
      </div>

      {/* Advanced Filter & Sorting Row */}
      <div className="p-4 bg-white border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Priority Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {t('dashboard.tasksList.filterPriority')}
          </label>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="block w-full py-1.5 pl-2.5 pr-8 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('dashboard.tasksList.allPriorities')}</option>
            <option value={Priority.HIGH}>🔴 {t('priority.HIGH')}</option>
            <option value={Priority.MEDIUM}>🟡 {t('priority.MEDIUM')}</option>
            <option value={Priority.LOW}>🔵 {t('priority.LOW')}</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {t('dashboard.tasksList.filterCategory')}
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full py-1.5 pl-2.5 pr-8 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
          >
            <option value="all">{t('dashboard.tasksList.allCategories')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {t('dashboard.tasksList.filterDueDate')}
          </label>
          <select
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value as DateFilter)}
            className="block w-full py-1.5 pl-2.5 pr-8 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('dashboard.tasksList.allDates')}</option>
            <option value="overdue">⚠️ {t('dashboard.tasksList.overdue')}</option>
            <option value="today">📅 {t('dashboard.tasksList.dueToday')}</option>
            <option value="this_week">🗓️ {t('dashboard.tasksList.dueThisWeek')}</option>
            <option value="upcoming">⏳ {t('dashboard.tasksList.upcoming')}</option>
          </select>
        </div>

        {/* Assignee Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            {t('dashboard.tasksList.filterAssignee')}
          </label>
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="block w-full py-1.5 pl-2.5 pr-8 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
          >
            <option value="all">{t('dashboard.tasksList.allAssignees')}</option>
            <option value="unassigned">{t('planning.unassigned')}</option>
            {usersList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center">
            <ArrowsUpDownIcon className="w-3 h-3 mr-1 text-slate-400" />
            {t('dashboard.tasksList.sortBy')}
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            className="block w-full py-1.5 pl-2.5 pr-8 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="dueDateAsc">{t('dashboard.tasksList.sort.dueDateAsc')}</option>
            <option value="dueDateDesc">{t('dashboard.tasksList.sort.dueDateDesc')}</option>
            <option value="priorityDesc">{t('dashboard.tasksList.sort.priorityDesc')}</option>
            <option value="priorityAsc">{t('dashboard.tasksList.sort.priorityAsc')}</option>
            <option value="status">{t('dashboard.tasksList.sort.status')}</option>
            <option value="titleAsc">{t('dashboard.tasksList.sort.titleAsc')}</option>
            <option value="titleDesc">{t('dashboard.tasksList.sort.titleDesc')}</option>
          </select>
        </div>

        {/* Reset Action */}
        <div className="flex items-end">
          <button
            type="button"
            disabled={!hasActiveFilters}
            onClick={handleResetFilters}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition-colors ${
              hasActiveFilters
                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer'
                : 'bg-slate-50 text-slate-400 border border-slate-200 opacity-60 cursor-not-allowed'
            }`}
          >
            <XIcon className="w-3.5 h-3.5" />
            <span>{t('dashboard.tasksList.resetFilters')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Table View or Cards View */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="py-14 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FunnelIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">
            {t('dashboard.tasksList.noTasks')}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
            >
              {t('dashboard.tasksList.resetFilters')}
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">{t('dashboard.tasksList.colTask')}</th>
                <th className="py-3 px-4">{t('dashboard.tasksList.colStatus')}</th>
                <th className="py-3 px-4">{t('dashboard.tasksList.colPriority')}</th>
                <th className="py-3 px-4">{t('dashboard.tasksList.colCategory')}</th>
                <th className="py-3 px-4">{t('dashboard.tasksList.colAssignee')}</th>
                <th className="py-3 px-4">{t('dashboard.tasksList.colDueDate')}</th>
                <th className="py-3 px-4 text-center">{t('dashboard.tasksList.colSubtasks')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredAndSortedTasks.map((task) => {
                const statusBadge = getStatusBadge(task.status);
                const priorityBadge = getPriorityBadge(task.priority);
                const category = categories.find((c) => c.id === task.categoryId);
                const assignee = users.find((u) => u.id === task.assigneeId);
                const overdue = isTaskOverdue(task);
                const totalSubtasks = task.subtasks?.length || 0;
                const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;

                return (
                  <tr
                    key={task.id}
                    onClick={() => handleSelectTask(task)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                  >
                    {/* Title & Description */}
                    <td className="py-3.5 px-4 min-w-[220px]">
                      <div className="flex items-start space-x-2">
                        <div className="pt-0.5">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${statusBadge.dot}`}
                          ></span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.bg}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${priorityBadge.bg}`}
                      >
                        <FlagIcon className={`w-3 h-3 mr-1 ${priorityBadge.flag}`} />
                        {priorityBadge.label}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {category ? (
                        <span className="inline-flex items-center text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <TagIcon className="w-3 h-3 mr-1 text-slate-400" />
                          {category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">N/A</span>
                      )}
                    </td>

                    {/* Assignee */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {assignee ? (
                        <div className="flex items-center space-x-2">
                          <img
                            src={assignee.avatar}
                            alt={`${assignee.firstName} ${assignee.lastName}`}
                            className="w-6 h-6 rounded-full border border-slate-200 object-cover"
                          />
                          <span className="text-xs font-medium text-slate-700">
                            {assignee.firstName} {assignee.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {t('planning.unassigned')}
                        </span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {task.status === Status.DONE && task.completionDate ? (
                        <div className="flex items-center space-x-1.5" title={`${t('modal.closureDate')}: ${new Date(task.completionDate).toLocaleString(locale)}`}>
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-xs font-semibold text-emerald-700">
                            {formatDate(task.completionDate)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          {overdue ? (
                            <ExclamationTriangleIcon className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          ) : (
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span
                            className={`text-xs font-medium ${
                              overdue ? 'text-rose-600 font-semibold' : 'text-slate-600'
                            }`}
                          >
                            {formatDate(getTaskDueDate(task))}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Subtasks */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {totalSubtasks > 0 ? (
                        <div className="inline-flex items-center space-x-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                          <CheckCircleIcon
                            className={`w-3 h-3 ${
                              completedSubtasks === totalSubtasks
                                ? 'text-emerald-500'
                                : 'text-slate-400'
                            }`}
                          />
                          <span>
                            {completedSubtasks}/{totalSubtasks}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Cards View */
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedTasks.map((task) => {
            const statusBadge = getStatusBadge(task.status);
            const priorityBadge = getPriorityBadge(task.priority);
            const category = categories.find((c) => c.id === task.categoryId);
            const assignee = users.find((u) => u.id === task.assigneeId);
            const overdue = isTaskOverdue(task);
            const totalSubtasks = task.subtasks?.length || 0;
            const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;

            return (
              <div
                key={task.id}
                onClick={() => handleSelectTask(task)}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusBadge.bg}`}
                    >
                      {statusBadge.label}
                    </span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border ${priorityBadge.bg}`}
                    >
                      <FlagIcon className={`w-2.5 h-2.5 mr-1 ${priorityBadge.flag}`} />
                      {priorityBadge.label}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {task.title}
                  </h4>

                  {task.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  {/* Category / Subtasks */}
                  <div className="flex items-center space-x-2">
                    {category && (
                      <span className="inline-flex items-center bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px]">
                        <TagIcon className="w-2.5 h-2.5 mr-1 text-slate-400" />
                        {category.name}
                      </span>
                    )}
                    {totalSubtasks > 0 && (
                      <span className="text-[11px] text-slate-500">
                        {completedSubtasks}/{totalSubtasks}
                      </span>
                    )}
                  </div>

                  {/* Assignee & Due Date */}
                  <div className="flex items-center space-x-2">
                    {task.status === Status.DONE && task.completionDate ? (
                      <div
                        className="flex items-center space-x-1 text-emerald-700 font-medium"
                        title={`${t('modal.closureDate')}: ${new Date(task.completionDate).toLocaleString(locale)}`}
                      >
                        <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                        <span className="text-[11px]">{formatDate(task.completionDate)}</span>
                      </div>
                    ) : (
                      <div
                        className={`flex items-center space-x-1 ${
                          overdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
                        }`}
                      >
                        {overdue ? (
                          <ExclamationTriangleIcon className="w-3 h-3 text-rose-500" />
                        ) : (
                          <CalendarIcon className="w-3 h-3 text-slate-400" />
                        )}
                        <span className="text-[11px]">{formatDate(getTaskDueDate(task))}</span>
                      </div>
                    )}
                    {assignee && (
                      <img
                        src={assignee.avatar}
                        alt={`${assignee.firstName} ${assignee.lastName}`}
                        title={`${assignee.firstName} ${assignee.lastName}`}
                        className="w-5 h-5 rounded-full border border-slate-200 object-cover"
                      />
                    )}
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

export default DashboardTasksList;
