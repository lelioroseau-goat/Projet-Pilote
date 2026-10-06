import React, { useState, useEffect } from 'react';
import { User, Language, Role } from '../types';
import Modal from './Modal';
import { XIcon, KeyIcon, EyeIcon, EyeSlashIcon, ArrowPathIcon } from './icons';
import { useI18n, languageMap } from '../contexts/i18n';

interface UserFormModalProps {
  user: User | null;
  roles: Role[];
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

const getInitialFormData = (user: User | null, defaultRoleIds: string[]): User => {
    if (user) return user;

    return {
        id: crypto.randomUUID(),
        firstName: '',
        lastName: '',
        email: '',
        hashedPassword: 'password123_hashed', // Default password for new users
        loginAttempts: 0,
        avatar: `https://i.pravatar.cc/150?u=${crypto.randomUUID()}`,
        isActive: true,
        workHours: { start: '09:00', lunchStart: '12:00', lunchEnd: '13:00', end: '17:00' },
        language: 'fr',
        roleIds: defaultRoleIds,
    }
}

const UserFormModal: React.FC<UserFormModalProps> = ({ user, roles, onSave, onClose }) => {
  const { t } = useI18n();
  const defaultRoleIds = [roles.find(r => r.id === 'user')?.id || roles[0]?.id || ''];
  const [formData, setFormData] = useState<User>(() => getInitialFormData(user, defaultRoleIds));
  const [customPassword, setCustomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlockAccount, setUnlockAccount] = useState(true);
  const isNewUser = !user;
  
  useEffect(() => {
    setFormData(getInitialFormData(user, defaultRoleIds));
    setCustomPassword('');
  }, [user, roles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox' && e.target instanceof HTMLInputElement;
    setFormData(prev => ({ 
        ...prev, 
        [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value 
    }));
  };
  
  const handleWorkHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      workHours: {
        ...prev.workHours,
        [name]: value
      } 
    }));
  };

  const handleRoleChange = (roleId: string, checked: boolean) => {
    setFormData(prev => {
        const currentRoleIds = prev.roleIds || [];
        const newRoleIds = checked 
            ? [...currentRoleIds, roleId]
            : currentRoleIds.filter(id => id !== roleId);

        // A user must have at least one role
        if (newRoleIds.length === 0) {
            return prev;
        }

        return { ...prev, roleIds: newRoleIds };
    });
  };

  const handleGeneratePassword = () => {
    const randomPwd = generateRandomPassword();
    setCustomPassword(randomPwd);
    setShowPassword(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUserData = { ...formData };
    if (customPassword.trim()) {
      finalUserData.hashedPassword = customPassword.trim() + '_hashed';
    }
    if (unlockAccount) {
      finalUserData.loginAttempts = 0;
    }
    onSave(finalUserData);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{isNewUser ? t('userForm.title.create') : t('userForm.title.edit')}</h2>
           <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
             <XIcon className="h-6 w-6" />
           </button>
        </div>
        
        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">{t('userForm.label.firstName')}</label>
                    <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                </div>
                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">{t('userForm.label.lastName')}</label>
                    <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">{t('userForm.label.email')}</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                  <label htmlFor="language" className="block text-sm font-medium text-slate-700 mb-1">{t('userForm.label.language')}</label>
                  <select id="language" name="language" value={formData.language} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    {Object.entries(languageMap).map(([code, { name, flag }]) => (
                      <option key={code} value={code}>{flag} {name}</option>
                    ))}
                  </select>
              </div>
            </div>
            <div>
              <p className="block text-sm font-medium text-slate-700 mb-2">{t('userForm.label.roles')}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-md">
                {roles.map(role => (
                  <label key={role.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.roleIds.includes(role.id)}
                      onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                      className="appearance-none h-4 w-4 cursor-pointer rounded-sm border border-slate-600 bg-white checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 checked:bg-[url('data:image/svg+xml,%3csvg viewBox=%220 0 16 16%22 fill=%22white%22 xmlns=%22http://www.w3.org/2000/svg%22%3e%3cpath d=%22M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z%22/%3e%3c/svg%3e')] bg-center bg-no-repeat"
                    />
                    <span className="text-sm font-medium text-slate-700">{role.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Security & Password Section */}
            <fieldset className="border-t border-slate-200 pt-4">
                <legend className="text-base font-semibold text-slate-700 mb-2 flex items-center">
                  <KeyIcon className="w-5 h-5 mr-2 text-amber-600" />
                  {t('userForm.legend.security')}
                </legend>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <div>
                    <label htmlFor="customPasswordInput" className="block text-xs font-semibold text-slate-600 mb-1">
                      {isNewUser ? t('userForm.label.customPassword') : t('resetPasswordModal.newPassword')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="customPasswordInput"
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        placeholder={isNewUser ? 'password123 (par défaut)' : t('userForm.placeholder.password')}
                        className="block w-full pl-3 pr-20 py-2 bg-white border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                          title={showPassword ? t('resetPasswordModal.hidePassword') : t('resetPasswordModal.showPassword')}
                        >
                          {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {!isNewUser && !customPassword && (
                      <p className="mt-1 text-xs text-slate-500">{t('userForm.help.passwordLeaveBlank')}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="inline-flex items-center text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 px-2.5 py-1.5 rounded transition-colors"
                    >
                      <ArrowPathIcon className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      {t('resetPasswordModal.generateRandom')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPassword('password123');
                        setShowPassword(true);
                      }}
                      className="inline-flex items-center text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 px-2.5 py-1.5 rounded transition-colors"
                    >
                      <KeyIcon className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      {t('resetPasswordModal.resetDefault')}
                    </button>
                  </div>
                </div>
            </fieldset>

            <fieldset className="border-t border-slate-200 pt-4">
                <legend className="text-lg font-semibold text-slate-700 mb-2">{t('userForm.legend.workHours')}</legend>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="start" className="block text-sm font-medium text-slate-700 mb-1">{t('userForm.label.workStart')}</label>
                        <input type="time" id="start" name="start" value={formData.workHours.start} onChange={handleWorkHoursChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                     <div>
                        <label htmlFor="lunchStart" className="block text-sm font-medium text-slate-700 mb-1">{t('userForm.label.lunchStart')}</label>
                        <input type="time" id="lunchStart" name="lunchStart" value={formData.workHours.lunchStart} onChange={handleWorkHoursChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                     <div>
                        <label htmlFor="lunchEnd" className="block text-sm font-medium text-slate-700 mb-1">{t('userForm.label.lunchEnd')}</label>
                        <input type="time" id="lunchEnd" name="lunchEnd" value={formData.workHours.lunchEnd} onChange={handleWorkHoursChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                     <div>
                        <label htmlFor="end" className="block text-sm font-medium text-slate-700 mb-1">{t('userForm.label.workEnd')}</label>
                        <input type="time" id="end" name="end" value={formData.workHours.end} onChange={handleWorkHoursChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                </div>
            </fieldset>
             {!isNewUser && (
                 <div className="border-t border-slate-200 pt-4">
                    <label htmlFor="isActive" className="flex items-center space-x-3 cursor-pointer">
                        <input 
                            type="checkbox" 
                            id="isActive" 
                            name="isActive" 
                            checked={formData.isActive} 
                            onChange={handleChange} 
                            className="appearance-none h-4 w-4 cursor-pointer rounded-sm border border-slate-600 bg-white checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 checked:bg-[url('data:image/svg+xml,%3csvg viewBox=%220 0 16 16%22 fill=%22white%22 xmlns=%22http://www.w3.org/2000/svg%22%3e%3cpath d=%22M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z%22/%3e%3c/svg%3e')] bg-center bg-no-repeat"
                        />
                        <span className="text-sm font-medium text-slate-700">{t('userForm.label.activeUser')}</span>
                    </label>
                 </div>
             )}
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
          <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">{isNewUser ? t('common.create') : t('common.save')}</button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;