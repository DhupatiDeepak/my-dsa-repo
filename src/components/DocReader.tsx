import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Star, Tag, Plus, Trash2, 
  ZoomIn, ZoomOut, Bookmark, X, Send,
  Maximize2, Minimize2, ChevronLeft,
  Expand, Shrink
} from 'lucide-react';
import type { DocTrackDocument, TodoItem, DocComment, DocStatus, DocPriority } from '../types';

interface DocReaderProps {
  doc: DocTrackDocument;
  onUpdateDoc: (updated: DocTrackDocument) => void;
  onClose: () => void;
  onAddToast: (msg: string, type: 'success' | 'info') => void;
}

const getMockContent = (title: string, category: string, page: number) => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('system design') || category === 'System Design') {
    return {
      chapter: `CHAPTER ${page}: SYSTEM ARCHITECTURE`,
      title: `${page}.1 Scalability, CDNs, & High Availability`,
      content: `System design patterns dictate how high-performance servers distribute traffic load. Web scale environments utilize load balancers, reverse proxies, and Content Delivery Networks (CDNs) to reduce network latency to edge nodes.`,
      points: [
        `1. Horizontal scaling adds virtual hardware nodes dynamically`,
        `2. CDNs cache static files (images, bundles) at edge sites`,
        `3. High availability ensures backup fallback failover triggers`
      ],
      tip: `Tip: Focus on replication strategies and data consistency guarantees.`
    };
  }
  if (lowerTitle.includes('resume') || category === 'Resume') {
    return {
      chapter: `SECTION ${page}: PROFESSIONAL RESUME DETAILS`,
      title: `Curriculum Vitae - Candidate Profile`,
      content: `Highly motivated Software Development Engineer with extensive experience building responsive React web platforms and backend database layers. Proficient in TypeScript, JavaScript, Node.js, and SQL.`,
      points: [
        `1. Developed DocTrack Pro tracking dashboard using local storage`,
        `2. Implemented complex calendar schedulers and streak logs`,
        `3. Optimized rendering pipelines to achieve sub-millisecond build speeds`
      ],
      tip: `Tip: Customize resume tags before submitting to placement portals.`
    };
  }
  if (lowerTitle.includes('project') || category === 'Projects') {
    return {
      chapter: `PROJECT DOC ${page}: TECHNICAL SPECIFICATION`,
      title: `${page}.2 System Requirements & Architecture`,
      content: `This technical documentation outlines the functional requirements, API layers, schema configurations, and deployment strategies for our modular software projects.`,
      points: [
        `1. Frontend built with React, Vite, and custom CSS design system`,
        `2. Storage handles local persistence and backup downloads`,
        `3. Security rules validate schema models on the client side`
      ],
      tip: `Tip: Maintain comprehensive README documents for GitHub uploads.`
    };
  }
  // Default to DSA content matching their title
  return {
    chapter: `CHAPTER ${page}: DATA STRUCTURES BOOTCAMP`,
    title: `${page}.3 Study Guide - ${title}`,
    content: `Learning Data Structures is crucial for placement preparation. Review coding problems covering Arrays, Linked Lists, Graphs, Trees, and Dynamic Programming algorithms.`,
    points: [
      `1. Practice space-time complexity analysis daily (Big O)`,
      `2. Master recursive traversals and binary search operations`,
      `3. Solve medium/hard problems on portals like LeetCode`
    ],
    tip: `Tip: Write notes on edge cases and complex recursion logic.`
  };
};

const getMockOutline = (title: string, category: string) => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('system design') || category === 'System Design') {
    return [
      'Introduction to Scaling',
      'Load Balancer distribution algorithms',
      'CDN caching and Edge routing',
      'Database replication strategies',
      'Message queue buffering structures'
    ];
  }
  if (lowerTitle.includes('resume') || category === 'Resume') {
    return [
      'Contact Information & Links',
      'Executive Profile Summary',
      'Work Experience Checklist',
      'Skills & Tech stack keywords',
      'Education milestones & Certificates'
    ];
  }
  if (lowerTitle.includes('project') || category === 'Projects') {
    return [
      'Project Requirements outline',
      'Tech Stack & Framework choices',
      'Database Schema & Data models',
      'Functional specs & Core logic',
      'Deployment timeline & testing plan'
    ];
  }
  return [
    'Overview & Setup guidelines',
    'Fundamental concepts checklist',
    'Practical problems & cases',
    'Complex edge cases analysis',
    'Summary check & next steps'
  ];
};

