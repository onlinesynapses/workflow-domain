/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useRef } from 'react';

// ── Google Fonts @import
// Add to index.html or import in main CSS file
// @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono&display=swap');

// ── CSS custom properties injection (style tag)
const DesignTokens = () => (
  <style>{`
    :root {
      /* ── Color Tokens ────────────────────────────────────── */
      --obsidian:       #0B0E11;   /* primary background        */
      --graphite:       #12161C;   /* panels, cards             */
      --circuit:        #1E232B;   /* borders, dividers         */
      --gold:           #F5C77A;   /* primary accent            */
      --amber:          #D9A441;   /* secondary accent          */
      --halt-red:       #C94B4B;   /* critical actions only     */
      --text-primary:   #E8E8E2;   /* never pure white          */
      --text-secondary: #8A8F9A;   /* labels, metadata          */

      /* ── Gradients ──────────────────────────────────────── */
      --gradient-gold: linear-gradient(135deg, #F5C77A, #D9A441);

      /* ── Typography ─────────────────────────────────────── */
      --font-display: 'IBM Plex Sans', sans-serif;
      --font-mono:    'JetBrains Mono', monospace;

      /* ── Spacing (strict 8px base system) ───────────────── */
      --sp-1: 8px;
      --sp-2: 16px;
      --sp-3: 24px;
      --sp-4: 32px;
      --sp-6: 48px;
      --sp-8: 64px;

      /* ── Panel Primitives ───────────────────────────────── */
      --radius:   10px;
      --border:   1px solid var(--circuit);
      --panel-bg: var(--graphite);
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: var(--font-display);
      background-color: var(--obsidian);
      color: var(--text-primary);
      overflow: hidden;
    }
  `}</style>
);

// ── TypeScript type definitions
// (In JavaScript, we'll use JSDoc comments)

/**
 * @typedef {Object} NodeType
 * @property {string} type - Unique identifier for the node type
 * @property {string} icon - Unicode character representing the node
 * @property {string} label - Human-readable label for the node
 * @property {string} desc - Short description of the node
 */

/**
 * @typedef {Object} PaletteGroup
 * @property {string} label - Category label (e.g., COGNITION, DECISION)
 * @property {NodeType[]} nodes - Array of node types in this category
 */

// ── Constants: MOCK_LOG_ENTRIES, PALETTE_GROUPS, VOCABULARY_REGISTRY
const MOCK_LOG_ENTRIES = [
  { timestamp: '10:42:03', level: 'INFO', message: 'System initialized. Canvas ready.' },
  { timestamp: '10:42:03', level: 'EVENT', message: 'Design system loaded. 9 node types registered.' },
  { timestamp: '10:42:04', level: 'INFO', message: 'Awaiting workflow construction.' }
];

const PALETTE_GROUPS = [
  {
    label: 'COGNITION',
    nodes: [
      {
        type: 'KNOWLEDGE_CONSULT',
        icon: '◈',
        label: 'Knowledge Consult',
        desc: 'Query domain knowledge base'
      }
    ]
  },
  {
    label: 'DECISION',
    nodes: [
      {
        type: 'DECISION_GATE',
        icon: '◆',
        label: 'Decision Gate',
        desc: 'Conditional fan-out routing'
      },
      {
        type: 'ESCALATION_TRIGGER',
        icon: '⚡',
        label: 'Escalation Trigger',
        desc: 'Human handoff or alert'
      }
    ]
  },
  {
    label: 'ACTION',
    nodes: [
      {
        type: 'PARALLEL_DISPATCH',
        icon: '⋈',
        label: 'Parallel Dispatch',
        desc: 'Fork to simultaneous paths'
      },
      {
        type: 'MERGE_CONVERGENCE',
        icon: '⊕',
        label: 'Merge Convergence',
        desc: 'Join parallel execution paths'
      },
      {
        type: 'DOMAIN_TRANSFORM',
        icon: '⟳',
        label: 'Domain Transform',
        desc: 'Enrich or reshape data'
      }
    ]
  },
  {
    label: 'VALIDATION',
    nodes: [
      {
        type: 'VALIDATION_CHECK',
        icon: '✓',
        label: 'Validation Check',
        desc: 'Verify against domain rules'
      }
    ]
  },
  {
    label: 'INTEGRATION',
    nodes: [
      {
        type: 'INTEGRATION_BRIDGE',
        icon: '⇄',
        label: 'Integration Bridge',
        desc: 'Connect external system'
      },
      {
        type: 'SCHEDULED_PROBE',
        icon: '◎',
        label: 'Scheduled Probe',
        desc: 'Time-triggered entry point'
      }
    ]
  }
];

