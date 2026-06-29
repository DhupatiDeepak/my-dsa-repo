import type { DocTrackDocument, Habit, Goal, StickyNote, Reminder, ActivityLog, AchievementBadge, UserSettings } from '../types';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  accentColor: 'cyan',
  compactMode: false,
  gridView: true
};

export const DEFAULT_HABITS: Habit[] = [
  { id: '1', name: '📖 Read 15+ Pages', history: [] },
  { id: '2', name: '💡 Solve 3 DSA Problems', history: [] },
  { id: '3', name: '💧 Drink 3L Water', history: [] },
  { id: '4', name: '🏃 Exercise 30 Mins', history: [] },
  { id: '5', name: '💤 Sleep by 11:00 PM', history: [] }
];

export const DEFAULT_GOALS: Goal[] = [
  { id: 'g1', title: 'Complete DSA Bootcamp', progress: 72, deadline: '2026-07-30', pinned: true },
  { id: 'g2', title: 'Revamp System Design Notes', progress: 40, deadline: '2026-08-15', pinned: true },
  { id: 'g3', title: 'Finish College Research Paper', progress: 15, deadline: '2026-09-01', pinned: false }
];

export const DEFAULT_STICKY_NOTES: StickyNote[] = [
  { id: 's1', text: '💡 Mock Interview with Alex on Thursday 4 PM! Prep behavioral questions.', color: 'yellow', pinned: true, x: 20, y: 30 },
  { id: 's2', text: '🎯 Remember to read System Design chapter on load balancers and CDNs.', color: 'blue', pinned: true, x: 260, y: 30 },
  { id: 's3', text: '🔥 Consistency check: Complete at least 3 tasks every day.', color: 'green', pinned: false, x: 20, y: 270 },
  { id: 's4', text: '🔴 Review Graph DP questions before next week.', color: 'red', pinned: false, x: 260, y: 270 }
];

export const DEFAULT_ACHIEVEMENTS: AchievementBadge[] = [
  { id: 'a1', title: 'First File Added', description: 'Upload your first study document', icon: 'FilePlus', unlocked: true, unlockedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
  { id: 'a2', title: '7-Day Streak', description: 'Maintain active work for 7 consecutive days', icon: 'Flame', unlocked: false },
  { id: 'a3', title: 'Early Bird', description: 'Read a document or complete a task before 7 AM', icon: 'Sun', unlocked: false },
  { id: 'a4', title: 'Night Owl', description: 'Log activity after 11 PM', icon: 'Moon', unlocked: true, unlockedAt: new Date().toISOString() },
  { id: 'a5', title: 'Productivity King', description: 'Complete 10 tasks in a single day', icon: 'Crown', unlocked: false },
  { id: 'a6', title: 'DSA Master', description: 'Mark a DSA document as Completed', icon: 'Binary', unlocked: false },
  { id: 'a7', title: 'Excel Wizard', description: 'Modify values in an interactive XLSX spreadsheet', icon: 'Grid', unlocked: false }
];

// Helper to get formatted ISO dates relative to today
const getPastDate = (daysAgo: number, timeStr: string = '10:00:00') => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const [h, m, s] = timeStr.split(':');
  d.setHours(parseInt(h), parseInt(m), parseInt(s));
  return d.toISOString();
};

