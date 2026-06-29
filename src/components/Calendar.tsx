import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { DocTrackDocument, Reminder } from '../types';

interface CalendarProps {
  documents: DocTrackDocument[];
  reminders: Reminder[];
  onAddReminder: (reminder: Reminder) => void;
  onDeleteReminder: (id: string) => void;
  onUpdateReminder: (updated: Reminder) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ documents, reminders, onAddReminder, onDeleteReminder, onUpdateReminder }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get name of the month
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Get total days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Get starting day of the month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Get days in previous month
  const prevDaysInMonth = new Date(year, month, 0).getDate();

  // Grid dates construction
  const dayCells = [];

  // Trailing days from previous month
  const trailingDaysCount = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Align to start on Monday
  for (let i = trailingDaysCount; i > 0; i--) {
    const day = prevDaysInMonth - i + 1;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    dayCells.push({
      dayNum: day,
      dateStr: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      isCurrentMonth: false
    });
  }

  // Days in current month
  for (let i = 1; i <= daysInMonth; i++) {
    dayCells.push({
      dayNum: i,
      dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      isCurrentMonth: true
    });
  }

  // Leading days from next month to make grid multiple of 7 (usually 35 or 42 cells)
  const totalGridCells = dayCells.length > 35 ? 42 : 35;
  const leadingDaysCount = totalGridCells - dayCells.length;
  for (let i = 1; i <= leadingDaysCount; i++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    dayCells.push({
      dayNum: i,
      dateStr: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      isCurrentMonth: false
    });
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Find deadlines & reminders on specific day
  const getEventsForDate = (dateStr: string) => {
    const events: { id: string; title: string; type: 'doc' | 'reminder'; color: string }[] = [];

    // Filter document deadlines
    documents.forEach(doc => {
      // For mock deadlines: Let's mock a deadline date by extracting date info
      // To keep it simple, let's look at the added date (relative mock deadline is addedDate + 5 days)
      const added = new Date(doc.addedDate);
      const deadline = new Date(added.setDate(added.getDate() + 7));
      const deadStr = deadline.toISOString().split('T')[0];
      
      if (deadStr === dateStr) {
        events.push({
          id: `dead_${doc.id}`,
          title: `🏁 Dead: ${doc.title}`,
          type: 'doc',
          color: 'var(--accent)'
        });
      }
    });

    // Reminders mapping
    reminders.forEach(rem => {
      if (rem.active) {
        const remDateStr = rem.dateTime.split('T')[0];
        if (remDateStr === dateStr) {
          events.push({
            id: `rem_${rem.id}`,
            title: `⏰ ${rem.title}`,
            type: 'reminder',
            color: rem.period === 'one-time' ? 'var(--color-high)' : 'var(--color-medium)'
          });
        }
      }
    });

    return events;
  };

  const handleCellClick = (dateStr: string) => {
    setModalDate(dateStr);
    setShowAddModal(true);
  };

  const handleCreateReminder = () => {
    if (!modalTitle.trim()) return;
    const newRem: Reminder = {
      id: 'rem_' + Math.random().toString(36).substr(2, 9),
      title: modalTitle,
      dateTime: `${modalDate}T09:00`,
      period: 'one-time',
      active: true
    };
    onAddReminder(newRem);
    setShowAddModal(false);
    setModalTitle('');
  };

  const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      
      {/* Month Navigator Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>📅 Monthly Work Scheduler</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Click on any cell to schedule a study reminder or view task deadlines.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="glass-btn" onClick={prevMonth} style={{ padding: '6px' }}><ChevronLeft size={16} /></button>
          <span style={{ fontSize: '16px', fontWeight: 'bold', minWidth: '130px', textAlign: 'center', fontFamily: 'var(--font-title)' }}>
            {monthName} {year}
          </span>
          <button className="glass-btn" onClick={nextMonth} style={{ padding: '6px' }}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="calendar-grid">
        {/* Day Header */}
        {weekLabels.map(l => (
          <div key={l} className="calendar-cell-header">{l}</div>
        ))}

        {/* Days grid cells */}
        {dayCells.map((cell, idx) => {
          const events = getEventsForDate(cell.dateStr);
          const isToday = cell.dateStr === todayStr;
          
          return (
            <div 
              key={idx} 
              className={`calendar-day-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => handleCellClick(cell.dateStr)}
              style={{ cursor: 'pointer' }}
            >
              <div 
                className="calendar-day-num" 
                style={{ 
                  color: isToday ? 'var(--accent)' : 'var(--text-primary)',
                  fontWeight: isToday ? 'bold' : 'normal'
                }}
              >
                {cell.dayNum}
              </div>

              {/* Event Cards inside cell */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', flexGrow: 1 }}>
                {events.map((ev) => (
                  <div 
                    key={ev.id} 
                    className="calendar-event"
                    style={{ 
                      backgroundColor: ev.color,
                      fontSize: '9px',
                      padding: '1px 4px',
                      borderRadius: '2px',
                      color: '#ffffff',
                      lineHeight: '1.2'
                    }}
                    title={ev.title}
                    onClick={(e) => {
                      e.stopPropagation(); // Avoid triggering cell click
                      if (ev.type === 'reminder') {
                        const originalRem = reminders.find(r => r.id === ev.id.replace('rem_', ''));
                        if (originalRem) {
                          setSelectedReminder(originalRem);
                        }
                      }
                    }}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Reminder Modal overlay */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ padding: '24px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ marginBottom: '16px' }}>Schedule study task</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Date</label>
              <input 
                type="date" 
                value={modalDate} 
                onChange={(e) => setModalDate(e.target.value)} 
                className="glass-input" 
              />
              
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Task / Reminder Title</label>
              <input 
                type="text" 
                placeholder="e.g. Solve 5 Array Questions, Read System Design load balancers" 
                value={modalTitle} 
                onChange={(e) => setModalTitle(e.target.value)} 
                className="glass-input"
                autoFocus 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="glass-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="glass-btn glass-btn-primary" onClick={handleCreateReminder}>Schedule</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Delete Reminder Modal */}
      {selectedReminder && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-slide-in" style={{ padding: '24px', background: 'var(--bg-secondary)', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px' }}>⏰ Manage Scheduled Reminder</h3>
              <button onClick={() => setSelectedReminder(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Reminder Title</label>
                <input 
                  type="text" 
                  value={selectedReminder.title} 
                  onChange={(e) => setSelectedReminder({ ...selectedReminder, title: e.target.value })}
                  className="glass-input" 
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={selectedReminder.dateTime} 
                  onChange={(e) => setSelectedReminder({ ...selectedReminder, dateTime: e.target.value })}
                  className="glass-input" 
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Repeat Period</label>
                <select
                  value={selectedReminder.period}
                  onChange={(e) => setSelectedReminder({ ...selectedReminder, period: e.target.value as any })}
                  className="glass-input"
                  style={{ width: '100%', marginTop: '4px' }}
                >
                  <option value="one-time">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <button 
                className="glass-btn" 
                onClick={() => {
                  onDeleteReminder(selectedReminder.id);
                  setSelectedReminder(null);
                }} 
                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                Delete
              </button>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="glass-btn" onClick={() => setSelectedReminder(null)}>Cancel</button>
                <button 
                  className="glass-btn glass-btn-primary" 
                  onClick={() => {
                    onUpdateReminder(selectedReminder);
                    setSelectedReminder(null);
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
