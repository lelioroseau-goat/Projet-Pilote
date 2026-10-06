import { Task, WorkHours } from '../types';

// Memoization cache for public holidays
const holidaysCache = new Map<number, string[]>();

export const toISODateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const getEasterSunday = (year: number): Date => {
    // Meeus/Jones/Butcher algorithm for Gregorian calendar
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(Date.UTC(year, month - 1, day));
};

const getPublicHolidays = (year: number): string[] => {
    if (holidaysCache.has(year)) {
        return holidaysCache.get(year)!;
    }

    const holidays = new Set<string>();

    // Fixed holidays
    holidays.add(`${year}-01-01`); // New Year's Day
    holidays.add(`${year}-05-01`); // Labour Day
    holidays.add(`${year}-05-08`); // Victory in Europe Day
    holidays.add(`${year}-07-14`); // Bastille Day
    holidays.add(`${year}-08-15`); // Assumption of Mary
    holidays.add(`${year}-11-01`); // All Saints' Day
    holidays.add(`${year}-11-11`); // Armistice Day
    holidays.add(`${year}-12-25`); // Christmas Day

    // Movable holidays based on Easter
    const easterSunday = getEasterSunday(year);

    const easterMonday = new Date(easterSunday);
    easterMonday.setUTCDate(easterSunday.getUTCDate() + 1);
    holidays.add(toISODateString(easterMonday));

    const ascensionDay = new Date(easterSunday);
    ascensionDay.setUTCDate(easterSunday.getUTCDate() + 39);
    holidays.add(toISODateString(ascensionDay));

    const whitMonday = new Date(easterSunday);
    whitMonday.setUTCDate(easterSunday.getUTCDate() + 50);
    holidays.add(toISODateString(whitMonday));
    
    const result = Array.from(holidays).sort();
    holidaysCache.set(year, result);
    return result;
};


const parseTime = (timeStr: string): number => {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
};

export const getWorkDayTotalHours = (workHours: WorkHours): number => {
    const start = parseTime(workHours.start);
    const lunchStart = parseTime(workHours.lunchStart);
    const lunchEnd = parseTime(workHours.lunchEnd);
    const end = parseTime(workHours.end);
    if ([start, lunchStart, lunchEnd, end].some(isNaN)) return 0;
    return (lunchStart - start) + (end - lunchEnd);
};

export interface TaskSegment {
    date: Date;
    durationOnDay: number;
    startOnDay: Date;
    originalTask: Task;
}

export const getWeekDays = (currentDate: Date): Date[] => {
    const today = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()));
    const dayOfWeek = today.getUTCDay(); // Sunday - 0, Monday - 1
    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const week = [];
    for (let i = 0; i < 7; i++) {
        const nextDay = new Date(monday);
        nextDay.setUTCDate(monday.getUTCDate() + i);
        week.push(nextDay);
    }
    return week;
};

export const isWeekend = (date: Date): boolean => {
    const day = date.getUTCDay();
    return day === 0 || day === 6; // Sunday or Saturday
};

export const isPublicHoliday = (date: Date): boolean => {
    const year = date.getUTCFullYear();
    const holidays = getPublicHolidays(year);
    const dateString = toISODateString(date);
    return holidays.includes(dateString);
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getUTCFullYear() === d2.getUTCFullYear() &&
         d1.getUTCMonth() === d2.getUTCMonth() &&
         d1.getUTCDate() === d2.getUTCDate();
};

const getOffsetInHours = (date: Date, workHours: WorkHours): number => {
    const hour = date.getUTCHours() + date.getUTCMinutes() / 60;
    const workStartHour = parseTime(workHours.start);
    const lunchStartHour = parseTime(workHours.lunchStart);
    const lunchEndHour = parseTime(workHours.lunchEnd);
    const workEndHour = parseTime(workHours.end);

    if (hour <= workStartHour) return 0;
    if (hour > workStartHour && hour <= lunchStartHour) {
        return hour - workStartHour;
    }
    if (hour > lunchStartHour && hour < lunchEndHour) {
        return lunchStartHour - workStartHour;
    }
    if (hour >= lunchEndHour && hour <= workEndHour) {
        const morning = lunchStartHour - workStartHour;
        const afternoon = hour - lunchEndHour;
        return morning + afternoon;
    }
    if (hour > workEndHour) return getWorkDayTotalHours(workHours);
    return 0;
};

export const calculateTaskPosition = (startDate: Date, durationHours: number, workHours: WorkHours) => {
    const totalDayHours = getWorkDayTotalHours(workHours);
    if (totalDayHours <= 0) return { top: 0, height: 0 };

    const startOffsetHours = getOffsetInHours(startDate, workHours);
    const top = (startOffsetHours / totalDayHours) * 100;
    const height = (durationHours / totalDayHours) * 100;
    return {
        top: Math.max(0, top),
        height: Math.min(100 - top, height),
    };
};