export const DocReader: React.FC<DocReaderProps> = ({ doc, onUpdateDoc, onClose, onAddToast }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'todo' | 'comments'>('info');
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  const handleFullscreenToggle = () => {
    if (!previewRef.current) return;
    if (!document.fullscreenElement) {
      previewRef.current.requestFullscreen().catch(err => {
        onAddToast('Could not enter fullscreen mode.', 'info');
        console.error("Error entering fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };
  const [zoomLevel, setZoomLevel] = useState(100);
  const [newTodoText, setNewTodoText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  
  const mockContent = getMockContent(doc.title, doc.category, doc.currentPage || 1);
  const docOutline = doc.docxOutline || getMockOutline(doc.title, doc.category);
  
  // XLSX Spreadsheet grid details
  const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
  const rows = Array.from({ length: 8 }, (_, i) => i + 1);

  // PDF page scrolling handler simulation
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > doc.pageCount) return;
    const progress = Math.round((newPage / doc.pageCount) * 100);
    const status: DocStatus = progress === 100 ? 'Completed' : 'Reading';
    onUpdateDoc({
      ...doc,
      currentPage: newPage,
      progress,
      status
    });
    onAddToast(`Advanced reading to page ${newPage} (${progress}%)`, 'info');
  };

  // Excel input edit cell handler
  const handleCellChange = (cellKey: string, val: string) => {
    const sheet = doc.xlsxData || {};
    const updatedSheet = { ...sheet, [cellKey]: val };
    
    // Automatically recalculate column totals if modifying sums
    // e.g. Row 6 calculates sums B6 = B2+B3+B4+B5
    if (cellKey.startsWith('B') && cellKey !== 'B6') {
      const sum = [2,3,4,5].reduce((acc, rowId) => {
        const rowVal = updatedSheet[`B${rowId}`] || '0';
        return acc + (parseFloat(rowVal) || 0);
      }, 0);
      updatedSheet['B6'] = String(sum);
    }
    if (cellKey.startsWith('C') && cellKey !== 'C6') {
      const sum = [2,3,4,5].reduce((acc, rowId) => {
        const rowVal = updatedSheet[`C${rowId}`] || '0';
        return acc + (parseFloat(rowVal) || 0);
      }, 0);
      updatedSheet['C6'] = String(sum);
    }
    // Calculate variance column D = B - C
    rows.forEach(rowId => {
      if (rowId > 1) {
        const b = parseFloat(updatedSheet[`B${rowId}`] || '0') || 0;
        const c = parseFloat(updatedSheet[`C${rowId}`] || '0') || 0;
        updatedSheet[`D${rowId}`] = String(b - c);
      }
    });

    onUpdateDoc({
      ...doc,
      xlsxData: updatedSheet
    });
  };

  // DOCX Segment outline click checker
  const handleOutlineClick = (_headerName: string, index: number) => {
    // Toggle outline segment completion
    // We can simulate progress increase by updating completed checkpoints
    const checkedCount = (doc.pdfBookmarks || []).includes(index)
      ? (doc.pdfBookmarks || []).filter(i => i !== index)
      : [...(doc.pdfBookmarks || []), index];

    const progress = Math.round((checkedCount.length / docOutline.length) * 100);
    const status: DocStatus = progress === 100 ? 'Completed' : 'In Progress';

    onUpdateDoc({
      ...doc,
      pdfBookmarks: checkedCount, // repurpose bookmarks list to store outline checked state
      progress,
      status
    });
    onAddToast(`Outline checklist progress: ${progress}%`, 'info');
  };

  // Info Tab modifiers
  const handleStatusChange = (status: DocStatus) => {
    onUpdateDoc({ ...doc, status, progress: status === 'Completed' ? 100 : doc.progress });
    onAddToast(`Reading status updated to "${status}"`, 'success');
  };

  const handlePriorityChange = (priority: DocPriority) => {
    onUpdateDoc({ ...doc, priority });
    onAddToast(`Priority updated to "${priority}"`, 'info');
  };

  const handleRatingChange = (rating: number) => {
    onUpdateDoc({ ...doc, rating });
    onAddToast(`Rating set to ${rating} Stars!`, 'success');
  };

  const toggleFavorite = () => {
    onUpdateDoc({ ...doc, favorite: !doc.favorite });
    onAddToast(doc.favorite ? 'Removed from favorites' : 'Marked as Favorite!', 'info');
  };

  const togglePinned = () => {
    onUpdateDoc({ ...doc, pinned: !doc.pinned });
    onAddToast(doc.pinned ? 'Unpinned document' : 'Pinned document to top!', 'info');
  };

  // Checklist updates
  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;
    const newTodo: TodoItem = {
      id: 'todo_' + Math.random().toString(36).substr(2, 9),
      text: newTodoText.trim(),
      completed: false
    };
    const updatedTodos = [...doc.todos, newTodo];
    onUpdateDoc({ ...doc, todos: updatedTodos });
    setNewTodoText('');
    onAddToast('Added checklist task to document.', 'success');
  };

  const handleToggleTodo = (todoId: string) => {
    const updatedTodos = doc.todos.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t);
    
    // Automatically recalculate reading progress if all tasks are complete!
    const doneCount = updatedTodos.filter(t => t.completed).length;
    const pct = updatedTodos.length > 0 ? Math.round((doneCount / updatedTodos.length) * 100) : doc.progress;

    onUpdateDoc({ 
      ...doc, 
      todos: updatedTodos,
      progress: pct,
      status: pct === 100 ? 'Completed' : doc.status
    });
  };

  const handleDeleteTodo = (todoId: string) => {
    onUpdateDoc({ ...doc, todos: doc.todos.filter(t => t.id !== todoId) });
    onAddToast('Removed checklist task.', 'info');
  };

  // Notes area update
  const handleNotesChange = (notes: string) => {
    onUpdateDoc({ ...doc, notes });
  };

  // Comments feed updates
  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newComment: DocComment = {
      id: 'comment_' + Math.random().toString(36).substr(2, 9),
      text: newCommentText.trim(),
      timestamp: new Date().toISOString(),
      author: 'Self'
    };
    onUpdateDoc({ ...doc, comments: [newComment, ...doc.comments] });
    setNewCommentText('');
    onAddToast('Comment posted.', 'success');
  };

  const handleDeleteComment = (commentId: string) => {
    onUpdateDoc({ ...doc, comments: doc.comments.filter(c => c.id !== commentId) });
    onAddToast('Comment deleted.', 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      
      {/* Title & Navigation details bar */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '8px', 
            background: 'var(--accent-glow)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center'
          }}>
            <FileText size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{doc.title}</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{doc.fileName} ({doc.fileSize})</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="glass-btn" onClick={togglePinned} style={{ color: doc.pinned ? 'var(--accent)' : 'inherit' }} title={doc.pinned ? 'Unpin item' : 'Pin item'}>
            <Bookmark size={14} fill={doc.pinned ? 'currentColor' : 'none'} />
          </button>
          <button className="glass-btn" onClick={toggleFavorite} style={{ color: doc.favorite ? '#f59e0b' : 'inherit' }} title="Toggle favorite">
            <Star size={14} fill={doc.favorite ? 'currentColor' : 'none'} />
          </button>
          <button className="glass-btn glass-btn-primary" onClick={onClose} style={{ padding: '8px 12px' }}>
            <X size={16} /> Close Reader
          </button>
        </div>
      </div>

      {/* Reader Layout Split Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMaximized ? 'minmax(0, 1.25fr) 40px' : 'minmax(0, 1.25fr) minmax(320px, 0.75fr)', 
        gap: '16px', 
        flexGrow: 1, 
        alignItems: 'stretch',
        minHeight: '600px'
      }}>
        
        {/* Left Pane: Google Drive style Simulated File Viewer */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
              📄 Interactive Preview ({doc.fileType.toUpperCase()})
            </span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="glass-btn" onClick={() => setZoomLevel(z => Math.max(50, z - 10))} style={{ padding: '4px 6px' }} title="Zoom Out">
                <ZoomOut size={12} />
              </button>
              <span style={{ fontSize: '11px', minWidth: '35px', textAlign: 'center' }}>{zoomLevel}%</span>
              <button className="glass-btn" onClick={() => setZoomLevel(z => Math.min(150, z + 10))} style={{ padding: '4px 6px' }} title="Zoom In">
                <ZoomIn size={12} />
              </button>
              <button 
                className="glass-btn" 
                onClick={handleFullscreenToggle} 
                style={{ 
                  padding: '4px 6px', 
                  color: isFullscreen ? 'var(--accent)' : 'inherit',
                  borderColor: isFullscreen ? 'rgba(var(--accent-rgb), 0.3)' : 'var(--glass-border)',
                  marginLeft: '4px'
                }}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
              >
                {isFullscreen ? <Shrink size={12} /> : <Expand size={12} />}
              </button>
              <button 
                className="glass-btn" 
                onClick={() => setIsMaximized(!isMaximized)} 
                style={{ 
                  padding: '4px 6px', 
                  color: isMaximized ? 'var(--accent)' : 'inherit',
                  borderColor: isMaximized ? 'rgba(var(--accent-rgb), 0.3)' : 'var(--glass-border)',
                  marginLeft: '4px'
                }}
                title={isMaximized ? "Restore side panel" : "Maximize view"}
              >
                {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
            </div>
          </div>

          <div 
            ref={previewRef} 
            className="fullscreen-target" 
            style={{ 
              flexGrow: 1, 
              overflowY: 'auto', 
              display: 'flex', 
              justifyContent: 'center', 
              background: 'rgba(0,0,0,0.1)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '16px' 
            }}
          >
            
            {/* 1. PDF File Reader view simulation */}
            {doc.fileType === 'pdf' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%', transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
                {doc.blobUrl ? (
                  <iframe 
                    src={doc.blobUrl} 
                    title={doc.title} 
                    style={{ width: '100%', minWidth: '480px', minHeight: '600px', borderRadius: '8px', border: '1px solid var(--border-color)', background: '#ffffff' }}
                  />
                ) : (
                  <div style={{ 
                    background: 'var(--bg-secondary)', 
                    width: '100%', 
                    maxWidth: '480px', 
                    minHeight: '580px', 
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    padding: '40px',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid var(--border-color)',
                    position: 'relative'
                  }}>
                    {/* Watermark/Outline Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <span>{mockContent.chapter}</span>
                      <span>PAGE {doc.currentPage || 1} OF {doc.pageCount}</span>
                    </div>

                    {/* Body Copy */}
                    <div style={{ margin: '30px 0', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h3 style={{ fontSize: '16px', color: 'var(--accent)' }}>{mockContent.title}</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-primary)', textIndent: '20px', lineHeight: '1.6' }}>
                        {mockContent.content}
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--text-primary)', textIndent: '20px', lineHeight: '1.6' }}>
                        Key focus areas:
                      </p>
                      <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                        {mockContent.points.map((pt, idx) => (
                          <div key={idx}>{pt}</div>
                        ))}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        {mockContent.tip}
                      </p>
                    </div>

                    {/* Bookmark visual badge */}
                    {(doc.pdfBookmarks || []).includes(doc.currentPage || 1) && (
                      <div style={{ position: 'absolute', top: '0', right: '40px', width: '20px', height: '30px', backgroundColor: 'var(--accent)' }} title="Page Bookmarked" />
                    )}

                    {/* Page Controls footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <button 
                        className="glass-btn" 
                        onClick={() => handlePageChange((doc.currentPage || 1) - 1)}
                        disabled={(doc.currentPage || 1) <= 1}
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        Previous Page
                      </button>
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                        Page {doc.currentPage || 1} / {doc.pageCount}
                      </span>
                      <button 
                        className="glass-btn" 
                        onClick={() => handlePageChange((doc.currentPage || 1) + 1)}
                        disabled={(doc.currentPage || 1) >= doc.pageCount}
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        Next Page
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Excel File Spreadsheet view simulation */}
            {doc.fileType === 'xlsx' && (
              <div style={{ width: '100%', overflowX: 'auto', transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}>
                <div style={{ minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="excel-grid-container">
                    <table className="excel-table">
                      <thead>
                        <tr>
                          <th className="excel-th excel-row-num"></th>
                          {cols.map(c => (
                            <th key={c} className="excel-th">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(r => (
                          <tr key={r}>
                            <td className="excel-row-num">{r}</td>
                            {cols.map(c => {
                              const cellKey = `${c}${r}`;
                              const val = (doc.xlsxData || {})[cellKey] || '';
                              
                              // Make D6 or formula cells display bold/styled
                              const isTotalRow = r === 6;
                              const isHeaderRow = r === 1;

                              return (
                                <td key={c} className="excel-td" style={{ 
                                  backgroundColor: isHeaderRow ? 'var(--bg-tertiary)' : undefined,
                                  fontWeight: (isTotalRow || isHeaderRow) ? 'bold' : 'normal'
                                }}>
                                  <input 
                                    type="text" 
                                    value={val}
                                    onChange={(e) => handleCellChange(cellKey, e.target.value)}
                                    className="excel-input"
                                    style={{ 
                                      textAlign: c !== 'A' ? 'right' : 'left',
                                      fontWeight: (isTotalRow || isHeaderRow) ? 'bold' : 'normal'
                                    }}
                                    disabled={isHeaderRow}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    💡 Type numbers in columns B and C. Totals in Row 6 and Variance column D recalculate automatically.
                  </span>
                </div>
              </div>
            )}

            {/* 3. DOCX Word File outline navigator simulation */}
            {doc.fileType === 'docx' && (
              <div style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '16px', transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}>
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ marginBottom: '12px' }}>Document Chapters & Completion Checklist</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {docOutline.map((header, idx) => {
                      const completed = (doc.pdfBookmarks || []).includes(idx);
                      
                      return (
                        <div 
                          key={idx} 
                          onClick={() => handleOutlineClick(header, idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: completed ? 'rgba(var(--accent-rgb), 0.05)' : 'var(--bg-tertiary)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            borderLeft: `3px solid ${completed ? 'var(--accent)' : 'transparent'}`,
                            transition: 'var(--transition-smooth)'
                          }}
                        >
                          <span style={{ fontSize: '13px', fontWeight: 500, textDecoration: completed ? 'line-through' : 'none' }}>
                            {idx + 1}. {header}
                          </span>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: completed ? 'var(--accent)' : 'var(--border-color)', color: completed ? '#fff' : 'var(--text-secondary)' }}>
                            {completed ? 'Read ✔' : 'Mark Read'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Other/Fallback file type simulation */}
            {doc.fileType === 'other' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: '60px' }}>
                <FileText size={48} style={{ marginBottom: '16px', color: 'var(--text-muted)' }} />
                <h4>No interactive view available</h4>
                <p style={{ fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
                  Use the right pane to take notes, add task checklists, and track your work logs.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Right Pane: Details, notes, comments and checklists */}
        {isMaximized ? (
          <div 
            onClick={() => setIsMaximized(false)}
            style={{
              width: '40px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              gap: '16px',
              color: 'var(--text-secondary)',
              transition: 'var(--transition-smooth)',
            }}
            title="Restore Sidebar Panel"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <ChevronLeft size={16} />
            <span style={{ 
              writingMode: 'vertical-lr', 
              fontSize: '11px', 
              fontWeight: 'bold', 
              letterSpacing: '1.5px',
              textTransform: 'uppercase'
            }}>
              Open Side Panel
            </span>
          </div>
        ) : (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* Tab selectors */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.05)', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexGrow: 1 }}>
                {(['info', 'notes', 'todo', 'comments'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flexGrow: 1,
                      padding: '12px',
                      border: 'none',
                      background: activeTab === tab ? 'var(--bg-secondary)' : 'transparent',
                      color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: activeTab === tab ? 'bold' : 'normal',
                      fontSize: '12px',
                      borderBottom: activeTab === tab ? '2px solid var(--accent)' : 'none',
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsMaximized(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderLeft: '1px solid var(--border-color)',
                  transition: 'color 0.2s'
                }}
                title="Collapse Panel (Maximize PDF)"
              >
                <X size={16} />
              </button>
            </div>

          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '16px' }}>
            
            {/* INFO TAB */}
            {activeTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status</label>
                    <select 
                      value={doc.status} 
                      onChange={(e) => handleStatusChange(e.target.value as DocStatus)}
                      className="glass-input" 
                      style={{ width: '100%', marginTop: '4px', fontSize: '12px' }}
                    >
                      {['Not Started', 'Reading', 'In Progress', 'Completed', 'On Hold', 'Revision'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Priority</label>
                    <select 
                      value={doc.priority} 
                      onChange={(e) => handlePriorityChange(e.target.value as DocPriority)}
                      className="glass-input" 
                      style={{ width: '100%', marginTop: '4px', fontSize: '12px' }}
                    >
                      {['Critical', 'High', 'Medium', 'Low'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Document rating stars</label>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <button 
                        key={stars} 
                        onClick={() => handleRatingChange(stars)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: stars <= doc.rating ? '#f59e0b' : 'var(--text-muted)' }}
                      >
                        <Star size={18} fill={stars <= doc.rating ? '#f59e0b' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Category:</span>
                    <strong>{doc.category}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Estimated Study Time:</span>
                    <strong>{doc.estimatedReadTime} Mins</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Added Date:</span>
                    <strong>{new Date(doc.addedDate).toLocaleDateString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Last Viewed:</span>
                    <strong>{new Date(doc.lastViewed).toLocaleDateString()}</strong>
                  </div>
                </div>

                {doc.tags.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tags</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {doc.tags.map((tag, idx) => (
                        <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', background: 'var(--border-color)', padding: '2px 8px', borderRadius: '4px' }}>
                          <Tag size={10} /> {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === 'notes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                <textarea 
                  value={doc.notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Start jotting down summary concepts, links, or ideas..."
                  className="glass-input"
                  style={{ width: '100%', height: '360px', resize: 'none', fontFamily: 'inherit', fontSize: '13px', lineHeight: '1.6' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  ✍️ Saved automatically. Use markdown styles for notes formatting.
                </span>
              </div>
            )}

            {/* TODO CHECKLIST TAB */}
            {activeTab === 'todo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="New checklist subtask..."
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    className="glass-input"
                    style={{ flexGrow: 1, fontSize: '12px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTodo();
                    }}
                  />
                  <button className="glass-btn glass-btn-primary" onClick={handleAddTodo} style={{ padding: '6px 12px' }}>
                    <Plus size={14} /> Add
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {doc.todos.length === 0 ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No checklists. Add tasks to calculate read progress!
                    </div>
                  ) : (
                    doc.todos.map((todo) => (
                      <div 
                        key={todo.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: '6px',
                          border: '1px solid var(--glass-border)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            type="checkbox" 
                            checked={todo.completed} 
                            onChange={() => handleToggleTodo(todo.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ 
                            fontSize: '13px', 
                            textDecoration: todo.completed ? 'line-through' : 'none',
                            color: todo.completed ? 'var(--text-secondary)' : 'var(--text-primary)'
                          }}>
                            {todo.text}
                          </span>
                        </div>
                        
                        <button 
                          onClick={() => handleDeleteTodo(todo.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.7 }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* COMMENTS TAB */}
            {activeTab === 'comments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="glass-input"
                    style={{ flexGrow: 1, fontSize: '12px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddComment();
                    }}
                  />
                  <button className="glass-btn glass-btn-primary" onClick={handleAddComment} style={{ padding: '6px 12px' }}>
                    <Send size={12} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {doc.comments.length === 0 ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No comments written yet.
                    </div>
                  ) : (
                    doc.comments.map((comment) => (
                      <div key={comment.id} className="glass-card" style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <strong>{comment.author}</strong>
                          <span>{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineBreak: 'anywhere' }}>{comment.text}</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '10px', opacity: 0.6 }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      </div>

    </div>
  );
};
