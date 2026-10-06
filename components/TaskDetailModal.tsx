import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, TaskNote, Status, Priority } from '../types';
import Modal from './Modal';
import { 
  UserIcon, 
  CalendarIcon, 
  FlagIcon, 
  XIcon, 
  CheckCircleIcon, 
  Bars3Icon, 
  ClockIcon, 
  PaperClipIcon, 
  TagIcon, 
  ClipboardDocumentListIcon, 
  CalendarDaysIcon, 
  CalendarPlusIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon
} from './icons';
import { useI18n } from '../contexts/i18n';
import { useAppContext } from '../contexts/AppContext';

const TaskDetailModal: React.FC = () => {
  const { 
    selectedTask, 
    handleCloseModal,
    handleUpdateTask,
    handleToggleSubtask,
    users,
    activeUsers,
    teams,
    categories,
    currentUser
  } = useAppContext();
  const { t, locale } = useI18n();

  // Cache the selected task data so that when selectedTask becomes null during the exit animation,
  // the modal content remains visible and smoothly fades/scales out.
  const [cachedTask, setCachedTask] = useState<Task | null>(selectedTask);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (selectedTask) {
      setCachedTask(selectedTask);
      setNewNoteContent('');
      setEditingNoteId(null);
      setEditingNoteContent('');
      setIsEditingDescription(false);
      setDescriptionDraft(selectedTask.description || '');
    }
  }, [selectedTask]);

  const activeTask = selectedTask || cachedTask;

  const toDateTimeLocalValue = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const toDateInputValue = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const assignee = useMemo(() => {
    if (!activeTask || !activeTask.assigneeId) return null;
    return users.find(u => u.id === activeTask.assigneeId) || null;
  }, [activeTask, users]);

  const priorityColorClass = (priority: Priority) => {
    switch (priority) {
      case Priority.HIGH: return 'bg-red-100 text-red-800';
      case Priority.MEDIUM: return 'bg-yellow-100 text-yellow-800';
      case Priority.LOW: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const categoriesForSelectedTaskOwner = useMemo(() => {
    if (!activeTask?.assigneeId) return [];
    const userTeam = teams.find(team => team.userIds.includes(activeTask.assigneeId!));
    if (!userTeam) return [];
    return categories.filter(c => userTeam.availableCategoryIds.includes(c.id));
  }, [activeTask, teams, categories]);

  const handleAddToOutlook = () => {
    if (!activeTask) return;

    const startDate = new Date(activeTask.startDate);
    const endDate = new Date(startDate.getTime() + activeTask.durationHours * 60 * 60 * 1000);

    const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
    url.searchParams.append('path', '/calendar/action/compose');
    url.searchParams.append('rru', 'addevent');
    url.searchParams.append('subject', activeTask.title);
    url.searchParams.append('startdt', startDate.toISOString());
    url.searchParams.append('enddt', endDate.toISOString());
    url.searchParams.append('body', (activeTask.description || '').replace(/\n/g, '<br>'));

    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask || !newNoteContent.trim()) return;

    const authorName = currentUser 
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : 'Utilisateur';

    const newNote: TaskNote = {
      id: crypto.randomUUID(),
      authorId: currentUser ? currentUser.id : 'unknown',
      authorName,
      authorAvatar: currentUser?.avatar || `https://i.pravatar.cc/150?u=${currentUser?.id || 'guest'}`,
      content: newNoteContent.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [...(activeTask.notes || []), newNote];
    handleUpdateTask({
      ...activeTask,
      notes: updatedNotes,
    });
    setNewNoteContent('');
  };

  const handleDeleteNote = (noteId: string) => {
    if (!activeTask) return;
    const updatedNotes = (activeTask.notes || []).filter(n => n.id !== noteId);
    handleUpdateTask({
      ...activeTask,
      notes: updatedNotes,
    });
  };

  const handleStartEditNote = (note: TaskNote) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const handleSaveEditNote = (noteId: string) => {
    if (!activeTask || !editingNoteContent.trim()) return;
    const updatedNotes = (activeTask.notes || []).map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          content: editingNoteContent.trim(),
          updatedAt: new Date().toISOString(),
        };
      }
      return note;
    });
    handleUpdateTask({
      ...activeTask,
      notes: updatedNotes,
    });
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['o', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i] || 'o'}`;
  };

  const handleDownloadFile = (file: File) => {
    try {
      if ((file as unknown) instanceof Blob || (file as unknown) instanceof File) {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else if ((file as any).url) {
        window.open((file as any).url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Download error', err);
    }
  };

  const handleAddFiles = (newFileList: FileList | File[]) => {
    if (!activeTask || !newFileList || newFileList.length === 0) return;
    const incomingFiles = Array.from(newFileList);
    const currentFiles = activeTask.files || [];
    handleUpdateTask({
      ...activeTask,
      files: [...currentFiles, ...incomingFiles],
    });
  };

  const handleRemoveFile = (indexToRemove: number) => {
    if (!activeTask) return;
    const currentFiles = activeTask.files || [];
    const updatedFiles = currentFiles.filter((_, i) => i !== indexToRemove);
    handleUpdateTask({
      ...activeTask,
      files: updatedFiles,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  if (!activeTask) return null;

  return (
    <Modal isOpen={Boolean(selectedTask)} onClose={handleCloseModal}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-5">
          <h2 className="text-2xl font-bold text-slate-800">{activeTask.title}</h2>
          <button 
            onClick={handleCloseModal} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label={t('common.cancel')}
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <CheckCircleIcon className="w-6 h-6 text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('modal.status')}</p>
              <select
                value={activeTask.status}
                onChange={(e) => {
                  const newStatus = e.target.value as Status;
                  const newCompletionDate = newStatus === Status.DONE
                    ? (activeTask.completionDate || new Date().toISOString())
                    : undefined;
                  handleUpdateTask({
                    ...activeTask,
                    status: newStatus,
                    completionDate: newCompletionDate,
                  });
                }}
                className="font-semibold text-slate-700 bg-transparent border-none focus:ring-0 p-0 text-sm w-full cursor-pointer"
              >
                {Object.values(Status).map(s => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <FlagIcon className="w-6 h-6 text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('modal.priority')}</p>
              <select
                value={activeTask.priority}
                onChange={(e) => handleUpdateTask({ ...activeTask, priority: e.target.value as Priority })}
                className={`font-semibold bg-transparent border-none focus:ring-0 p-0 text-sm w-full cursor-pointer ${priorityColorClass(activeTask.priority).replace('bg-', 'text-')}`}
              >
                {Object.values(Priority).map(p => <option key={p} value={p}>{t(`priority.${p}`)}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <UserIcon className="w-6 h-6 text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('modal.assignee')}</p>
              <select
                value={activeTask.assigneeId || ''}
                onChange={(e) => {
                  const newAssigneeId = e.target.value || null;
                  let newCategoryId = activeTask.categoryId;

                  if (newAssigneeId) {
                    const userTeam = teams.find(team => team.userIds.includes(newAssigneeId));
                    const newAvailableCategoryIds = userTeam ? userTeam.availableCategoryIds : [];
                    if (!newAvailableCategoryIds.includes(activeTask.categoryId)) {
                      newCategoryId = newAvailableCategoryIds[0] || '';
                    }
                  }
                  
                  handleUpdateTask({ 
                    ...activeTask, 
                    assigneeId: newAssigneeId,
                    categoryId: newCategoryId
                  });
                }}
                className="font-semibold text-slate-700 bg-transparent border-none focus:ring-0 p-0 text-sm w-full cursor-pointer truncate"
              >
                <option value="">{t('modal.unassigned')}</option>
                {activeUsers.map(u => <option key={u.id} value={u.id}>{`${u.firstName} ${u.lastName}`}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <TagIcon className="w-6 h-6 text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('modal.category')}</p>
              <select
                value={activeTask.categoryId}
                onChange={(e) => handleUpdateTask({ ...activeTask, categoryId: e.target.value })}
                className="font-semibold text-slate-700 bg-transparent border-none focus:ring-0 p-0 text-sm w-full cursor-pointer truncate"
                disabled={!activeTask.assigneeId || categoriesForSelectedTaskOwner.length === 0}
              >
                {categoriesForSelectedTaskOwner.length === 0 && <option>{t('modal.noCategory')}</option>}
                {categoriesForSelectedTaskOwner.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Section Date de Clôture (affichée lorsque la tâche est terminée) */}
        {activeTask.status === Status.DONE && (
          <div className="mb-6 p-4 bg-emerald-50/90 rounded-xl border border-emerald-200/90 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start sm:items-center space-x-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-emerald-950">
                      {t('modal.closureDate')}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-200 text-emerald-900">
                      {t('status.DONE')}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-850 mt-0.5">
                    {activeTask.completionDate
                      ? t('modal.closedOn', {
                          date: new Date(activeTask.completionDate).toLocaleString(locale, {
                            dateStyle: 'full',
                            timeStyle: 'short',
                          }),
                        })
                      : t('modal.closureDateDesc')}
                  </p>
                </div>
              </div>

              {/* Éditeur rapide de la date de clôture */}
              <div className="flex items-center space-x-2 self-start sm:self-center">
                <div className="flex items-center bg-white px-2.5 py-1.5 rounded-lg border border-emerald-300 text-xs shadow-xs focus-within:ring-2 focus-within:ring-emerald-500">
                  <CalendarIcon className="w-4 h-4 text-emerald-600 mr-1.5 shrink-0" />
                  <input
                    type="datetime-local"
                    value={
                      activeTask.completionDate
                        ? (() => {
                            const d = new Date(activeTask.completionDate);
                            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                            return d.toISOString().slice(0, 16);
                          })()
                        : (() => {
                            const d = new Date();
                            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                            return d.toISOString().slice(0, 16);
                          })()
                    }
                    onChange={(e) => {
                      if (e.target.value) {
                        handleUpdateTask({
                          ...activeTask,
                          completionDate: new Date(e.target.value).toISOString(),
                        });
                      }
                    }}
                    className="bg-transparent border-none text-xs text-emerald-950 font-medium focus:ring-0 p-0 cursor-pointer"
                    title={t('modal.changeClosureDate')}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateTask({
                      ...activeTask,
                      completionDate: new Date().toISOString(),
                    });
                  }}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs flex items-center space-x-1 cursor-pointer"
                  title={t('modal.setToday')}
                >
                  <span>{t('modal.setToday')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section Description */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-slate-700 flex items-center">
              <Bars3Icon className="w-5 h-5 mr-2 text-slate-500" />
              {t('modal.description')}
            </h3>
            {!isEditingDescription ? (
              <button
                type="button"
                onClick={() => {
                  setDescriptionDraft(activeTask.description || '');
                  setIsEditingDescription(true);
                }}
                className="inline-flex items-center space-x-1 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <PencilSquareIcon className="w-3.5 h-3.5" />
                <span>{t('modal.editDescription')}</span>
              </button>
            ) : null}
          </div>
          {isEditingDescription ? (
            <div className="space-y-2">
              <textarea
                value={descriptionDraft}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('form.placeholder.description')}
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditingDescription(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                >
                  {t('modal.cancelDescription')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateTask({ ...activeTask, description: descriptionDraft });
                    setIsEditingDescription(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs cursor-pointer"
                >
                  {t('modal.saveDescription')}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100 whitespace-pre-wrap text-sm leading-relaxed">
              {activeTask.description || t('form.placeholder.description')}
            </p>
          )}
        </div>

        {activeTask.subtasks && activeTask.subtasks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-base font-semibold text-slate-700 mb-2 flex items-center">
              <ClipboardDocumentListIcon className="w-5 h-5 mr-2 text-slate-500" />
              {t('modal.subtasks')}
            </h3>
            <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100 max-h-60 overflow-y-auto">
              {activeTask.subtasks.map(subtask => (
                <label key={subtask.id} className="flex items-center p-2 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => handleToggleSubtask(subtask.id)}
                    className="appearance-none h-5 w-5 cursor-pointer rounded-sm border-2 border-slate-400 bg-white checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 checked:bg-[url('data:image/svg+xml,%3csvg viewBox=%220 0 16 16%22 fill=%22white%22 xmlns=%22http://www.w3.org/2000/svg%22%3e%3cpath d=%22M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z%22/%3e%3c/svg%3e')] bg-center bg-no-repeat"
                  />
                  <span className={`ml-3 text-sm text-slate-700 ${subtask.completed ? 'line-through text-slate-400' : ''}`}>
                    {subtask.title}
                  </span>
                  <span className="ml-auto text-xs font-medium text-slate-500">({subtask.durationHours}h)</span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        {/* Progress Notes & Comments Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-semibold text-slate-700">
                {t('modal.notes')}
              </h3>
              <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                — {t('modal.notesSubtitle')}
              </span>
            </div>
            {activeTask.notes && activeTask.notes.length > 0 && (
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                {t('modal.notesCount', { count: activeTask.notes.length })}
              </span>
            )}
          </div>

          {/* List of existing notes */}
          <div className="space-y-3 mb-4">
            {(!activeTask.notes || activeTask.notes.length === 0) ? (
              <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <ChatBubbleLeftRightIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t('modal.noNotes')}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {activeTask.notes.map((note) => {
                  const isEditing = editingNoteId === note.id;
                  const formattedDate = new Date(note.createdAt).toLocaleString(locale, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  });

                  return (
                    <div 
                      key={note.id} 
                      className="p-3.5 bg-slate-50 hover:bg-slate-50/90 rounded-xl border border-slate-200/80 transition-all text-sm group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={note.authorAvatar || `https://i.pravatar.cc/150?u=${note.authorId}`}
                            alt={note.authorName}
                            className="w-6 h-6 rounded-full border border-slate-200 object-cover"
                          />
                          <div>
                            <span className="font-semibold text-xs text-slate-800 mr-2">
                              {note.authorName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {formattedDate}
                              {note.updatedAt && <span className="italic ml-1">(modifié)</span>}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isEditing && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEditNote(note)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition-colors"
                                title={t('modal.editNote')}
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteNote(note.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                                title={t('modal.deleteNote')}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={editingNoteContent}
                            onChange={(e) => setEditingNoteContent(e.target.value)}
                            rows={2}
                            className="w-full text-xs p-2.5 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-slate-800"
                            autoFocus
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={handleCancelEditNote}
                              className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                            >
                              {t('modal.cancelNote')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditNote(note.id)}
                              className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-xs"
                            >
                              {t('modal.saveNote')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap pl-8">
                          {note.content}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* New note input form */}
          <form onSubmit={handleAddNote} className="space-y-2">
            <div className="relative">
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder={t('modal.addNotePlaceholder')}
                rows={2}
                className="w-full p-3 pr-24 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400 text-slate-700"
              />
              <button
                type="submit"
                disabled={!newNoteContent.trim()}
                className="absolute right-2.5 bottom-3.5 inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>{t('modal.addNote')}</span>
              </button>
            </div>
          </form>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${activeTask.completionDate ? 'lg:grid-cols-5' : 'md:grid-cols-4'} gap-4 mb-6`}>
          {/* Date de début */}
          <div className="flex items-center space-x-3 bg-slate-50 hover:bg-slate-100/80 p-3 rounded-lg border border-slate-200 transition-colors">
            <CalendarDaysIcon className="w-6 h-6 text-indigo-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <label htmlFor="modal-startDate" className="text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer">
                  {t('modal.startDate')}
                </label>
                <PencilSquareIcon className="w-3.5 h-3.5 text-slate-400 opacity-60" />
              </div>
              <input
                id="modal-startDate"
                type="datetime-local"
                value={toDateTimeLocalValue(activeTask.startDate)}
                onChange={(e) => {
                  if (e.target.value) {
                    handleUpdateTask({
                      ...activeTask,
                      startDate: new Date(e.target.value).toISOString(),
                    });
                  }
                }}
                title={t('modal.clickToEdit')}
                className="font-semibold text-slate-700 bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded p-0 text-xs sm:text-sm w-full cursor-pointer"
              />
            </div>
          </div>

          {/* Durée */}
          <div className="flex items-center space-x-3 bg-slate-50 hover:bg-slate-100/80 p-3 rounded-lg border border-slate-200 transition-colors">
            <ClockIcon className="w-6 h-6 text-amber-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <label htmlFor="modal-duration" className="text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer">
                  {t('modal.duration')}
                </label>
                <PencilSquareIcon className="w-3.5 h-3.5 text-slate-400 opacity-60" />
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  id="modal-duration"
                  type="number"
                  min="0.25"
                  step="0.5"
                  value={activeTask.durationHours ?? ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val >= 0) {
                      handleUpdateTask({ ...activeTask, durationHours: val });
                    }
                  }}
                  title={t('modal.clickToEdit')}
                  className="font-semibold text-slate-700 bg-transparent border-none focus:ring-1 focus:ring-amber-500 rounded p-0 text-sm w-16 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-500">{t('modal.hours')}</span>
              </div>
            </div>
          </div>

          {/* Date limite */}
          <div className="flex items-center space-x-3 bg-slate-50 hover:bg-slate-100/80 p-3 rounded-lg border border-slate-200 transition-colors">
            <CalendarIcon className="w-6 h-6 text-rose-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <label htmlFor="modal-deadline" className="text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer">
                  {t('modal.deadline')}
                </label>
                {activeTask.deadline ? (
                  <button
                    type="button"
                    onClick={() => handleUpdateTask({ ...activeTask, deadline: undefined })}
                    title={t('modal.clearDeadline')}
                    className="text-[11px] font-medium text-slate-400 hover:text-rose-600 transition-colors flex items-center space-x-0.5 cursor-pointer"
                  >
                    <XIcon className="w-3 h-3" />
                    <span>{t('modal.cancelNote')}</span>
                  </button>
                ) : (
                  <PencilSquareIcon className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                )}
              </div>
              <input
                id="modal-deadline"
                type="date"
                value={toDateInputValue(activeTask.deadline)}
                onChange={(e) => {
                  handleUpdateTask({
                    ...activeTask,
                    deadline: e.target.value ? new Date(e.target.value + 'T23:59:59').toISOString() : undefined,
                  });
                }}
                title={t('modal.clickToEdit')}
                className="font-semibold text-slate-700 bg-transparent border-none focus:ring-1 focus:ring-rose-500 rounded p-0 text-xs sm:text-sm w-full cursor-pointer"
              />
            </div>
          </div>

          {/* Date de clôture (si terminée) */}
          {activeTask.completionDate && (
            <div className="flex items-center space-x-3 bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
              <CheckCircleIcon className="w-6 h-6 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">{t('modal.closureDate')}</p>
                <p className="font-semibold text-emerald-900 text-sm truncate">
                  {new Date(activeTask.completionDate).toLocaleDateString(locale, { dateStyle: 'medium' })}
                </p>
              </div>
            </div>
          )}

          {/* Code Projet */}
          <div className="flex items-center space-x-3 bg-slate-50 hover:bg-slate-100/80 p-3 rounded-lg border border-slate-200 transition-colors">
            <BriefcaseIcon className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('modal.projectCode')}</p>
                <PencilSquareIcon className="w-3.5 h-3.5 text-slate-400 opacity-60" />
              </div>
              <input
                type="text"
                value={activeTask.projectCode || ''}
                onChange={(e) => handleUpdateTask({ ...activeTask, projectCode: e.target.value })}
                placeholder={t('modal.noProjectCode')}
                title={t('modal.clickToEdit')}
                className="font-semibold text-slate-700 bg-transparent border-none focus:ring-1 focus:ring-emerald-500 rounded p-0 text-sm w-full placeholder-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Section Pièces jointes */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-slate-700 flex items-center">
              <PaperClipIcon className="w-5 h-5 mr-2 text-slate-500" />
              <span>{t('modal.attachments')}</span>
              {activeTask.files && activeTask.files.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">
                  {activeTask.files.length}
                </span>
              )}
            </h3>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>{t('modal.addAttachment')}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    handleAddFiles(e.target.files);
                    e.target.value = '';
                  }
                }}
                className="hidden"
              />
            </div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-lg border transition-all ${
              isDraggingFiles
                ? 'border-2 border-dashed border-blue-500 bg-blue-50/60'
                : 'border-slate-200 bg-slate-50/50'
            } p-3 sm:p-4`}
          >
            {activeTask.files && activeTask.files.length > 0 ? (
              <div className="space-y-3">
                <ul className="divide-y divide-slate-100 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                  {activeTask.files.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-2.5 sm:p-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1 mr-3">
                        <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <DocumentTextIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800 truncate" title={file.name}>
                            {file.name}
                          </p>
                          {file.size ? (
                            <p className="text-xs text-slate-400">
                              {formatFileSize(file.size)}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(file)}
                          title={t('modal.downloadAttachment')}
                          className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          title={t('modal.deleteAttachment')}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="pt-1 flex items-center justify-center text-xs text-slate-500">
                  <span>{t('modal.dragDropAttachments')}&nbsp;</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-medium text-blue-600 hover:text-blue-700 underline cursor-pointer"
                  >
                    {t('modal.browseFiles')}
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="py-6 text-center cursor-pointer border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-md transition-colors"
              >
                <PaperClipIcon className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <p className="text-sm text-slate-600 font-medium">
                  {t('modal.dragDropAttachments')}{' '}
                  <span className="text-blue-600 hover:underline">{t('modal.browseFiles')}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {t('modal.noAttachments')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4 flex justify-end">
          <button
            onClick={handleAddToOutlook}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
            aria-label={t('modal.addToOutlook')}
          >
            <CalendarPlusIcon className="w-5 h-5 text-slate-600"/>
            <span>{t('modal.addToOutlook')}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
