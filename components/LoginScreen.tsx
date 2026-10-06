
import React, { useState } from 'react';
import { User, RES_OT_BG_URL } from '../types';
import { CodeBracketSquareIcon, XIcon, PhotoIcon, SparklesIcon, MoonIcon, MicrosoftIcon } from './icons';
import Modal from './Modal';
import { I18nProvider, useI18n } from '../contexts/i18n';
import { useAppContext } from '../contexts/AppContext';
import LanguageSelector from './LanguageSelector';
import BackgroundCustomizationModal from './BackgroundCustomizationModal';
import MicrosoftLoginModal from './MicrosoftLoginModal';

interface LoginScreenProps {}

const MAX_LOGIN_ATTEMPTS = 3;

const LoginContent: React.FC<LoginScreenProps> = () => {
    const [email, setEmail] = useState('alice.dubois@example.com');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [lockedUser, setLockedUser] = useState<{ user: User, newPassword: string} | null>(null);
    const [isBgModalOpen, setBgModalOpen] = useState(false);
    const [isMicrosoftModalOpen, setMicrosoftModalOpen] = useState(false);
    
    const { users, setUsers, handleLogin, backgroundSettings, microsoftAuthConfig, roles } = useAppContext();
    const { t } = useI18n();

    const isDark = backgroundSettings?.type === 'dark';
    const isImageBg = backgroundSettings?.type === 'res_ot' || backgroundSettings?.type === 'custom';
    const bgImageUrl = backgroundSettings?.type === 'res_ot' 
        ? RES_OT_BG_URL 
        : (backgroundSettings?.customUrl || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const user = users.find(u => u.email === email);

        if (!user || !user.isActive) {
            setError(t('login.error.invalid'));
            return;
        }

        const simmulatedHashedPassword = password + '_hashed';
        if (user.hashedPassword === simmulatedHashedPassword) {
            if (user.loginAttempts > 0) {
                const updatedUser = { ...user, loginAttempts: 0 };
                setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
                handleLogin(updatedUser);
            } else {
                handleLogin(user);
            }
        } else {
            const newAttempts = user.loginAttempts + 1;
            
            if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
                // Lock account and reset password
                const newPassword = `temp_${Math.random().toString(36).substring(2, 8)}`;
                const updatedUser = { ...user, loginAttempts: 0, hashedPassword: newPassword + '_hashed' };
                setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
                setError(t('login.error.locked'));
                setLockedUser({ user: updatedUser, newPassword });
            } else {
                const updatedUser = { ...user, loginAttempts: newAttempts };
                setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
                setError(t('login.error.invalid'));
            }
        }
    };
    
    const handleMicrosoftSuccess = (loggedInUser: User) => {
        setMicrosoftModalOpen(false);
        // If it's a new user, add to user list
        if (!users.some(u => u.id === loggedInUser.id)) {
            setUsers(prev => [...prev, loggedInUser]);
        }
        handleLogin(loggedInUser);
    };

    return (
        <div className={`flex items-center justify-center min-h-screen p-4 relative overflow-hidden ${
            isDark 
                ? 'bg-slate-950 text-slate-100' 
                : isImageBg 
                ? 'bg-slate-900' 
                : 'bg-slate-100'
        }`}>
            {/* Dark Mode Gradient Accent */}
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
                        <div className="fixed inset-0 z-0 bg-slate-950/40 pointer-events-none transition-opacity backdrop-brightness-95" />
                    )}
                </>
            )}

            {/* Top Controls on Login Page */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center space-x-2">
                <button
                    type="button"
                    onClick={() => setBgModalOpen(true)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-xs border ${
                        backgroundSettings.type === 'res_ot'
                            ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600 ring-2 ring-orange-400/20'
                            : backgroundSettings.type === 'dark'
                            ? 'bg-slate-900 hover:bg-slate-800 text-indigo-300 border-slate-700 ring-2 ring-indigo-500/20'
                            : backgroundSettings.type === 'custom'
                            ? 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                    title={t('background.customization')}
                >
                    {backgroundSettings.type === 'res_ot' ? (
                        <SparklesIcon className="w-3.5 h-3.5" />
                    ) : backgroundSettings.type === 'dark' ? (
                        <MoonIcon className="w-3.5 h-3.5" />
                    ) : (
                        <PhotoIcon className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline font-semibold">
                        {backgroundSettings.type === 'res_ot'
                            ? 'RES OT'
                            : backgroundSettings.type === 'dark'
                            ? 'Sombre'
                            : backgroundSettings.type === 'custom'
                            ? 'Perso'
                            : t('header.background')}
                    </span>
                </button>
                <LanguageSelector variant="header" />
            </div>

            <div className="relative z-10 w-full max-w-md p-8 space-y-6 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-center">
                    <div className="inline-flex p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-md text-white mb-2">
                        <CodeBracketSquareIcon className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{t('login.title')}</h2>
                    <p className="mt-1 text-xs text-slate-500 font-medium">Projet-Pilote Management Platform</p>
                </div>

                {/* Microsoft AD / Entra ID SSO Button */}
                {microsoftAuthConfig.enabled && (
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => setMicrosoftModalOpen(true)}
                            className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border border-slate-700 group"
                        >
                            <MicrosoftIcon className="w-5 h-5 shrink-0" />
                            <span className="group-hover:translate-x-0.5 transition-transform">{t('login.microsoft')}</span>
                        </button>
                        
                        <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('login.or')}</span>
                            <div className="flex-grow border-t border-slate-200"></div>
                        </div>
                    </div>
                )}

                {/* Local login form (if enabled or if SSO disabled) */}
                {(!microsoftAuthConfig.enabled || microsoftAuthConfig.allowLocalLoginWithSso) && (
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && !lockedUser && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">{error}</div>}
                        
                        <div className="rounded-md shadow-xs -space-y-px">
                            <div>
                                <label htmlFor="email-address" className="sr-only">{t('login.email')}</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2.5 bg-white border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder={t('login.email')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">{t('login.password')}</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2.5 bg-white border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder={t('login.password')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer shadow-sm transition-all"
                            >
                                {t('login.button')}
                            </button>
                        </div>
                    </form>
                )}

                {/* Quick info if SSO is disabled */}
                {!microsoftAuthConfig.enabled && (
                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={() => setMicrosoftModalOpen(true)}
                            className="inline-flex items-center text-xs text-slate-500 hover:text-blue-600 transition-colors"
                        >
                            <MicrosoftIcon className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                            Tester la connexion Microsoft AD
                        </button>
                    </div>
                )}
            </div>

            {isMicrosoftModalOpen && (
                <MicrosoftLoginModal
                    isOpen={isMicrosoftModalOpen}
                    onClose={() => setMicrosoftModalOpen(false)}
                    onSuccess={handleMicrosoftSuccess}
                    existingUsers={users}
                    tenantId={microsoftAuthConfig.tenantId}
                    defaultRoleId={microsoftAuthConfig.defaultRoleId}
                    roles={roles}
                />
            )}

            {lockedUser && (
                <Modal isOpen={!!lockedUser} onClose={() => setLockedUser(null)}>
                    <div className="p-6">
                         <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-slate-800">{t('login.reset.title')}</h2>
                            <button onClick={() => setLockedUser(null)} className="text-slate-400 hover:text-slate-600">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <p className="text-slate-600 mb-4">{t('login.reset.message')}</p>
                        <div className="bg-slate-100 p-3 rounded-lg text-center">
                            <p className="text-sm text-slate-500">{t('login.reset.newPassword')}</p>
                            <p className="text-lg font-mono font-bold text-slate-800 tracking-wider">{lockedUser.newPassword}</p>
                        </div>
                         <div className="mt-6 flex justify-end">
                            <button onClick={() => setLockedUser(null)} className="bg-blue-600 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium hover:bg-blue-700">
                                {t('login.reset.close')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {isBgModalOpen && (
                <BackgroundCustomizationModal
                    isOpen={isBgModalOpen}
                    onClose={() => setBgModalOpen(false)}
                />
            )}
        </div>
    );
};

// Wrapper to provide I18n context for the login screen itself
const LoginScreen: React.FC<LoginScreenProps> = (props) => (
    <I18nProvider>
        <LoginContent {...props} />
    </I18nProvider>
);

export default LoginScreen;