export const DEFAULT_DOCUMENTS: DocTrackDocument[] = [
  {
    id: 'doc1',
    title: 'DSA Roadmap & Placement Preparation',
    fileName: 'DSA_RoadMap.pdf',
    fileType: 'pdf',
    fileSize: '14.8 MB',
    pageCount: 35,
    currentPage: 23,
    progress: 65,
    status: 'Reading',
    priority: 'High',
    category: 'DSA',
    tags: ['Interview', 'Placement', 'Important'],
    addedDate: getPastDate(5, '09:15:00'),
    lastViewed: getPastDate(1, '19:40:00'),
    estimatedReadTime: 120,
    rating: 4,
    pinned: true,
    favorite: true,
    notes: `### Essential Algorithms to Review\n1. **Sliding Window:** Find max subarray of size K.\n2. **Two Pointers:** Reverse array, Container with most water.\n3. **Fast & Slow Pointers:** Cycle detection in linked lists.\n4. **Merge Intervals:** Interval merging algorithms.\n\n*Important Link:* [LeetCode Preparation Guide](https://leetcode.com)`,
    todos: [
      { id: 't1_1', text: 'Finish Arrays & HashMaps basics', completed: true },
      { id: 't1_2', text: 'Solve sliding window pattern problems', completed: true },
      { id: 't1_3', text: 'Implement Linked List reversal', completed: true },
      { id: 't1_4', text: 'Understand DFS & BFS on Trees', completed: false },
      { id: 't1_5', text: 'Solve 100 interview problems', completed: false }
    ],
    comments: [
      { id: 'c1_1', text: 'Make sure to focus on dynamic programming as well, it comes up often.', timestamp: getPastDate(2, '10:15:00'), author: 'Self' },
      { id: 'c1_2', text: 'Reached page 23. Sorting is complete.', timestamp: getPastDate(1, '20:10:00'), author: 'Self' }
    ],
    pdfBookmarks: [5, 12, 23]
  },
  {
    id: 'doc2',
    title: 'System Design Fundamentals',
    fileName: 'System_Design_Fundamentals.pdf',
    fileType: 'pdf',
    fileSize: '22.4 MB',
    pageCount: 150,
    currentPage: 60,
    progress: 40,
    status: 'In Progress',
    priority: 'Critical',
    category: 'System Design',
    tags: ['Interview', 'Architecture'],
    addedDate: getPastDate(10, '11:00:00'),
    lastViewed: getPastDate(2, '14:22:00'),
    estimatedReadTime: 300,
    rating: 5,
    pinned: true,
    favorite: true,
    notes: `### Core Scalability Concepts\n- **Vertical vs Horizontal Scaling**\n- **Load Balancers:** Nginx, HAProxy, Round Robin vs Least Connections.\n- **Caching:** Redis, Memcached, Cache-Aside vs Write-Through patterns.\n- **Database Sharding:** Consistent hashing algorithms.`,
    todos: [
      { id: 't2_1', text: 'Read horizontal vs vertical scaling', completed: true },
      { id: 't2_2', text: 'Implement sample Nginx configuration', completed: true },
      { id: 't2_3', text: 'Understand Consistent Hashing', completed: false },
      { id: 't2_4', text: 'Design a URL shortener system', completed: false }
    ],
    comments: [],
    pdfBookmarks: [10, 45]
  },
  {
    id: 'doc3',
    title: 'Software Engineer Resume 2026',
    fileName: 'Resume_2026.docx',
    fileType: 'docx',
    fileSize: '1.2 MB',
    pageCount: 2,
    progress: 90,
    status: 'Revision',
    priority: 'High',
    category: 'Resume',
    tags: ['Job Hunting', 'Career'],
    addedDate: getPastDate(2, '14:00:00'),
    lastViewed: getPastDate(0, '22:15:00'),
    estimatedReadTime: 10,
    rating: 5,
    pinned: true,
    favorite: true,
    notes: `### Bullet points updates to make:\n- [ ] Update GPA for the final semester.\n- [ ] Add description for the React-TypeScript document dashboard project (DocTrack Pro!).\n- [ ] Revise wording in the experience section to emphasize impact (STAR method).`,
    todos: [
      { id: 't3_1', text: 'Update final project details', completed: true },
      { id: 't3_2', text: 'Add LaTeX compilation configuration link', completed: true },
      { id: 't3_3', text: 'Send to senior developer for review', completed: false }
    ],
    comments: [
      { id: 'c3_1', text: 'Starred because recruiters are actively responding.', timestamp: getPastDate(0, '21:00:00'), author: 'Self' }
    ],
    docxOutline: ['Contact Information', 'Professional Summary', 'Education Background', 'Work Experience', 'Core Skills', 'Projects Outline']
  },
  {
    id: 'doc4',
    title: 'Project Budget & Timeline Sheet',
    fileName: 'Project_Budget.xlsx',
    fileType: 'xlsx',
    fileSize: '4.5 MB',
    pageCount: 1,
    progress: 100,
    status: 'Completed',
    priority: 'Medium',
    category: 'Projects',
    tags: ['Finance', 'Office Work'],
    addedDate: getPastDate(15, '09:00:00'),
    lastViewed: getPastDate(4, '16:45:00'),
    estimatedReadTime: 30,
    rating: 3,
    pinned: false,
    favorite: true,
    notes: `### Project Expenses\nTracking development software subscriptions, asset acquisitions, and server cost estimates. Keep these updated monthly.`,
    todos: [
      { id: 't4_1', text: 'Enter asset acquisition costs', completed: true },
      { id: 't4_2', text: 'Add Vercel domain subscription fee', completed: true },
      { id: 't4_3', text: 'Verify total sums', completed: true }
    ],
    comments: [],
    xlsxData: {
      'A1': 'Expense Title', 'B1': 'Budgeted ($)', 'C1': 'Actual Spent ($)', 'D1': 'Variance ($)',
      'A2': 'SaaS Subscriptions', 'B2': '150', 'C2': '120', 'D2': '30',
      'A3': 'Domain Names', 'B3': '50', 'C3': '45', 'D3': '5',
      'A4': 'Assets & Design', 'B4': '300', 'C4': '280', 'D4': '20',
      'A5': 'Hosting Servers', 'B5': '200', 'C5': '190', 'D5': '10',
      'A6': 'Total Dev Expenses', 'B6': '700', 'C6': '635', 'D6': '65'
    }
  }
];

export const DEFAULT_ACTIVITY_LOGS: ActivityLog[] = [
  { id: 'l1', timestamp: getPastDate(4, '09:00:00'), type: 'doc_added', description: 'Added new PDF: DSA_RoadMap.pdf' },
  { id: 'l2', timestamp: getPastDate(3, '10:15:00'), type: 'todo_completed', description: 'Completed task: "Finish Arrays & HashMaps basics"' },
  { id: 'l3', timestamp: getPastDate(2, '12:00:00'), type: 'favorite_toggle', description: 'Marked Software Engineer Resume 2026 as favorite' },
  { id: 'l4', timestamp: getPastDate(1, '14:00:00'), type: 'doc_added', description: 'Added new Spreadsheet: Project_Budget.xlsx' },
  { id: 'l5', timestamp: getPastDate(0, '16:30:00'), type: 'progress_update', description: 'Read pages in DSA Roadmap (reached 65%)' }
];

export const DEFAULT_REMINDERS: Reminder[] = [
  { id: 'r1', title: 'Review Load Balancer in System Design PDF', dateTime: getPastDate(-1, '08:00:00'), period: 'daily', active: true, docId: 'doc2', docTitle: 'System Design Fundamentals' },
  { id: 'r2', title: 'Submit College Research Paper Draft', dateTime: getPastDate(-3, '23:59:59'), period: 'one-time', active: true, docId: 'doc1', docTitle: 'DSA Roadmap & Placement Preparation' }
];
