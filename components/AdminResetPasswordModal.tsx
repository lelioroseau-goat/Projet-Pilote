import React, { useState } from 'react';
import { User } from '../types';
import Modal from './Modal';
import { XIcon, KeyIcon, EyeIcon, EyeSlashIcon, DocumentDuplicateIcon, ArrowPathIcon, CheckCircleIcon } from './icons';
import { useI18n } from '../contexts/i18n';

interface AdminResetPasswordModalProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onClose: () => void;
}

const generateRandomPassword = (): string => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const AdminResetPasswordModal: React.FC<AdminResetPasswordModalProps> = ({ user, onSave, onClose }) => {
  const { t } = useI18n();
  const [newPassword, setNewPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [unlockAccount, setUnlockAccount] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerate = () => {
    const generated = generateRandomPassword();
    setNewPassword(generated);
    setError('');
  };

  const handleSetDefault = () => {
    setNewPassword('password123');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError(t('resetPasswordModal.errorLength'));
      return;
    }

    const updatedUser: User = {
      ...user,
      hashedPassword: newPassword + '_hashed',
      loginAttempts: unlockAccount ? 0 : user.loginAttempts,
    };

    onSave(updatedUser);
    setSuccess(t('resetPasswordModal.success'));
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded-xl">
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <KeyIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{t('resetPasswordModal.title')}</h2>
              <p className="text-xs text-slate-500">{t('resetPasswordModal.subtitle')}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* User Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-5 flex items-center space-x-3">
          <img src={user.avatar} alt={user.firstName} className="w-11 h-11 rounded-full border border-white shadow-sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            {user.loginAttempts >= 3 && (
              <span className="inline-block mt-1 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                Compte actuellement verrouillé ({user.loginAttempts} échecs)
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-2.5 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 text-sm px-4 py-2.5 rounded-lg mb-4 flex items-center space-x-2">
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="newPasswordInput" className="block text-sm font-medium text-slate-700 mb-1">
              {t('resetPasswordModal.newPassword')}
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPasswordInput"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                }}
                className="block w-full pl-3 pr-20 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm text-sm font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('resetPasswordModal.placeholder')}
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title={showPassword ? t('resetPasswordModal.hidePassword') : t('resetPasswordModal.showPassword')}
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                  title={t('resetPasswordModal.copy')}
                >
                  {copied ? <CheckCircleIcon className="w-5 h-5 text-emerald-600" /> : <DocumentDuplicateIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {copied && (
              <p className="mt-1 text-xs font-medium text-emerald-600 flex items-center space-x-1">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>{t('resetPasswordModal.copied')}</span>
              </p>
            )}
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors"
            >
              <ArrowPathIcon className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              {t('resetPasswordModal.generateRandom')}
            </button>
            <button
              type="button"
              onClick={handleSetDefault}
              className="inline-flex items-center text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors"
            >
              <KeyIcon className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              {t('resetPasswordModal.resetDefault')}
            </button>
          </div>

          {/* Unlock Account toggle */}
          <div className="pt-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={unlockAccount}
                onChange={(e) => setUnlockAccount(e.target.checked)}
                className="appearance-none h-4 w-4 cursor-pointer rounded-sm border border-slate-400 bg-white checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 checked:bg-[url('data:image/svg+xml,%3csvg viewBox=%220 0 16 16%22 fill=%22white%22 xmlns=%22http://www.w3.org/2000/svg%22%3e%3cpath d=%22M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z%22/%3e%3c/svg%3e')] bg-center bg-no-repeat"
              />
              <span className="text-sm font-medium text-slate-700">{t('resetPasswordModal.unlockAccount')}</span>
            </label>
          </div>
        </div>

        <div className="mt-7 pt-4 border-t border-slate-100 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-white py-2 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            {t('resetPasswordModal.confirm')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminResetPasswordModal;
