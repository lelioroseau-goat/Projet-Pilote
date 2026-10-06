import React, { useMemo } from 'react';
import { Task, User, Status, Priority } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CheckCircleIcon, ListBulletIcon, ArrowTrendingUpIcon } from './icons';
import { useI18n } from '../contexts/i18n';

interface ChartProps {
  tasks: Task[];
}

interface UserChartProps extends ChartProps {
  users: User[];
}

const STATUS_COLORS = {
  [Status.TODO]: '#3b82f6', // blue-500
  [Status.IN_PROGRESS]: '#f59e0b', // amber-500
  [Status.ON_HOLD]: '#64748b', // slate-500
  [Status.DONE]: '#22c55e', // green-500
};

const PRIORITY_COLORS = {
  [Priority.LOW]: '#60a5fa', // blue-400
  [Priority.MEDIUM]: '#facc15', // yellow-400
  [Priority.HIGH]: '#f87171', // red-400
}

export const TasksByStatusChart: React.FC<ChartProps> = ({ tasks }) => {
  const { t } = useI18n();

  const data = useMemo(() => {
    const counts = {
      [Status.TODO]: 0,
      [Status.IN_PROGRESS]: 0,
      [Status.ON_HOLD]: 0,
      [Status.DONE]: 0,
    };
    tasks.forEach(task => {
      if (counts.hasOwnProperty(task.status)) {
        counts[task.status]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name: t(`status.${name}`), value }));
  }, [tasks, t]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={STATUS_COLORS[Object.keys(Status).find(key => t(`status.${key}`) === entry.name) as Status]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const TasksByPriorityChart: React.FC<ChartProps> = ({ tasks }) => {
  const { t } = useI18n();

  const data = useMemo(() => {
    const counts = {
      [Priority.LOW]: 0,
      [Priority.MEDIUM]: 0,
      [Priority.HIGH]: 0,
    };
    tasks.forEach(task => {
      counts[task.priority]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: t(`priority.${name}`), value }));
  }, [tasks, t]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[Object.keys(Priority).find(key => t(`priority.${key}`) === entry.name) as Priority]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const TasksPerUserChart: React.FC<UserChartProps> = ({ tasks, users }) => {
    const { t } = useI18n();
    const data = useMemo(() => {
        return users.map(user => {
            const userTasks = tasks.filter(task => task.assigneeId === user.id);
            return {
                name: user.firstName,
                [t('status.TODO')]: userTasks.filter(t => t.status === Status.TODO).length,
                [t('status.IN_PROGRESS')]: userTasks.filter(t => t.status === Status.IN_PROGRESS).length,
                [t('status.ON_HOLD')]: userTasks.filter(t => t.status === Status.ON_HOLD).length,
            };
        });
    }, [tasks, users, t]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis allowDecimals={false}/>
        <Tooltip cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} />
        <Legend />
        <Bar dataKey={t('status.TODO')} stackId="a" fill={STATUS_COLORS[Status.TODO]} />
        <Bar dataKey={t('status.IN_PROGRESS')} stackId="a" fill={STATUS_COLORS[Status.IN_PROGRESS]} />
        <Bar dataKey={t('status.ON_HOLD')} stackId="a" fill={STATUS_COLORS[Status.ON_HOLD]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const ProjectProgressSummary: React.FC<ChartProps> = ({ tasks }) => {
    const { t } = useI18n();
    const summary = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === Status.DONE).length;
        const inProgress = tasks.filter(t => t.status === Status.IN_PROGRESS).length;
        return { total, completed, inProgress };
    }, [tasks]);
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                    <ListBulletIcon className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                    <p className="text-slate-500 text-sm">{t('charts.totalTasks')}</p>
                    <p className="text-2xl font-bold text-slate-800">{summary.total}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircleIcon className="w-7 h-7 text-green-600" />
                </div>
                <div>
                    <p className="text-slate-500 text-sm">{t('charts.completedTasks')}</p>
                    <p className="text-2xl font-bold text-slate-800">{summary.completed}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm flex items-center space-x-4">
                <div className="bg-yellow-100 p-3 rounded-full">
                    <ArrowTrendingUpIcon className="w-7 h-7 text-yellow-600" />
                </div>
                <div>
                    <p className="text-slate-500 text-sm">{t('charts.inProgressTasks')}</p>
                    <p className="text-2xl font-bold text-slate-800">{summary.inProgress}</p>
                </div>
            </div>
        </div>
    )
}