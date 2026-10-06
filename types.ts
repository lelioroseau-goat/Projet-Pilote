export type Language = 'fr' | 'en' | 'es';

export type BackgroundThemeType = 'default' | 'dark' | 'res_ot' | 'custom';

export interface BackgroundSettings {
  type: BackgroundThemeType;
  customUrl?: string;
  opacity: number; // 10 to 100
  blur: number; // 0 to 10
  darkOverlay: boolean;
}

export const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings = {
  type: 'default',
  customUrl: '',
  opacity: 85,
  blur: 0,
  darkOverlay: true,
};

export const RES_OT_BG_URL = '/backgrounds/res_ot_team_bg.jpg';

export enum Status {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  DONE = 'DONE',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface SubtaskTemplate {
  title: string;
  durationHours: number;
}

export interface Category {
  id: string;
  name: string;
  defaultSubtasks?: SubtaskTemplate[];
}

export interface Team {
  id: string;
  name: string;
  userIds: string[];
  availableCategoryIds: string[];
}

export interface WorkHours {
    start: string; // "HH:mm" format, e.g., "09:00"
    end: string; // "HH:mm" format, e.g., "17:00"
    lunchStart: string; // "HH:mm" format, e.g., "12:00"
    lunchEnd: string; // "HH:mm" format, e.g., "13:30"
}

export interface MicrosoftAuthConfig {
  enabled: boolean;
  tenantId: string;
  clientId: string;
  authorityUrl?: string;
  allowLocalLoginWithSso: boolean;
  autoCreateNewUsers: boolean;
  defaultRoleId: string;
}

export const DEFAULT_MICROSOFT_AUTH_CONFIG: MicrosoftAuthConfig = {
  enabled: false,
  tenantId: '',
  clientId: '',
  authorityUrl: 'https://login.microsoftonline.com/organizations',
  allowLocalLoginWithSso: true,
  autoCreateNewUsers: true,
  defaultRoleId: 'contributor',
};

export const PERMISSIONS = [
    'board_view',
    'dashboard_view',
    'dashboard_view_team',
    'planning_view',
    'tasks_create',
    'tasks_view_all',
    'admin_access',
    'admin_manage_teams',
    'admin_manage_users',
    'admin_manage_roles',
] as const;

export type Permission = typeof PERMISSIONS[number];

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  hashedPassword: string;
  loginAttempts: number;
  avatar: string;
  workHours: WorkHours;
  isActive: boolean;
  language: Language;
  roleIds: string[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  durationHours: number;
}

export interface TaskNote {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string; // ISO date string
  updatedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assigneeId: string | null;
  startDate: string; 
  durationHours: number;
  deadline?: string;
  dueDate?: string;
  completionDate?: string;
  files: File[];
  categoryId: string;
  subtasks?: Subtask[];
  notes?: TaskNote[];
  projectCode?: string; // Centre de coût / Code projet pour la facturation
  isArchived?: boolean;
  archivedAt?: string;
}

export type View = 'board' | 'dashboard' | 'planning' | 'admin' | 'archives';
