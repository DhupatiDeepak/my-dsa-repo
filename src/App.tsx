import { useState, useEffect } from 'react';
import { 
  FileText, Calendar as CalendarIcon, CheckSquare, Star, Folder, 
  Flame, Award, Search, Moon, Sun, Settings as SettingsIcon, 
  PanelLeftClose, PanelLeft, Plus, Trash2, Pin, Grid, X, 
  Clock, Bell, User, Sparkles, FolderClosed, BookOpen, AlertTriangle, Edit2
} from 'lucide-react';

import type { DocTrackDocument, Habit, Goal, StickyNote, Reminder, ActivityLog, StreakInfo, AchievementBadge, UserSettings, DocStatus, FileType } from './types';
import { storage, getTodayStr } from './services/storage';
import { DEFAULT_GOALS, DEFAULT_STICKY_NOTES, DEFAULT_REMINDERS, DEFAULT_ACTIVITY_LOGS, DEFAULT_ACHIEVEMENTS } from './utils/mockData';

// Component Imports
import { Pomodoro } from './components/Pomodoro';
import { StickyWall } from './components/StickyWall';
import { Habits } from './components/Habits';
import { Achievements } from './components/Achievements';
import { ActivityLogs } from './components/ActivityLogs';
import { Kanban } from './components/Kanban';
import { Calendar } from './components/Calendar';
import { Settings } from './components/Settings';
import { DocReader } from './components/DocReader';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'documents' | 'kanban' | 'calendar' | 'habits' | 'achievements' | 'sticky' | 'history' | 'settings'>('dashboard');
  
  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Core LocalStorage State
  const [documents, setDocuments] = useState<DocTrackDocument[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [streak, setStreak] = useState<StreakInfo>({ currentStreak: 0, bestStreak: 0, lastActiveDate: '', history: [] });
  const [badges, setBadges] = useState<AchievementBadge[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ theme: 'dark', accentColor: 'cyan', compactMode: false, gridView: true });

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocTrackDocument | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [activeFolderFilter, setActiveFolderFilter] = useState<string>('All');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('All');

  // Modal forms
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState<FileType>('pdf');
  const [newDocSize, setNewDocSize] = useState('5.0 MB');
  const [newDocPages, setNewDocPages] = useState(20);
  const [newDocCategory, setNewDocCategory] = useState('DSA');
  const [newDocPriority, setNewDocPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [newDocTags, setNewDocTags] = useState('');
  const [editingDoc, setEditingDoc] = useState<DocTrackDocument | null>(null);
  const [editDocTitle, setEditDocTitle] = useState('');
  const [editDocCategory, setEditDocCategory] = useState('');
  const [editDocPriority, setEditDocPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [editDocTags, setEditDocTags] = useState('');
  const [editDocSize, setEditDocSize] = useState('');
  const [editDocPages, setEditDocPages] = useState(1);
  const newDocRating = 4;
  const [uploadedFileData, setUploadedFileData] = useState<{ xlsx?: Record<string, string>; notesText?: string; blobUrl?: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [docToDelete, setDocToDelete] = useState<{ id: string; title: string } | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalProgress, setGoalProgress] = useState(0);
  const [goalDeadline, setGoalDeadline] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Speed Dial FAB
  const [fabOpen, setFabOpen] = useState(false);

  // Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Alarm Alerts modal
  const [activeAlarm, setActiveAlarm] = useState<Reminder | null>(null);

  // Load and apply themes
  useEffect(() => {
    // Initial storage loads
    setDocuments(storage.getDocuments());
    setHabits(storage.getHabits());
    setGoals(storage.getGoals());
    setStickyNotes(storage.getStickyNotes());
    setReminders(storage.getReminders());
    setLogs(storage.getLogs());
    setStreak(storage.getStreak());
    setBadges(storage.getBadges());
    
    const initialSettings = storage.getSettings();
    setSettings(initialSettings);
    storage.saveSettings(initialSettings); // apply themes to documentElement
  }, []);

  // Check alarm schedule loops
  useEffect(() => {
    const checkAlarms = () => {
      const activeReminders = storage.getReminders();
      const now = new Date();
      const currentHoursMinutes = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayStr = getTodayStr();

      activeReminders.forEach((rem) => {
        if (!rem.active) return;
        
        const remDateStr = rem.dateTime.split('T')[0];
        const remTimeStr = rem.dateTime.split('T')[1] || '09:00';

        // Check if reminder is due
        const dateMatch = rem.period === 'daily' || remDateStr === todayStr;
        const timeMatch = remTimeStr.startsWith(currentHoursMinutes);

        if (dateMatch && timeMatch) {
          // Play Synthetic sound alarm and open modal!
          setActiveAlarm(rem);
          // Auto deactivate if one-time
          if (rem.period === 'one-time') {
            const updated = activeReminders.map(r => r.id === rem.id ? { ...r, active: false } : r);
            storage.saveReminders(updated);
            setReminders(updated);
          }
        }
      });
    };

    const interval = setInterval(checkAlarms, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminders]);

  // Toast Helper
  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Log action wrapper
  const logAction = (type: string, desc: string) => {
    const newLog = storage.logActivity(type, desc);
    setLogs(prev => [newLog, ...prev]);
    setStreak(storage.getStreak()); // sync streak widget changes
    checkBadgeAchievements();
  };

  // Evaluate Achievement Badge Unlocks
  const checkBadgeAchievements = () => {
    const currentDocs = storage.getDocuments();
    const currentLogs = storage.getLogs();
    const currentStreak = storage.getStreak();
    const activeBadges = storage.getBadges();
    let updated = false;

    const nextBadges = activeBadges.map((badge) => {
      if (badge.unlocked) return badge;

      let unlockCondition = false;
      if (badge.id === 'a2' && currentStreak.currentStreak >= 7) unlockCondition = true;
      if (badge.id === 'a5' && currentLogs.filter(l => l.type === 'todo_completed').length >= 10) unlockCondition = true;
      if (badge.id === 'a6' && currentDocs.some(d => d.category === 'DSA' && d.status === 'Completed')) unlockCondition = true;
      
      if (unlockCondition) {
        updated = true;
        addToast(`🏆 Achievement Unlocked: ${badge.title}!`, 'success');
        return {
          ...badge,
          unlocked: true,
          unlockedAt: new Date().toISOString()
        };
      }
      return badge;
    });

    if (updated) {
      storage.saveBadges(nextBadges);
      setBadges(nextBadges);
    }
  };

  // State handlers syncing with storage
  const handleUpdateDocuments = (nextDocs: DocTrackDocument[]) => {
    storage.saveDocuments(nextDocs);
    setDocuments(nextDocs);
  };

  const handleUpdateHabits = (nextHabits: Habit[]) => {
    storage.saveHabits(nextHabits);
    setHabits(nextHabits);
  };

  const handleUpdateSettings = (nextSettings: UserSettings) => {
    storage.saveSettings(nextSettings);
    setSettings(nextSettings);
  };

  const handleUpdateStickyNotes = (nextNotes: StickyNote[]) => {
    storage.saveStickyNotes(nextNotes);
    setStickyNotes(nextNotes);
  };

  const handleUpdateStreak = (nextStreak: StreakInfo) => {
    storage.saveStreak(nextStreak);
    setStreak(nextStreak);
  };

  const handleAddReminder = (newRem: Reminder) => {
    const nextReminders = [...reminders, newRem];
    storage.saveReminders(nextReminders);
    setReminders(nextReminders);
    logAction('reminder_added', `Scheduled reminder: ${newRem.title}`);
    addToast('Reminder scheduled successfully!', 'success');
  };

  const handleDeleteReminder = (id: string) => {
    const nextReminders = reminders.filter(r => r.id !== id);
    storage.saveReminders(nextReminders);
    setReminders(nextReminders);
    logAction('reminder_deleted', `Deleted scheduled reminder.`);
    addToast('Reminder deleted successfully.', 'info');
  };

  const handleUpdateReminder = (updated: Reminder) => {
    const nextReminders = reminders.map(r => r.id === updated.id ? updated : r);
    storage.saveReminders(nextReminders);
    setReminders(nextReminders);
    logAction('reminder_updated', `Updated reminder: ${updated.title}`);
    addToast('Reminder updated successfully!', 'success');
  };

  const handleUpdateGoals = (nextGoals: Goal[]) => {
    storage.saveGoals(nextGoals);
    setGoals(nextGoals);
  };

  const handleStartAddGoal = () => {
    setEditingGoal(null);
    setGoalTitle('');
    setGoalProgress(0);
    setGoalDeadline(new Date().toISOString().substring(0, 10));
    setShowGoalModal(true);
  };

  const handleStartEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalTitle(goal.title);
    setGoalProgress(goal.progress);
    setGoalDeadline(goal.deadline);
    setShowGoalModal(true);
  };

  const handleSaveGoal = () => {
    if (!goalTitle.trim()) {
      addToast('Goal title cannot be empty', 'error');
      return;
    }

    if (editingGoal) {
      const nextGoals = goals.map(g => {
        if (g.id === editingGoal.id) {
          return {
            ...g,
            title: goalTitle.trim(),
            progress: goalProgress,
            deadline: goalDeadline
          };
        }
        return g;
      });
      handleUpdateGoals(nextGoals);
      logAction('goal_updated', `Updated goal: ${goalTitle}`);
      addToast(`Goal "${goalTitle}" updated!`, 'success');
    } else {
      const newGoal: Goal = {
        id: 'goal_' + Math.random().toString(36).substr(2, 9),
        title: goalTitle.trim(),
        progress: goalProgress,
        deadline: goalDeadline,
        pinned: false
      };
      handleUpdateGoals([...goals, newGoal]);
      logAction('goal_added', `Created goal: ${goalTitle}`);
      addToast(`Goal "${goalTitle}" created!`, 'success');
    }
    setShowGoalModal(false);
  };

  const handleDeleteGoal = (id: string, title: string) => {
    const nextGoals = goals.filter(g => g.id !== id);
    handleUpdateGoals(nextGoals);
    logAction('goal_deleted', `Deleted goal: ${title}`);
    addToast(`Goal "${title}" deleted`, 'info');
  };


  const handleDocUpload = (file: File) => {
    const idx = file.name.lastIndexOf('.');
    const title = idx !== -1 ? file.name.substring(0, idx) : file.name;
    setNewDocTitle(title.replace(/_/g, ' ').replace(/\.[a-zA-Z0-9]+$/, ''));

    const ext = idx !== -1 ? file.name.substring(idx + 1).toLowerCase() : '';
    let fileType: FileType = 'other';
    if (ext === 'pdf') fileType = 'pdf';
    else if (ext === 'docx') fileType = 'docx';
    else if (ext === 'xlsx' || ext === 'csv') fileType = 'xlsx';
    setNewDocType(fileType);

    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const sizeStr = parseFloat(sizeMB) > 0.1 ? `${sizeMB} MB` : `${(file.size / 1024).toFixed(0)} KB`;
    setNewDocSize(sizeStr);

    if (fileType === 'pdf') {
      setNewDocPages(Math.max(1, Math.round(file.size / 50000)));
    } else if (fileType === 'docx') {
      setNewDocPages(Math.max(1, Math.round(file.size / 20000)));
    } else {
      setNewDocPages(1);
    }

    const localBlobUrl = URL.createObjectURL(file);
    setUploadedFileData({ blobUrl: localBlobUrl });

    if (ext === 'txt') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setUploadedFileData({ blobUrl: localBlobUrl, notesText: text });
        addToast(`Successfully read text file contents into notes!`, 'success');
      };
      reader.readAsText(file);
    }

    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvText = event.target?.result as string;
        const lines = csvText.split('\n');
        const sheetData: Record<string, string> = {};
        lines.slice(0, 8).forEach((line, rowIndex) => {
          const columns = line.split(',');
          columns.slice(0, 6).forEach((val, colIndex) => {
            const colLetter = String.fromCharCode(65 + colIndex);
            const rowNum = rowIndex + 1;
            sheetData[`${colLetter}${rowNum}`] = val.trim();
          });
        });
        setUploadedFileData({ blobUrl: localBlobUrl, xlsx: sheetData });
        addToast(`Successfully parsed CSV dataset into columns!`, 'success');
      };
      reader.readAsText(file);
    }

    addToast(`Pre-populated details for "${file.name}"!`, 'info');
  };

  // Document management: CRUD operations
  const handleCreateDocument = () => {
    if (!newDocTitle.trim()) {
      addToast('Please enter document title', 'error');
      return;
    }

    const tagsList = newDocTags.split(',').map(t => t.trim()).filter(Boolean);
    
    // Generate default task checklists matching file categories
    const initialChecklist = 
      newDocCategory === 'DSA' ? [
        { id: 'dt1', text: 'Solve basic topics', completed: false },
        { id: 'dt2', text: 'Analyze space-time complexity', completed: false },
        { id: 'dt3', text: 'Write notes on tricky edge cases', completed: false }
      ] : [
        { id: 'dt1', text: 'Draft summary notes', completed: false },
        { id: 'dt2', text: 'Review key terms', completed: false }
      ];

    const newDoc: DocTrackDocument = {
      id: 'doc_' + Math.random().toString(36).substr(2, 9),
      title: newDocTitle.trim(),
      fileName: newDocTitle.trim().replace(/\s+/g, '_') + '.' + newDocType,
      fileType: newDocType,
      fileSize: newDocSize,
      pageCount: newDocPages,
      progress: 0,
      status: 'Not Started',
      priority: newDocPriority,
      category: newDocCategory,
      tags: tagsList,
      addedDate: new Date().toISOString(),
      lastViewed: new Date().toISOString(),
      estimatedReadTime: newDocPages * 2, // 2 mins per page estimate
      rating: newDocRating,
      pinned: false,
      favorite: false,
      notes: uploadedFileData?.notesText || `### Study Notes: ${newDocTitle}\nWrite down key summaries and revision concepts.`,
      todos: initialChecklist,
      comments: [],
      blobUrl: uploadedFileData?.blobUrl
    };

    if (newDocType === 'xlsx') {
      newDoc.xlsxData = uploadedFileData?.xlsx || {
        'A1': 'Expense Title', 'B1': 'Budgeted ($)', 'C1': 'Actual Spent ($)', 'D1': 'Variance ($)',
        'A2': 'Subscriptions', 'B2': '100', 'C2': '80', 'D2': '20',
        'A3': 'Marketing Cost', 'B3': '150', 'C3': '135', 'D3': '15',
        'A4': 'Support Staff', 'B4': '300', 'C4': '310', 'D4': '-10',
        'A5': 'Infrastructure', 'B5': '200', 'C5': '190', 'D5': '10',
        'A6': 'Total Dev Expenses', 'B6': '750', 'C6': '715', 'D6': '35'
      };
    } else if (newDocType === 'docx') {
      newDoc.docxOutline = ['1. Overview & Setup', '2. Essential Methods', '3. Case Studies', '4. Wrap-up summary'];
    }

    handleUpdateDocuments([newDoc, ...documents]);
    setShowAddDocModal(false);
    
    // Clear forms
    setNewDocTitle('');
    setNewDocTags('');
    setUploadedFileData(null);
    
    logAction('doc_added', `Added document: ${newDoc.title}`);
    addToast(`Document "${newDoc.title}" created successfully!`, 'success');
  };

  const handleDeleteDocument = (id: string, title: string) => {
    setDocToDelete({ id, title });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDocument = () => {
    if (!docToDelete) return;
    handleUpdateDocuments(documents.filter(d => d.id !== docToDelete.id));
    logAction('doc_deleted', `Deleted document: ${docToDelete.title}`);
    addToast(`Deleted document "${docToDelete.title}"`, 'info');
    setShowDeleteConfirm(false);
    setDocToDelete(null);
  };

  const handleStartEditDocument = (doc: DocTrackDocument) => {
    setEditingDoc(doc);
    setEditDocTitle(doc.title);
    setEditDocCategory(doc.category);
    setEditDocPriority(doc.priority);
    setEditDocTags(doc.tags.join(', '));
    setEditDocSize(doc.fileSize);
    setEditDocPages(doc.pageCount);
  };

  const handleSaveEditDocument = () => {
    if (!editingDoc) return;
    if (!editDocTitle.trim()) {
      addToast('Document title cannot be empty', 'error');
      return;
    }
    const tagsList = editDocTags.split(',').map(t => t.trim()).filter(Boolean);
    const updatedDocs = documents.map(d => {
      if (d.id === editingDoc.id) {
        return {
          ...d,
          title: editDocTitle.trim(),
          category: editDocCategory,
          priority: editDocPriority,
          tags: tagsList,
          fileSize: editDocSize,
          pageCount: editDocPages,
          estimatedReadTime: editDocPages * 2
        };
      }
      return d;
    });

    handleUpdateDocuments(updatedDocs);
    setEditingDoc(null);
    logAction('doc_updated', `Updated document info for: ${editDocTitle}`);
    addToast(`Document "${editDocTitle}" details updated!`, 'success');
  };

  const handleToggleDocFavorite = (id: string) => {
    const updated = documents.map(d => {
      if (d.id === id) {
        logAction('favorite_toggle', `${d.favorite ? 'Removed' : 'Added'} star: ${d.title}`);
        addToast(d.favorite ? 'Starred removed' : 'Added to Starred favorites!', 'info');
        return { ...d, favorite: !d.favorite };
      }
      return d;
    });
    handleUpdateDocuments(updated);
  };

  const handleToggleDocPinned = (id: string) => {
    const updated = documents.map(d => {
      if (d.id === id) {
        addToast(d.pinned ? 'Unpinned from top' : 'Pinned to dashboard top!', 'info');
        return { ...d, pinned: !d.pinned };
      }
      return d;
    });
    handleUpdateDocuments(updated);
  };

  const handleUpdateDocDetails = (updatedDoc: DocTrackDocument) => {
    const nextDocs = documents.map(d => d.id === updatedDoc.id ? updatedDoc : d);
    handleUpdateDocuments(nextDocs);
    if (selectedDoc && selectedDoc.id === updatedDoc.id) {
      setSelectedDoc(updatedDoc);
    }
  };

  // Kanban status updater
  const handleUpdateDocStatus = (id: string, status: DocStatus) => {
    const updated = documents.map(d => {
      if (d.id === id) {
        logAction('progress_update', `Updated "${d.title}" status to "${status}"`);
        addToast(`Moved task to "${status}"`, 'success');
        return { 
          ...d, 
          status, 
          progress: status === 'Completed' ? 100 : d.progress 
        };
      }
      return d;
    });
    handleUpdateDocuments(updated);
  };

  // Backups and restoration exports
  const handleExportData = () => {
    return JSON.stringify({
      documents: storage.getDocuments(),
      habits: storage.getHabits(),
      goals: storage.getGoals(),
      stickyNotes: storage.getStickyNotes(),
      reminders: storage.getReminders(),
      logs: storage.getLogs(),
      streak: storage.getStreak(),
      badges: storage.getBadges(),
      settings: storage.getSettings()
    });
  };

  const handleImportData = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.documents && parsed.habits && parsed.settings) {
        localStorage.setItem('doc_track_docs', JSON.stringify(parsed.documents));
        localStorage.setItem('doc_track_habits', JSON.stringify(parsed.habits));
        localStorage.setItem('doc_track_goals', JSON.stringify(parsed.goals || DEFAULT_GOALS));
        localStorage.setItem('doc_track_sticky', JSON.stringify(parsed.stickyNotes || DEFAULT_STICKY_NOTES));
        localStorage.setItem('doc_track_reminders', JSON.stringify(parsed.reminders || DEFAULT_REMINDERS));
        localStorage.setItem('doc_track_logs', JSON.stringify(parsed.logs || DEFAULT_ACTIVITY_LOGS));
        localStorage.setItem('doc_track_streak', JSON.stringify(parsed.streak || { currentStreak: 1, bestStreak: 1, lastActiveDate: '', history: [] }));
        localStorage.setItem('doc_track_badges', JSON.stringify(parsed.badges || DEFAULT_ACHIEVEMENTS));
        localStorage.setItem('doc_track_settings', JSON.stringify(parsed.settings));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const triggerResetData = () => {
    setShowResetConfirm(true);
  };

  const confirmResetData = () => {
    localStorage.clear();
    addToast('Application database wiped. Reloading...', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  // Snooze alarm triggers
  const handleSnoozeAlarm = (minutesCount: number) => {
    if (!activeAlarm) return;
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutesCount);
    
    const snoozedRem: Reminder = {
      ...activeAlarm,
      dateTime: now.toISOString().substring(0, 16),
      active: true
    };
    
    // Save to list
    const list = reminders.map(r => r.id === activeAlarm.id ? snoozedRem : r);
    storage.saveReminders(list);
    setReminders(list);
    
    setActiveAlarm(null);
    logAction('alarm_snoozed', `Snoozed alarm "${activeAlarm.title}" for ${minutesCount} mins.`);
    addToast(`Alarm snoozed for ${minutesCount} minutes!`, 'info');
  };

  // Document click opener
  const handleOpenDoc = (doc: DocTrackDocument) => {
    const updated = {
      ...doc,
      lastViewed: new Date().toISOString()
    };
    handleUpdateDocDetails(updated);
    setSelectedDoc(updated);
    setActiveTab('documents'); // redirect if opened from elsewhere
  };

  // Folder categories
  const [foldersList, setFoldersList] = useState<string[]>(() => {
    const saved = localStorage.getItem('doc_track_categories');
    return saved ? JSON.parse(saved) : ['All', 'DSA', 'System Design', 'Resume', 'Projects', 'Office Work', 'College', 'Personal'];
  });

  const saveFoldersList = (nextFolders: string[]) => {
    setFoldersList(nextFolders);
    localStorage.setItem('doc_track_categories', JSON.stringify(nextFolders));
  };

  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [renameCategoryInput, setRenameCategoryInput] = useState('');

  const handleAddCategory = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    if (foldersList.includes(cleanName)) {
      addToast('Category already exists', 'error');
      return;
    }
    const nextList = [...foldersList, cleanName];
    saveFoldersList(nextList);
    logAction('category_added', `Created category: ${cleanName}`);
    addToast(`Category "${cleanName}" created!`, 'success');
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    const cleanNewName = newName.trim();
    if (!cleanNewName || oldName === 'All') return;
    if (foldersList.includes(cleanNewName)) {
      addToast('Category already exists', 'error');
      return;
    }
    const nextList = foldersList.map(c => c === oldName ? cleanNewName : c);
    saveFoldersList(nextList);

    // Update category name in all documents belonging to this category!
    const updatedDocs = documents.map(d => {
      if (d.category === oldName) {
        return { ...d, category: cleanNewName };
      }
      return d;
    });
    handleUpdateDocuments(updatedDocs);
    logAction('category_renamed', `Renamed category ${oldName} to ${cleanNewName}`);
    addToast('Category renamed successfully!', 'success');
  };

  const handleDeleteCategory = (catName: string) => {
    if (catName === 'All' || catName === 'Personal') {
      addToast('Cannot delete system category', 'error');
      return;
    }
    const nextList = foldersList.filter(c => c !== catName);
    saveFoldersList(nextList);

    // Reset documents in deleted category to 'Personal'
    const updatedDocs = documents.map(d => {
      if (d.category === catName) {
        return { ...d, category: 'Personal' };
      }
      return d;
    });
    handleUpdateDocuments(updatedDocs);
    logAction('category_deleted', `Deleted category ${catName}`);
    addToast(`Deleted category "${catName}" (docs moved to Personal)`, 'info');
  };

  // Filtering documents list for displays
  const filteredDocuments = documents.filter((doc) => {
    const matchQuery = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchCategory = activeCategoryFilter === 'All' || doc.category === activeCategoryFilter;
    const matchFolder = activeFolderFilter === 'All' || doc.category === activeFolderFilter;
    const matchStatus = activeStatusFilter === 'All' || doc.status === activeStatusFilter;

    return matchQuery && matchCategory && matchFolder && matchStatus;
  });

  // Calculate Overview Stats
  const totalDocCount = documents.length;
  const pdfCount = documents.filter(d => d.fileType === 'pdf').length;
  const docxCount = documents.filter(d => d.fileType === 'docx').length;
  const xlsxCount = documents.filter(d => d.fileType === 'xlsx').length;
  const completedTasks = documents.reduce((acc, d) => acc + d.todos.filter(t => t.completed).length, 0);
  const pendingTasks = documents.reduce((acc, d) => acc + d.todos.filter(t => !t.completed).length, 0);
  
  // Weekly progress tasks counts (mock stats)
  const weekStats = [
    { day: 'Mon', count: 4 },
    { day: 'Tue', count: 3 },
    { day: 'Wed', count: 5 },
    { day: 'Thu', count: 2 },
    { day: 'Fri', count: 3 },
    { day: 'Sat', count: 1 },
    { day: 'Sun', count: 2 }
  ];

  const maxTaskCount = Math.max(...weekStats.map(s => s.count));

  // Current reading file details
  const currentlyReading = documents.filter(d => d.status === 'Reading' || d.status === 'In Progress').slice(0, 2);


  // Reminders notifications
  const upcomingReminders = reminders.filter(r => r.active).slice(0, 3);

  return (
    <div className="app-container">
      
      {/* 1. Sidebar Panel */}
      <aside className={`glass-panel sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Sparkles size={24} />
          </div>
          <span className="sidebar-header-title" style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '18px' }}>
            DocTrack <span style={{ color: 'var(--accent)' }}>Pro</span>
          </span>
        </div>

        <ul className="sidebar-menu">
          <li>
            <a 
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setActiveTab('dashboard'); setSelectedDoc(null); }}
            >
              <Grid size={18} />
              <span className="sidebar-text">Dashboard</span>
            </a>
          </li>
          <li>
            <a 
              className={`sidebar-item ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => { setActiveTab('documents'); }}
            >
              <Folder size={18} />
              <span className="sidebar-text">Documents</span>
            </a>
          </li>
          <li>
            <a 
              className={`sidebar-item ${activeTab === 'kanban' ? 'active' : ''}`}
              onClick={() => { setActiveTab('kanban'); setSelectedDoc(null); }}
            >
              <CheckSquare size={18} />
              <span className="sidebar-text">Todo Board</span>
            </a>
          </li>
          <li>
            <a 
              className={`sidebar-item ${activeTab === 'calendar' ? 'active' : ''}`}
              onClick={() => { setActiveTab('calendar'); setSelectedDoc(null); }}
            >
              <CalendarIcon size={18} />
              <span className="sidebar-text">Calendar</span>
            </a>
          </li>
          <li>
            <a 
              className={`sidebar-item ${activeTab === 'habits' ? 'active' : ''}`}
              onClick={() => { setActiveTab('habits'); setSelectedDoc(null); }}
            >
              <Flame size={18} />
              <span className="sidebar-text">Consistency</span>
            </a>
          </li>
          <li>
            <a 
              className={`sidebar-item ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => { setActiveTab('achievements'); setSelectedDoc(null); }}
            >
              <Award size={18} />
              <span className="sidebar-text">Achievements</span>
            </a>
          </li>
          <li>
            <a 
              className={`sidebar-item ${activeTab === 'sticky' ? 'active' : ''}`}
              onClick={() => { setActiveTab('sticky'); setSelectedDoc(null); }}
            >
              <FileText size={18} />
              <span className="sidebar-text">Sticky Wall</span>
            </a>
          </li>
          <li>
            <a 
              className={`sidebar-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => { setActiveTab('history'); setSelectedDoc(null); }}
            >
              <Clock size={18} />
              <span className="sidebar-text">Activity Log</span>
            </a>
          </li>
          <li>
            <a 
              className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => { setActiveTab('settings'); setSelectedDoc(null); }}
            >
              <SettingsIcon size={18} />
              <span className="sidebar-text">Settings</span>
            </a>
          </li>
        </ul>

        {/* Sidebar Footer collapse button */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--glass-border)' }}>
          <button 
            className="glass-btn" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ width: '100%', justifyContent: 'center', padding: '6px' }}
          >
            {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      </aside>

      {/* Main Container Area */}
      <div className="main-content">
        
        {/* 2. Header Dashboard */}
        <header className="glass-panel top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Workspace /</span>
            <span style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'capitalize' }}>{activeTab}</span>
          </div>

          {/* Search documents */}
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search files, categories, notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input search-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Streak flame indicator */}
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              onClick={() => setActiveTab('habits')}
              title="View daily streak"
            >
              <Flame className="streak-flame" size={20} />
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{streak.currentStreak} 🔥</span>
            </div>

            {/* Light/Dark fast mode toggle */}
            <button 
              className="glass-btn" 
              onClick={() => {
                const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
                handleUpdateSettings({ ...settings, theme: nextTheme });
              }}
              style={{ padding: '6px' }}
            >
              {settings.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Profile Avatar info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'none' }} className="sidebar-text">Study Pro</span>
            </div>
          </div>
        </header>

        {/* 3. Screen Views router switcher */}
        <main style={{ padding: '24px', flexGrow: 1, overflowY: 'auto' }}>
          
          {/* DASHBOARD TAB VIEW */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Overview grid statistics */}
              <div className="overview-grid">
                
                <div className="glass-card overview-card" onClick={() => setActiveTab('documents')} style={{ cursor: 'pointer' }}>
                  <div className="overview-card-header">
                    <span>Total Files</span>
                    <FileText size={16} />
                  </div>
                  <div className="overview-val">{totalDocCount}</div>
                </div>

                <div className="glass-card overview-card">
                  <div className="overview-card-header">
                    <span>PDF Files</span>
                    <span style={{ fontSize: '11px', color: 'var(--status-reading)', fontWeight: 'bold' }}>PDF</span>
                  </div>
                  <div className="overview-val">{pdfCount}</div>
                </div>

                <div className="glass-card overview-card">
                  <div className="overview-card-header">
                    <span>DOCX Files</span>
                    <span style={{ fontSize: '11px', color: 'var(--status-revision)', fontWeight: 'bold' }}>Word</span>
                  </div>
                  <div className="overview-val">{docxCount}</div>
                </div>

                <div className="glass-card overview-card">
                  <div className="overview-card-header">
                    <span>Excel Sheets</span>
                    <span style={{ fontSize: '11px', color: 'var(--status-completed)', fontWeight: 'bold' }}>XLSX</span>
                  </div>
                  <div className="overview-val">{xlsxCount}</div>
                </div>

                <div className="glass-card overview-card" onClick={() => { setActiveTab('documents'); setActiveStatusFilter('Completed'); }} style={{ cursor: 'pointer' }}>
                  <div className="overview-card-header">
                    <span>Tasks Done</span>
                    <CheckSquare size={16} />
                  </div>
                  <div className="overview-val">{completedTasks}</div>
                </div>

                <div className="glass-card overview-card" onClick={() => { setActiveTab('documents'); setActiveStatusFilter('Reading'); }} style={{ cursor: 'pointer' }}>
                  <div className="overview-card-header">
                    <span>Pending Tasks</span>
                    <Clock size={16} style={{ color: 'var(--color-high)' }} />
                  </div>
                  <div className="overview-val">{pendingTasks}</div>
                </div>

              </div>

              {/* Split layout: Dashboard widgets left / details right */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)', gap: '20px' }}>
                
                {/* Left pane widgets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Currently Reading & Starred list */}
                  <div className="glass-card" style={{ padding: '20px' }}>
                    <h3 style={{ marginBottom: '12px', fontSize: '15px' }}>📖 Currently Reading & Starred Studies</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {currentlyReading.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                          No documents are marked in progress. Click "Open" to start reading files!
                        </div>
                      ) : (
                        currentlyReading.map((doc) => (
                          <div 
                            key={doc.id} 
                            onClick={() => handleOpenDoc(doc)}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              padding: '10px 14px', 
                              background: 'var(--bg-secondary)', 
                              borderRadius: '6px', 
                              cursor: 'pointer',
                              borderLeft: `3px solid var(--accent)`
                            }}
                          >
                            <div>
                              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{doc.title}</span>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {doc.category} • {doc.pageCount} Pages • {doc.progress}% Completed
                              </div>
                            </div>
                            <span style={{ fontSize: '11px', background: 'var(--accent-glow)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px' }}>
                              Continue
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Weekly Progress custom chart */}
                  <div className="glass-card" style={{ padding: '20px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>📈 Tasks Finished (Weekly Progress)</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {weekStats.map((day) => {
                        const widthPct = maxTaskCount > 0 ? (day.count / maxTaskCount) * 100 : 0;
                        return (
                          <div key={day.day} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ width: '35px', fontSize: '12px', color: 'var(--text-secondary)' }}>{day.day}</span>
                            <div style={{ flexGrow: 1, height: '14px', background: 'var(--border-color)', borderRadius: '7px', overflow: 'hidden' }}>
                              <div 
                                style={{ 
                                  width: `${widthPct}%`, 
                                  height: '100%', 
                                  background: 'linear-gradient(90deg, var(--accent) 0%, rgba(var(--accent-rgb), 0.6) 100%)', 
                                  borderRadius: '7px',
                                  transition: 'width 0.5s ease-out'
                                }} 
                              />
                            </div>
                            <span style={{ width: '20px', fontSize: '12px', textAlign: 'right', fontWeight: 'bold' }}>{day.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Sticky Notes Board widget */}
                  <div className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '15px' }}>📌 Sticky Reminders</h3>
                      <button className="glass-btn" onClick={() => setActiveTab('sticky')} style={{ padding: '4px 8px', fontSize: '11px' }}>
                        Open Wall
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {stickyNotes.slice(0, 2).map((note) => (
                        <div key={note.id} className={`sticky-note ${note.color}`} style={{ padding: '12px', height: '110px', fontSize: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '6px' }}>
                          <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', height: '65px' }}>{note.text}</p>
                          <span style={{ fontSize: '9px', opacity: 0.6 }}>Pin Locked: {note.pinned ? 'Yes' : 'No'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right pane widgets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Streak & Consistency panel */}
                  <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Flame className="streak-flame" size={32} />
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{streak.currentStreak} Days Streak</div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Best Record: {streak.bestStreak} Days consistency</span>
                    </div>
                  </div>

                  {/* Focus Pomodoro */}
                  <Pomodoro onSessionComplete={() => {
                    logAction('habit_done', 'Finished 25-minute Pomodoro study sprint!');
                    addToast('Great job! 25-minute Pomodoro focus completed!', 'success');
                  }} />

                  {/* Upcoming Reminders Alarm panel */}
                  <div className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '15px' }}>⏰ Scheduled Reminders</h3>
                      <button className="glass-btn" onClick={() => setActiveTab('calendar')} style={{ padding: '4px 8px', fontSize: '11px' }}>
                        View Scheduler
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {upcomingReminders.length === 0 ? (
                        <div style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                          No reminders scheduled.
                        </div>
                      ) : (
                        upcomingReminders.map((rem) => (
                          <div 
                            key={rem.id} 
                            className="glass-card" 
                            style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{rem.title}</div>
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                {new Date(rem.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {rem.period}
                              </span>
                            </div>
                            <Bell size={12} style={{ color: 'var(--accent)' }} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Goal Milestones progress */}
                  <div className="glass-card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '15px' }}>🎯 Target Goals</h3>
                      <button className="glass-btn" onClick={handleStartAddGoal} style={{ padding: '4px 8px', fontSize: '11px' }}>
                        + Add Goal
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {goals.length === 0 ? (
                        <div style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                          No goals set. Click "+ Add Goal" to track milestones!
                        </div>
                      ) : (
                        goals.map((g) => (
                          <div key={g.id} style={{ paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '4px' }}>
                              <div>
                                <span style={{ fontWeight: 'bold' }}>{g.title}</span>
                                <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: '6px' }}>(Due: {g.deadline})</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong>{g.progress}%</strong>
                                <button onClick={() => handleStartEditGoal(g)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }} title="Edit Goal">
                                  <Edit2 size={10} />
                                </button>
                                <button onClick={() => handleDeleteGoal(g.id, g.title)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }} title="Delete Goal">
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </div>
                            <div style={{ width: '100%', height: '5px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${g.progress}%`, height: '100%', background: 'var(--accent)' }} />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* DOCUMENTS TAB VIEW */}
          {activeTab === 'documents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
              
              {selectedDoc ? (
                /* Subpage: Interactive File Reader pane */
                <DocReader 
                  doc={selectedDoc} 
                  onUpdateDoc={handleUpdateDocDetails} 
                  onClose={() => setSelectedDoc(null)} 
                  onAddToast={addToast}
                />
              ) : (
                /* Main library page */
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div>
                      <h3>📂 Document prep workspace</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Add files and keep notes of PDF reading progress, Excel data inputs, and outline milestones.</p>
                    </div>
                    
                    <button className="glass-btn glass-btn-primary" onClick={() => setShowAddDocModal(true)}>
                      <Plus size={16} /> Add Document
                    </button>
                  </div>

                  {/* Directory / Folders filters */}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    
                    {/* Left Sidebar folder nodes simulation */}
                    <div className="glass-panel" style={{ width: '220px', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                          📁 Categories
                        </span>
                        <button 
                          onClick={() => setShowAddCategoryInput(!showAddCategoryInput)} 
                          style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                          title="Add Category"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {showAddCategoryInput && (
                        <div style={{ display: 'flex', gap: '4px', padding: '4px 8px' }}>
                          <input 
                            type="text" 
                            placeholder="New name..." 
                            value={newCategoryName} 
                            onChange={(e) => setNewCategoryName(e.target.value)} 
                            className="glass-input" 
                            style={{ fontSize: '11px', padding: '4px 8px', flexGrow: 1, minWidth: 0 }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddCategory(newCategoryName);
                                setNewCategoryName('');
                                setShowAddCategoryInput(false);
                              }
                            }}
                            autoFocus
                          />
                          <button 
                            className="glass-btn glass-btn-primary" 
                            onClick={() => {
                              handleAddCategory(newCategoryName);
                              setNewCategoryName('');
                              setShowAddCategoryInput(false);
                            }}
                            style={{ padding: '4px 8px', fontSize: '10px' }}
                          >
                            Add
                          </button>
                        </div>
                      )}

                      {foldersList.map((f) => {
                        const isRenaming = renamingCategory === f;
                        return (
                          <div 
                            key={f}
                            className={`folder-item ${activeFolderFilter === f ? 'active' : ''}`}
                            onClick={() => {
                              if (!isRenaming) {
                                setActiveFolderFilter(f);
                                setActiveCategoryFilter(f);
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: activeFolderFilter === f ? 'bold' : 'normal',
                              color: activeFolderFilter === f ? 'var(--accent)' : 'var(--text-secondary)',
                              background: activeFolderFilter === f ? 'var(--accent-glow)' : 'transparent'
                            }}
                          >
                            {isRenaming ? (
                              <div style={{ display: 'flex', gap: '4px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                                <input 
                                  type="text" 
                                  value={renameCategoryInput} 
                                  onChange={(e) => setRenameCategoryInput(e.target.value)} 
                                  className="glass-input" 
                                  style={{ fontSize: '11px', padding: '2px 6px', flexGrow: 1, minWidth: 0 }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleRenameCategory(f, renameCategoryInput);
                                      setRenamingCategory(null);
                                    }
                                  }}
                                  autoFocus
                                />
                                <button 
                                  className="glass-btn glass-btn-primary" 
                                  onClick={() => {
                                    handleRenameCategory(f, renameCategoryInput);
                                    setRenamingCategory(null);
                                  }}
                                  style={{ padding: '2px 6px', fontSize: '10px' }}
                                >
                                  Save
                                </button>
                                <button 
                                  className="glass-btn" 
                                  onClick={() => setRenamingCategory(null)}
                                  style={{ padding: '2px 4px', fontSize: '10px' }}
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <FolderClosed size={14} />
                                  <span>{f}</span>
                                </div>
                                {f !== 'All' && f !== 'Personal' && (
                                  <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                                    <button 
                                      onClick={() => {
                                        setRenamingCategory(f);
                                        setRenameCategoryInput(f);
                                      }}
                                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                                      title="Rename Category"
                                    >
                                      <Edit2 size={11} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteCategory(f)}
                                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                                      title="Delete Category"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Document library Grid output list */}
                    <div style={{ flexGrow: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      {/* Sub filters */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {(['All', 'Not Started', 'Reading', 'In Progress', 'Completed'] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() => setActiveStatusFilter(s)}
                              style={{
                                fontSize: '11px',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                border: '1px solid',
                                borderColor: activeStatusFilter === s ? 'var(--accent)' : 'var(--glass-border)',
                                color: activeStatusFilter === s ? 'var(--accent)' : 'var(--text-secondary)',
                                background: activeStatusFilter === s ? 'var(--accent-glow)' : 'transparent',
                                cursor: 'pointer'
                              }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>

                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Showing <strong>{filteredDocuments.length}</strong> of {documents.length} files
                        </span>
                      </div>

                      {filteredDocuments.length === 0 ? (
                        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                          <BookOpen size={32} style={{ color: 'var(--text-muted)' }} />
                          <p>No documents found matching the filters.</p>
                          <button className="glass-btn" onClick={() => { setActiveFolderFilter('All'); setActiveCategoryFilter('All'); setActiveStatusFilter('All'); setSearchQuery(''); }}>
                            Clear Filters
                          </button>
                        </div>
                      ) : (
                        <div className="document-grid">
                          {filteredDocuments.map((doc) => {
                            return (
                              <div 
                                key={doc.id}
                                className={`glass-card doc-card priority-${doc.priority}`}
                                style={{ background: 'var(--bg-secondary)', borderLeftWidth: '4px' }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <span className="doc-badge-status" style={{ 
                                    backgroundColor: 
                                      doc.status === 'Completed' ? 'rgba(16, 185, 129, 0.15)' : 
                                      doc.status === 'Reading' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.08)',
                                    color: 
                                      doc.status === 'Completed' ? 'var(--status-completed)' : 
                                      doc.status === 'Reading' ? 'var(--status-reading)' : 'var(--text-secondary)'
                                  }}>
                                    {doc.status}
                                  </span>
                                  
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button 
                                      onClick={() => handleToggleDocPinned(doc.id)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: doc.pinned ? 'var(--accent)' : 'var(--text-muted)' }}
                                    >
                                      <Pin size={12} fill={doc.pinned ? 'currentColor' : 'none'} />
                                    </button>
                                    <button 
                                      onClick={() => handleToggleDocFavorite(doc.id)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: doc.favorite ? '#f59e0b' : 'var(--text-muted)' }}
                                    >
                                      <Star size={12} fill={doc.favorite ? 'currentColor' : 'none'} />
                                    </button>
                                  </div>
                                </div>

                                <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text-primary)', lineBreak: 'anywhere' }}>
                                  {doc.title}
                                </div>

                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  Type: <strong style={{ color: 'var(--accent)' }}>{doc.fileType.toUpperCase()}</strong> • Size: {doc.fileSize}
                                </div>

                                {/* Reading Progress visual */}
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                                    <span>Read Progress</span>
                                    <span>{doc.progress}%</span>
                                  </div>
                                  <div style={{ width: '100%', height: '5px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${doc.progress}%`, height: '100%', background: 'var(--accent)' }} />
                                  </div>
                                </div>

                                {/* Checklist metrics */}
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  Checklist: <strong>{doc.todos.filter(t => t.completed).length} / {doc.todos.length} Tasks</strong>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '4px 0' }}>
                                  {doc.tags.slice(0, 3).map((tag, idx) => (
                                    <span key={idx} style={{ fontSize: '9px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', padding: '1px 5px', borderRadius: '4px' }}>
                                      #{tag}
                                    </span>
                                  ))}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: 'auto' }}>
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Added {new Date(doc.addedDate).toLocaleDateString()}
                                  </span>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button 
                                      className="glass-btn glass-btn-primary" 
                                      onClick={() => handleOpenDoc(doc)}
                                      style={{ padding: '4px 10px', fontSize: '12px' }}
                                    >
                                      Open Reader
                                    </button>
                                    <button 
                                      className="glass-btn" 
                                      onClick={() => handleStartEditDocument(doc)}
                                      style={{ padding: '4px', color: 'var(--text-secondary)' }}
                                      title="Edit Details"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button 
                                      className="glass-btn" 
                                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                                      style={{ padding: '4px', color: '#ef4444' }}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>

                              </div>
                            );
                          })}
                        </div>
                      )}

                    </div>

                  </div>
                </>
              )}

            </div>
          )}

          {/* KANBAN BOARD TAB VIEW */}
          {activeTab === 'kanban' && (
            <Kanban 
              documents={documents} 
              onUpdateStatus={handleUpdateDocStatus} 
              onOpenDoc={handleOpenDoc}
            />
          )}

          {/* CALENDAR TAB VIEW */}
          {activeTab === 'calendar' && (
            <Calendar 
              documents={documents} 
              reminders={reminders} 
              onAddReminder={handleAddReminder}
              onDeleteReminder={handleDeleteReminder}
              onUpdateReminder={handleUpdateReminder}
            />
          )}

          {/* HABITS CONSISTENCY TAB VIEW */}
          {activeTab === 'habits' && (
            <Habits 
              habits={habits} 
              streak={streak} 
              onUpdateHabits={handleUpdateHabits} 
              onUpdateStreak={handleUpdateStreak} 
              onLogActivity={logAction}
              onAddToast={addToast}
            />
          )}

          {/* ACHIEVEMENTS TAB VIEW */}
          {activeTab === 'achievements' && (
            <Achievements badges={badges} />
          )}

          {/* STICKY NOTES TAB VIEW */}
          {activeTab === 'sticky' && (
            <StickyWall 
              notes={stickyNotes} 
              onUpdateNotes={handleUpdateStickyNotes}
            />
          )}

          {/* ACTIVITY LOGS TAB VIEW */}
          {activeTab === 'history' && (
            <ActivityLogs 
              logs={logs} 
              onClearLogs={() => {
                storage.saveLogs([]);
                setLogs([]);
                addToast('Activity logs cleared.', 'info');
              }}
            />
          )}

          {/* SETTINGS TAB VIEW */}
          {activeTab === 'settings' && (
            <Settings 
              settings={settings} 
              onUpdateSettings={handleUpdateSettings} 
              onImportData={handleImportData}
              onExportData={handleExportData}
              onResetData={triggerResetData}
              onAddToast={addToast}
            />
          )}

        </main>
      </div>

      {/* 4. FAB Floating Action Speed Dial widget */}
      <div className="fab-container">
        {fabOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px', alignItems: 'flex-end' }}>
            <button 
              className="glass-btn glass-btn-primary" 
              onClick={() => { setShowAddDocModal(true); setFabOpen(false); }}
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
            >
              📄 Add Document
            </button>
            <button 
              className="glass-btn" 
              onClick={() => { setActiveTab('calendar'); setFabOpen(false); }}
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
            >
              ⏰ Schedule Task
            </button>
            <button 
              className="glass-btn" 
              onClick={() => { setActiveTab('sticky'); setFabOpen(false); }}
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
            >
              📝 Sticky Note
            </button>
          </div>
        )}
        <button className="fab-button" onClick={() => setFabOpen(!fabOpen)}>
          <Plus size={24} style={{ transform: fabOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {/* 5. ADD DOCUMENT MODAL DIALOG */}
      {showAddDocModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ padding: '24px', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Add Study Document</h3>
              <button onClick={() => setShowAddDocModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📤 Drag & Drop or Upload Actual File</label>
                <div 
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.01)',
                    marginTop: '4px',
                    transition: 'var(--transition-smooth)'
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleDocUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                >
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Click to select or drop a PDF, Word, Excel, CSV, or Text file
                  </span>
                  <input 
                    type="file" 
                    id="file-upload-input" 
                    style={{ display: 'none' }} 
                    accept=".pdf,.docx,.xlsx,.txt,.csv"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleDocUpload(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Document Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. DSA Graphs, System Design CDNs, ML Notes" 
                  value={newDocTitle} 
                  onChange={(e) => setNewDocTitle(e.target.value)} 
                  className="glass-input" 
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>File Type</label>
                  <select 
                    value={newDocType} 
                    onChange={(e) => setNewDocType(e.target.value as FileType)}
                    className="glass-input" 
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="pdf">PDF (.pdf)</option>
                    <option value="docx">Word (.docx)</option>
                    <option value="xlsx">Excel (.xlsx)</option>
                    <option value="other">Other / Text</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pages</label>
                  <input 
                    type="number" 
                    value={newDocPages} 
                    onChange={(e) => setNewDocPages(parseInt(e.target.value) || 1)} 
                    className="glass-input" 
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Category</label>
                  <select
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    {['DSA', 'System Design', 'Resume', 'Projects', 'Office Work', 'College', 'Personal'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Priority</label>
                  <select 
                    value={newDocPriority} 
                    onChange={(e) => setNewDocPriority(e.target.value as any)}
                    className="glass-input" 
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="Critical">🔴 Critical</option>
                    <option value="High">🟠 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tags (comma separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Placement, Revision, Urgent" 
                  value={newDocTags} 
                  onChange={(e) => setNewDocTags(e.target.value)} 
                  className="glass-input" 
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>File Size Estimate</label>
                <input 
                  type="text" 
                  value={newDocSize} 
                  onChange={(e) => setNewDocSize(e.target.value)} 
                  className="glass-input" 
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="glass-btn" onClick={() => setShowAddDocModal(false)}>Cancel</button>
              <button className="glass-btn glass-btn-primary" onClick={handleCreateDocument}>Create File</button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ALARM TRIGGER ALERT MODAL */}
      {activeAlarm && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="glass-panel modal-content" style={{ padding: '24px', maxWidth: '400px', background: 'var(--bg-secondary)', border: '2px solid var(--accent)', textAlign: 'center' }}>
            <div style={{ 
              width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(var(--accent-rgb), 0.15)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto'
            }}>
              <Bell size={28} className="animate-slide-in" style={{ animation: 'skeletonPulse 1s infinite' }} />
            </div>

            <h3 style={{ marginBottom: '8px' }}>⏰ DocTrack Reminder</h3>
            <p style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
              {activeAlarm.title}
            </p>
            {activeAlarm.docTitle && (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Linked Document: <strong>{activeAlarm.docTitle}</strong>
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="glass-btn" onClick={() => handleSnoozeAlarm(5)} style={{ flexGrow: 1, justifyContent: 'center', fontSize: '12px' }}>
                  Snooze 5m
                </button>
                <button className="glass-btn" onClick={() => handleSnoozeAlarm(15)} style={{ flexGrow: 1, justifyContent: 'center', fontSize: '12px' }}>
                  Snooze 15m
                </button>
              </div>
              <button 
                className="glass-btn glass-btn-primary" 
                onClick={() => {
                  if (activeAlarm.docId) {
                    const linked = documents.find(d => d.id === activeAlarm.docId);
                    if (linked) handleOpenDoc(linked);
                  }
                  setActiveAlarm(null);
                }} 
                style={{ justifyContent: 'center' }}
              >
                Dismiss & Open Work
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. CUSTOM CONFIRMATION OVERLAYS */}
      {showDeleteConfirm && docToDelete && (
        <div className="modal-overlay" style={{ zIndex: 2500 }}>
          <div className="glass-panel modal-content animate-slide-in" style={{ padding: '24px', maxWidth: '420px', background: 'var(--bg-secondary)', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
            <div style={{ 
              width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto'
            }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ marginBottom: '8px', color: '#ef4444' }}>Delete Document?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>
              Are you sure you want to delete <strong>"{docToDelete.title}"</strong>?<br/>
              This will erase all notes, comments, and task checklists.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button 
                className="glass-btn" 
                onClick={() => { setShowDeleteConfirm(false); setDocToDelete(null); }}
                style={{ flexGrow: 1, justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button 
                className="glass-btn" 
                onClick={confirmDeleteDocument}
                style={{ flexGrow: 1, justifyContent: 'center', backgroundColor: '#dc2626', color: '#ffffff', border: 'none' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. EDIT DOCUMENT DETAILS MODAL */}
      {editingDoc && (
        <div className="modal-overlay" style={{ zIndex: 2500 }}>
          <div className="glass-panel modal-content animate-slide-in" style={{ padding: '24px', background: 'var(--bg-secondary)', maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>📝 Edit Document Details</h3>
              <button onClick={() => setEditingDoc(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Document Title</label>
                <input 
                  type="text" 
                  value={editDocTitle} 
                  onChange={(e) => setEditDocTitle(e.target.value)} 
                  className="glass-input" 
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Category</label>
                  <select
                    value={editDocCategory}
                    onChange={(e) => setEditDocCategory(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    {foldersList.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Priority</label>
                  <select 
                    value={editDocPriority} 
                    onChange={(e) => setEditDocPriority(e.target.value as any)}
                    className="glass-input" 
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="Critical">🔴 Critical</option>
                    <option value="High">🟠 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tags (comma separated)</label>
                <input 
                  type="text" 
                  value={editDocTags} 
                  onChange={(e) => setEditDocTags(e.target.value)} 
                  className="glass-input" 
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>File Size</label>
                  <input 
                    type="text" 
                    value={editDocSize} 
                    onChange={(e) => setEditDocSize(e.target.value)} 
                    className="glass-input" 
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pages</label>
                  <input 
                    type="number" 
                    value={editDocPages} 
                    onChange={(e) => setEditDocPages(parseInt(e.target.value) || 1)} 
                    className="glass-input" 
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="glass-btn" onClick={() => setEditingDoc(null)}>Cancel</button>
              <button className="glass-btn glass-btn-primary" onClick={handleSaveEditDocument}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* 10. GOAL CRUD MODAL */}
      {showGoalModal && (
        <div className="modal-overlay" style={{ zIndex: 2500 }}>
          <div className="glass-panel modal-content animate-slide-in" style={{ padding: '24px', background: 'var(--bg-secondary)', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>{editingGoal ? '🎯 Edit Goal Milestone' : '🎯 Add Goal Milestone'}</h3>
              <button onClick={() => setShowGoalModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Goal Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Master Binary Search trees, Complete projects" 
                  value={goalTitle} 
                  onChange={(e) => setGoalTitle(e.target.value)} 
                  className="glass-input" 
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Progress Percentage ({goalProgress}%)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100"
                  value={goalProgress} 
                  onChange={(e) => setGoalProgress(parseInt(e.target.value) || 0)} 
                  style={{ width: '100%', marginTop: '4px', accentColor: 'var(--accent)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Target Deadline</label>
                <input 
                  type="date" 
                  value={goalDeadline} 
                  onChange={(e) => setGoalDeadline(e.target.value)} 
                  className="glass-input" 
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="glass-btn" onClick={() => setShowGoalModal(false)}>Cancel</button>
              <button className="glass-btn glass-btn-primary" onClick={handleSaveGoal}>
                {editingGoal ? 'Save Changes' : 'Create Goal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="modal-overlay" style={{ zIndex: 2500 }}>
          <div className="glass-panel modal-content animate-slide-in" style={{ padding: '24px', maxWidth: '420px', background: 'var(--bg-secondary)', border: '1px solid rgba(239, 68, 68, 0.2)', textAlign: 'center' }}>
            <div style={{ 
              width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
              display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto'
            }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ marginBottom: '8px', color: '#ef4444' }}>Factory Reset Everything?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>
              This will permanently erase all documents, streaks, habits, notes, and scheduler timeline events. This operation cannot be undone!
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button 
                className="glass-btn" 
                onClick={() => setShowResetConfirm(false)}
                style={{ flexGrow: 1, justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button 
                className="glass-btn" 
                onClick={confirmResetData}
                style={{ flexGrow: 1, justifyContent: 'center', backgroundColor: '#dc2626', color: '#ffffff', border: 'none' }}
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. TOAST NOTIFICATION STACK */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <Sparkles size={16} />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

export default App;
