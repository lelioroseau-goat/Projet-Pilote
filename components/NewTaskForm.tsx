import React, { useState, useMemo, useEffect } from 'react';
import { User, Task, Priority, Category, Team, Subtask } from '../types';
import { PaperClipIcon, ChevronDownIcon, PlusIcon, TrashIcon, ClipboardDocumentListIcon } from './icons';
import { useI18n } from '../contexts/i18n';
import { useAppContext } from '../contexts/AppContext';

interface NewTaskFormProps {
    users: User[];
    teams: Team[];
    categories: Category[];
    onSave: (task: Omit<Task, 'id' | 'status'>) => void;
    onCancel: () => void;
}

const NewTaskForm: React.FC<NewTaskFormProps> = ({ users, teams, categories, onSave, onCancel }) => {
    const { t } = useI18n();
    const { currentUser } = useAppContext();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [projectCode, setProjectCode] = useState('');
    const [assigneeId, setAssigneeId] = useState<string | null>(null);
    const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
    
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const nowString = now.toISOString().slice(0, 16);
    
    const [startDate, setStartDate] = useState(nowString);
    const [deadline, setDeadline] = useState('');
    const [durationHours, setDurationHours] = useState(1);
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState('');

    const [isChecklistEnabled, setIsChecklistEnabled] = useState(false);
    const [subtasks, setSubtasks] = useState<{ title: string; durationHours: number }[]>([]);
    const [categoryId, setCategoryId] = useState<string>('');
    const [isDefaultChecklist, setIsDefaultChecklist] = useState(false);

    const availableCategories = useMemo(() => {
        if (!assigneeId) return [];
        const team = teams.find(t => t.userIds.includes(assigneeId));
        if (!team) return [];
        return categories.filter(c => team.availableCategoryIds.includes(c.id));
    }, [assigneeId, teams, categories]);
    
    // Auto-load checklist from category
    useEffect(() => {
        const selectedCategory = categories.find(c => c.id === categoryId);
        if (selectedCategory?.defaultSubtasks && selectedCategory.defaultSubtasks.length > 0) {
            setSubtasks(selectedCategory.defaultSubtasks);
            setIsChecklistEnabled(true);
            setIsDefaultChecklist(true);
        } else {
            // Only reset if it was a default checklist before
            if (isDefaultChecklist) {
                setSubtasks([]);
                setIsChecklistEnabled(false);
            }
            setIsDefaultChecklist(false);
        }
    }, [categoryId, categories]);
    
    // Auto-update duration from subtasks
    useEffect(() => {
        if (isChecklistEnabled) {
            const totalDuration = subtasks.reduce((acc, sub) => acc + (Number(sub.durationHours) || 0), 0);
            setDurationHours(totalDuration);
        }
    }, [subtasks, isChecklistEnabled]);

    // Auto-select category when assignee changes
    useEffect(() => {
        if (availableCategories.length > 0 && !availableCategories.some(c => c.id === categoryId)) {
            setCategoryId(availableCategories[0].id);
        } else if (availableCategories.length === 0) {
            setCategoryId('');
        }
    }, [availableCategories, categoryId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleAddSubtask = () => {
        setSubtasks([...subtasks, { title: '', durationHours: 1 }]);
    };

    const handleSubtaskChange = (index: number, field: 'title' | 'durationHours', value: string | number) => {
        const newSubtasks = [...subtasks];
        if (field === 'durationHours') {
            newSubtasks[index][field] = Number(value);
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
        if (!title.trim()) {
            setError(t('form.error.titleRequired'));
            return;
        }
        if (assigneeId && !categoryId) {
            setError(t('form.error.categoryRequired'));
            return;
        }
        const initialNotesList = notes.trim()
            ? [
                {
                    id: crypto.randomUUID(),
                    authorId: currentUser?.id || 'unknown',
                    authorName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Utilisateur',
                    authorAvatar: currentUser?.avatar || `https://i.pravatar.cc/150?u=${currentUser?.id || 'user'}`,
                    content: notes.trim(),
                    createdAt: new Date().toISOString(),
                },
            ]
            : undefined;

        onSave({
            title,
            description,
            notes: initialNotesList,
            projectCode: projectCode.trim() || undefined,
            assigneeId,
            priority,
            startDate: new Date(startDate).toISOString(),
            durationHours: Number(durationHours) || 1,
            categoryId: categoryId,
            deadline: deadline ? new Date(deadline).toISOString() : undefined,
            files,
            subtasks: isChecklistEnabled && subtasks.length > 0
                ? subtasks.map(sub => ({
                    id: crypto.randomUUID(),
                    completed: false,
                    title: sub.title,
                    durationHours: Number(sub.durationHours) || 0,
                  }))
                : undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">{t('form.title.create')}</h2>
                <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

            <div className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">{t('form.label.title')}</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => {
                            setTitle(e.target.value);
                            if (error) setError('');
                        }}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder={t('form.placeholder.title')}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">{t('form.label.description')}</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder={t('form.placeholder.description')}
                    />
                </div>
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                        <span>{t('form.label.notes')}</span>
                        <span className="text-xs font-normal text-slate-400">{t('form.help.notes')}</span>
                    </label>
                    <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder={t('form.placeholder.notes')}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label htmlFor="assigneeId" className="block text-sm font-medium text-slate-700 mb-1 whitespace-nowrap">{t('form.label.assignee')}</label>
                        <div className="relative mt-1">
                            <select
                                id="assigneeId"
                                value={assigneeId || ''}
                                onChange={(e) => setAssigneeId(e.target.value || null)}
                                className="appearance-none block w-full pl-3 pr-10 py-2 text-base bg-white border border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                            >
                                <option value="">{t('form.select.unassigned')}</option>
                                {users.map(u => <option key={u.id} value={u.id}>{`${u.firstName} ${u.lastName}`}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                <ChevronDownIcon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1 whitespace-nowrap">{t('form.label.category')}</label>
                        <div className="relative mt-1">
                            <select
                                id="category"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="appearance-none block w-full pl-3 pr-10 py-2 text-base bg-white border border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm disabled:bg-slate-100"
                                disabled={!assigneeId || availableCategories.length === 0}
                            >
                                {availableCategories.length === 0 && <option>{t('form.select.assigneeFirst')}</option>}
                                {availableCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                <ChevronDownIcon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="projectCode" className="block text-sm font-medium text-slate-700 mb-1 whitespace-nowrap" title={t('form.help.projectCode')}>
                            {t('form.label.projectCode')}
                        </label>
                        <input
                            type="text"
                            id="projectCode"
                            value={projectCode}
                            onChange={(e) => setProjectCode(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder={t('form.placeholder.projectCode')}
                        />
                        <p className="mt-1 text-xs text-slate-500 whitespace-nowrap">{t('form.help.projectCode')}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-1 whitespace-nowrap">{t('form.label.priority')}</label>
                        <div className="relative mt-1">
                            <select
                                id="priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as Priority)}
                                className="appearance-none block w-full pl-3 pr-10 py-2 text-base bg-white border border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                            >
                                {Object.values(Priority).map(p => <option key={p} value={p}>{t(`priority.${p}`)}</option>)}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                <ChevronDownIcon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1 whitespace-nowrap">{t('form.label.startDate')}</label>
                        <input
                            type="datetime-local"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                     <div>
                        <label htmlFor="deadline" className="block text-sm font-medium text-slate-700 mb-1 whitespace-nowrap">{t('form.label.deadline')}</label>
                        <input
                            type="date"
                            id="deadline"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="durationHours" className="block text-sm font-medium text-slate-700 mb-1 whitespace-nowrap">{t('form.label.duration')}</label>
                        <input
                            type="number"
                            id="durationHours"
                            value={durationHours}
                            onChange={(e) => setDurationHours(Number(e.target.value))}
                            min="0.5"
                            step="0.5"
                            readOnly={isChecklistEnabled}
                            className={`mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isChecklistEnabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                        />
                    </div>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="enableChecklist"
                        className="appearance-none h-4 w-4 cursor-pointer rounded-sm border-2 border-slate-400 bg-white checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 checked:bg-[url('data:image/svg+xml,%3csvg viewBox=%220 0 16 16%22 fill=%22white%22 xmlns=%22http://www.w3.org/2000/svg%22%3e%3cpath d=%22M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z%22/%3e%3c/svg%3e')] bg-center bg-no-repeat disabled:opacity-50 disabled:cursor-not-allowed"
                        checked={isChecklistEnabled}
                        onChange={(e) => {
                            setIsChecklistEnabled(e.target.checked);
                            if (isDefaultChecklist) setIsDefaultChecklist(false);
                            if (!e.target.checked) {
                                setSubtasks([]);
                                setDurationHours(1);
                            }
                        }}
                        disabled={isDefaultChecklist}
                    />
                    <label htmlFor="enableChecklist" className="ml-3 block text-sm font-medium text-gray-700">
                        {t('form.label.checklist')}
                    </label>
                </div>

                {isChecklistEnabled && (
                    <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="text-md font-semibold text-slate-800 flex items-center">
                            <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
                            {t('form.label.subtasks')}
                        </h4>
                        <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
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
                                            readOnly={isDefaultChecklist}
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
                                            readOnly={isDefaultChecklist}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSubtask(index)}
                                        className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-0.5"
                                        title={t('common.delete')}
                                        disabled={isDefaultChecklist}
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {!isDefaultChecklist && (
                            <button
                                type="button"
                                onClick={handleAddSubtask}
                                className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mt-2"
                            >
                                <PlusIcon className="w-4 h-4 mr-1" />
                                {t('form.button.addSubtask')}
                            </button>
                        )}
                    </div>
                )}


                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('form.label.attachments')}</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                             <PaperClipIcon className="mx-auto h-10 w-10 text-slate-400" />
                            <div className="flex text-sm text-slate-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                    <span>{t('form.attachments.upload')}</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                                 </label>
                                <p className="pl-1">{t('form.attachments.dragDrop')}</p>
                            </div>
                            <p className="text-xs text-slate-500">
                                {files.length === 0 ? t('form.attachments.none') : t('form.attachments.count', {count: files.length, files: files.map(f => f.name).join(', ')})}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    {t('common.cancel')}
                </button>
                <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    {t('common.createTask')}
                </button>
            </div>
        </form>
    );
};

export default NewTaskForm;