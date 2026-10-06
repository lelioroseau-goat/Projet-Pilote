import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useMockData } from '../hooks/useMockData';
import { User, Task, Team, Category, Role, Permission, Status, BackgroundSettings, DEFAULT_BACKGROUND_SETTINGS, MicrosoftAuthConfig, DEFAULT_MICROSOFT_AUTH_CONFIG } from '../types';
import { isWeekend, isPublicHoliday } from '../utils/dateUtils';

interface AppContextType {
    // Raw Data & Setters from useMockData
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    teams: Team[];
    setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    roles: Role[];
    setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
    
    // Session-related data
    currentUser: User | null;
    currentUserPermissions: Set<Permission>;
    handleLogin: (user: User) => void;
    handleLogout: () => void;
    updateLoggedInUser: (updates: Partial<User>) => void;

    // Background & Theme Settings
    backgroundSettings: BackgroundSettings;
    updateBackgroundSettings: (updates: Partial<BackgroundSettings>) => void;

    // Microsoft AD / SSO Auth Config
    microsoftAuthConfig: MicrosoftAuthConfig;
    updateMicrosoftAuthConfig: (updates: Partial<MicrosoftAuthConfig>) => void;

    // Derived data
    visibleTasks: Task[];
    activeUsers: User[];

    // UI State & Handlers
    selectedTask: Task | null;
    isNewTaskModalOpen: boolean;
    openNewTaskModal: () => void;
    closeNewTaskModal: () => void;
    handleSelectTask: (task: Task) => void;
    handleCloseModal: () => void;
    handleUpdateTask: (updatedTask: Task) => void;
    handleAddTask: (taskData: Omit<Task, 'id' | 'status'>) => void;
    handleToggleSubtask: (subtaskId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const mockData = useMockData();
    const { tasks, setTasks, users, setUsers, roles } = mockData;
    
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

    // Background Theme Settings (with local persistence)
    const [backgroundSettings, setBackgroundSettings] = useState<BackgroundSettings>(() => {
        try {
            const saved = localStorage.getItem('app_background_settings');
            if (saved) {
                return { ...DEFAULT_BACKGROUND_SETTINGS, ...JSON.parse(saved) };
            }
        } catch {
            // Ignore localStorage reading issues
        }
        return DEFAULT_BACKGROUND_SETTINGS;
    });

    const updateBackgroundSettings = useCallback((updates: Partial<BackgroundSettings>) => {
        setBackgroundSettings(prev => {
            const next = { ...prev, ...updates };
            try {
                localStorage.setItem('app_background_settings', JSON.stringify(next));
            } catch {
                // Ignore storage errors
            }
            return next;
        });
    }, []);

    // Microsoft Active Directory / Entra ID Auth Settings
    const [microsoftAuthConfig, setMicrosoftAuthConfig] = useState<MicrosoftAuthConfig>(() => {
        try {
            const saved = localStorage.getItem('app_microsoft_auth_config');
            if (saved) {
                return { ...DEFAULT_MICROSOFT_AUTH_CONFIG, ...JSON.parse(saved) };
            }
        } catch {
            // Ignore storage issues
        }
        return DEFAULT_MICROSOFT_AUTH_CONFIG;
    });

    const updateMicrosoftAuthConfig = useCallback((updates: Partial<MicrosoftAuthConfig>) => {
        setMicrosoftAuthConfig(prev => {
            const next = { ...prev, ...updates };
            try {
                localStorage.setItem('app_microsoft_auth_config', JSON.stringify(next));
            } catch {
                // Ignore storage errors
            }
            return next;
        });
    }, []);
    
    const handleLogin = useCallback((user: User) => {
        setCurrentUser(user);
    }, []);

    const handleLogout = useCallback(() => {
        setCurrentUser(null);
    }, []);

    const currentUserPermissions = useMemo(() => {
        if (!currentUser) return new Set<Permission>();
        const userRoles = roles.filter(r => currentUser.roleIds.includes(r.id));
        const permissions = userRoles.flatMap(r => r.permissions);
        return new Set(permissions);
    }, [currentUser, roles]);

    const visibleTasks = useMemo(() => {
        if (!currentUser) return [];
        if (currentUserPermissions.has('tasks_view_all')) {
            return tasks;
        }
        return tasks.filter(task => task.assigneeId === currentUser.id);
    }, [tasks, currentUser, currentUserPermissions]);

    const activeUsers = useMemo(() => users.filter(u => u.isActive), [users]);

    const handleSelectTask = useCallback((task: Task) => {
        setSelectedTask(task);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedTask(null);
    }, []);
    
    const openNewTaskModal = useCallback(() => setIsNewTaskModalOpen(true), []);
    const closeNewTaskModal = useCallback(() => setIsNewTaskModalOpen(false), []);

    const handleUpdateTask = useCallback((updatedTask: Task) => {
        let taskWithCompletionDate = { ...updatedTask };
        const originalTask = tasks.find(t => t.id === updatedTask.id);
    
        if (originalTask) {
            // If status changes to DONE, set completion date to today (or keep user-provided completionDate)
            if (updatedTask.status === Status.DONE && originalTask.status !== Status.DONE) {
                taskWithCompletionDate.completionDate = updatedTask.completionDate || new Date().toISOString();
            } 
            // If status is DONE and no completionDate was present, assign today's date
            else if (updatedTask.status === Status.DONE && !updatedTask.completionDate) {
                taskWithCompletionDate.completionDate = new Date().toISOString();
            }
            // If status changes away from DONE, clear completion date
            else if (updatedTask.status !== Status.DONE && originalTask.status === Status.DONE) {
                delete taskWithCompletionDate.completionDate;
            }
        } else if (updatedTask.status === Status.DONE && !updatedTask.completionDate) {
            taskWithCompletionDate.completionDate = new Date().toISOString();
        }
    
        setTasks(prevTasks =>
            prevTasks.map(task => (task.id === taskWithCompletionDate.id ? taskWithCompletionDate : task))
        );
    
        if (selectedTask && selectedTask.id === taskWithCompletionDate.id) {
            setSelectedTask(taskWithCompletionDate);
        }
    }, [tasks, setTasks, selectedTask]);

    const handleAddTask = useCallback((taskData: Omit<Task, 'id' | 'status'>) => {
        const newTask: Task = {
            id: crypto.randomUUID(),
            status: Status.TODO,
            ...taskData,
        };
        setTasks(prev => [...prev, newTask]);
        closeNewTaskModal();
    }, [setTasks, closeNewTaskModal]);

    const handleToggleSubtask = (subtaskId: string) => {
        if (!selectedTask || !selectedTask.subtasks) return;

        const updatedSubtasks = selectedTask.subtasks.map(sub =>
            sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
        );
        
        const allCompleted = updatedSubtasks.every(s => s.completed);
        const someCompleted = updatedSubtasks.some(s => s.completed);

        let newStatus = selectedTask.status;
        if (allCompleted) {
            newStatus = Status.DONE;
        } else if (someCompleted && newStatus !== Status.IN_PROGRESS) {
            newStatus = Status.IN_PROGRESS;
        } else if (!someCompleted && newStatus !== Status.TODO) {
             newStatus = Status.TODO;
        }


        const updatedTask = { 
            ...selectedTask, 
            subtasks: updatedSubtasks,
            status: newStatus
        };
        
        handleUpdateTask(updatedTask);
    };

    const updateLoggedInUser = useCallback((updates: Partial<User>) => {
        if (!currentUser) return;
        const updatedUser = { ...currentUser, ...updates };
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    }, [currentUser, setUsers]);
    
    const value = {
        ...mockData,
        currentUser,
        currentUserPermissions,
        handleLogin,
        handleLogout,
        updateLoggedInUser,
        backgroundSettings,
        updateBackgroundSettings,
        microsoftAuthConfig,
        updateMicrosoftAuthConfig,
        visibleTasks,
        activeUsers,
        selectedTask,
        isNewTaskModalOpen,
        openNewTaskModal,
        closeNewTaskModal,
        handleSelectTask,
        handleCloseModal,
        handleUpdateTask,
        handleAddTask,
        handleToggleSubtask,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};