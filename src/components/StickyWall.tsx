import React, { useState, useRef } from 'react';
import { Plus, Trash2, Pin, Move } from 'lucide-react';
import type { StickyNote } from '../types';

interface StickyWallProps {
  notes: StickyNote[];
  onUpdateNotes: (notes: StickyNote[]) => void;
}

export const StickyWall: React.FC<StickyWallProps> = ({ notes, onUpdateNotes }) => {
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const addNote = () => {
    const newNote: StickyNote = {
      id: 'sticky_' + Math.random().toString(36).substr(2, 9),
      text: 'New sticky note... Double-click to edit.',
      color: 'yellow',
      pinned: false,
      x: 20 + (notes.length * 15) % 200,
      y: 80 + (notes.length * 15) % 200
    };
    onUpdateNotes([...notes, newNote]);
  };

  const updateText = (id: string, text: string) => {
    onUpdateNotes(notes.map(n => n.id === id ? { ...n, text } : n));
  };

  const updateColor = (id: string, color: StickyNote['color']) => {
    onUpdateNotes(notes.map(n => n.id === id ? { ...n, color } : n));
  };

  const togglePin = (id: string) => {
    onUpdateNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const deleteNote = (id: string) => {
    onUpdateNotes(notes.filter(n => n.id !== id));
  };

  // Dragging Implementation
  const handleMouseDown = (e: React.MouseEvent, note: StickyNote) => {
    if (note.pinned) return; // Can't drag pinned notes if they are locked
    
    // Check if user clicked the drag bar
    const target = e.target as HTMLElement;
    if (!target.closest('.drag-handle')) return;

    setDraggedNoteId(note.id);
    
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    dragOffset.current = {
      x: clientX - (note.x || 0),
      y: clientY - (note.y || 0)
    };
    
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNoteId) return;

    const note = notes.find(n => n.id === draggedNoteId);
    if (!note) return;

    const container = containerRef.current;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    
    // Calculate new position relative to container
    let newX = e.clientX - dragOffset.current.x;
    let newY = e.clientY - dragOffset.current.y;

    // Boundaries
    newX = Math.max(0, Math.min(newX, containerRect.width - 200));
    newY = Math.max(0, Math.min(newY, containerRect.height - 200));

    onUpdateNotes(notes.map(n => n.id === draggedNoteId ? { ...n, x: newX, y: newY } : n));
  };

  const handleMouseUp = () => {
    if (draggedNoteId) {
      setDraggedNoteId(null);
    }
  };

  return (
    <div 
      style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>📝 Personal Sticky Board</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Drag notes by their top bar. Pin notes to lock their positions.</p>
        </div>
        <button className="glass-btn glass-btn-primary" onClick={addNote}>
          <Plus size={16} /> New Note
        </button>
      </div>

      <div 
        ref={containerRef}
        className="glass-card" 
        style={{ 
          flexGrow: 1, 
          minHeight: '500px', 
          position: 'relative', 
          background: 'rgba(0,0,0,0.15)',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        {notes.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)', flexDirection: 'column', gap: '12px' }}>
            <p>No sticky notes found on your board.</p>
            <button className="glass-btn" onClick={addNote}>Add Sticky Note</button>
          </div>
        ) : (
          notes.map((note) => {
            const colors = ['yellow', 'blue', 'green', 'red', 'purple'] as StickyNote['color'][];
            return (
              <div 
                key={note.id}
                className={`sticky-note ${note.color}`}
                style={{
                  position: 'absolute',
                  left: `${note.x || 0}px`,
                  top: `${note.y || 0}px`,
                  width: '210px',
                  height: '210px',
                  zIndex: draggedNoteId === note.id ? 99 : 5,
                  cursor: draggedNoteId === note.id ? 'grabbing' : 'default',
                  boxShadow: note.pinned ? '0 0 10px rgba(0,0,0,0.1)' : '0 8px 16px rgba(0,0,0,0.15)',
                  border: note.pinned ? '2px solid rgba(var(--accent-rgb), 0.5)' : undefined
                }}
              >
                {/* Drag handle header bar */}
                <div 
                  className="drag-handle" 
                  onMouseDown={(e) => handleMouseDown(e, note)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '4px',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    cursor: note.pinned ? 'not-allowed' : 'grab',
                    marginBottom: '8px',
                    fontSize: '11px',
                    opacity: 0.7
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {!note.pinned && <Move size={12} />}
                    <span>{note.pinned ? '📌 Pinned' : 'Draft'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => togglePin(note.id)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: note.pinned ? 'var(--accent)' : 'inherit' }}
                      title={note.pinned ? 'Unlock position' : 'Lock position'}
                    >
                      <Pin size={12} fill={note.pinned ? 'currentColor' : 'none'} />
                    </button>
                    <button 
                      onClick={() => deleteNote(note.id)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                      title="Delete note"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <textarea
                  value={note.text}
                  onChange={(e) => updateText(note.id, e.target.value)}
                  style={{ fontSize: '13px', border: 'none', height: '110px' }}
                />

                {/* Color Selector */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateColor(note.id, c)}
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          border: note.color === c ? '2px solid rgba(0,0,0,0.5)' : '1px solid rgba(0,0,0,0.2)',
                          backgroundColor: 
                            c === 'yellow' ? '#fef08a' : 
                            c === 'blue' ? '#bfdbfe' : 
                            c === 'green' ? '#bbf7d0' : 
                            c === 'red' ? '#fecaca' : '#e9d5ff',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
