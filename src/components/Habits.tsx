import React, { useState } from 'react';
import { Check, Flame, Trash2, Edit2 } from 'lucide-react';
import type { Habit, StreakInfo } from '../types';
import { getTodayStr, storage } from '../services/storage';

interface HabitsProps {
  habits: Habit[];
  streak: StreakInfo;
  onUpdateHabits: (habits: Habit[]) => void;
  onUpdateStreak: (streak: StreakInfo) => void;
  onLogActivity: (type: string, desc: string) => void;
  onAddToast: (msg: string, type: 'success' | 'info') => void;
}

export const Habits: React.FC<HabitsProps> = ({ 
  habits, streak, onUpdateHabits, onUpdateStreak, onLogActivity, onAddToast 
}) => {
  const today = getTodayStr();
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingHabitName, setEditingHabitName] = useState('');

  const saveHabitRename = (id: string) => {
    if (!editingHabitName.trim()) return;
    const nextList = habits.map(h => h.id === id ? { ...h, name: editingHabitName.trim() } : h);
    onUpdateHabits(nextList);
    setEditingHabitId(null);
    onLogActivity('habit_renamed', `Renamed habit to: ${editingHabitName.trim()}`);
    onAddToast('Habit renamed successfully!', 'success');
  };

  const toggleHabitToday = (habit: Habit) => {
    const isCompleted = habit.history.includes(today);
    let newHistory: string[];

    if (isCompleted) {
      // Uncheck
      newHistory = habit.history.filter(d => d !== today);
      onAddToast(`Habit "${habit.name}" unchecked.`, 'info');
    } else {
      // Check
      newHistory = [...habit.history, today];
      onLogActivity('habit_done', `Completed daily habit: ${habit.name}`);
      onAddToast(`Habit "${habit.name}" checked off for today!`, 'success');
      
      // Update streak
      storage.updateStreakForToday();
      onUpdateStreak(storage.getStreak());
    }

    onUpdateHabits(habits.map(h => h.id === habit.id ? { ...h, history: newHistory } : h));
  };

  const addHabit = (name: string) => {
    if (!name.trim()) return;
    const newHabit: Habit = {
      id: 'habit_' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      history: []
    };
    onUpdateHabits([...habits, newHabit]);
    onLogActivity('habit_added', `Created habit tracker: ${name}`);
    onAddToast(`Created new habit: "${name}"`, 'success');
  };

  const deleteHabit = (id: string, name: string) => {
    onUpdateHabits(habits.filter(h => h.id !== id));
    onLogActivity('habit_deleted', `Deleted habit: ${name}`);
    onAddToast(`Deleted habit: "${name}"`, 'info');
  };

  // Get days of current week (Mon to Sun) for display
  const getWeekDates = () => {
    const dates = [];
    const now = new Date();
    // Get monday of current week
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(now.setDate(diff));
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        num: d.getDate(),
        isToday: `${yyyy}-${mm}-${dd}` === today
      });
    }
    return dates;
  };

  const weekDays = getWeekDates();
  const todayCompletedCount = habits.filter(h => h.history.includes(today)).length;
  const todayCompletionRate = habits.length > 0 ? Math.round((todayCompletedCount / habits.length) * 100) : 0;

  // Streak Badge Level
  const getBadgeTier = (streakCount: number) => {
    if (streakCount >= 100) return { name: 'Diamond', color: '#c084fc', icon: '💎' };
    if (streakCount >= 30) return { name: 'Gold', color: '#fbbf24', icon: '🥇' };
    if (streakCount >= 7) return { name: 'Silver', color: '#94a3b8', icon: '🥈' };
    return { name: 'Bronze', color: '#b45309', icon: '🥉' };
  };

  const badgeTier = getBadgeTier(streak.currentStreak);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Streak and Badges summary */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Flame size={28} className="streak-flame" />
              <div>
                <h2 style={{ fontSize: '28px', lineHeight: '1' }}>{streak.currentStreak} Days</h2>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Current Streak</span>
              </div>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              🔥 Best Streak: <strong>{streak.bestStreak} Days</strong>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '32px', marginBottom: '2px' }}>{badgeTier.icon}</div>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: badgeTier.color, textTransform: 'uppercase' }}>
              {badgeTier.name} Badge
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Consistency Level</div>
          </div>
        </div>

        {/* Completion Progress widget */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '14px' }}>Today's Habits Progress</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
              <svg width="60" height="60" className="progress-ring">
                <circle cx="30" cy="30" r="25" stroke="var(--border-color)" strokeWidth="5" fill="transparent" />
                <circle 
                  cx="30" cy="30" r="25" 
                  stroke="var(--accent)" 
                  strokeWidth="5" 
                  fill="transparent" 
                  strokeDasharray="157"
                  strokeDashoffset={157 - (157 * todayCompletionRate) / 100}
                  className="progress-ring"
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px', fontWeight: 'bold' }}>
                {todayCompletionRate}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {todayCompletedCount} of {habits.length} Done
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {todayCompletionRate === 100 ? '🎉 Perfect Day! Amazing job!' : 'Complete your daily habits to lock the streak!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Habit List */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Daily Checklist</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Add new habit..."
              className="glass-input"
              id="new-habit-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.currentTarget;
                  addHabit(input.value);
                  input.value = '';
                }
              }}
              style={{ fontSize: '13px' }}
            />
            <button 
              className="glass-btn glass-btn-primary" 
              onClick={() => {
                const el = document.getElementById('new-habit-input') as HTMLInputElement;
                if (el) {
                  addHabit(el.value);
                  el.value = '';
                }
              }}
            >
              Add
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {habits.map((habit) => {
            const doneToday = habit.history.includes(today);
            return (
              <div 
                key={habit.id} 
                className="glass-card" 
                style={{ 
                  padding: '12px 16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: doneToday ? 'rgba(var(--accent-rgb), 0.2)' : 'var(--glass-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    onClick={() => toggleHabitToday(habit)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      border: '2px solid',
                      borderColor: doneToday ? 'var(--accent)' : 'var(--text-secondary)',
                      backgroundColor: doneToday ? 'var(--accent)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    {doneToday && <Check size={16} strokeWidth={3} />}
                  </button>
                  {editingHabitId === habit.id ? (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={editingHabitName} 
                        onChange={(e) => setEditingHabitName(e.target.value)} 
                        className="glass-input" 
                        style={{ fontSize: '12px', padding: '2px 8px', width: '120px' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveHabitRename(habit.id);
                          }
                        }}
                        autoFocus
                      />
                      <button 
                        className="glass-btn glass-btn-primary" 
                        onClick={() => saveHabitRename(habit.id)}
                        style={{ padding: '2px 6px', fontSize: '10px' }}
                      >
                        Save
                      </button>
                      <button 
                        className="glass-btn" 
                        onClick={() => setEditingHabitId(null)}
                        style={{ padding: '2px 4px', fontSize: '10px' }}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: 500,
                        textDecoration: doneToday ? 'line-through' : 'none',
                        color: doneToday ? 'var(--text-secondary)' : 'var(--text-primary)'
                      }}>
                        {habit.name}
                      </span>
                      <button 
                        onClick={() => {
                          setEditingHabitId(habit.id);
                          setEditingHabitName(habit.name);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: 0 }}
                        title="Rename Habit"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Week Checklist tracker visual */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {weekDays.map((day) => {
                      const completed = habit.history.includes(day.dateStr);
                      return (
                        <div 
                          key={day.dateStr} 
                          style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: '2px',
                            opacity: day.isToday ? 1 : 0.75
                          }}
                        >
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{day.label}</span>
                          <div 
                            style={{ 
                              width: '18px', 
                              height: '18px', 
                              borderRadius: '4px',
                              border: '1px solid',
                              borderColor: completed ? 'var(--accent)' : 'var(--border-color)',
                              backgroundColor: completed ? 'rgba(var(--accent-rgb), 0.2)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px',
                              fontWeight: 'bold',
                              color: completed ? 'var(--accent)' : 'var(--text-secondary)'
                            }}
                            title={day.dateStr}
                          >
                            {day.num}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <button 
                    onClick={() => deleteHabit(habit.id, habit.name)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}
                    title="Delete habit tracker"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
