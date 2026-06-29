export type FileType = 'pdf' | 'docx' | 'xlsx' | 'other';
export type DocStatus = 'Not Started' | 'Reading' | 'In Progress' | 'Completed' | 'On Hold' | 'Revision';
export type DocPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ReminderPeriod = 'one-time' | 'daily' | 'weekly' | 'monthly';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DocComment {
  id: string;
  text: string;
  timestamp: string;
  author: string;
}

export interface DocTrackDocument {
  id: string;
  title: string;
  fileName: string;
  fileType: FileType;
  fileSize: string; // e.g. "15 MB"
  pageCount: number; // For PDF/DOCX
  progress: number; // 0 to 100
  status: DocStatus;
  priority: DocPriority;
  category: string;
  tags: string[];
  addedDate: string; // ISO String
  lastViewed: string; // ISO String
  estimatedReadTime: number; // in minutes
  rating: number; // 1 to 5 stars
  pinned: boolean;
  favorite: boolean;
  notes: string; // rich text or markdown notes content
  todos: TodoItem[];
  comments: DocComment[];
  // File-type specific data for interactive simulations:
  xlsxData?: Record<string, string>; // cell key e.g. "A1" -> value "100"
  docxOutline?: string[]; // Doc outline headers
  pdfBookmarks?: number[]; // bookmarked page numbers
  currentPage?: number; // active reading page
  blobUrl?: string; // local blob URL for uploaded files
}

export interface Habit {
  id: string;
  name: string;
  // History of completed dates in format YYYY-MM-DD
  history: string[];
}

export interface Goal {
  id: string;
  title: string;
  progress: number; // 0 to 100
  deadline: string; // YYYY-MM-DD
  pinned: boolean;
}

export interface StickyNote {
  id: string;
  text: string;
  color: 'yellow' | 'blue' | 'green' | 'red' | 'purple';
  pinned: boolean;
  x?: number; // Position for draggable placement
  y?: number;
}

export interface Reminder {
  id: string;
  title: string;
  dateTime: string; // ISO String or YYYY-MM-DDTHH:mm
  period: ReminderPeriod;
  active: boolean;
  docId?: string; // Optional linked document
  docTitle?: string; // Cache linked doc title
}

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO string
  type: string; // e.g. 'doc_added', 'todo_completed', 'habit_done'
  description: string;
}

export interface StreakInfo {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  history: string[]; // List of active dates (YYYY-MM-DD)
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string; // ISO String
}

export interface UserSettings {
  theme: 'dark' | 'light';
  accentColor: 'cyan' | 'emerald' | 'purple' | 'amber';
  compactMode: boolean;
  gridView: boolean;
}
