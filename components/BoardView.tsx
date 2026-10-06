import React, { useMemo } from 'react';
import { Status } from '../types';
import TaskColumn from './TaskColumn';
import { useAppContext } from '../contexts/AppContext';
import { isTaskArchived } from '../utils/archiveUtils';

interface BoardViewProps {
  onViewArchives?: () => void;
}

const BoardView: React.FC<BoardViewProps> = ({ onViewArchives }) => {
  const { visibleTasks: tasks, users, handleSelectTask, handleUpdateTask } = useAppContext();
  const columns = Object.values(Status);

  // Exclude auto-archived tasks (>30d closed or marked archived) from active board display
  const activeTasks = useMemo(() => {
    return tasks.filter(task => !isTaskArchived(task));
  }, [tasks]);

  // Total count of archived tasks for the DONE column notice
  const archivedDoneCount = useMemo(() => {
    return tasks.filter(task => task.status === Status.DONE && isTaskArchived(task)).length;
  }, [tasks]);

  const handleDrop = (taskId: string, newStatus: Status) => {
    const taskToMove = tasks.find(t => t.id === taskId);
    if (taskToMove && taskToMove.status !== newStatus) {
      handleUpdateTask({ ...taskToMove, status: newStatus });
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full pb-6">
        {columns.map(status => {
          const tasksInColumn = activeTasks.filter(task => task.status === status);
          return (
            <TaskColumn
              key={status}
              title={status}
              tasks={tasksInColumn}
              users={users}
              onSelectTask={handleSelectTask}
              onDrop={handleDrop}
              onViewArchives={onViewArchives}
              archivedTasksCount={status === Status.DONE ? archivedDoneCount : 0}
            />
          );
        })}
      </div>
    </div>
  );
};

export default BoardView;
