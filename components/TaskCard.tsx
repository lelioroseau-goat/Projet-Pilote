import React from 'react';
import { motion } from 'motion/react';
import { Task, User, Priority } from '../types';
import { FlagIcon, CalendarIcon, TagIcon, ListBulletIcon, BriefcaseIcon, ChatBubbleLeftRightIcon, CheckCircleIcon } from './icons';
import { useI18n } from '../contexts/i18n';
import { useAppContext } from '../contexts/AppContext';

interface TaskCardProps {
  task: Task;
  assignee?: User;
  onSelectTask: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, assignee, onSelectTask }) => {
  const { t, locale } = useI18n();
  const { categories } = useAppContext();
  
  const priorityClasses = {
    [Priority.HIGH]: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-500',
    },
    [Priority.MEDIUM]: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      border: 'border-yellow-500',
    },
    [Priority.LOW]: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-500',
    },
  };
  
  const p_classes = priorityClasses[task.priority];
  const categoryName = categories.find(c => c.id === task.categoryId)?.name || 'N/A';

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("taskId", task.id);
    setTimeout(() => {
        e.currentTarget.classList.add('opacity-50', 'shadow-2xl');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50', 'shadow-2xl');
  };

  return (
    <motion.div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onSelectTask(task)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={`bg-white p-4 rounded-lg shadow-sm hover:shadow-md border-l-4 ${p_classes.border} cursor-pointer transition-shadow`}
    >
      <h3 className="font-semibold text-slate-800 mb-2">{task.title}</h3>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${p_classes.bg} ${p_classes.text}`}>
            <FlagIcon className="w-3 h-3" />
            <span>{t(`priority.${task.priority}`)}</span>
        </span>
        <span className="flex items-center space-x-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            <TagIcon className="w-3 h-3" />
            <span>{categoryName}</span>
        </span>
        {task.projectCode && (
            <span 
                className="flex items-center space-x-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
                title={`${t('modal.projectCode')}: ${task.projectCode}`}
            >
                <BriefcaseIcon className="w-3 h-3 text-emerald-600" />
                <span className="truncate max-w-[110px]">{task.projectCode}</span>
            </span>
        )}
        {task.subtasks && task.subtasks.length > 0 && (
            <span 
                className="flex items-center space-x-1 text-xs text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full"
                title={`${task.subtasks.filter(s => s.completed).length} / ${task.subtasks.length} ${t('modal.subtasks')} completed`}
            >
                <ListBulletIcon className="w-4 h-4" />
                <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
            </span>
        )}
        {task.notes && task.notes.length > 0 && (
            <span 
                className="flex items-center space-x-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full"
                title={`${task.notes.length} ${t('modal.notes')}`}
            >
                <ChatBubbleLeftRightIcon className="w-3 h-3 text-indigo-600" />
                <span>{task.notes.length}</span>
            </span>
        )}
        {task.completionDate && (
            <span 
                className="flex items-center space-x-1 text-xs font-semibold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full"
                title={`${t('modal.closureDate')}: ${new Date(task.completionDate).toLocaleString(locale)}`}
            >
                <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                <span>{t('taskCard.closedOn')}: {new Date(task.completionDate).toLocaleDateString(locale, { day: '2-digit', month: 'short' })}</span>
            </span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1">
                <CalendarIcon className="w-4 h-4" />
                <span>{new Date(task.startDate).toLocaleDateString(locale, { day: '2-digit', month: 'short'})}</span>
            </span>
        </div>
        {assignee && (
          <img
            src={assignee.avatar}
            alt={`${assignee.firstName} ${assignee.lastName}`}
            title={`${assignee.firstName} ${assignee.lastName}`}
            className={`w-7 h-7 rounded-full border-2 border-white ${assignee.isActive ? '' : 'grayscale opacity-60'}`}
          />
        )}
      </div>
    </motion.div>
  );
};

export default TaskCard;