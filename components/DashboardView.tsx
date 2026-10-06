import React, { useState, useMemo, useEffect } from 'react';
import { TasksByStatusChart, TasksPerUserChart, ProjectProgressSummary, TasksByPriorityChart } from './ChartComponents';
import { useI18n } from '../contexts/i18n';
import { ChevronDownIcon } from './icons';
import { useAppContext } from '../contexts/AppContext';
import ReportsView from './ReportsView';
import DashboardTasksList from './DashboardTasksList';

type DashboardTab = 'personal' | 'team' | 'reports';

const DashboardView: React.FC = () => {
  const { t } = useI18n();
  const { visibleTasks: tasks, users, currentUser, teams, currentUserPermissions: permissions } = useAppContext();

  if (!currentUser) return null;

  const canViewTeamDashboard = permissions.has('dashboard_view_team');
  const [activeTab, setActiveTab] = useState<DashboardTab>('personal');
  
  const userTeams = useMemo(() => teams.filter(team => team.userIds.includes(currentUser.id)), [teams, currentUser]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(userTeams[0]?.id || null);

  useEffect(() => {
    if (canViewTeamDashboard && !selectedTeamId && userTeams.length > 0) {
      setSelectedTeamId(userTeams[0].id);
    }
  }, [userTeams, canViewTeamDashboard, selectedTeamId]);
  
  const personalTasks = useMemo(() => tasks.filter(task => task.assigneeId === currentUser.id), [tasks, currentUser]);

  const teamData = useMemo(() => {
    if (!selectedTeamId) return { teamTasks: [], teamMembers: [] };
    const team = teams.find(t => t.id === selectedTeamId);
    if (!team) return { teamTasks: [], teamMembers: [] };

    const teamMembers = users.filter(u => team.userIds.includes(u.id));
    const teamTasks = tasks.filter(task => team.userIds.includes(task.assigneeId || ''));
    
    return { teamTasks, teamMembers };
  }, [selectedTeamId, teams, users, tasks]);

  const selectedTeamName = useMemo(() => {
    return teams.find(t => t.id === selectedTeamId)?.name;
  }, [teams, selectedTeamId]);

  const renderTabButton = (tabName: DashboardTab, labelKey: string) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
        activeTab === tabName
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {t(labelKey)}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{t('dashboard.title')}</h2>
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {renderTabButton('personal', 'dashboard.myActivity')}
                {canViewTeamDashboard && renderTabButton('team', 'dashboard.teamView')}
                {renderTabButton('reports', 'dashboard.reports')}
            </nav>
        </div>
      </div>

      {activeTab === 'personal' && (
        <div className="space-y-6">
            <ProjectProgressSummary tasks={personalTasks} />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">{t('dashboard.tasksByStatus')}</h3>
                    <TasksByStatusChart tasks={personalTasks} />
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">{t('dashboard.tasksByPriority')}</h3>
                    <TasksByPriorityChart tasks={personalTasks} />
                </div>
            </div>
            {/* Interactive Tasks List */}
            <DashboardTasksList 
              tasks={personalTasks} 
              availableUsers={[currentUser]} 
              title={t('dashboard.tasksList.title')} 
            />
        </div>
      )}

      {activeTab === 'team' && canViewTeamDashboard && (
         <div className="space-y-6">
            {userTeams.length > 1 && (
                <div className="max-w-xs">
                    <label htmlFor="team-select" className="block text-sm font-medium text-gray-700">{t('dashboard.selectTeam')}</label>
                    <div className="relative mt-1">
                        <select
                            id="team-select"
                            value={selectedTeamId || ''}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="appearance-none block w-full pl-3 pr-10 py-2 text-base bg-white border border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                        >
                            {userTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                            <ChevronDownIcon className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            )}
            {selectedTeamId ? (
                 <>
                    <ProjectProgressSummary tasks={teamData.teamTasks} />
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <h3 className="text-lg font-semibold text-slate-700 mb-4">{t('dashboard.teamWorkload')}</h3>
                            <TasksPerUserChart tasks={teamData.teamTasks} users={teamData.teamMembers} />
                        </div>
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                            <h3 className="text-lg font-semibold text-slate-700 mb-4">{t('dashboard.tasksByStatus')}</h3>
                            <TasksByStatusChart tasks={teamData.teamTasks} />
                        </div>
                    </div>
                    {/* Interactive Team Tasks List */}
                    <DashboardTasksList 
                      tasks={teamData.teamTasks} 
                      availableUsers={teamData.teamMembers} 
                      title={selectedTeamName ? `${t('dashboard.tasksList.title')} (${selectedTeamName})` : t('dashboard.tasksList.title')} 
                    />
                 </>
            ) : (
                <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-slate-100">
                    <p className="text-slate-500">{t('dashboard.noTeam')}</p>
                </div>
            )}
         </div>
      )}
      
      {activeTab === 'reports' && (
        <ReportsView />
      )}

    </div>
  );
};

export default DashboardView;