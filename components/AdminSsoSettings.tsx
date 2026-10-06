import React, { useState } from 'react';
import { MicrosoftAuthConfig } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { useI18n } from '../contexts/i18n';
import { MicrosoftIcon, ShieldCheckIcon, CheckCircleIcon, ServerStackIcon, LockClosedIcon } from './icons';

const AdminSsoSettings: React.FC = () => {
  const { microsoftAuthConfig, updateMicrosoftAuthConfig, roles } = useAppContext();
  const { t } = useI18n();

  const [formConfig, setFormConfig] = useState<MicrosoftAuthConfig>(microsoftAuthConfig);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleToggleEnable = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormConfig(prev => ({ ...prev, enabled: e.target.checked }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMicrosoftAuthConfig(formConfig);
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-start justify-between pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl shadow-xs">
              <MicrosoftIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                {t('admin.sso.title')}
                {formConfig.enabled ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5 animate-pulse"></span>
                    Actif en production
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    Désactivé (Prêt pour prod)
                  </span>
                )}
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                {t('admin.sso.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {showSavedToast && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium">{t('admin.sso.savedSuccess')}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          {/* Main Activation Switch */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between">
            <div className="pr-4">
              <label htmlFor="sso-toggle" className="font-bold text-slate-800 text-sm sm:text-base cursor-pointer">
                {t('admin.sso.enableLabel')}
              </label>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {t('admin.sso.enableHelp')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                id="sso-toggle"
                type="checkbox"
                checked={formConfig.enabled}
                onChange={handleToggleEnable}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tenant ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t('admin.sso.tenantId')}
              </label>
              <input
                type="text"
                value={formConfig.tenantId}
                onChange={(e) => setFormConfig(prev => ({ ...prev, tenantId: e.target.value }))}
                placeholder={t('admin.sso.tenantIdPlaceholder')}
                className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-800"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                L'identifiant du répertoire ou le nom de votre tenant Azure (ex: <em>monentreprise.onmicrosoft.com</em>).
              </p>
            </div>

            {/* Client ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t('admin.sso.clientId')}
              </label>
              <input
                type="text"
                value={formConfig.clientId}
                onChange={(e) => setFormConfig(prev => ({ ...prev, clientId: e.target.value }))}
                placeholder={t('admin.sso.clientIdPlaceholder')}
                className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-slate-800"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Généré lors de l'enregistrement de l'application dans le portail Microsoft Entra ID.
              </p>
            </div>

            {/* Authority URL */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t('admin.sso.authority')}
              </label>
              <input
                type="text"
                value={formConfig.authorityUrl || 'https://login.microsoftonline.com/organizations'}
                onChange={(e) => setFormConfig(prev => ({ ...prev, authorityUrl: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
              />
            </div>
          </div>

          {/* Additional Options */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Paramètres d'accès et provisionnement
            </h4>
            
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formConfig.allowLocalLoginWithSso}
                onChange={(e) => setFormConfig(prev => ({ ...prev, allowLocalLoginWithSso: e.target.checked }))}
                className="mt-0.5 appearance-none h-4 w-4 cursor-pointer rounded-sm border border-slate-400 bg-white checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 checked:bg-[url('data:image/svg+xml,%3csvg viewBox=%220 0 16 16%22 fill=%22white%22 xmlns=%22http://www.w3.org/2000/svg%22%3e%3cpath d=%22M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z%22/%3e%3c/svg%3e')] bg-center bg-no-repeat"
              />
              <span className="text-xs text-slate-700">
                <strong>{t('admin.sso.allowLocalLogin')}</strong>
              </span>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formConfig.autoCreateNewUsers}
                onChange={(e) => setFormConfig(prev => ({ ...prev, autoCreateNewUsers: e.target.checked }))}
                className="mt-0.5 appearance-none h-4 w-4 cursor-pointer rounded-sm border border-slate-400 bg-white checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 checked:bg-[url('data:image/svg+xml,%3csvg viewBox=%220 0 16 16%22 fill=%22white%22 xmlns=%22http://www.w3.org/2000/svg%22%3e%3cpath d=%22M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z%22/%3e%3c/svg%3e')] bg-center bg-no-repeat"
              />
              <span className="text-xs text-slate-700">
                <strong>{t('admin.sso.autoCreate')}</strong> (Just-In-Time Provisioning)
              </span>
            </label>

            <div className="pt-2 flex items-center space-x-4">
              <label className="text-xs font-medium text-slate-700">
                {t('admin.sso.defaultRole')} :
              </label>
              <select
                value={formConfig.defaultRoleId}
                onChange={(e) => setFormConfig(prev => ({ ...prev, defaultRoleId: e.target.value }))}
                className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all hover:shadow-md cursor-pointer flex items-center space-x-2"
            >
              <ShieldCheckIcon className="w-4 h-4" />
              <span>{t('admin.sso.save')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Guide Box */}
      <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 shadow-md">
        <h4 className="text-sm font-bold text-white flex items-center mb-3">
          <ServerStackIcon className="w-4 h-4 mr-2 text-blue-400" />
          {t('admin.sso.infoBoxTitle')}
        </h4>
        <div className="space-y-2 text-xs text-slate-300 font-mono">
          <p>{t('admin.sso.step1')}</p>
          <p>{t('admin.sso.step2')}</p>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-indigo-300 select-all">
            Redirect URI : http://&lt;IP_DE_VOTRE_SERVEUR_LAB&gt;:8080/
          </div>
          <p>{t('admin.sso.step3')}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSsoSettings;
