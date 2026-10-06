import React, { useState } from 'react';
import { User, Task, Status, Priority, Team, Category, Role, PERMISSIONS, SubtaskTemplate } from '../types';
import { isPublicHoliday, isWeekend } from '../utils/dateUtils';

// Helper to generate past dates
const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  
  // Rewind to the previous working day if the date falls on a weekend or public holiday.
  while(isWeekend(date) || isPublicHoliday(date)) {
    date.setDate(date.getDate() - 1);
  }

  return date.toISOString();
};


// NOTE: This is a simple simulation. In a real application, passwords would be hashed with a strong algorithm (like bcrypt) on the server.
const initialUsers: User[] = [
  { 
    id: 'u1', 
    firstName: 'Alice', 
    lastName: 'Dubois',
    email: 'alice.dubois@example.com',
    hashedPassword: 'password123_hashed',
    loginAttempts: 0,
    avatar: 'https://i.pravatar.cc/150?u=u1',
    workHours: { start: '09:00', lunchStart: '12:00', lunchEnd: '13:30', end: '17:00' },
    isActive: true,
    language: 'fr',
    roleIds: ['admin']
  },
  { 
    id: 'u2', 
    firstName: 'Bob', 
    lastName: 'Leclerc',
    email: 'bob.leclerc@example.com',
    hashedPassword: 'password123_hashed',
    loginAttempts: 0,
    avatar: 'https://i.pravatar.cc/150?u=u2',
    workHours: { start: '09:00', lunchStart: '12:30', lunchEnd: '13:30', end: '17:30' },
    isActive: true,
    language: 'fr',
    roleIds: ['team_lead', 'user']
  },
  { 
    id: 'u3', 
    firstName: 'Chloé', 
    lastName: 'Martin',
    email: 'chloe.martin@example.com',
    hashedPassword: 'password123_hashed',
    loginAttempts: 0,
    avatar: 'https://i.pravatar.cc/150?u=u3',
    workHours: { start: '08:30', lunchStart: '12:00', lunchEnd: '13:00', end: '16:30' },
    isActive: true,
    language: 'en',
    roleIds: ['user']
  },
  { 
    id: 'u4', 
    firstName: 'David', 
    lastName: 'Bernard',
    email: 'david.bernard@example.com',
    hashedPassword: 'password123_hashed',
    loginAttempts: 0,
    avatar: 'https://i.pravatar.cc/150?u=u4',
    workHours: { start: '09:30', lunchStart: '13:00', lunchEnd: '14:00', end: '18:00' },
    isActive: true,
    language: 'es',
    roleIds: ['user']
  },
  { 
    id: 'u5', 
    firstName: 'Paul', 
    lastName: 'Colliot',
    email: 'paul.colliot@exemple.fr',
    hashedPassword: 'admin_hashed',
    loginAttempts: 0,
    avatar: 'https://i.pravatar.cc/150?u=u5',
    workHours: { start: '09:00', lunchStart: '12:00', lunchEnd: '13:00', end: '17:00' },
    isActive: true,
    language: 'fr',
    roleIds: ['admin', 'team_lead']
  },
];

const INTEGRATION_SITE_SUBTASKS_CONFIG: SubtaskTemplate[] = [
    { title: 'Mise en place VPN IPSec', durationHours: 2 },
    { title: 'Mise à jour IP Plan', durationHours: 0.5 },
    { title: 'Paramétrage Jumpbox', durationHours: 0.5 },
    { title: 'Accès aux équipements (Monitoring)', durationHours: 0.5 },
    { title: 'Sharepoint Password', durationHours: 0.5 },
    { title: 'Shareppoint HK SCADA', durationHours: 0.5 },
    { title: 'Récupération des doumentations (Données Lives / Données 10 min / Exploitation / Network Diagram)', durationHours: 1 },
    { title: 'Mis à jour formation SCADA', durationHours: 2 },
    { title: 'Mode opératoire (si nécessaire)', durationHours: 4 },
    { title: 'Donner accès au CC', durationHours: 2 },
    { title: 'Paramétrage Ping Monitoring', durationHours: 0.5 },
    { title: 'Paramétrage SCADAM', durationHours: 1 },
    { title: 'Données 10 minutes', durationHours: 2 },
    { title: 'Alarmes', durationHours: 2 },
    { title: 'Création d\'un outil d\'import (si nécessaire)', durationHours: 8 },
    { title: 'Données Lives', durationHours: 4 }
];


