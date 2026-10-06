import React, { useState } from 'react';
import Modal from './Modal';
import { MicrosoftIcon, XIcon, ShieldCheckIcon } from './icons';
import { User, Role } from '../types';
import { useI18n } from '../contexts/i18n';

interface MicrosoftLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  existingUsers: User[];
  tenantId?: string;
  defaultRoleId?: string;
  roles: Role[];
}

const MicrosoftLoginModal: React.FC<MicrosoftLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingUsers,
  tenantId,
  defaultRoleId = 'contributor',
  roles,
}) => {
  const { t } = useI18n();
  const [adEmail, setAdEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSimulatedAdLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = adEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Veuillez saisir une adresse email professionnelle valide (ex: prenom.nom@entreprise.com).');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Look for existing user with this email
      let user = existingUsers.find(u => u.email.toLowerCase() === trimmed);

      if (!user) {
        // Auto-provision user from Microsoft AD
        const namePart = trimmed.split('@')[0];
        const parts = namePart.split('.');
        const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Collaborateur';
        const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'AD';

        const roleId = defaultRoleId || roles[0]?.id || 'contributor';

        user = {
          id: `ad_${crypto.randomUUID()}`,
          firstName,
          lastName,
          email: trimmed,
          hashedPassword: 'MICROSOFT_SSO_AUTHENTICATED',
          loginAttempts: 0,
          avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          workHours: {
            start: '09:00',
            end: '17:00',
            lunchStart: '12:00',
            lunchEnd: '13:30',
          },
          isActive: true,
          language: 'fr',
          roleIds: [roleId],
        };
      }

      setIsSubmitting(false);
      onSuccess(user);
    }, 900);
  };

  const handleSelectDemoUser = (user: User) => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess(user);
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 sm:p-7 max-w-md w-full bg-white rounded-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center space-x-2.5">
            <MicrosoftIcon className="w-6 h-6" />
            <h3 className="text-lg font-bold text-slate-900">
              Microsoft Entra ID (SSO)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-2xl mb-3">
            <ShieldCheckIcon className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-800">
            {t('login.adPrompt')}
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            {t('login.adSubtext')}
          </p>
          {tenantId && (
            <div className="mt-2 inline-block px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-mono">
              Tenant: {tenantId}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSimulatedAdLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email professionnel Microsoft / Office 365
            </label>
            <input
              type="email"
              required
              value={adEmail}
              onChange={(e) => setAdEmail(e.target.value)}
              placeholder="votre.nom@entreprise.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-[#0078d4] hover:bg-[#106ebe] active:bg-[#005a9e] text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <MicrosoftIcon className="w-4 h-4 brightness-200" />
            <span>
              {isSubmitting ? t('login.microsoftConnecting') : 'Continuer avec Microsoft'}
            </span>
          </button>
        </form>

        {/* Quick select test accounts */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
            Ou tester avec un collaborateur existant
          </p>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {existingUsers.slice(0, 4).map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelectDemoUser(u)}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-slate-100 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-2.5">
                  <img src={u.avatar} alt="" className="w-6 h-6 rounded-full" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-600">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-[10px] text-slate-400">{u.email}</p>
                  </div>
                </div>
                <span className="text-[10px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Se connecter &rarr;
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MicrosoftLoginModal;
