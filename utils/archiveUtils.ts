import { Task, Status } from '../types';

export const ARCHIVE_DAYS_THRESHOLD = 30;

/**
 * Determines whether a task is archived.
 * A task is archived if:
 * 1. It is explicitly marked as archived (`task.isArchived === true`), OR
 * 2. Its status is DONE, it was not explicitly unarchived (`task.isArchived !== false`),
 *    and its completion date (or due date / start date) is older than `daysThreshold` days (default 30).
 */
export const isTaskArchived = (task: Task, daysThreshold: number = ARCHIVE_DAYS_THRESHOLD): boolean => {
  if (task.isArchived === true) return true;
  if (task.isArchived === false) return false;
  if (task.status !== Status.DONE) return false;

  const refDateStr = task.completionDate || task.dueDate || task.startDate;
  if (!refDateStr) return false;

  const refTime = new Date(refDateStr).getTime();
  if (isNaN(refTime)) return false;

  const diffMs = Date.now() - refTime;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= daysThreshold;
};

/**
 * Returns the number of days elapsed since a task was completed/closed.
 */
export const getDaysSinceCompletion = (task: Task): number => {
  const refDateStr = task.completionDate || task.dueDate || task.startDate;
  if (!refDateStr) return 0;
  const refTime = new Date(refDateStr).getTime();
  if (isNaN(refTime)) return 0;
  const diffMs = Date.now() - refTime;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

/**
 * Compares a task's relevant date against a 'fromDate' cutoff ('YYYY-MM-DD').
 * Returns true if the task occurred on or after fromDate.
 */
export const isTaskOnOrAfterDate = (task: Task, fromDateStr?: string | null): boolean => {
  if (!fromDateStr) return true;
  const cutoffTime = new Date(`${fromDateStr}T00:00:00`).getTime();
  if (isNaN(cutoffTime)) return true;

  // For DONE tasks, check completionDate first; for other tasks, check startDate
  const taskDateStr = task.status === Status.DONE 
    ? (task.completionDate || task.dueDate || task.startDate)
    : (task.startDate || task.dueDate);

  if (!taskDateStr) return true;
  const taskTime = new Date(taskDateStr).getTime();
  if (isNaN(taskTime)) return true;

  return taskTime >= cutoffTime;
};