const initialCategories: Category[] = [
    { id: 'cat1', name: 'Projet' },
    { id: 'cat2', name: 'Integration Site', defaultSubtasks: INTEGRATION_SITE_SUBTASKS_CONFIG },
    { id: 'cat3', name: 'Maintenance SCADA' },
    { id: 'cat4', name: 'Mode Opérationnel' },
    { id: 'cat5', name: 'Général' }
];

const categoryNameToId = (name: string) => initialCategories.find(c => c.name === name)?.id || '';

const initialTeams: Team[] = [
    { 
      id: 'team1', 
      name: 'SCADA',
      userIds: ['u1', 'u2', 'u5'],
      availableCategoryIds: [categoryNameToId('Maintenance SCADA'), categoryNameToId('Général'), categoryNameToId('Mode Opérationnel')]
    },
    { 
      id: 'team2', 
      name: 'CMS',
      userIds: ['u3'],
      availableCategoryIds: [categoryNameToId('Integration Site'), categoryNameToId('Général')]
    },
    { 
      id: 'team3', 
      name: 'Projet',
      userIds: ['u4', 'u1'],
      availableCategoryIds: [categoryNameToId('Projet'), categoryNameToId('Integration Site'), categoryNameToId('Général')]
    },
];

const initialRoles: Role[] = [
    {
        id: 'admin',
        name: 'Administrateur',
        permissions: [...PERMISSIONS],
    },
    {
        id: 'team_lead',
        name: 'Chef d\'équipe',
        permissions: [
            'board_view',
            'dashboard_view',
            'dashboard_view_team',
            'planning_view',
            'tasks_create',
            'tasks_view_all',
        ],
    },
    {
        id: 'user',
        name: 'Utilisateur',
        permissions: [
            'board_view',
            'dashboard_view',
            'planning_view',
            'tasks_create',
        ],
    }
];

const initialTasks: Task[] = [
  {
    id: 't1',
    title: 'Concevoir la maquette UI/UX',
    description: 'Créer les maquettes haute-fidélité pour les écrans principaux de l\'application mobile en utilisant Figma.',
    status: Status.IN_PROGRESS,
    priority: Priority.HIGH,
    assigneeId: 'u4',
    startDate: '2024-08-12T09:30:00.000Z',
    durationHours: 6,
    categoryId: categoryNameToId('Projet'),
    projectCode: 'PRJ-2024-001',
    files: [],
    deadline: '2024-08-14T23:59:59.000Z',
    notes: [
      {
        id: 'n1',
        authorId: 'u4',
        authorName: 'David Bernard',
        authorAvatar: 'https://i.pravatar.cc/150?u=u4',
        content: 'Écrans de connexion et tableau de bord validés avec l\'équipe UX.',
        createdAt: daysAgo(2),
      },
      {
        id: 'n2',
        authorId: 'u1',
        authorName: 'Alice Dubois',
        authorAvatar: 'https://i.pravatar.cc/150?u=u1',
        content: 'Penser à adapter les composants pour la vue tablette/desktop.',
        createdAt: daysAgo(1),
      }
    ]
  },
  {
    id: 't2',
    title: 'Développer l\'API d\'authentification',
    description: 'Mettre en place les endpoints pour l\'inscription, la connexion et la déconnexion des utilisateurs avec JWT.',
    status: Status.IN_PROGRESS,
    priority: Priority.HIGH,
    assigneeId: 'u3',
    startDate: '2024-08-13T10:00:00.000Z',
    durationHours: 5,
    categoryId: categoryNameToId('Integration Site'),
    projectCode: 'CC-DEV-8402',
    files: [],
    notes: [
      {
        id: 'n3',
        authorId: 'u3',
        authorName: 'Chloé Martin',
        authorAvatar: 'https://i.pravatar.cc/150?u=u3',
        content: 'Endpoints JWT créés. En cours de rédaction des tests unitaires.',
        createdAt: daysAgo(1),
      }
    ]
  },
  {
    id: 't3',
    title: 'Configurer la base de données',
    description: 'Installer et configurer PostgreSQL pour l\'environnement de développement et de production.',
    status: Status.TODO,
    priority: Priority.MEDIUM,
    assigneeId: 'u2',
    startDate: '2024-08-14T14:00:00.000Z',
    durationHours: 3,
    categoryId: categoryNameToId('Maintenance SCADA'),
    projectCode: 'CC-OPS-1104',
    files: [],
  },
  {
    id: 't4',
    title: 'Rédiger la documentation utilisateur',
    description: 'Écrire un guide de démarrage rapide et une documentation complète pour les utilisateurs finaux.',
    status: Status.TODO,
    priority: Priority.LOW,
    assigneeId: 'u4',
    startDate: '2024-08-14T09:30:00.000Z',
    durationHours: 2,
    categoryId: categoryNameToId('Projet'),
    files: [],
    deadline: '2024-08-20T23:59:59.000Z',
  },
  {
    id: 't5',
    title: 'Effectuer les tests d\'intégration',
    description: 'Tester l\'intégration entre le frontend et le backend pour assurer la communication correcte des données.',
    status: Status.DONE,
    priority: Priority.MEDIUM,
    assigneeId: 'u3',
    startDate: '2024-08-01T10:00:00.000Z',
    durationHours: 4,
    categoryId: categoryNameToId('Integration Site'),
    files: [],
    completionDate: '2024-08-08T16:00:00.000Z',
  },
  {
    id: 't6',
    title: 'Déployer l\'application sur staging',
    description: 'Mettre en place le pipeline CI/CD pour déployer automatiquement les nouvelles versions sur le serveur de test.',
    status: Status.TODO,
    priority: Priority.HIGH,
    assigneeId: null,
    startDate: '2024-08-19T09:00:00.000Z',
    durationHours: 6.5,
    categoryId: categoryNameToId('Projet'),
    files: [],
    deadline: '2024-08-23T23:59:59.000Z',
  },
  {
    id: 't7',
    title: 'Revue de code du module de paiement',
    description: 'Faire une revue de code détaillée du module de paiement développé par l\'équipe B.',
    status: Status.IN_PROGRESS,
    priority: Priority.MEDIUM,
    assigneeId: 'u1',
    startDate: '2024-08-14T13:30:00.000Z',
    durationHours: 1,
    categoryId: categoryNameToId('Général'),
    files: [],
  },
  {
    id: 't8',
    title: 'Optimiser les perfs du dashboard',
    description: 'Analyser et optimiser les requêtes de la base de données pour le tableau de bord principal.',
    status: Status.DONE,
    priority: Priority.LOW,
    assigneeId: 'u2',
    startDate: '2024-08-05T14:00:00.000Z',
    durationHours: 2,
    categoryId: categoryNameToId('Général'),
    files: [],
    completionDate: '2024-08-07T11:00:00.000Z',
  },
  {
    id: 't9',
    title: 'Migration majeure de la base de données',
    description: 'Planifier et exécuter la migration de la base de données de MySQL vers PostgreSQL. Implique un arrêt de service planifié.',
    status: Status.TODO,
    priority: Priority.HIGH,
    assigneeId: 'u1',
    startDate: '2024-08-13T09:00:00.000Z',
    durationHours: 30,
    categoryId: categoryNameToId('Maintenance SCADA'),
    files: [],
    deadline: '2024-08-26T23:59:59.000Z',
  },
  // New completed tasks for testing reports
  {
    id: 't10',
    title: 'Finaliser le rapport de performance Q3',
    description: 'Compiler les données et finaliser le rapport du troisième trimestre.',
    status: Status.DONE,
    priority: Priority.MEDIUM,
    assigneeId: 'u1', // Alice (SCADA, Projet)
    startDate: daysAgo(10),
    durationHours: 8,
    categoryId: categoryNameToId('Général'),
    files: [],
    completionDate: daysAgo(3), // Last week
  },
  {
    id: 't11',
    title: 'Mettre à jour le guide de l\'utilisateur',
    description: 'Intégrer les nouvelles fonctionnalités dans le guide utilisateur.',
    status: Status.DONE,
    priority: Priority.LOW,
    assigneeId: 'u2', // Bob (SCADA)
    startDate: daysAgo(20),
    durationHours: 12,
    categoryId: categoryNameToId('Maintenance SCADA'),
    files: [],
    completionDate: daysAgo(10), // This month
  },
  {
    id: 't12',
    title: 'Corriger le bug d\'affichage sur mobile',
    description: 'Le layout est cassé sur les appareils de petite taille.',
    status: Status.DONE,
    priority: Priority.HIGH,
    assigneeId: 'u3', // Chloé (CMS)
    startDate: daysAgo(7),
    durationHours: 3,
    categoryId: categoryNameToId('Integration Site'),
    files: [],
    completionDate: daysAgo(5), // Last week
  },
  {
    id: 't13',
    title: 'Rechercher des solutions de monitoring',
    description: 'Comparer différentes solutions de monitoring pour notre infrastructure.',
    status: Status.DONE,
    priority: Priority.MEDIUM,
    assigneeId: 'u4', // David (Projet)
    startDate: daysAgo(100),
    durationHours: 16,
    categoryId: categoryNameToId('Projet'),
    files: [],
    completionDate: daysAgo(90), // This year
  },
  {
    id: 't14',
    title: 'Préparer la présentation pour le comité',
    description: 'Créer les diapositives pour la réunion du comité de pilotage.',
    status: Status.DONE,
    priority: Priority.HIGH,
    assigneeId: 'u1', // Alice (SCADA, Projet)
    startDate: daysAgo(70),
    durationHours: 6,
    categoryId: categoryNameToId('Maintenance SCADA'),
    files: [],
    completionDate: daysAgo(60), // This year
  },
  {
    id: 't15',
    title: 'Auditer les accès de sécurité',
    description: 'Vérifier que tous les accès sont conformes à la politique de sécurité.',
    status: Status.DONE,
    priority: Priority.HIGH,
    assigneeId: 'u5', // Paul (SCADA)
    startDate: daysAgo(5),
    durationHours: 8,
    categoryId: categoryNameToId('Général'),
    files: [],
    completionDate: daysAgo(1), // Last week
  },
  {
    id: 't16',
    title: 'Organiser l\'événement d\'équipe',
    description: 'Planifier le prochain team building.',
    status: Status.DONE,
    priority: Priority.LOW,
    assigneeId: 'u2', // Bob (SCADA)
    startDate: daysAgo(45),
    durationHours: 4,
    categoryId: categoryNameToId('Général'),
    files: [],
    completionDate: daysAgo(35), // This year
  }
];

