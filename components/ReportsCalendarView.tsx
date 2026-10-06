import React, { useState, useMemo, useEffect } from 'react';
import { Task, User, Priority, WorkHours } from '../types';
import { useI18n } from '../contexts/i18n';
import { ChevronLeftIcon, ChevronRightIcon, UserCircleIcon } from './icons';
import { getMonthDays, isSameDay, isWeekend, isPublicHoliday, getWorkDayTotalHours, calculateTaskPosition, calculateEndTime, TaskSegment } from '../utils/dateUtils';

interface ReportsCalendarViewProps {
    segments: (TaskSegment & { originalTask: Task })[];
    usersToDisplay: User[];
    allUsers: User[];
    initialDate: Date;
    onSelectTask: (task: Task) => void;
}

const fallbackWorkHours: WorkHours = { start: '09:00', lunchStart: '12:00', lunchEnd: '13:00', end: '17:00' };

const priorityClasses = {
    [Priority.HIGH]: { bg: 'bg-red-200/80', border: 'border-red-500', text: 'text-red-900' },
    [Priority.MEDIUM]: { bg: 'bg-yellow-200/80', border: 'border-yellow-500', text: 'text-yellow-900' },
    [Priority.LOW]: { bg: 'bg-blue-200/80', border: 'border-blue-500', text: 'text-blue-900' },
};

const ReportsCalendarView: React.FC<ReportsCalendarViewProps> = ({ segments, usersToDisplay, allUsers, initialDate, onSelectTask }) => {
    const { t, locale } = useI18n();
    const [displayDate, setDisplayDate] = useState(initialDate);

    useEffect(() => {
        setDisplayDate(initialDate);
    }, [initialDate]);

    const handleNav = (offset: number) => {
        setDisplayDate(prev => {
            const newDate = new Date(prev);
            newDate.setUTCMonth(newDate.getUTCMonth() + offset, 15);
            return newDate;
        });
    };

    const monthDays = useMemo(() => getMonthDays(displayDate), [displayDate]);

    const title = useMemo(() => {
        return displayDate.toLocaleDateString(locale, { timeZone: 'UTC', month: 'long', year: 'numeric' });
    }, [displayDate, locale]);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm mt-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                <div className="flex items-center space-x-1">
                    <button onClick={() => handleNav(-1)} className="p-2 rounded-md hover:bg-slate-200 transition-colors"><ChevronLeftIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleNav(1)} className="p-2 rounded-md hover:bg-slate-200 transition-colors"><ChevronRightIcon className="w-5 h-5" /></button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <div className="grid border-l border-t border-slate-200" style={{ gridTemplateColumns: `150px repeat(${monthDays.length}, minmax(80px, 1fr))` }}>
                    {/* Header Row */}
                    <div className="sticky left-0 bg-white z-20 p-2 font-semibold text-slate-600 text-sm border-b border-r border-slate-200">{t('planning.user')}</div>
                    {monthDays.map(day => (
                        <div key={day.toISOString()} className="p-2 text-center font-semibold text-slate-600 text-sm border-b border-r border-slate-200">
                            <div className={`${isWeekend(day) || isPublicHoliday(day) ? 'text-red-500' : ''}`}>{day.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' })}</div>
                            <div className="text-xs text-slate-400">{day.getUTCDate()}</div>
                        </div>
                    ))}
                    
                    {/* User Rows */}
                    {usersToDisplay.map((user) => {
                        const userWorkHours = user.workHours || fallbackWorkHours;
                        
                        return (
                            <React.Fragment key={user.id}>
                                <div className="sticky left-0 flex items-center space-x-3 p-2 bg-white border-b border-r border-slate-200 z-10 min-h-[150px]">
                                    <img src={user.avatar} alt={`${user.firstName} ${user.lastName}`} className="w-8 h-8 rounded-full"/>
                                    <span className="font-medium text-sm text-slate-700">{user.firstName} {user.lastName}</span>
                                </div>
                                
                                {monthDays.map(day => {
                                    const isNonWorkingDay = isWeekend(day) || isPublicHoliday(day);
                                    const segmentsForDay = segments
                                        .filter(seg => seg.originalTask.assigneeId === user.id && isSameDay(seg.date, day));
                                    
                                    const totalDayHours = getWorkDayTotalHours(userWorkHours);
                                    const morningHours = (userWorkHours.lunchStart.split(':').map(Number)[0] + userWorkHours.lunchStart.split(':').map(Number)[1]/60) - (userWorkHours.start.split(':').map(Number)[0] + userWorkHours.start.split(':').map(Number)[1]/60);
                                    const lunchPositionPercent = totalDayHours > 0 ? (morningHours / totalDayHours) * 100 : 0;
                                    
                                    return (
                                        <div key={`${user.id}-${day.toISOString()}`} className={`relative p-0 border-b border-r border-slate-200 ${isNonWorkingDay ? 'bg-slate-100' : 'bg-white'}`}>
                                            {!isNonWorkingDay && <div className="absolute w-full border-t border-dashed border-slate-300 z-0" style={{ top: `${lunchPositionPercent}%` }}><span className="text-xs text-slate-400 absolute -mt-2.5 ml-1 select-none opacity-70">{userWorkHours.lunchStart}</span></div>}
                                            <div className="relative h-full w-full">
                                                {segmentsForDay.map(segment => {
                                                    const { top, height } = calculateTaskPosition(segment.startOnDay, segment.durationOnDay, userWorkHours);
                                                    const p_classes = priorityClasses[segment.originalTask.priority];
                                                    const startTime = segment.startOnDay;
                                                    const endTime = calculateEndTime(startTime, segment.durationOnDay, userWorkHours);
                                                    
                                                    return (
                                                        <div key={`${segment.originalTask.id}-${segment.startOnDay.toISOString()}`} onClick={() => onSelectTask(segment.originalTask)} className={`absolute w-[90%] left-1/2 -translate-x-1/2 p-1 rounded-md border-l-4 cursor-pointer hover:shadow-lg transition-all duration-200 z-10 ${p_classes.bg} ${p_classes.border}`} style={{ top: `${top}%`, height: `${Math.max(5, height)}%`}} title={`${segment.originalTask.title} (${startTime.toLocaleTimeString(locale, {hour: '2-digit', minute:'2-digit', timeZone: 'UTC'})} - ${endTime.toLocaleTimeString(locale, {hour: '2-digit', minute:'2-digit', timeZone: 'UTC'})})`}>
                                                            <p className={`text-xs font-semibold truncate ${p_classes.text}`}>{segment.originalTask.title}</p>
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
            </div>
        </div>
    );
};

export default ReportsCalendarView;