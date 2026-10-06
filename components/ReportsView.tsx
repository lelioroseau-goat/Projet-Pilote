import React, { useState, useMemo, useEffect } from 'react';
import { Task, User, Team, Status, Priority } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { useI18n } from '../contexts/i18n';
import { FlagIcon, ChevronDownIcon, CalendarIcon } from './icons';
import { getWeekDays, getTaskSegments, TaskSegment } from '../utils/dateUtils';
import ReportsCalendarView from './ReportsCalendarView';


type TimeRange = 'lastWeek' | 'thisMonth' | 'thisYear';
type Scope = 'myTasks' | 'team' | 'all';

const ReportsView: React.FC = () => {
  const { tasks, users, teams, currentUser, currentUserPermissions, handleSelectTask } = useAppContext();
  const { t, locale } = useI18n();

  const [timeRange, setTimeRange] = useState<TimeRange>('thisMonth');
  const [scope, setScope] = useState<Scope>('myTasks');
  
  const userTeams = useMemo(() => teams.filter(team => team.userIds.includes(currentUser.id)), [teams, currentUser]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(userTeams[0]?.id || null);

  const canViewTeam = currentUserPermissions.has('dashboard_view_team');
  const canViewAll = currentUserPermissions.has('tasks_view_all');

  // Set default scope based on permissions
  useEffect(() => {
    if (canViewAll) setScope('all');
    else if(canViewTeam) setScope('team');
    else setScope('myTasks');
  }, [canViewAll, canViewTeam]);

  const filteredCompletedTasks = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (timeRange) {
      case 'lastWeek':
        const lastWeekDate = new Date(now);
        lastWeekDate.setDate(now.getDate() - 7);
        const lastWeekDays = getWeekDays(lastWeekDate);
        startDate = new Date(lastWeekDays[0]);
        startDate.setUTCHours(0,0,0,0);
        const lastDayOfLastWeek = new Date(lastWeekDays[6])
        lastDayOfLastWeek.setUTCHours(23,59,59,999);
        endDate.setTime(lastDayOfLastWeek.getTime());
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const completedTasks = tasks.filter(task => 
        task.status === Status.DONE && 
        task.completionDate &&
        new Date(task.completionDate) >= startDate &&
        new Date(task.completionDate) <= endDate
    );

    let scopeFilteredTasks: Task[];

    switch(scope) {
      case 'myTasks':
        scopeFilteredTasks = completedTasks.filter(task => task.assigneeId === currentUser.id);
        break;
      case 'team':
        if (!selectedTeamId) {
            scopeFilteredTasks = [];
        } else {
            const team = teams.find(t => t.id === selectedTeamId);
            const teamMemberIds = team ? team.userIds : [];
            scopeFilteredTasks = completedTasks.filter(task => task.assigneeId && teamMemberIds.includes(task.assigneeId));
        }
        break;
      case 'all':
        scopeFilteredTasks = canViewAll ? completedTasks : [];
        break;
      default:
        scopeFilteredTasks = [];
    }
    
    return scopeFilteredTasks.sort((a,b) => new Date(b.completionDate!).getTime() - new Date(a.completionDate!).getTime());

  }, [timeRange, scope, tasks, currentUser, selectedTeamId, teams, canViewAll]);

  const usersToDisplay = useMemo(() => {
    switch (scope) {
        case 'myTasks':
            return currentUser ? [currentUser] : [];
        case 'team':
            if (!selectedTeamId) return [];
            const team = teams.find(t => t.id === selectedTeamId);
            return team ? users.filter(u => team.userIds.includes(u.id)) : [];
        case 'all':
            return users;
        default:
            return [];
    }
  }, [scope, currentUser, selectedTeamId, teams, users]);

  const fallbackWorkHours = { start: '09:00', lunchStart: '12:00', lunchEnd: '13:00', end: '17:00' };

  const allSegmentsForDisplayedUsers = useMemo(() => {
    let segments: (TaskSegment & { originalTask: Task })[] = [];
    const usersForGantt = [...usersToDisplay]; 

    for (const user of usersForGantt) {
        let scheduledSegmentsForUser: (TaskSegment & { taskId: string })[] = [];
        const userTasks = tasks
            .filter(t => t.assigneeId === user.id)
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        
        for (const task of userTasks) {
            const userWorkHours = user.workHours || fallbackWorkHours;
            const newSegmentsOmitted = getTaskSegments(task, scheduledSegmentsForUser, userWorkHours);
            const newSegmentsWithTask = newSegmentsOmitted.map(segment => ({ ...segment, originalTask: task }));
            
            segments.push(...newSegmentsWithTask);
            
            const segmentsWithTaskId = newSegmentsWithTask.map(s => ({ ...s, taskId: task.id }));
            scheduledSegmentsForUser.push(...segmentsWithTaskId);
        }
    }
    return segments;
  }, [tasks, usersToDisplay]);

  const completedTaskSegments = useMemo(() => {
    const completedTaskIds = new Set(filteredCompletedTasks.map(t => t.id));
    return allSegmentsForDisplayedUsers.filter(seg => completedTaskIds.has(seg.originalTask.id));
  }, [allSegmentsForDisplayedUsers, filteredCompletedTasks]);


  const initialCalendarDate = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case 'lastWeek':
        const lastWeekDate = new Date();
        lastWeekDate.setDate(now.getDate() - 7);
        return lastWeekDate;
      case 'thisMonth':
      case 'thisYear':
      default:
        return now;
    }
  }, [timeRange]);

  const priorityClasses = {
    [Priority.HIGH]: 'bg-red-100 text-red-700',
    [Priority.MEDIUM]: 'bg-yellow-100 text-yellow-700',
    [Priority.LOW]: 'bg-blue-100 text-blue-700',
  };
  
  const renderFilterButton = (filterValue: any, currentFilter: any, setFilter: (val: any) => void, label: string) => (
      <button
        onClick={() => setFilter(filterValue)}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${currentFilter === filterValue ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
      >
          {label}
      </button>
  );

  return (
    <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-800">{t('reports.title')}</h3>
        
        {/* FILTERS */}
        <div className="flex flex-col md:flex-row gap-6 p-4 bg-white rounded-xl shadow-sm">
            {/* Scope Filter */}
            <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('reports.scopeFilter')}</label>
                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                    {renderFilterButton('myTasks', scope, setScope, t('reports.scope.myTasks'))}
                    {canViewTeam && renderFilterButton('team', scope, setScope, t('reports.scope.team'))}
                    {canViewAll && renderFilterButton('all', scope, setScope, t('reports.scope.all'))}
                </div>
                {scope === 'team' && canViewTeam && (
                     <div className="relative mt-2 max-w-xs">
                         <label htmlFor="team-select-report" className="sr-only">{t('reports.selectTeam')}</label>
                         <select
                             id="team-select-report"
                             value={selectedTeamId || ''}
                             onChange={(e) => setSelectedTeamId(e.target.value || null)}
                             className="appearance-none block w-full pl-3 pr-10 py-2 text-base bg-white border border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                         >
                            {userTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                         </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                             <ChevronDownIcon className="h-5 w-5" />
                         </div>
                     </div>
                )}
            </div>

            {/* Time Range Filter */}
            <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('reports.timeFilter')}</label>
                 <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                    {renderFilterButton('lastWeek', timeRange, setTimeRange, t('reports.time.lastWeek'))}
                    {renderFilterButton('thisMonth', timeRange, setTimeRange, t('reports.time.thisMonth'))}
                    {renderFilterButton('thisYear', timeRange, setTimeRange, t('reports.time.thisYear'))}
                 </div>
            </div>
        </div>
        
        {/* RESULTS */}
        <div className="bg-white rounded-xl shadow-sm">
            <ul className="divide-y divide-slate-200">
                {filteredCompletedTasks.length > 0 ? (
                    filteredCompletedTasks.map(task => {
                        const assignee = users.find(u => u.id === task.assigneeId);
                        return (
                            <li key={task.id} onClick={() => handleSelectTask(task)} className="p-4 hover:bg-slate-50 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-slate-800">{task.title}</p>
                                        {task.projectCode && (
                                            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                {task.projectCode}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                        <CalendarIcon className="w-4 h-4"/>
                                        {t('reports.completedOn')} {new Date(task.completionDate!).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    {assignee && (
                                        <div className="flex items-center gap-2 text-sm" title={`${t('reports.assignee')}: ${assignee.firstName} ${assignee.lastName}`}>
                                            <img src={assignee.avatar} alt={assignee.firstName} className="w-8 h-8 rounded-full" />
                                            <span className="hidden lg:inline">{assignee.firstName} {assignee.lastName}</span>
                                        </div>
                                    )}
                                    <span className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${priorityClasses[task.priority]}`}>
                                        <FlagIcon className="w-3 h-3" />
                                        <span>{t(`priority.${task.priority}`)}</span>
                                    </span>
                                </div>
                            </li>
                        )
                    })
                ) : (
                    <li className="p-8 text-center text-slate-500 italic">
                        {t('reports.noTasksFound')}
                    </li>
                )}
            </ul>
        </div>
        
        <ReportsCalendarView 
            segments={completedTaskSegments}
            usersToDisplay={usersToDisplay}
            allUsers={users}
            initialDate={initialCalendarDate} 
            onSelectTask={handleSelectTask} 
        />
    </div>
  )
}

export default ReportsView;