// ── SVG: HexLogo component
const HexLogo = ({ size = 28, glow = false }) => {
  const glowClass = glow ? 'animate-pulse' : '';
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 28 28" 
      className={`${glowClass}`}
      style={{
        filter: glow ? 'drop-shadow(0 0 10px rgba(245,199,122,0.15))' : 'none'
      }}
    >
      <polygon 
        points="14,2 24,8 24,20 14,26 4,20 4,8" 
        fill="none" 
        stroke="var(--gold)" 
        strokeWidth="1.5"
      />
      <text 
        x="14" 
        y="18" 
        textAnchor="middle" 
        fill="var(--gold)" 
        fontSize="12" 
        fontFamily="var(--font-display)"
        fontWeight="600"
      >
        S
      </text>
    </svg>
  );
};

// ── Components: TopBar, NodePalette, CanvasViewport, Inspector, LogStrip

const TopBar = ({ projectName, setProjectName, executionState, deployHandler, haltHandler }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleProjectNameChange = (e) => {
    setProjectName(e.target.value);
  };

  const handleProjectNameBlur = () => {
    setIsEditing(false);
  };

  const handleProjectNameClick = () => {
    setIsEditing(true);
  };

  const getStatusPillStyle = () => {
    switch (executionState) {
      case 'READY':
        return 'bg-transparent text-var(--gold)';
      case 'RUNNING':
        return 'bg-transparent text-var(--amber)';
      case 'HALTED':
        return 'bg-transparent text-var(--halt-red)';
      case 'COMPLETE':
        return 'bg-transparent text-var(--gold)';
      default:
        return 'bg-transparent text-var(--gold)';
    }
  };

  const getStatusDotStyle = () => {
    switch (executionState) {
      case 'READY':
        return 'w-2 h-2 rounded-full bg-var(--gold) inline-block mr-1';
      case 'RUNNING':
        return 'w-2 h-2 rounded-full bg-var(--amber) inline-block mr-1 animate-pulse';
      case 'HALTED':
        return 'w-2 h-2 rounded-full bg-var(--halt-red) inline-block mr-1';
      case 'COMPLETE':
        return 'w-2 h-2 rounded-full bg-var(--gold) inline-block mr-1 animate-flash';
      default:
        return 'w-2 h-2 rounded-full bg-var(--gold) inline-block mr-1';
    }
  };

  return (
    <div className="topbar" style={{
      height: '48px',
      backgroundColor: 'var(--obsidian)',
      borderBottom: 'var(--border)',
      padding: '0 var(--sp-3)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: 'var(--font-display)'
    }}>
      <div className="left-cluster" style={{ display: 'flex', alignItems: 'center' }}>
        <HexLogo size={28} />
        <span style={{
          marginLeft: 'var(--sp-2)',
          fontSize: '13px',
          fontWeight: '600',
          letterSpacing: '0.02em',
          color: 'var(--text-primary)',
          textTransform: 'uppercase'
        }}>
          SYNAPSES-OD
        </span>
        <div style={{
          width: '1px',
          height: '20px',
          backgroundColor: 'var(--circuit)',
          margin: '0 var(--sp-2)'
        }}></div>
        <input
          type="text"
          value={projectName}
          onChange={handleProjectNameChange}
          onBlur={handleProjectNameBlur}
          onClick={handleProjectNameClick}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: isEditing ? '1px solid var(--gold)' : 'none',
            outline: 'none',
            fontSize: '13px',
            fontFamily: 'var(--font-display)',
            color: 'var(--text-secondary)',
            padding: '2px 0',
            width: '200px'
          }}
          placeholder="Untitled Project"
        />
      </div>
      
      <div className="right-cluster" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
        <div className={`status-pill ${getStatusPillStyle()}`} style={{
          borderRadius: '6px',
          padding: '4px 10px',
          fontSize: '11px',
          fontWeight: '600',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span className={getStatusDotStyle()}></span>
          {executionState}
        </div>
        
        <button 
          onClick={deployHandler}
          style={{
            background: 'var(--gradient-gold)',
            color: 'var(--obsidian)',
            fontFamily: 'var(--font-display)',
            fontWeight: '600',
            fontSize: '11px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.target.style.boxShadow = '0 0 12px rgba(245,199,122,0.35)'}
          onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
        >
          DEPLOY
        </button>
        
        {executionState === 'RUNNING' && (
          <button 
            onClick={haltHandler}
            style={{
              backgroundColor: 'var(--halt-red)',
              color: 'white',
              fontFamily: 'var(--font-display)',
              fontWeight: '600',
              fontSize: '11px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              opacity: 1,
              transition: 'opacity 150ms ease-in-out'
            }}
          >
            HALT
          </button>
        )}
      </div>
    </div>
  );
};

const NodePalette = ({ groups, onNodeSelect }) => {
  const [expandedGroups, setExpandedGroups] = useState({});
  
  const toggleGroup = (label) => {
    setExpandedGroups(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <div className="node-palette" style={{
      width: '220px',
      backgroundColor: 'var(--panel-bg)',
      borderRight: 'var(--border)',
      overflowY: 'auto',
      height: 'calc(100vh - 48px - 160px)',
      position: 'relative'
    }}>
      <div style={{
        padding: 'var(--sp-2)',
        borderBottom: 'var(--border)',
        fontSize: '10px',
        fontWeight: '600',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-display)'
      }}>
        NODE PALETTE
      </div>
      
      <select style={{
        width: 'calc(100% - var(--sp-2) * 2)',
        margin: 'var(--sp-1) var(--sp-2)',
        padding: 'var(--sp-1)',
        backgroundColor: 'var(--obsidian)',
        color: 'var(--text-secondary)',
        border: 'var(--border)',
        borderRadius: '4px',
        fontSize: '11px',
        fontFamily: 'var(--font-display)'
      }}>
        <option>Default</option>
        <option>Medical</option>
        <option>Legal</option>
        <option>Finance</option>
        <option>Logistics</option>
        <option>Custom…</option>
      </select>
      
      {groups.map((group, index) => (
        <div key={index}>
          <div 
            onClick={() => toggleGroup(group.label)}
            style={{
              padding: 'var(--sp-1) var(--sp-2)',
              borderBottom: 'var(--border)',
              fontSize: '10px',
              fontWeight: '600',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.style.backgroundColor = 'rgba(245,199,122,0.04)'}
            onMouseLeave={(e) => e.style.backgroundColor = 'transparent'}
          >
            <span>{group.label}</span>
            <span style={{
              transform: expandedGroups[group.label] ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease-in-out'
            }}>▶</span>
          </div>
          
          {expandedGroups[group.label] && group.nodes.map((node, nodeIndex) => (
            <div 
              key={nodeIndex}
              draggable
              onDragStart={() => onNodeSelect(node)}
              style={{
                padding: 'var(--sp-1) var(--sp-2)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-1)',
                height: '56px',
                cursor: 'grab'
              }}
              onMouseEnter={(e) => {
                e.style.backgroundColor = 'rgba(245,199,122,0.06)';
                e.querySelector('.icon-area').style.borderColor = 'var(--gold)';
              }}
              onMouseLeave={(e) => {
                e.style.backgroundColor = 'transparent';
                e.querySelector('.icon-area').style.borderColor = 'var(--circuit)';
              }}
            >
              <div className="icon-area" style={{
                width: '24px',
                height: '24px',
                backgroundColor: 'var(--circuit)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--circuit)',
                transition: 'border-color 150ms ease-in-out'
              }}>
                <span style={{
                  color: 'var(--gold)',
                  fontSize: '14px'
                }}>{node.icon}</span>
              </div>
              <div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                  marginBottom: '2px'
                }}>{node.label}</div>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-display)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '150px'
                }}>{node.desc}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const CanvasViewport = ({ selectedNode, setSelectedNode }) => {
  const [showMinimap, setShowMinimap] = useState(true);
  
  return (
    <div className="canvas-viewport" style={{
      flex: 1,
      backgroundColor: 'var(--obsidian)',
      position: 'relative',
      backgroundImage: 'radial-gradient(circle, var(--circuit) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      minHeight: 0
    }}>
      {/* Empty state */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 10
      }}>
        <HexLogo size={120} glow={true} />
        <div style={{
          marginTop: 'var(--sp-3)',
          fontSize: '13px',
          fontWeight: '600',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-display)'
        }}>
          BEGIN YOUR WORKFLOW
        </div>
        <div style={{
          marginTop: 'var(--sp-1)',
          fontSize: '11px',
          color: 'var(--circuit)',
          fontFamily: 'var(--font-display)'
        }}>
          Drag a node from the palette or choose a template
        </div>
        
        <div style={{
          display: 'flex',
          gap: '16px',
          marginTop: 'var(--sp-4)'
        }}>
          {['TRIAGE FLOW', 'REVIEW PIPELINE', 'INTEGRATION HUB'].map((label, i) => (
            <div 
              key={i}
              style={{
                width: '120px',
                height: '72px',
                backgroundColor: 'var(--graphite)',
                border: 'var(--border)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontSize: '11px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
              onMouseEnter={(e) => e.style.borderColor = 'var(--gold)'}
              onMouseLeave={(e) => e.style.borderColor = 'var(--circuit)'}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
      
      {/* Minimap */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        width: '140px',
        height: '90px',
        backgroundColor: 'var(--graphite)',
        border: 'var(--border)',
        borderRadius: '8px',
        zIndex: 20
      }}>
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          width: '100px',
          height: '50px',
          border: '2px solid var(--gold)',
          pointerEvents: 'none'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '30px',
          left: '40px',
          width: '6px',
          height: '6px',
          backgroundColor: 'var(--gold)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '50px',
          left: '80px',
          width: '6px',
          height: '6px',
          backgroundColor: 'var(--gold)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}></div>
      </div>
    </div>
  );
};

const Inspector = ({ selectedNode, onClose }) => {
  if (!selectedNode) {
    return (
      <div style={{
        width: 0,
        backgroundColor: 'var(--panel-bg)',
        borderLeft: 'var(--border)',
        overflow: 'hidden',
        transition: 'width 200ms ease-in-out',
        height: 'calc(100vh - 48px - 160px)'
      }}></div>
    );
  }

  return (
    <div style={{
      width: '300px',
      backgroundColor: 'var(--panel-bg)',
      borderLeft: 'var(--border)',
      overflow: 'hidden',
      transition: 'width 200ms ease-in-out',
      height: 'calc(100vh - 48px - 160px)',
      transform: 'translateX(0)',
      opacity: 1,
      animation: 'slideIn 200ms ease-in-out forwards'
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(16px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      
      <div style={{
        padding: 'var(--sp-2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: 'var(--border)'
      }}>
        <span style={{
          backgroundColor: 'var(--gold)',
          color: 'var(--obsidian)',
          fontFamily: 'var(--font-display)',
          fontSize: '10px',
          fontWeight: '600',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          padding: '4px 10px',
          borderRadius: '12px'
        }}>
          {selectedNode.label.toUpperCase()}
        </span>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '16px',
            cursor: 'pointer',
            padding: 0
          }}
        >
          ×
        </button>
      </div>
      
      <div style={{ padding: 'var(--sp-2)' }}>
        {/* Configuration Section */}
        <div style={{ marginBottom: 'var(--sp-3)' }}>
          <div style={{
            fontSize: '10px',
            fontWeight: '600',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-display)',
            marginBottom: 'var(--sp-1)'
          }}>
            CONFIGURATION
          </div>
          <div style={{ height: '1px', backgroundColor: 'var(--circuit)', marginBottom: 'var(--sp-2)' }}></div>
          
          <div style={{ marginBottom: 'var(--sp-2)' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              marginBottom: '4px'
            }}>
              LABEL
            </label>
            <input 
              type="text" 
              defaultValue={selectedNode.label}
              style={{
                width: '100%',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--obsidian)',
                border: 'var(--border)',
                borderRadius: '6px',
                padding: 'var(--sp-1)',
                outline: 'none'
              }}
              onFocus={(e) => e.style.borderColor = 'var(--gold)'}
              onBlur={(e) => e.style.borderColor = 'var(--circuit)'}
            />
          </div>
          
          <div style={{ marginBottom: 'var(--sp-2)' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              marginBottom: '4px'
            }}>
              DESCRIPTION
            </label>
            <textarea 
              rows="2"
              defaultValue={selectedNode.desc}
              style={{
                width: '100%',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--obsidian)',
                border: 'var(--border)',
                borderRadius: '6px',
                padding: 'var(--sp-1)',
                outline: 'none'
              }}
              onFocus={(e) => e.style.borderColor = 'var(--gold)'}
              onBlur={(e) => e.style.borderColor = 'var(--circuit)'}
            ></textarea>
          </div>
          
          <div style={{ marginBottom: 'var(--sp-2)' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              marginBottom: '4px'
            }}>
              TIMEOUT (MS)
            </label>
            <input 
              type="number" 
              defaultValue="30000"
              style={{
                width: '100%',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--obsidian)',
                border: 'var(--border)',
                borderRadius: '6px',
                padding: 'var(--sp-1)',
                outline: 'none'
              }}
              onFocus={(e) => e.style.borderColor = 'var(--gold)'}
              onBlur={(e) => e.style.borderColor = 'var(--circuit)'}
            />
          </div>
          
          <div style={{ marginBottom: 'var(--sp-2)' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              marginBottom: '4px'
            }}>
              RETRY
            </label>
            <div style={{
              width: '40px',
              height: '20px',
              backgroundColor: 'var(--circuit)',
              borderRadius: '10px',
              position: 'relative',
              cursor: 'pointer'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                backgroundColor: 'var(--text-secondary)',
                borderRadius: '50%',
                position: 'absolute',
                top: '2px',
                left: '2px',
                transition: 'left 150ms ease-in-out'
              }}></div>
            </div>
          </div>
        </div>
        
        {/* Schema Section */}
        <div>
          <div style={{
            fontSize: '10px',
            fontWeight: '600',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-display)',
            marginBottom: 'var(--sp-1)'
          }}>
            SCHEMA
          </div>
          <div style={{ height: '1px', backgroundColor: 'var(--circuit)', marginBottom: 'var(--sp-2)' }}></div>
          
          <div style={{ marginBottom: 'var(--sp-2)' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              marginBottom: '4px'
            }}>
              INPUT
            </label>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--obsidian)',
              border: 'var(--border)',
              borderRadius: '6px',
              padding: 'var(--sp-1)',
              cursor: 'pointer'
            }}>
              <div style={{ color: 'var(--gold)' }}>&#123;</div>
              <div style={{ paddingLeft: 'var(--sp-1)' }}>"data": "...",</div>
              <div style={{ paddingLeft: 'var(--sp-1)' }}"type": "object"</div>
              <div style={{ color: 'var(--gold)' }}>&#125;</div>
            </div>
          </div>
          
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              marginBottom: '4px'
            }}>
              OUTPUT
            </label>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--obsidian)',
              border: 'var(--border)',
              borderRadius: '6px',
              padding: 'var(--sp-1)',
              cursor: 'pointer'
            }}>
              <div style={{ color: 'var(--gold)' }}>&#123;</div>
              <div style={{ paddingLeft: 'var(--sp-1)' }}>"result": "...",</div>
              <div style={{ paddingLeft: 'var(--sp-1)' }}"type": "object"</div>
              <div style={{ color: 'var(--gold)' }}>&#125;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LogStrip = ({ entries, isExpanded, toggleExpand, clearLogs }) => {
  const logRef = useRef(null);
  
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [entries]);

  const getLevelColor = (level) => {
    switch (level) {
      case 'INFO': return 'var(--text-secondary)';
      case 'EVENT': return 'var(--gold)';
      case 'WARN': return 'var(--amber)';
      case 'ERROR': return 'var(--halt-red)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="log-strip" style={{
      height: isExpanded ? '160px' : '32px',
      backgroundColor: 'var(--panel-bg)',
      borderTop: 'var(--border)',
      transition: 'height 200ms ease-in-out',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--sp-2)',
        borderBottom: isExpanded ? 'var(--border)' : 'none'
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: '600',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-display)'
        }}>
          EXECUTION LOG
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <button 
            onClick={clearLogs}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontFamily: 'var(--font-display)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.style.color = 'var(--halt-red)'}
            onMouseLeave={(e) => e.style.color = 'var(--text-secondary)'}
          >
            CLEAR
          </button>
          <button 
            onClick={toggleExpand}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              cursor: 'pointer',
              transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 200ms ease-in-out'
            }}
          >
            ▲
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div 
          ref={logRef}
          style={{
            flex: 1,
            padding: 'var(--sp-1) var(--sp-2)',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            lineHeight: '1.6'
          }}
        >
          {entries.map((entry, index) => (
            <div 
              key={index}
              style={{
                opacity: 0,
                transform: 'translateY(4px)',
                animation: 'fadeInUp 150ms ease-in-out forwards'
              }}
            >
              <span style={{ color: 'var(--circuit)' }}>{entry.timestamp}</span>
              <span style={{ margin: '0 var(--sp-1)' }}>[</span>
              <span style={{ color: getLevelColor(entry.level) }}>{entry.level}</span>
              <span style={{ margin: '0 var(--sp-1)' }}>]</span>
              <span> {entry.message}</span>
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ── Root App: layout assembly, useState wiring
const App = () => {
  const [projectName, setProjectName] = useState('Untitled Project');
  const [executionState, setExecutionState] = useState('READY');
  const [selectedNode, setSelectedNode] = useState(null);
  const [logEntries, setLogEntries] = useState(MOCK_LOG_ENTRIES);
  const [isLogExpanded, setIsLogExpanded] = useState(true);
  
  const handleDeploy = () => {
    setExecutionState('RUNNING');
    setLogEntries(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level: 'INFO',
      message: 'Deployment initiated.'
    }]);
  };
  
  const handleHalt = () => {
    setExecutionState('HALTED');
    setLogEntries(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level: 'INFO',
      message: 'Execution halted by user.'
    }]);
  };
  
  const handleClearLogs = () => {
    setLogEntries([]);
  };
  
  const handleToggleLogExpand = () => {
    setIsLogExpanded(!isLogExpanded);
  };
  
  const handleNodeSelect = (node) => {
    setSelectedNode(node);
  };
  
  const handleCloseInspector = () => {
    setSelectedNode(null);
  };

  return (
    <div className="app-container" style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-display)'
    }}>
      <DesignTokens />
      
      <TopBar 
        projectName={projectName}
        setProjectName={setProjectName}
        executionState={executionState}
        deployHandler={handleDeploy}
        haltHandler={handleHalt}
      />
      
      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 0
      }}>
        <NodePalette 
          groups={PALETTE_GROUPS}
          onNodeSelect={handleNodeSelect}
        />
        
        <CanvasViewport 
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
        />
        
        <Inspector 
          selectedNode={selectedNode}
          onClose={handleCloseInspector}
        />
      </div>
      
      <LogStrip 
        entries={logEntries}
        isExpanded={isLogExpanded}
        toggleExpand={handleToggleLogExpand}
        clearLogs={handleClearLogs}
      />
    </div>
  );
};

export default App;