import React, { useState, useEffect, useRef, useMemo } from 'react';
import { KanbanIcon, ChartBarIcon, CodeBracketSquareIcon, CalendarDaysIcon, PlusIcon, Cog6ToothIcon, UserCircleIcon, ChevronDownIcon, ArrowRightOnRectangleIcon, KeyIcon, CameraIcon, PhotoIcon, SparklesIcon, MoonIcon, ArchiveBoxIcon } from './icons';
import { useI18n } from '../contexts/i18n';
import { useAppContext } from '../contexts/AppContext';
import { isTaskArchived } from '../utils/archiveUtils';
import LanguageSelector from './LanguageSelector';

type View = 'board' | 'dashboard' | 'planning' | 'admin' | 'archives';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
  onNewTask: () => void;
  onLogout: () => void;
  onChangePassword: () => void;
  onChangeAvatar: () => void;
  onCustomizeBackground: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, onNewTask, onLogout, onChangePassword, onChangeAvatar, onCustomizeBackground }) => {
  const { t } = useI18n();
  const { currentUser, currentUserPermissions: permissions, backgroundSettings, visibleTasks } = useAppContext();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const archivedCount = useMemo(() => {
    return visibleTasks.filter(t => isTaskArchived(t)).length;
  }, [visibleTasks]);

  const commonButtonClasses = 'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200';
  const activeButtonClasses = 'bg-blue-600 text-white shadow';
  const inactiveButtonClasses = 'text-slate-600 hover:bg-slate-200';

  const commonIconButtonClasses = "p-2 rounded-full transition-colors duration-200";
  const activeIconButtonClasses = "bg-blue-100 text-blue-600";
  const inactiveIconButtonClasses = "text-slate-500 hover:bg-slate-200";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white/85 backdrop-blur-md shadow-xs border-b border-slate-200/80 sticky top-0 z-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-xs text-white">
              <CodeBracketSquareIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">{t('header.title')}</h1>
              {backgroundSettings.type === 'res_ot' && (
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                  <SparklesIcon className="w-3 h-3 text-orange-500" />
                  <span>RES OT Team Theme</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Navigation Tabs */}
            <nav className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
              {permissions.has('board_view') && (
                <button
                  onClick={() => setView('board')}
                  title={t('header.board')}
                  className={`${commonButtonClasses} ${currentView === 'board' ? activeButtonClasses : inactiveButtonClasses}`}
                >
                  <KanbanIcon className="w-5 h-5" />
                  <span className="hidden md:inline">{t('header.board')}</span>
                </button>
              )}
              {permissions.has('dashboard_view') && (
                <button
                  onClick={() => setView('dashboard')}
                  title={t('header.dashboard')}
                  className={`${commonButtonClasses} ${currentView === 'dashboard' ? activeButtonClasses : inactiveButtonClasses}`}
                >
                  <ChartBarIcon className="w-5 h-5" />
                  <span className="hidden md:inline">{t('header.dashboard')}</span>
                </button>
              )}
              {permissions.has('planning_view') && (
                <button
                  onClick={() => setView('planning')}
                  title={t('header.planning')}
                  className={`${commonButtonClasses} ${currentView === 'planning' ? activeButtonClasses : inactiveButtonClasses}`}
                >
                  <CalendarDaysIcon className="w-5 h-5" />
                  <span className="hidden md:inline">{t('header.planning')}</span>
                </button>
              )}
              {permissions.has('board_view') && (
                <button
                  onClick={() => setView('archives')}
                  title={t('header.archives')}
                  className={`${commonButtonClasses} ${currentView === 'archives' ? activeButtonClasses : inactiveButtonClasses}`}
                >
                  <ArchiveBoxIcon className="w-5 h-5" />
                  <span className="hidden md:inline">{t('header.archives')}</span>
                  {archivedCount > 0 && (
                    <span className={`text-xs px-1.5 py-0.2 rounded-full font-semibold ${
                      currentView === 'archives' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {archivedCount}
                    </span>
                  )}
                </button>
              )}
            </nav>

            {permissions.has('admin_access') && (
              <button
                  onClick={() => setView('admin')}
                  title={t('header.admin')}
                  className={`${commonIconButtonClasses} ${currentView === 'admin' ? activeIconButtonClasses : inactiveIconButtonClasses}`}
              >
                  <Cog6ToothIcon className="w-6 h-6" />
              </button>
            )}
            
            {permissions.has('tasks_create') && (
              <button
                  onClick={onNewTask}
                  className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-sm transition-colors duration-200"
              >
                  <PlusIcon className="w-5 h-5 sm:mr-2" />
                  <span className="hidden sm:inline">{t('header.create')}</span>
              </button>
            )}

            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            {/* User Profile Menu (Contains Profile, Language, Background Theme & Settings) */}
            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setMenuOpen(prev => !prev)}
                    className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 transition-colors rounded-full p-1 pr-3 border border-slate-200"
                    aria-label="Menu utilisateur"
                    aria-expanded={isMenuOpen}
                >
                    <img src={currentUser.avatar} alt={currentUser.firstName} className="w-8 h-8 rounded-full object-cover" />
                    <span className="font-semibold text-sm text-slate-700 hidden sm:inline">{currentUser.firstName} {currentUser.lastName}</span>
                    <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 origin-top-right bg-white rounded-2xl shadow-xl ring-1 ring-black/5 border border-slate-100 divide-y divide-slate-100 focus:outline-none z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {/* User Header */}
                        <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100/60 flex items-center space-x-3">
                            <img src={currentUser.avatar} alt={currentUser.firstName} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-xs" />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900 truncate">{currentUser.firstName} {currentUser.lastName}</p>
                                <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                            </div>
                        </div>

                        {/* Section: Préférences & Affichage */}
                        <div className="p-2 space-y-1">
                            <div className="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Affichage & Préférences
                            </div>
                            
                            {/* Wallpaper & Theme Selector */}
                            <button
                                type="button"
                                onClick={() => { onCustomizeBackground(); setMenuOpen(false); }}
                                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors group"
                            >
                                <div className="flex items-center space-x-2.5">
                                    <div className={`p-1.5 rounded-lg transition-colors ${
                                        backgroundSettings.type === 'res_ot' 
                                            ? 'bg-orange-100 text-orange-600' 
                                            : backgroundSettings.type === 'dark'
                                            ? 'bg-indigo-100 text-indigo-600'
                                            : 'bg-slate-100 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50'
                                    }`}>
                                        {backgroundSettings.type === 'res_ot' ? (
                                            <SparklesIcon className="w-4 h-4" />
                                        ) : backgroundSettings.type === 'dark' ? (
                                            <MoonIcon className="w-4 h-4" />
                                        ) : (
                                            <PhotoIcon className="w-4 h-4" />
                                        )}
                                    </div>
                                    <span className="font-semibold text-slate-800">{t('background.customization')}</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    backgroundSettings.type === 'res_ot'
                                        ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                        : backgroundSettings.type === 'dark'
                                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                        : backgroundSettings.type === 'custom'
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                    {backgroundSettings.type === 'res_ot' 
                                        ? 'RES OT' 
                                        : backgroundSettings.type === 'dark'
                                        ? 'Sombre'
                                        : backgroundSettings.type === 'custom' 
                                        ? 'Perso' 
                                        : 'Clair'}
                                </span>
                            </button>

                            {/* Language Switcher inside Menu */}
                            <LanguageSelector variant="menu" onSelect={() => setMenuOpen(false)} />
                        </div>

                        {/* Section: Compte */}
                        <div className="p-2 space-y-0.5">
                            <div className="px-2 py-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Mon Compte
                            </div>
                            <button 
                                type="button"
                                onClick={() => { onChangeAvatar(); setMenuOpen(false); }} 
                                className="w-full flex items-center px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors group"
                            >
                                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 mr-2.5">
                                    <CameraIcon className="w-4 h-4" />
                                </div>
                                <span>{t('header.changeAvatar')}</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => { onChangePassword(); setMenuOpen(false); }} 
                                className="w-full flex items-center px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors group"
                            >
                                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 mr-2.5">
                                    <KeyIcon className="w-4 h-4" />
                                </div>
                                <span>{t('header.changePassword')}</span>
                            </button>
                        </div>

                        {/* Section: Déconnexion */}
                        <div className="p-2">
                            <button 
                                type="button"
                                onClick={onLogout} 
                                className="w-full flex items-center px-2.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors group"
                            >
                                <div className="p-1.5 rounded-lg bg-red-100 text-red-600 mr-2.5">
                                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                </div>
                                <span>{t('header.logout')}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;