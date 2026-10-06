import React, { useState, useEffect } from 'react';
import { Role, Permission, PERMISSIONS } from '../types';
import Modal from './Modal';
import { XIcon } from './icons';
import { useI18n } from '../contexts/i18n';

interface RoleFormModalProps {
  role: Role | null;
  onSave: (updatedRole: Role) => void;
  onClose: () => void;
}

const getInitialFormData = (role: Role | null): Omit<Role, 'id'> & { id?: string } => {
    if (role) return role;

    return {
        name: '',
        permissions: [],
    }
}

const RoleFormModal: React.FC<RoleFormModalProps> = ({ role, onSave, onClose }) => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<Set<Permission>>(new Set());
  const isNewRole = !role;

  useEffect(() => {
    const initialData = getInitialFormData(role);
    setName(initialData.name);
    setPermissions(new Set(initialData.permissions));
  }, [role]);

  const handlePermissionToggle = (permission: Permission) => {
    setPermissions(prev => {
        const newPermissions = new Set(prev);
        if (newPermissions.has(permission)) {
            newPermissions.delete(permission);
        } else {
            newPermissions.add(permission);
        }
        return newPermissions;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const roleToSave: Role = {
        id: role?.id || crypto.randomUUID(),
        name,
        permissions: Array.from(permissions),
    };
    onSave(roleToSave);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{isNewRole ? t('roleForm.title.create') : t('roleForm.title.edit')}</h2>
           <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
             <XIcon className="h-6 w-6" />
           </button>
        </div>
        
        <div className="space-y-6">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">{t('roleForm.label.name')}</label>
                <input type="text" id="name" name="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            
            <fieldset>
                <legend className="text-lg font-semibold text-slate-700 mb-3">{t('roleForm.legend.permissions')}</legend>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {PERMISSIONS.map(permission => (
                        <label key={permission} className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-slate-50">
                            <input 
                                type="checkbox" 
                                checked={permissions.has(permission)} 
                                onChange={() => handlePermissionToggle(permission)}
                                className="appearance-none h-4 w-4 cursor-pointer rounded-sm border border-slate-600 bg-white checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 checked:bg-[url('data:image/svg+xml,%3csvg viewBox=%220 0 16 16%22 fill=%22white%22 xmlns=%22http://www.w3.org/2000/svg%22%3e%3cpath d=%22M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z%22/%3e%3c/svg%3e')] bg-center bg-no-repeat"
                            />
                            <span className="text-sm font-medium text-slate-700">{t(`permissions_${permission}`)}</span>
                        </label>
                    ))}
                </div>
            </fieldset>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
          <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">{isNewRole ? t('common.create') : t('common.save')}</button>
        </div>
      </form>
    </Modal>
  );
};

export default RoleFormModal;