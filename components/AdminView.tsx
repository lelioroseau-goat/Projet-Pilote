import React, { useState } from 'react';
import { Team, Category, User, Role } from '../types';
import { UsersIcon, TagIcon, TrashIcon, PlusIcon, XIcon, UserCircleIcon, PencilSquareIcon, ChevronDownIcon, UserPlusIcon, ShieldCheckIcon, KeyIcon, MicrosoftIcon } from './icons';
import UserFormModal from './UserFormModal';
import RoleFormModal from './RoleFormModal';
import CategoryFormModal from './CategoryFormModal';
import AdminResetPasswordModal from './AdminResetPasswordModal';
import TeamMemberCombobox from './TeamMemberCombobox';
import AdminSsoSettings from './AdminSsoSettings';
import { useAppContext } from '../contexts/AppContext';
import { useI18n } from '../contexts/i18n';

type AdminTab = 'teams' | 'users' | 'roles' | 'sso';

const AdminView: React.FC = () => {
  const { 
      teams, setTeams, 
      categories, setCategories, 
      users, setUsers, 
      roles, setRoles, 
      currentUserPermissions: permissions
  } = useAppContext();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<AdminTab>('teams');
  const [editingUser, setEditingUser] = useState<User | 'new' | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | 'new' | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | 'new' | null>(null);

  const [newTeamName, setNewTeamName] = useState('');
  
  const activeUsers = users.filter(u => u.isActive);

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const teamName = newTeamName.trim();
    if (teamName) {
      const newTeam: Team = {
        id: crypto.randomUUID(),
        name: teamName,
        userIds: [],
        availableCategoryIds: [],
      };
      setTeams(prev => [...prev, newTeam]);
      setNewTeamName('');
    }
  };

  const handleDeleteTeam = (id: string) => {
    setTeams(prev => prev.filter(team => team.id !== id));
  };

  const handleSaveCategory = (categoryToSave: Category) => {
    if (categories.some(c => c.id === categoryToSave.id)) {
        setCategories(prev => prev.map(c => c.id === categoryToSave.id ? categoryToSave : c));
    } else {
        setCategories(prev => [...prev, categoryToSave]);
    }
  };

  const handleDeleteCategory = (id: string) => {
    setTeams(prevTeams => prevTeams.map(team => ({
      ...team,
      availableCategoryIds: team.availableCategoryIds.filter(catId => catId !== id)
    })));
    setCategories(prev => prev.filter(category => category.id !== id));
  };

  const toggleUserInTeam = (teamId: string, userId: string) => {
    setTeams(prevTeams => prevTeams.map(team => {
      if (team.id === teamId) {
        const userIds = team.userIds.includes(userId)
          ? team.userIds.filter(id => id !== userId)
          : [...team.userIds, userId];
        return { ...team, userIds };
      }
      return team;
    }));
  };

  const toggleCategoryInTeam = (teamId: string, categoryId: string) => {
    setTeams(prevTeams => prevTeams.map(team => {
        if (team.id === teamId) {
            const availableCategoryIds = team.availableCategoryIds.includes(categoryId)
                ? team.availableCategoryIds.filter(cId => cId !== categoryId)
                : [...team.availableCategoryIds, categoryId];
            return { ...team, availableCategoryIds };
        }
        return team;
    }));
  };

  const handleSaveUser = (userToSave: User) => {
    if (users.some(u => u.id === userToSave.id)) {
        setUsers(prevUsers => prevUsers.map(u => u.id === userToSave.id ? userToSave : u));
    } else {
        setUsers(prevUsers => [...prevUsers, userToSave]);
    }
  };

  const handleSaveRole = (roleToSave: Role) => {
      if (roles.some(r => r.id === roleToSave.id)) {
          setRoles(prevRoles => prevRoles.map(r => r.id === roleToSave.id ? roleToSave : r));
      } else {
          setRoles(prevRoles => [...prevRoles, roleToSave]);
      }
  };

  const handleDeleteRole = (id: string) => {
    if (id === 'admin') return; // Prevent deleting the admin role
    setRoles(prev => prev.filter(role => role.id !== id));
  }
  
  const renderTabButton = (tabName: AdminTab, labelKey: string) => (
      <button
        onClick={() => setActiveTab(tabName)}
        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
          activeTab === tabName
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        {t(labelKey)}
      </button>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-800">{t('admin.title')}</h2>
      
       <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {permissions.has('admin_manage_teams') && renderTabButton('teams', 'admin.tabs.teams')}
          {permissions.has('admin_manage_users') && renderTabButton('users', 'admin.tabs.users')}
          {permissions.has('admin_manage_roles') && renderTabButton('roles', 'admin.tabs.roles')}
          {permissions.has('admin_manage_roles') && renderTabButton('sso', 'admin.tabs.sso')}
        </nav>
      </div>

      {activeTab === 'teams' && permissions.has('admin_manage_teams') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xl font-semibold text-slate-700 mb-2 flex items-center">
                    <UsersIcon className="w-6 h-6 mr-3 text-blue-600" />
                    {t('admin.teams.title')}
                </h3>
                {teams.map(team => {
                    const teamMembers = users.filter(u => team.userIds.includes(u.id));
                    const availableUsersToAdd = activeUsers.filter(u => !team.userIds.includes(u.id));
                    return (
                        <div key={team.id} className="bg-white p-6 rounded-xl shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-bold text-slate-800">{team.name}</h4>
                                <button onClick={() => handleDeleteTeam(team.id)} className="text-slate-400 hover:text-red-500 p-1 rounded-full transition-colors" title={t('admin.teams.deleteTitle', {teamName: team.name})}><TrashIcon className="w-5 h-5" /></button>
                            </div>
                            <div className="mb-6">
                                <h5 className="font-semibold text-slate-600 mb-3">{t('admin.teams.members')}</h5>
                                <div className="flex flex-wrap gap-2 items-center mb-3">
                                    {teamMembers.map(member => (
                                        <div key={member.id} className={`flex items-center bg-slate-100 rounded-full pl-3 pr-1 ${!member.isActive ? 'grayscale opacity-70' : ''}`}>
                                            <img src={member.avatar} alt={`${member.firstName} ${member.lastName}`} className="w-6 h-6 rounded-full mr-2" />
                                            <span className="text-sm font-medium text-slate-700">{`${member.firstName} ${member.lastName}`}</span>
                                            <button onClick={() => toggleUserInTeam(team.id, member.id)} className="ml-2 text-slate-400 hover:text-red-500 rounded-full p-0.5"><XIcon className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                    {teamMembers.length === 0 && <p className="text-sm text-slate-500 italic">{t('admin.teams.noMembers')}</p>}
                                </div>
                                <TeamMemberCombobox
                                    availableUsers={availableUsersToAdd}
                                    onSelectUser={(userId) => toggleUserInTeam(team.id, userId)}
                                />
                            </div>
                            <div>
                                <h5 className="font-semibold text-slate-600 mb-3">{t('admin.teams.availableCategories')}</h5>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {categories.map(category => (
                                        <label key={category.id} className="flex items-center space-x-3 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={team.availableCategoryIds.includes(category.id)} 
                                                onChange={() => toggleCategoryInTeam(team.id, category.id)} 
                                                className="appearance-none h-4 w-4 cursor-pointer rounded-sm border border-slate-600 bg-white checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 checked:bg-[url('data:image/svg+xml,%3csvg viewBox=%220 0 16 16%22 fill=%22white%22 xmlns=%22http://www.w3.org/2000/svg%22%3e%3cpath d=%22M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z%22/%3e%3c/svg%3e')] bg-center bg-no-repeat"
                                            />
                                            <span className="text-sm font-medium text-slate-700">{category.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                })}
                 <form onSubmit={handleAddTeam} className="bg-white p-6 rounded-xl shadow-sm">
                     <h4 className="text-lg font-bold text-slate-800 mb-4">{t('admin.teams.newTeamPlaceholder')}</h4>
                     <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            placeholder={t('admin.teams.newTeamPlaceholder')}
                            className="flex-grow px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                         <button type="submit" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition-colors duration-200">{t('common.add')}</button>
                     </div>
                </form>
            </div>
            <div className="space-y-4">
                 <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-slate-700 flex items-center">
                            <TagIcon className="w-6 h-6 mr-3 text-blue-600" />
                            {t('admin.categories.library')}
                        </h3>
                        <button onClick={() => setEditingCategory('new')} className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 py-2 px-3 rounded-lg shadow-sm transition-colors">
                            <PlusIcon className="w-5 h-5 mr-1"/>
                            {t('admin.categories.createCategory')}
                        </button>
                    </div>
                    <ul className="space-y-2 mb-4">
                        {categories.map(category => (
                            <li key={category.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
                                <span className="text-slate-700">{category.name}</span>
                                <div className="flex items-center space-x-1">
                                     <button onClick={() => setEditingCategory(category)} className="text-slate-400 hover:text-blue-500 p-1 rounded-full transition-colors" title={t('admin.categories.editCategory', {categoryName: category.name})}>
                                        <PencilSquareIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDeleteCategory(category.id)} className="text-slate-400 hover:text-red-500 p-1 rounded-full transition-colors" title={t('admin.categories.deleteTitle', {categoryName: category.name})}>
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                         {categories.length === 0 && <p className="text-sm text-slate-500 italic">{t('admin.categories.noCategories')}</p>}
                    </ul>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'users' && permissions.has('admin_manage_users') && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-700 flex items-center">
                    <UserCircleIcon className="w-6 h-6 mr-3 text-blue-600" />
                    {t('admin.users.title')}
                </h3>
                <button onClick={() => setEditingUser('new')} className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-lg shadow-sm transition-colors">
                    <UserPlusIcon className="w-5 h-5 mr-2"/>
                    {t('admin.users.createUser')}
                </button>
            </div>
            <ul className="divide-y divide-slate-200">
                {users.map(user => {
                    const userRoles = roles.filter(r => user.roleIds.includes(r.id));
                    return (
                        <li key={user.id} className="py-4 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                                    <p className="text-sm text-slate-500">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="flex-shrink-0 hidden sm:block">
                                    {userRoles.map(r => <span key={r.id} className="text-xs font-medium bg-slate-100 text-slate-600 rounded-full px-2 py-1 mr-1">{r.name}</span>)}
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {user.isActive ? t('admin.users.active') : t('admin.users.inactive')}
                                </span>
                                <button 
                                    onClick={() => setResetPasswordUser(user)} 
                                    className="text-slate-400 hover:text-amber-600 p-1.5 rounded-full hover:bg-amber-50 transition-colors" 
                                    title={t('admin.users.resetPasswordTitle', {userName: user.firstName})}
                                >
                                    <KeyIcon className="w-5 h-5"/>
                                </button>
                                <button 
                                    onClick={() => setEditingUser(user)} 
                                    className="text-slate-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-100 transition-colors" 
                                    title={t('admin.users.editTitle', {userName: user.firstName})}
                                >
                                    <PencilSquareIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
      )}
      
      {activeTab === 'roles' && permissions.has('admin_manage_roles') && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-700 flex items-center">
                    <ShieldCheckIcon className="w-6 h-6 mr-3 text-blue-600" />
                    {t('admin.roles.title')}
                </h3>
                <button onClick={() => setEditingRole('new')} className="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-lg shadow-sm transition-colors">
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    {t('admin.roles.createRole')}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map(role => (
                    <div key={role.id} className="border border-slate-200 rounded-lg p-4 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                             <div>
                                <p className="font-bold text-slate-800">{role.name}</p>
                                <p className="text-xs text-slate-500">{t('admin.roles.permissionsCount', {count: role.permissions.length})}</p>
                             </div>
                             <div>
                                <button onClick={() => setEditingRole(role)} className="text-slate-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-100 transition-colors"><PencilSquareIcon className="w-5 h-5"/></button>
                                {role.id !== 'admin' && <button onClick={() => handleDeleteRole(role.id)} className="text-slate-400 hover:text-red-600 p-1 rounded-full hover:bg-red-100 transition-colors"><TrashIcon className="w-5 h-5"/></button>}
                            </div>
                        </div>
                        <ul className="text-xs text-slate-600 space-y-1 mt-auto">
                            {role.permissions.slice(0, 3).map(p => <li key={p}>• {t(`permissions_${p}`)}</li>)}
                            {role.permissions.length > 3 && <li>...</li>}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
      )}

      {activeTab === 'sso' && permissions.has('admin_manage_roles') && (
        <AdminSsoSettings />
      )}
      
      {(editingUser === 'new' || (editingUser && typeof editingUser === 'object')) && (
        <UserFormModal 
            user={editingUser === 'new' ? null : editingUser} 
            roles={roles}
            onSave={handleSaveUser}
            onClose={() => setEditingUser(null)} 
        />
      )}
      {resetPasswordUser && (
        <AdminResetPasswordModal
            user={resetPasswordUser}
            onSave={handleSaveUser}
            onClose={() => setResetPasswordUser(null)}
        />
      )}
      {(editingRole === 'new' || (editingRole && typeof editingRole === 'object')) && (
        <RoleFormModal 
            role={editingRole === 'new' ? null : editingRole}
            onSave={handleSaveRole}
            onClose={() => setEditingRole(null)}
        />
      )}
      {(editingCategory === 'new' || (editingCategory && typeof editingCategory === 'object')) && (
        <CategoryFormModal 
            category={editingCategory === 'new' ? null : editingCategory}
            onSave={handleSaveCategory}
            onClose={() => setEditingCategory(null)}
        />
      )}
    </div>
  );
};

export default AdminView;