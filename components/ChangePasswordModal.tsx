import React, { useState } from 'react';
import { User } from '../types';
import Modal from './Modal';
import { XIcon } from './icons';
import { useI18n } from '../contexts/i18n';

interface ChangePasswordModalProps {
  currentUser: User;
  onSave: (newHashedPassword: string) => void;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ currentUser, onSave, onClose }) => {
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Simulate checking the current password
    if (currentUser.hashedPassword !== currentPassword + '_hashed') {
      setError(t('changePassword.error.wrongCurrent'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('changePassword.error.mismatch'));
      return;
    }

    if(newPassword.length < 6) {
        setError("Le mot de passe doit faire au moins 6 caractères."); // Simple validation
        return;
    }

    // Simulate hashing the new password
    const newHashedPassword = newPassword + '_hashed';
    onSave(newHashedPassword);
    setSuccess(t('changePassword.success'));
    setTimeout(onClose, 1500); // Close modal after success message
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{t('changePassword.title')}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{success}</div>}

        <div className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-1">{t('changePassword.current')}</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">{t('changePassword.new')}</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">{t('changePassword.confirm')}</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
          <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;