import React, { useState } from 'react';
import { Star, ArrowRight, Eye, Tag } from 'lucide-react';
import type { DocTrackDocument, DocStatus } from '../types';

interface KanbanProps {
  documents: DocTrackDocument[];
  onUpdateStatus: (id: string, status: DocStatus) => void;
  onOpenDoc: (doc: DocTrackDocument) => void;
}

interface Column {
  id: string;
  title: string;
  statuses: DocStatus[];
  color: string;
}

const COLUMNS: Column[] = [
  { id: 'pending', title: '⏳ Pending / Reading', statuses: ['Not Started', 'Reading'], color: 'var(--status-reading)' },
  { id: 'in_progress', title: '⚡ In Progress', statuses: ['In Progress'], color: 'var(--status-in-progress)' },
  { id: 'review', title: '👀 Revision / On Hold', statuses: ['Revision', 'On Hold'], color: 'var(--status-revision)' },
  { id: 'completed', title: '✅ Completed', statuses: ['Completed'], color: 'var(--status-completed)' }
];

export const Kanban: React.FC<KanbanProps> = ({ documents, onUpdateStatus, onOpenDoc }) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Required to allow dropping
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    if (!id) return;

    // Get first status from the target column as default
    const col = COLUMNS.find(c => c.id === targetColumnId);
    if (col && col.statuses.length > 0) {
      onUpdateStatus(id, col.statuses[0]);
    }
    setDraggedId(null);
  };

  // Safe manual moving for mobile/accessibility
  const moveCardRight = (doc: DocTrackDocument) => {
    const currentColIndex = COLUMNS.findIndex(col => col.statuses.includes(doc.status));
    if (currentColIndex < COLUMNS.length - 1) {
      const nextCol = COLUMNS[currentColIndex + 1];
      onUpdateStatus(doc.id, nextCol.statuses[0]);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'var(--color-critical)';
      case 'High': return 'var(--color-high)';
      case 'Medium': return 'var(--color-medium)';
      default: return 'var(--color-low)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div>
        <h3>📋 Todo Kanban Board</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Drag and drop document cards between columns to update their reading status.</p>
      </div>

      <div className="kanban-board">
        {COLUMNS.map((col) => {
          const colDocs = documents.filter(doc => col.statuses.includes(doc.status));
          
          return (
            <div 
              key={col.id}
              className="glass-panel kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              style={{ borderTop: `4px solid ${col.color}`, background: 'rgba(255,255,255,0.01)' }}
            >
              <div className="kanban-column-header">
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{col.title}</span>
                <span style={{ fontSize: '12px', background: 'var(--border-color)', padding: '2px 8px', borderRadius: '10px' }}>
                  {colDocs.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1, overflowY: 'auto', padding: '2px' }}>
                {colDocs.length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                    Drop cards here
                  </div>
                ) : (
                  colDocs.map((doc) => {
                    return (
                      <div
                        key={doc.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, doc.id)}
                        className="glass-card kanban-card animate-slide-in"
                        style={{ 
                          borderLeft: `4px solid ${getPriorityColor(doc.priority)}`,
                          opacity: draggedId === doc.id ? 0.4 : 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          background: 'var(--bg-secondary)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                            {doc.fileType.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '9px', fontWeight: 'bold', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: getPriorityColor(doc.priority) }}>
                            {doc.priority}
                          </span>
                        </div>

                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', lineBreak: 'anywhere' }}>
                          {doc.title}
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                            <span>Progress</span>
                            <span>{doc.progress}%</span>
                          </div>
                          <div style={{ width: '100%', height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${doc.progress}%`, height: '100%', background: 'var(--accent)' }} />
                          </div>
                        </div>

                        {/* Tags */}
                        {doc.tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '4px 0' }}>
                            {doc.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '9px', background: 'rgba(var(--accent-rgb), 0.08)', color: 'var(--accent)', padding: '1px 5px', borderRadius: '4px' }}>
                                <Tag size={8} /> {tag}
                              </span>
                            ))}
                            {doc.tags.length > 2 && (
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>+{doc.tags.length - 2}</span>
                            )}
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Star size={11} fill={doc.favorite ? '#f59e0b' : 'none'} stroke={doc.favorite ? '#f59e0b' : 'var(--text-muted)'} />
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rating: {doc.rating}/5</span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              className="glass-btn" 
                              onClick={() => onOpenDoc(doc)}
                              style={{ padding: '4px 6px', borderRadius: '4px' }}
                              title="Open document details"
                            >
                              <Eye size={12} />
                            </button>
                            {col.id !== 'completed' && (
                              <button 
                                className="glass-btn"
                                onClick={() => moveCardRight(doc)}
                                style={{ padding: '4px 6px', borderRadius: '4px' }}
                                title="Move to next stage"
                              >
                                <ArrowRight size={12} />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
