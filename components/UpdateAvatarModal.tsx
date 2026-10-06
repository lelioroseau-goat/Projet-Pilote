import React, { useState, useRef } from 'react';
import { User } from '../types';
import Modal from './Modal';
import { XIcon, CameraIcon } from './icons';
import { useI18n } from '../contexts/i18n';

interface UpdateAvatarModalProps {
  currentUser: User;
  onSave: (newAvatarDataUrl: string) => void;
  onClose: () => void;
}

const UpdateAvatarModal: React.FC<UpdateAvatarModalProps> = ({ currentUser, onSave, onClose }) => {
  const { t } = useI18n();
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (newAvatarPreview) {
      onSave(newAvatarPreview);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  }

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="p-6 bg-white rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{t('avatarModal.title')}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-around gap-8 mb-8">
            <div className="text-center">
                <p className="font-semibold text-slate-600 mb-2">{t('avatarModal.current')}</p>
                <img src={currentUser.avatar} alt="Current Avatar" className="w-32 h-32 rounded-full object-cover shadow-md" />
            </div>
             <div className="text-center">
                <p className="font-semibold text-slate-600 mb-2">{t('avatarModal.new')}</p>
                <div 
                    className="w-32 h-32 rounded-full object-cover shadow-md bg-slate-200 flex items-center justify-center cursor-pointer relative group"
                    onClick={triggerFileSelect}
                >
                    {newAvatarPreview ? (
                        <img src={newAvatarPreview} alt="New Avatar Preview" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <CameraIcon className="w-12 h-12 text-slate-400 group-hover:text-slate-500 transition" />
                    )}
                     <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center rounded-full transition-opacity">
                         <CameraIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        
        <div className="flex justify-center mb-6">
             <button
                type="button"
                onClick={triggerFileSelect}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                {t('avatarModal.selectFile')}
            </button>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
          <button 
            type="button" 
            onClick={handleSave} 
            disabled={!newAvatarPreview}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UpdateAvatarModal;