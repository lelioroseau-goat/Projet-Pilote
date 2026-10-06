import React, { useState, useEffect } from 'react';
import { Category, SubtaskTemplate } from '../types';
import Modal from './Modal';
import { XIcon, TrashIcon, PlusIcon, ClipboardDocumentListIcon } from './icons';
import { useI18n } from '../contexts/i18n';

interface CategoryFormModalProps {
  category: Category | null;
  onSave: (category: Category) => void;
  onClose: () => void;
}

const getInitialFormData = (category: Category | null): Omit<Category, 'id'> & { id?: string } => {
    if (category) return category;

    return {
        name: '',
        defaultSubtasks: [],
    }
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ category, onSave, onClose }) => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [subtasks, setSubtasks] = useState<SubtaskTemplate[]>([]);
  const isNewCategory = !category;

  useEffect(() => {
    const initialData = getInitialFormData(category);
    setName(initialData.name);
    setSubtasks(initialData.defaultSubtasks || []);
  }, [category]);

  const handleAddSubtask = () => {
    setSubtasks([...subtasks, { title: '', durationHours: 1 }]);
  };

  const handleSubtaskChange = (index: number, field: 'title' | 'durationHours', value: string | number) => {
    const newSubtasks = [...subtasks];
    if (field === 'durationHours') {
        newSubtasks[index][field] = Number(value) || 0;
    } else {
        newSubtasks[index][field] = value as string;
    }
    setSubtasks(newSubtasks);
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const categoryToSave: Category = {
        id: category?.id || crypto.randomUUID(),
        name,
        defaultSubtasks: subtasks.length > 0 ? subtasks : undefined,
    };
    onSave(categoryToSave);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{isNewCategory ? t('categoryForm.title.create') : t('categoryForm.title.edit')}</h2>
           <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
             <XIcon className="h-6 w-6" />
           </button>
        </div>
        
        <div className="space-y-6">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">{t('categoryForm.label.name')}</label>
                <input type="text" id="name" name="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            
            <fieldset className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <legend className="text-md font-semibold text-slate-800 flex items-center">
                    <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
                    {t('categoryForm.legend.subtasks')}
                </legend>
                <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                    {subtasks.length === 0 && <p className="text-sm text-slate-500 italic text-center py-4">{t('categoryForm.noSubtasks')}</p>}
                    {subtasks.map((sub, index) => (
                        <div key={index} className="flex items-end space-x-2">
                            <div className="flex-grow">
                                <label htmlFor={`subtask-title-${index}`} className="block text-xs font-medium text-slate-600 mb-1">{t('form.label.subtaskTitle')}</label>
                                <input
                                    id={`subtask-title-${index}`}
                                    type="text"
                                    placeholder={t('form.placeholder.subtaskTitle')}
                                    value={sub.title}
                                    onChange={(e) => handleSubtaskChange(index, 'title', e.target.value)}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md shadow-sm text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor={`subtask-duration-${index}`} className="block text-xs font-medium text-slate-600 mb-1">{t('form.label.subtaskDuration')}</label>
                                <input
                                    id={`subtask-duration-${index}`}
                                    type="number"
                                    value={sub.durationHours}
                                    onChange={(e) => handleSubtaskChange(index, 'durationHours', e.target.value)}
                                    min="0"
                                    step="0.5"
                                    className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-md shadow-sm text-sm"
                                    required
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveSubtask(index)}
                                className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors mb-0.5"
                                title={t('common.delete')}
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 pt-2"
                >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    {t('categoryForm.button.addSubtask')}
                </button>
            </fieldset>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">{t('common.cancel')}</button>
          <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">{isNewCategory ? t('common.create') : t('common.save')}</button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryFormModal;