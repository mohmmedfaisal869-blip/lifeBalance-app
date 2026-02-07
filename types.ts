
export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
}

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  status: TaskStatus;
  createdAt: number;
  completedAt?: number;
}

export interface SleepHistoryEntry {
  date: string;
  quality: 'good' | 'average' | 'poor';
}

export interface GratitudeNote {
  id: string;
  text: string;
  date: string;
}

export interface UserPreferences {
  language: Language;
  theme: Theme;
  waterGoal: number; // In Liters
  waterIntake: number; // In ml
  lastWaterReset: string;
  wakeupTime: string;
  weekendWakeupTime: string;
  isAlarmEnabled: boolean;
  sleepHistory: SleepHistoryEntry[];
  tasks: Task[];
  archivedTasks: Task[];
  gratitudeNotes: GratitudeNote[];
  streak: number;
  lastActivityDate: string;
  quranPagesGoal: number;
  quranPagesRead: number;
  lastQuranReset: string;
  quranEdition: 'kingFahd' | 'madinah';
  quranTotalPages: number;
  quranStreakDays: number;
}
