import React, { useState, useMemo } from 'react';
import { Task, User, Priority } from '../types';
import { getWeekDays, isWeekend, isPublicHoliday, isSameDay, calculateTaskPosition, calculateEndTime, getWorkDayTotalHours, getTaskSegments, TaskSegment, getMonthDays, countWorkDays } from '../utils/dateUtils';
import { ChevronLeftIcon, ChevronRightIcon, UserCircleIcon, ChevronDownIcon } from './icons';
import { useAppContext } from '../contexts/AppContext';
import { useI18n } from '../contexts/i18n';

type PlanningViewType = 'week' | 'month' | 'year';

const PlanningView: React.FC = () => {
  const { 
    visibleTasks: tasks, 
    users, 
    handleSelectTask: onSelectTask, 
    currentUser, 
    teams, 
    currentUserPermissions: permissions
  } = useAppContext();
  const { t, locale } = useI18n();
    
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<PlanningViewType>('week');
  const [selectedTeamId, setSelectedTeamId] = useState<string | 'all'>('all');

  const canFilterByTeam = useMemo(() =>
    permissions.has('dashboard_view_team') || permissions.has('admin_access'),
    [permissions]
  );

  const filterableTeams = useMemo(() => {
    if (!currentUser) return [];
    if (permissions.has('admin_access')) {
        return teams;
    }
    if (permissions.has('dashboard_view_team')) {
        return teams.filter(team => team.userIds.includes(currentUser.id));
    }
    return [];
  }, [teams, currentUser, permissions]);
  
  const handleNav = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setUTCHours(12,0,0,0); // Avoid timezone issues
      switch (viewType) {
        case 'week':
          newDate.setUTCDate(newDate.getUTCDate() + offset * 7);
          break;
        case 'month':
          newDate.setUTCMonth(newDate.getUTCMonth() + offset);
          break;
        case 'year':
          newDate.setUTCFullYear(newDate.getUTCFullYear() + offset);
          break;
      }
      return newDate;
    });
  };

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const yearMonths = useMemo(() => Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(currentDate.getUTCFullYear(), i, 1))), [currentDate]);

  const fallbackWorkHours = { start: '09:00', lunchStart: '12:00', lunchEnd: '13:00', end: '17:00' };

  // Calculate task segments for accurate scheduling, splitting tasks across days and respecting work hours.
  const tasksWithSegments = useMemo(() => {
    const allScheduledTasks: (Task & { segments: TaskSegment[] })[] = [];
    const allUsers = [...users, {id: 'unassigned', workHours: fallbackWorkHours} as User];

    for (const user of allUsers) {
        let scheduledSegmentsForUser: (TaskSegment & { taskId: string })[] = [];
        const userTasks = tasks
            .filter(t => (user.id === 'unassigned' ? !t.assigneeId : t.assigneeId === user.id))
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        
        for (const task of userTasks) {
            const newSegmentsOmitted = getTaskSegments(task, scheduledSegmentsForUser, user.workHours || fallbackWorkHours);
            const newSegmentsWithTask = newSegmentsOmitted.map(segment => ({ ...segment, originalTask: task }));
            
            allScheduledTasks.push({ ...task, segments: newSegmentsWithTask });
            
            // Add the newly calculated segments to the list of blockers for the next task of the same user
            const segmentsWithTaskId = newSegmentsWithTask.map(s => ({ ...s, taskId: task.id }));
            scheduledSegmentsForUser.push(...segmentsWithTaskId);
        }
    }
    return allScheduledTasks;
  }, [tasks, users]);

  const title = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { timeZone: 'UTC' };
    switch (viewType) {
      case 'week':
        return t('planning.weekOf', {
          startDate: weekDays[0].toLocaleDateString(locale, { ...options, day: 'numeric', month: 'long' }),
          endDate: weekDays[6].toLocaleDateString(locale, { ...options, day: 'numeric', month: 'long', year: 'numeric' })
        });
      case 'month':
        return currentDate.toLocaleDateString(locale, { ...options, month: 'long', year: 'numeric' });
      case 'year':
        return currentDate.toLocaleDateString(locale, { ...options, year: 'numeric' });
      default:
        return '';
    }
  }, [currentDate, viewType, locale, t, weekDays]);

  const priorityClasses = {
    [Priority.HIGH]: { bg: 'bg-red-200/80', border: 'border-red-500', text: 'text-red-900', load: 'bg-red-400' },
    [Priority.MEDIUM]: { bg: 'bg-yellow-200/80', border: 'border-yellow-500', text: 'text-yellow-900', load: 'bg-yellow-400' },
    [Priority.LOW]: { bg: 'bg-blue-200/80', border: 'border-blue-500', text: 'text-blue-900', load: 'bg-blue-400' },
  };

  const renderViewButton = (type: PlanningViewType, labelKey: string) => {
    const isActive = viewType === type;
    return (
      <button
        onClick={() => setViewType(type)}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
      >
        {t(labelKey)}
      </button>
    );
  };
  
  const displayedUsers = useMemo(() => {
    if (selectedTeamId === 'all') {
        return users;
    }
    const team = teams.find(t => t.id === selectedTeamId);
    return team ? users.filter(u => team.userIds.includes(u.id)) : users;
  }, [users, teams, selectedTeamId]);

  const allDisplayUsers = [...displayedUsers, null];

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{t('planning.title')}</h2>
        <div className="flex items-center space-x-2 sm:space-x-4">
          {canFilterByTeam && filterableTeams.length > 0 && (
            <div className="relative">
              <label htmlFor="team-filter" className="sr-only">{t('planning.filter.selectTeam')}</label>
              <select
                  id="team-filter"
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="appearance-none block w-full pl-3 pr-10 py-1.5 text-sm font-medium bg-white border border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
              >
                  <option value="all">{t('planning.filter.allUsers')}</option>
                  {filterableTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <ChevronDownIcon className="h-5 w-5" />
              </div>
            </div>
          )}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
            {renderViewButton('week', 'planning.view.week')}
            {renderViewButton('month', 'planning.view.month')}
            {renderViewButton('year', 'planning.view.year')}
          </div>
          <div className="flex items-center space-x-1">
            <button onClick={() => handleNav(-1)} className="p-2 rounded-md hover:bg-slate-200 transition-colors"><ChevronLeftIcon className="w-5 h-5" /></button>
            <button onClick={() => handleNav(1)} className="p-2 rounded-md hover:bg-slate-200 transition-colors"><ChevronRightIcon className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="w-full text-center sm:text-right text-slate-600 font-medium">{title}</div>
      </div>

      <div className="overflow-x-auto">
        {/* WEEK VIEW */}
        {viewType === 'week' && (
             <div className="grid gap-px" style={{ gridTemplateColumns: '150px repeat(7, minmax(120px, 1fr))' }}>
                <div className="sticky top-0 bg-white z-10 py-3 px-2 font-semibold text-slate-600 text-sm">{t('planning.user')}</div>
                {weekDays.map(day => (
                    <div key={day.toISOString()} className="sticky top-0 bg-white z-10 py-3 px-2 text-center font-semibold text-slate-600 text-sm">
                        <div>{day.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' })}</div>
                        <div className="text-xs text-slate-400">{day.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}</div>
                    </div>
                ))}

                {allDisplayUsers.map((user, index) => {
                    const isUnassigned = user === null;
                    const displayUser = isUnassigned ? { id: null, firstName: t('planning.unassigned'), lastName: '', avatar: '' } : user;
                    const userWorkHours = user?.workHours || fallbackWorkHours;
                    return (
                        <React.Fragment key={isUnassigned ? 'unassigned' : user.id}>
                            <div className="flex items-center space-x-3 p-2 bg-white border-t border-slate-200 h-full">
                                {isUnassigned ? <UserCircleIcon className="w-8 h-8 text-slate-400"/> : <img src={displayUser.avatar} alt={`${displayUser.firstName} ${displayUser.lastName}`} className="w-8 h-8 rounded-full"/>}
                                <span className="font-medium text-sm text-slate-700">{displayUser.firstName} {displayUser.lastName}</span>
                            </div>
                            {weekDays.map(day => {
                                const isNonWorkingDay = isWeekend(day) || isPublicHoliday(day);
                                const segmentsForDay = tasksWithSegments
                                    .filter(task => (isUnassigned ? !task.assigneeId : task.assigneeId === user.id))
                                    .flatMap(task => task.segments.filter(segment => isSameDay(segment.date, day)).map(segment => ({ ...segment, originalTask: task })));
                                
                                const totalDayHours = getWorkDayTotalHours(userWorkHours);
                                const morningHours = (userWorkHours.lunchStart.split(':').map(Number)[0] + userWorkHours.lunchStart.split(':').map(Number)[1]/60) - (userWorkHours.start.split(':').map(Number)[0] + userWorkHours.start.split(':').map(Number)[1]/60);
                                const lunchPositionPercent = totalDayHours > 0 ? (morningHours / totalDayHours) * 100 : 0;
                                return (
                                    <div key={`${displayUser.id}-${day.toISOString()}`} className={`relative p-0 border-t border-slate-200 min-h-[250px] ${isNonWorkingDay ? 'bg-slate-100' : 'bg-white'}`}>
                                        {!isNonWorkingDay && <div className="absolute w-full border-t border-dashed border-slate-300 z-0" style={{ top: `${lunchPositionPercent}%` }}><span className="text-xs text-slate-400 absolute -mt-2.5 ml-1 select-none opacity-70">{userWorkHours.lunchStart}</span></div>}
                                        <div className="relative h-full w-full">
                                            {segmentsForDay.map(segment => {
                                                const { top, height } = calculateTaskPosition(segment.startOnDay, segment.durationOnDay, userWorkHours);
                                                const p_classes = priorityClasses[segment.originalTask.priority];
                                                const startTime = segment.startOnDay;
                                                const endTime = calculateEndTime(startTime, segment.durationOnDay, userWorkHours);
                                                return (
                                                    <div key={`${segment.originalTask.id}-${segment.startOnDay.toISOString()}`} onClick={() => onSelectTask(segment.originalTask)} className={`absolute w-[90%] left-1/2 -translate-x-1/2 p-1.5 rounded-md border-l-4 cursor-pointer hover:shadow-lg transition-all duration-200 z-10 ${p_classes.bg} ${p_classes.border}`} style={{ top: `${top}%`, height: `${Math.max(5, height)}%`}} title={`${segment.originalTask.title} (${startTime.toLocaleTimeString(locale, {hour: '2-digit', minute:'2-digit', timeZone: 'UTC'})} - ${endTime.toLocaleTimeString(locale, {hour: '2-digit', minute:'2-digit', timeZone: 'UTC'})})`}>
                                                        <p className={`text-xs font-semibold truncate ${p_classes.text}`}>{segment.originalTask.title}</p>
                                                        {height > 10 && <p className={`text-[10px] opacity-80 ${p_classes.text}`}>{`${startTime.toLocaleTimeString(locale, {hour: '2-digit', minute:'2-digit', timeZone: 'UTC'})} - ${endTime.toLocaleTimeString(locale, {hour: '2-digit', minute:'2-digit', timeZone: 'UTC'})}`}</p>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    )
                })}
             </div>
        )}

        {/* MONTH VIEW */}
        {viewType === 'month' && (
            <div className="grid border-l border-t border-slate-200" style={{ gridTemplateColumns: `150px repeat(${monthDays.length}, minmax(40px, 1fr))` }}>
                 <div className="sticky left-0 bg-white z-20 p-2 font-semibold text-slate-600 text-sm border-b border-r border-slate-200">{t('planning.user')}</div>
                {monthDays.map(day => (
                    <div key={day.toISOString()} className="p-2 text-center font-semibold text-slate-600 text-sm border-b border-r border-slate-200">
                        <div className={`${isWeekend(day) || isPublicHoliday(day) ? 'text-red-500' : ''}`}>{day.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' })}</div>
                        <div className="text-xs text-slate-400">{day.getUTCDate()}</div>
                    </div>
                ))}
                {allDisplayUsers.map(user => {
                    const isUnassigned = user === null;
                    const displayUser = isUnassigned ? { id: null, firstName: t('planning.unassigned'), lastName: '', avatar: '' } : user;
                    const userWorkHours = user?.workHours || fallbackWorkHours;
                    return (
                        <React.Fragment key={isUnassigned ? 'unassigned' : user.id}>
                            <div className="sticky left-0 flex items-center space-x-3 p-2 bg-white border-b border-r border-slate-200 z-10">
                                {isUnassigned ? <UserCircleIcon className="w-8 h-8 text-slate-400"/> : <img src={displayUser.avatar} alt={`${displayUser.firstName} ${displayUser.lastName}`} className="w-8 h-8 rounded-full"/>}
                                <span className="font-medium text-sm text-slate-700">{displayUser.firstName} {displayUser.lastName}</span>
                            </div>
                            {monthDays.map(day => {
                                const segmentsForDay = tasksWithSegments.filter(task => (isUnassigned ? !task.assigneeId : task.assigneeId === user.id)).flatMap(task => task.segments.filter(segment => isSameDay(segment.date, day)));
                                const totalHoursOnDay = segmentsForDay.reduce((sum, seg) => sum + seg.durationOnDay, 0);
                                const totalWorkHours = getWorkDayTotalHours(userWorkHours);
                                const loadPercentage = totalWorkHours > 0 ? Math.min(100, (totalHoursOnDay / totalWorkHours) * 100) : 0;
                                const isNonWorkingDay = isWeekend(day) || isPublicHoliday(day);
                                return (
                                    <div key={`${displayUser.id}-${day.toISOString()}`} className={`relative p-1 border-b border-r border-slate-200 min-h-[60px] ${isNonWorkingDay ? 'bg-slate-100' : 'bg-white'}`} title={segmentsForDay.map(s => s.originalTask.title).join(', ')}>
                                        {totalHoursOnDay > 0 && !isNonWorkingDay && (
                                            <div className="h-full w-full flex flex-col justify-end">
                                                <div className="text-center text-xs font-bold text-white/80 z-10 mb-1">{`${Math.round(totalHoursOnDay*10)/10}h`}</div>
                                                <div className="absolute bottom-0 left-0 w-full bg-blue-500/60" style={{ height: `${loadPercentage}%`}}></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    );
                })}
            </div>
        )}

        {/* YEAR VIEW */}
        {viewType === 'year' && (
             <div className="grid border-l border-t border-slate-200" style={{ gridTemplateColumns: `150px repeat(12, 1fr)` }}>
                <div className="sticky left-0 bg-white z-20 p-2 font-semibold text-slate-600 text-sm border-b border-r border-slate-200">{t('planning.user')}</div>
                {yearMonths.map(month => <div key={month.toISOString()} className="p-2 text-center font-semibold text-slate-600 text-sm border-b border-r border-slate-200">{month.toLocaleDateString(locale, { month: 'long', timeZone: 'UTC' })}</div>)}
                {allDisplayUsers.map(user => {
                    const isUnassigned = user === null;
                    const displayUser = isUnassigned ? { id: null, firstName: t('planning.unassigned'), lastName: '', avatar: '' } : user;
                    const userWorkHours = user?.workHours || fallbackWorkHours;
                    return (
                        <React.Fragment key={isUnassigned ? 'unassigned' : user.id}>
                             <div className="sticky left-0 flex items-center space-x-3 p-2 bg-white border-b border-r border-slate-200 z-10">
                                {isUnassigned ? <UserCircleIcon className="w-8 h-8 text-slate-400"/> : <img src={displayUser.avatar} alt={`${displayUser.firstName} ${displayUser.lastName}`} className="w-8 h-8 rounded-full"/>}
                                <span className="font-medium text-sm text-slate-700">{displayUser.firstName} {displayUser.lastName}</span>
                            </div>
                            {yearMonths.map(month => {
                                const segmentsForMonth = tasksWithSegments
                                    .filter(task => (isUnassigned ? !task.assigneeId : task.assigneeId === user.id))
                                    .flatMap(task => task.segments.filter(segment => segment.date.getUTCMonth() === month.getUTCMonth() && segment.date.getUTCFullYear() === currentDate.getUTCFullYear()));
                                const totalHours = segmentsForMonth.reduce((sum, seg) => sum + seg.durationOnDay, 0);
                                const totalWorkDays = countWorkDays(month);
                                const totalWorkableHours = totalWorkDays * getWorkDayTotalHours(userWorkHours);
                                const load = totalWorkableHours > 0 ? (totalHours / totalWorkableHours) * 100 : 0;
                                
                                const getBgColor = (l: number) => {
                                    if (l <= 0) return 'bg-slate-50';
                                    if (l < 25) return 'bg-green-200';
                                    if (l < 50) return 'bg-green-300';
                                    if (l < 75) return 'bg-yellow-300';
                                    if (l < 90) return 'bg-orange-400';
                                    return 'bg-red-400';
                                }
                                
                                return (
                                    <div key={`${displayUser.id}-${month.toISOString()}`} className={`flex items-center justify-center p-2 border-b border-r border-slate-200 min-h-[60px] text-center ${getBgColor(load)}`}>
                                       {totalHours > 0 && <span className="font-bold text-slate-800 text-sm">{`${Math.round(totalHours)}h`}</span>}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    );
                })}
            </div>
        )}

      </div>
    </div>
  );
};

export default PlanningView;