const STORAGE_KEYS = {
  USERS: 'app_db_users',
  TASKS: 'app_db_tasks',
  TEAMS: 'app_db_teams',
  CATEGORIES: 'app_db_categories',
  ROLES: 'app_db_roles',
};

const getStoredData = <T,>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
  }
  return fallback;
};

export const useMockData = () => {
  const [users, setUsersState] = useState<User[]>(() => getStoredData(STORAGE_KEYS.USERS, initialUsers));
  const [tasks, setTasksState] = useState<Task[]>(() => getStoredData(STORAGE_KEYS.TASKS, initialTasks));
  const [teams, setTeamsState] = useState<Team[]>(() => getStoredData(STORAGE_KEYS.TEAMS, initialTeams));
  const [categories, setCategoriesState] = useState<Category[]>(() => getStoredData(STORAGE_KEYS.CATEGORIES, initialCategories));
  const [roles, setRolesState] = useState<Role[]>(() => getStoredData(STORAGE_KEYS.ROLES, initialRoles));

  const setUsers: React.Dispatch<React.SetStateAction<User[]>> = (value) => {
    setUsersState(prev => {
      const next = typeof value === 'function' ? (value as (prev: User[]) => User[])(prev) : value;
      try { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(next)); } catch (e) { console.error(e); }
      return next;
    });
  };

  const setTasks: React.Dispatch<React.SetStateAction<Task[]>> = (value) => {
    setTasksState(prev => {
      const next = typeof value === 'function' ? (value as (prev: Task[]) => Task[])(prev) : value;
      try { localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(next)); } catch (e) { console.error(e); }
      return next;
    });
  };

  const setTeams: React.Dispatch<React.SetStateAction<Team[]>> = (value) => {
    setTeamsState(prev => {
      const next = typeof value === 'function' ? (value as (prev: Team[]) => Team[])(prev) : value;
      try { localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(next)); } catch (e) { console.error(e); }
      return next;
    });
  };

  const setCategories: React.Dispatch<React.SetStateAction<Category[]>> = (value) => {
    setCategoriesState(prev => {
      const next = typeof value === 'function' ? (value as (prev: Category[]) => Category[])(prev) : value;
      try { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(next)); } catch (e) { console.error(e); }
      return next;
    });
  };

  const setRoles: React.Dispatch<React.SetStateAction<Role[]>> = (value) => {
    setRolesState(prev => {
      const next = typeof value === 'function' ? (value as (prev: Role[]) => Role[])(prev) : value;
      try { localStorage.setItem(STORAGE_KEYS.ROLES, JSON.stringify(next)); } catch (e) { console.error(e); }
      return next;
    });
  };

  return { users, setUsers, tasks, setTasks, teams, setTeams, categories, setCategories, roles, setRoles };
};