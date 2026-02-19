import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';

// Define the store with the complete specification
export const createSynapsesStore = (initialAst) => create(
  immer((set, get) => ({
    // CANONICAL AST (mutate this, never rfNodes/rfEdges directly)
    ast: initialAst || {
      version: '1.0.0',
      agentId: uuidv4(),
      nodes: [],
      edges: [],
      metadata: {
        name: 'Untitled Workflow',
        domainVocabulary: 'default',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        description: ''
      }
    },
    
    // DERIVED REACT FLOW STATE
    rfNodes: [],
    rfEdges: [],
    
    // INTERNAL: AST → React Flow recompute
    _recompute: () => {
      const { ast, activeVocabulary } = get();
      const vocab = get().getVocabulary(activeVocabulary);
      
      // Map SynapseNode[] → React Flow Node[]
      const rfNodes = ast.nodes.map(node => {
        const vocabItem = vocab[node.semanticType];
        return {
          id: node.id,
          type: 'synapseNode',
          position: node.position,
          data: {
            semanticType: node.semanticType,
            label: vocabItem?.label || node.label,
            icon: vocabItem?.icon || '◈',
            description: node.description,
            _ui: node._ui,
          },
          selected: node._ui.selected,
          className: () => {
            let classes = 'node-container';
            if (node._ui.selected) classes += ' selected-node';
            if (node._ui.executing) classes += ' executing-node';
            if (node._ui.error) classes += ' error-node';
            if (node._ui.complete) classes += ' complete-node';
            return classes;
          }
        };
      });
      
      // Map SynapseEdge[] → React Flow Edge[]
      const rfEdges = ast.edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'synapseEdge',
        label: edge.label,
        data: {
          edgeType: edge.edgeType,
          condition: edge.condition,
          _computed: edge._computed,
        },
        animated: edge._computed.animated,
        style: {
          stroke: edge._computed.strokeColor,
          strokeDasharray: edge._computed.strokeDashArray,
        }
      }));
      
      set({ rfNodes, rfEdges });
    },
    
    // NODE MUTATIONS
    addNode: (type, position) => {
      set(state => {
        const newNode = {
          id: `node-${Date.now()}`,
          semanticType: type,
          label: type.replace(/_/g, ' '),
          description: '',
          position,
          inputSchema: {},
          outputSchema: {},
          config: {},
          retryPolicy: { maxAttempts: 1, backoffMs: 0, retryOn: [] },
          timeout: 5000,
          executionMode: 'sequential',
          preProcessors: [],
          postProcessors: [],
          tracing: { enabled: true, sampleRate: 1.0 },
          _ui: { selected: false, executing: false, error: false, complete: false }
        };
        
        state.ast.nodes.push(newNode);
        state.ast.metadata.modified = new Date().toISOString();
        return state;
      });
      get()._recompute();
    },
    
    updateNode: (id, patch) => {
      set(state => {
        const node = state.ast.nodes.find(n => n.id === id);
        if (node) {
          Object.assign(node, patch);
          state.ast.metadata.modified = new Date().toISOString();
        }
        return state;
      });
      get()._recompute();
    },
    
    deleteNode: (id) => {
      set(state => {
        // Remove the node
        state.ast.nodes = state.ast.nodes.filter(n => n.id !== id);
        // Remove all edges connected to this node
        state.ast.edges = state.ast.edges.filter(
          e => e.source !== id && e.target !== id
        );
        state.ast.metadata.modified = new Date().toISOString();
        return state;
      });
      get()._recompute();
    },
    
    // EDGE MUTATIONS
    connectNodes: (connection) => {
      set(state => {
        const newEdge = {
          id: `edge-${Date.now()}`,
          source: connection.source,
          target: connection.target,
          edgeType: 'default',
          _computed: { 
            strokeColor: '#F5C77A', 
            strokeDashArray: 'none', 
            animated: false 
          }
        };
        
        state.ast.edges.push(newEdge);
        state.ast.metadata.modified = new Date().toISOString();
        return state;
      });
      get()._recompute();
    },
    
    updateEdge: (id, patch) => {
      set(state => {
        const edge = state.ast.edges.find(e => e.id === id);
        if (edge) {
          Object.assign(edge, patch);
          state.ast.metadata.modified = new Date().toISOString();
        }
        return state;
      });
      get()._recompute();
    },
    
    deleteEdge: (id) => {
      set(state => {
        state.ast.edges = state.ast.edges.filter(e => e.id !== id);
        state.ast.metadata.modified = new Date().toISOString();
        return state;
      });
      get()._recompute();
    },
    
    // POSITION SYNC (canvas drag → AST)
    syncNodePosition: (id, position) => {
      set(state => {
        const node = state.ast.nodes.find(n => n.id === id);
        if (node) {
          node.position = position;
          state.ast.metadata.modified = new Date().toISOString();
        }
        return state;
      });
    },
    
    // SELECTION
    selectedNodeId: null,
    selectedEdgeId: null,
    selectNode: (id) => {
      set(state => {
        // Deselect all nodes
        state.ast.nodes.forEach(node => {
          node._ui.selected = (node.id === id);
        });
        
        state.selectedNodeId = id;
        state.selectedEdgeId = null;
        return state;
      });
      get()._recompute();
    },
    selectEdge: (id) => {
      set(state => {
        state.selectedNodeId = null;
        state.selectedEdgeId = id;
        return state;
      });
    },
    
    // VOCABULARY
    activeVocabulary: 'default',
    setVocabulary: (key) => {
      set(state => {
        state.activeVocabulary = key;
        state.ast.metadata.domainVocabulary = key;
        state.ast.metadata.modified = new Date().toISOString();
        return state;
      });
      get()._recompute();
    },
    getVocabulary: (key) => {
      const vocabKey = key || get().activeVocabulary;
      // This would come from the registry defined in App.jsx
      return window.VOCABULARY_REGISTRY?.[vocabKey] || window.VOCABULARY_REGISTRY?.default || {};
    },
    
    // EXECUTION STATE
    executionState: 'idle',
    executingNodes: new Set(),
    setNodeExecuting: (id, executing) => {
      set(state => {
        const node = state.ast.nodes.find(n => n.id === id);
        if (node) {
          node._ui.executing = executing;
          if (executing) {
            state.executingNodes.add(id);
          } else {
            state.executingNodes.delete(id);
          }
        }
        return state;
      });
      get()._recompute();
    },
    setNodeError: (id, error) => {
      set(state => {
        const node = state.ast.nodes.find(n => n.id === id);
        if (node) {
          node._ui.error = error;
        }
        return state;
      });
      get()._recompute();
    },
    setNodeComplete: (id, complete) => {
      set(state => {
        const node = state.ast.nodes.find(n => n.id === id);
        if (node) {
          node._ui.complete = complete;
          node._ui.executing = false;
        }
        return state;
      });
      get()._recompute();
    },
    setExecutionState: (state) => {
      set(s => {
        s.executionState = state;
        return s;
      });
    },
    
    // AST IMPORT/EXPORT
    exportAST: () => {
      return JSON.stringify(get().ast, null, 2);
    },
    importAST: (json) => {
      try {
        const parsed = JSON.parse(json);
        set(state => {
          state.ast = parsed;
          return state;
        });
        get()._recompute();
      } catch (error) {
        console.error('Invalid AST JSON:', error);
      }
    }
  }))
);

// Create the default store instance
export const useSynapsesStore = createSynapsesStore();