export const calculateEndTime = (startDate: Date, durationHours: number, workHours: WorkHours): Date => {
    let remainingDuration = durationHours;
    const endDate = new Date(startDate);
    const startHour = startDate.getUTCHours() + startDate.getUTCMinutes() / 60;
    const lunchStartHour = parseTime(workHours.lunchStart);
    const lunchEndHour = parseTime(workHours.lunchEnd);

    if (startHour < lunchStartHour) {
        const timeBeforeLunch = lunchStartHour - startHour;
        if (remainingDuration <= timeBeforeLunch) {
            const endHour = startHour + remainingDuration;
            endDate.setUTCHours(Math.floor(endHour), (endHour % 1) * 60, 0, 0);
            return endDate;
        } else {
            remainingDuration -= timeBeforeLunch;
            const endHour = lunchEndHour + remainingDuration;
            endDate.setUTCHours(Math.floor(endHour), (endHour % 1) * 60, 0, 0);
            return endDate;
        }
    } else {
        const effectiveStartHour = Math.max(startHour, lunchEndHour);
        const endHour = effectiveStartHour + remainingDuration;
        endDate.setUTCHours(Math.floor(endHour), (endHour % 1) * 60, 0, 0);
        return endDate;
    }
};

export const getAvailableTimeSlotsForDay = (day: Date, blockingSegments: (TaskSegment & {taskId: string})[], workHours: WorkHours): { start: Date, end: Date }[] => {
    const isoDate = toISODateString(day);
    const workSlots = [
        { start: new Date(`${isoDate}T${workHours.start}:00.000Z`), end: new Date(`${isoDate}T${workHours.lunchStart}:00.000Z`) },
        { start: new Date(`${isoDate}T${workHours.lunchEnd}:00.000Z`), end: new Date(`${isoDate}T${workHours.end}:00.000Z`) }
    ];

    let freeSlots = workSlots;
    const sortedBlockers = [...blockingSegments].sort((a, b) => a.startOnDay.getTime() - b.startOnDay.getTime());

    for (const blocker of sortedBlockers) {
        const blockerStart = blocker.startOnDay;
        const blockerEnd = calculateEndTime(blocker.startOnDay, blocker.durationOnDay, workHours);
        
        const nextFreeSlots: { start: Date, end: Date }[] = [];
        for (const slot of freeSlots) {
            const overlapStarts = Math.max(slot.start.getTime(), blockerStart.getTime());
            const overlapEnds = Math.min(slot.end.getTime(), blockerEnd.getTime());

            if (overlapStarts >= overlapEnds) {
                nextFreeSlots.push(slot);
                continue;
            }
            if (slot.start.getTime() < blockerStart.getTime()) {
                nextFreeSlots.push({ start: slot.start, end: blockerStart });
            }
            if (slot.end.getTime() > blockerEnd.getTime()) {
                nextFreeSlots.push({ start: blockerEnd, end: slot.end });
            }
        }
        freeSlots = nextFreeSlots;
    }
    return freeSlots;
};

export const getTaskSegments = (task: Task, existingSegments: (TaskSegment & {taskId: string})[], workHours: WorkHours): Omit<TaskSegment, 'originalTask'>[] => {
    const newSegments: Omit<TaskSegment, 'originalTask'>[] = [];
    let remainingHours = task.durationHours;
    let timeCursor = new Date(task.startDate);
    let safetyBreak = 100; // Prevent infinite loops
    const [startH, startM] = workHours.start.split(':').map(Number);


    while (remainingHours > 0.001 && safetyBreak > 0) {
        safetyBreak--;

        while (isWeekend(timeCursor) || isPublicHoliday(timeCursor)) {
            timeCursor.setUTCDate(timeCursor.getUTCDate() + 1);
            timeCursor.setUTCHours(startH, startM, 0, 0);
        }
        
        const segmentsOnThisDay = existingSegments.filter(s => isSameDay(s.date, timeCursor));
        const availableSlots = getAvailableTimeSlotsForDay(timeCursor, segmentsOnThisDay, workHours);

        let dayWorkDone = false;
        for (const slot of availableSlots) {
            if (remainingHours <= 0.001) break;

            const effectiveStart = new Date(Math.max(timeCursor.getTime(), slot.start.getTime()));

            if (effectiveStart >= slot.end) continue;

            const slotDurationHours = (slot.end.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60);
            const durationToSchedule = Math.min(remainingHours, slotDurationHours);
            
            if (durationToSchedule > 0.001) {
                const segmentDate = new Date(effectiveStart);
                segmentDate.setUTCHours(0, 0, 0, 0);

                newSegments.push({
                    date: segmentDate,
                    durationOnDay: durationToSchedule,
                    startOnDay: effectiveStart,
                });
                
                remainingHours -= durationToSchedule;
                timeCursor = calculateEndTime(effectiveStart, durationToSchedule, workHours);
                dayWorkDone = true;
            }
        }
        
        if (!dayWorkDone && remainingHours > 0.001) {
            timeCursor.setUTCDate(timeCursor.getUTCDate() + 1);
            timeCursor.setUTCHours(startH, startM, 0, 0);
        }
    }
    return newSegments;
};


export const getMonthDays = (date: Date): Date[] => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const daysInMonth = new Date(year, month + 1, 0).getUTCDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(Date.UTC(year, month, i)));
    }
    return days;
};

export const countWorkDays = (date: Date): number => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const daysInMonth = new Date(year, month + 1, 0).getUTCDate();
    let workDays = 0;
    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(Date.UTC(year, month, i));
        if (!isWeekend(d) && !isPublicHoliday(d)) {
            workDays++;
        }
    }
    return workDays;
};