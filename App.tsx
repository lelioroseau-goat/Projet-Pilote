import React, { useState } from 'react';
import Header from './components/Header';
import BoardView from './components/BoardView';
import DashboardView from './components/DashboardView';
import PlanningView from './components/PlanningView';
import AdminView from './components/AdminView';
import ArchivesView from './components/ArchivesView';
import Modal from './components/Modal';
import NewTaskForm from './components/NewTaskForm';
import TaskDetailModal from './components/TaskDetailModal';
import { I18nProvider } from './contexts/i18n';
import LoginScreen from './components/LoginScreen';
import ChangePasswordModal from './components/ChangePasswordModal';
import UpdateAvatarModal from './components/UpdateAvatarModal';
import BackgroundCustomizationModal from './components/BackgroundCustomizationModal';
import { useAppContext } from './contexts/AppContext';
import { RES_OT_BG_URL, View } from './types';

const AppLayout: React.FC = () => {
    const { 
        currentUser,
        updateLoggedInUser,
        handleLogout,
        isNewTaskModalOpen,
        openNewTaskModal,
        closeNewTaskModal,
        handleAddTask,
        activeUsers,
        teams,
        categories,
        backgroundSettings,
    } = useAppContext();

    const [view, setView] = useState<View>('board');
    const [isChangePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
    const [isUpdateAvatarModalOpen, setUpdateAvatarModalOpen] = useState(false);
    const [isBackgroundModalOpen, setBackgroundModalOpen] = useState(false);
    
    if (!currentUser) return null; // Should not happen if logic in App is correct

    const handleSavePassword = (newHashedPassword: string) => {
        updateLoggedInUser({ hashedPassword: newHashedPassword });
    };
    
    const handleSaveAvatar = (newAvatarDataUrl: string) => {
        updateLoggedInUser({ avatar: newAvatarDataUrl });
    };

    const isDark = backgroundSettings.type === 'dark';
    const isImageBg = backgroundSettings.type === 'res_ot' || backgroundSettings.type === 'custom';
    const isCustomBg = isDark || isImageBg;
    const bgImageUrl = backgroundSettings.type === 'res_ot' 
        ? RES_OT_BG_URL 
        : (backgroundSettings.customUrl || '');

    return (
        <div className={`relative flex flex-col h-screen overflow-hidden ${
            isDark 
                ? 'bg-slate-950 text-slate-100' 
                : isImageBg 
                ? 'bg-slate-900' 
                : 'bg-slate-50'
        }`}>
             {/* Dark Mode Ambient Backdrop */}
             {isDark && (
                <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none" />
             )}

             {/* Dynamic Background Wallpaper Layer */}
             {isImageBg && bgImageUrl && (
                <>
                    <div 
                        className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-300 transform scale-100"
                        style={{
                            backgroundImage: `url(${bgImageUrl})`,
                            opacity: (backgroundSettings.opacity ?? 85) / 100,
                            filter: backgroundSettings.blur ? `blur(${backgroundSettings.blur}px)` : 'none',
                        }}
                    />
                    {backgroundSettings.darkOverlay && (
                        <div className="fixed inset-0 z-0 bg-slate-950/35 pointer-events-none transition-opacity backdrop-brightness-95" />
                    )}
                </>
             )}

             <div className="relative z-10 flex flex-col h-full overflow-hidden">
                 <Header
                    currentView={view}
                    setView={setView}
                    onNewTask={openNewTaskModal}
                    onLogout={handleLogout}
                    onChangePassword={() => setChangePasswordModalOpen(true)}
                    onChangeAvatar={() => setUpdateAvatarModalOpen(true)}
                    onCustomizeBackground={() => setBackgroundModalOpen(true)}
                 />
                 <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${
                     isDark
                         ? 'bg-slate-950/60 backdrop-blur-xs'
                         : isImageBg 
                         ? 'bg-slate-900/40 backdrop-blur-xs' 
                         : ''
                 }`}>
                     {view === 'board' && <BoardView onViewArchives={() => setView('archives')} />}
                     {view === 'dashboard' && <DashboardView />}
                     {view === 'planning' && <PlanningView />}
                     {view === 'archives' && <ArchivesView onBackToBoard={() => setView('board')} />}
                     {view === 'admin' && <AdminView />}
                </main>
             </div>

            <TaskDetailModal />
            <Modal isOpen={isNewTaskModalOpen} onClose={closeNewTaskModal} maxWidth="max-w-4xl">
                <NewTaskForm 
                    users={activeUsers} 
                    teams={teams}
                    categories={categories}
                    onSave={handleAddTask}
                    onCancel={closeNewTaskModal}
                />
            </Modal>
            {isChangePasswordModalOpen && (
                <ChangePasswordModal 
                    currentUser={currentUser}
                    onSave={handleSavePassword}
                    onClose={() => setChangePasswordModalOpen(false)}
                />
            )}
            {isUpdateAvatarModalOpen && (
                <UpdateAvatarModal 
                    currentUser={currentUser}
                    onSave={handleSaveAvatar}
                    onClose={() => setUpdateAvatarModalOpen(false)}
                />
            )}
            {isBackgroundModalOpen && (
                <BackgroundCustomizationModal 
                    isOpen={isBackgroundModalOpen}
                    onClose={() => setBackgroundModalOpen(false)}
                />
            )}
        </div>
    );
};

const App: React.FC = () => {
    const { currentUser, updateLoggedInUser } = useAppContext();

    if (!currentUser) {
        return <LoginScreen />;
    }

    return (
        <I18nProvider 
            language={currentUser.language} 
            onLanguageChange={(newLang) => updateLoggedInUser({ language: newLang })}
        >
            <AppLayout />
        </I18nProvider>
    );
};

export default App;