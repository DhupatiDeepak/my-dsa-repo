import type { DocTrackDocument, Habit, Goal, StickyNote, Reminder, ActivityLog, StreakInfo, AchievementBadge, UserSettings } from '../types';
import { 
  DEFAULT_DOCUMENTS, DEFAULT_SETTINGS, DEFAULT_HABITS, 
  DEFAULT_GOALS, DEFAULT_STICKY_NOTES, DEFAULT_REMINDERS, 
  DEFAULT_ACTIVITY_LOGS, DEFAULT_ACHIEVEMENTS 
} from '../utils/mockData';

const KEYS = {
  DOCUMENTS: 'doc_track_docs',
  SETTINGS: 'doc_track_settings',
  HABITS: 'doc_track_habits',
  GOALS: 'doc_track_goals',
  STICKY: 'doc_track_sticky',
  REMINDERS: 'doc_track_reminders',
  LOGS: 'doc_track_logs',
  STREAK: 'doc_track_streak',
  BADGES: 'doc_track_badges',
};

// Simple date formatted YYYY-MM-DD
export const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const storage = {
  getDocuments(): DocTrackDocument[] {
    const data = localStorage.getItem(KEYS.DOCUMENTS);
    if (!data) {
      this.saveDocuments(DEFAULT_DOCUMENTS);
      return DEFAULT_DOCUMENTS;
    }
    return JSON.parse(data);
  },
  saveDocuments(docs: DocTrackDocument[]): void {
    const sanitized = docs.map(({ blobUrl, ...rest }) => rest);
    localStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(sanitized));
  },

  getSettings(): UserSettings {
    const data = localStorage.getItem(KEYS.SETTINGS);
    if (!data) {
      this.saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(data);
  },
  saveSettings(settings: UserSettings): void {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    // Apply styling attributes
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.setAttribute('data-accent', settings.accentColor);
  },

  getHabits(): Habit[] {
    const data = localStorage.getItem(KEYS.HABITS);
    if (!data) {
      this.saveHabits(DEFAULT_HABITS);
      return DEFAULT_HABITS;
    }
    return JSON.parse(data);
  },
  saveHabits(habits: Habit[]): void {
    localStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
  },

  getGoals(): Goal[] {
    const data = localStorage.getItem(KEYS.GOALS);
    if (!data) {
      this.saveGoals(DEFAULT_GOALS);
      return DEFAULT_GOALS;
    }
    return JSON.parse(data);
  },
  saveGoals(goals: Goal[]): void {
    localStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
  },

  getStickyNotes(): StickyNote[] {
    const data = localStorage.getItem(KEYS.STICKY);
    if (!data) {
      this.saveStickyNotes(DEFAULT_STICKY_NOTES);
      return DEFAULT_STICKY_NOTES;
    }
    return JSON.parse(data);
  },
  saveStickyNotes(notes: StickyNote[]): void {
    localStorage.setItem(KEYS.STICKY, JSON.stringify(notes));
  },

  getReminders(): Reminder[] {
    const data = localStorage.getItem(KEYS.REMINDERS);
    if (!data) {
      this.saveReminders(DEFAULT_REMINDERS);
      return DEFAULT_REMINDERS;
    }
    return JSON.parse(data);
  },
  saveReminders(reminders: Reminder[]): void {
    localStorage.setItem(KEYS.REMINDERS, JSON.stringify(reminders));
  },

  getLogs(): ActivityLog[] {
    const data = localStorage.getItem(KEYS.LOGS);
    if (!data) {
      this.saveLogs(DEFAULT_ACTIVITY_LOGS);
      return DEFAULT_ACTIVITY_LOGS;
    }
    return JSON.parse(data);
  },
  saveLogs(logs: ActivityLog[]): void {
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  },

  getStreak(): StreakInfo {
    const data = localStorage.getItem(KEYS.STREAK);
    if (!data) {
      const initial: StreakInfo = { currentStreak: 3, bestStreak: 5, lastActiveDate: getYesterdayStr(), history: [getYesterdayStr()] };
      this.saveStreak(initial);
      return initial;
    }
    return JSON.parse(data);
  },
  saveStreak(streak: StreakInfo): void {
    localStorage.setItem(KEYS.STREAK, JSON.stringify(streak));
  },

  getBadges(): AchievementBadge[] {
    const data = localStorage.getItem(KEYS.BADGES);
    if (!data) {
      this.saveBadges(DEFAULT_ACHIEVEMENTS);
      return DEFAULT_ACHIEVEMENTS;
    }
    return JSON.parse(data);
  },
  saveBadges(badges: AchievementBadge[]): void {
    localStorage.setItem(KEYS.BADGES, JSON.stringify(badges));
  },

  // Log action helper and trigger streak updates & badges checks
  logActivity(type: string, description: string): ActivityLog {
    const logs = this.getLogs();
    const newLog: ActivityLog = {
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      description
    };
    logs.unshift(newLog);
    this.saveLogs(logs.slice(0, 100)); // limit to last 100 logs

    // Streak logic
    this.updateStreakForToday();
    
    return newLog;
  },

  updateStreakForToday(): void {
    const streak = this.getStreak();
    const today = getTodayStr();
    const yesterday = getYesterdayStr();

    if (streak.history.includes(today)) {
      // Already logged activity today, do nothing
      return;
    }

    const history = [...streak.history, today];
    let newStreak = streak.currentStreak;

    if (streak.lastActiveDate === yesterday) {
      // Active consecutive days
      newStreak += 1;
    } else if (streak.lastActiveDate !== today) {
      // Streak broken, reset to 1
      newStreak = 1;
    }

    const newBest = Math.max(streak.bestStreak, newStreak);
    this.saveStreak({
      currentStreak: newStreak,
      bestStreak: newBest,
      lastActiveDate: today,
      history
    });
  }
};
