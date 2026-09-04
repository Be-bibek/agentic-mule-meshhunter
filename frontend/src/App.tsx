import { useState, useEffect } from 'react'
import axios from 'axios'
import { Shield, Crosshair, Loader2, Map as MapIcon, Network } from 'lucide-react'
import GraphView from './components/GraphView'
import AgentSidebar from './components/AgentSidebar'
import IndiaHeatmap from './components/IndiaHeatmap'
import './App.css'

const BACKEND = 'http://127.0.0.1:8000'

interface GraphNode {
  id: string
  type: string
  name?: string
}

interface GraphLink {
  source: string
  target: string
  amount?: number
  type?: string
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

type ViewMode = 'topology' | 'heatmap';

function App() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
  const [logs, setLogs] = useState<any[]>([])
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set())
  const [investigating, setInvestigating] = useState(false)
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('topology')

  useEffect(() => {
    const buildGraph = (txns: any[], accs: any[]) => {
      const nodes: GraphNode[] = []
      const links: GraphLink[] = []
      const nodeIds = new Set<string>()

      accs.slice(0, 200).forEach((a: any) => {
        nodes.push({ id: a.account_id, type: 'account', name: a.name })
        nodeIds.add(a.account_id)
      })

      txns.slice(0, 400).forEach((t: any) => {
        if (nodeIds.has(t.sender_id) && nodeIds.has(t.receiver_id)) {
          links.push({ source: t.sender_id, target: t.receiver_id, amount: t.amount })
        }
        if (nodeIds.has(t.sender_id)) {
          if (!nodeIds.has(t.device_info.device_id)) {
            nodes.push({ id: t.device_info.device_id, type: 'device' })
            nodeIds.add(t.device_info.device_id)
          }
          links.push({ source: t.sender_id, target: t.device_info.device_id, type: 'used' })
        }
      })

      setGraphData({ nodes, links })
    }

    Promise.all([
      fetch(`${BACKEND}/api/graph/transactions`).then(r => r.json()),
      fetch(`${BACKEND}/api/graph/accounts`).then(r => r.json()),
    ]).then(([txns, accs]) => {
      buildGraph(txns, accs)
    }).catch(err => {
      console.warn('Backend graph data fetch failed, using mock:', err)
      setGraphData({
        nodes: [
          { id: 'acc_demo_1', type: 'account', name: 'Alice' },
          { id: 'acc_demo_2', type: 'account', name: 'Bob' },
          { id: 'dev_shared', type: 'device' },
        ],
        links: [
          { source: 'acc_demo_1', target: 'acc_demo_2', amount: 1000 },
          { source: 'acc_demo_1', target: 'dev_shared' },
          { source: 'acc_demo_2', target: 'dev_shared' },
        ]
      })
    })
  }, [])

  useEffect(() => {
    let ws: WebSocket
    let reconnectTimer: ReturnType<typeof setTimeout>

    const connect = () => {
      ws = new WebSocket(`ws://127.0.0.1:8000/api/ws/investigation`)

      ws.onopen = () => console.log('[WS] Agent telemetry connected')

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setLogs(prev => [data, ...prev])

        if (data.target && typeof data.target === 'string' && data.target.startsWith('acc_')) {
          setHighlightedNodes(prev => new Set(prev).add(data.target))
        }

        if (data.type === 'investigation_complete') {
          setInvestigating(false)
          setActiveTargetId(null)
          if (data.verdict?.verdict?.is_mule_ring) {
            const members: string[] = data.verdict.verdict.ring_members || []
            setHighlightedNodes(new Set(members))
            
            // Push a synthetic SEVER RING log for demo visual impact
            setLogs(prev => [{
              type: 'action',
              target: 'SYSTEM',
              title: '⚡ [SEVER RING & FREEZE] Payload Executed',
              details: `Ring isolated. Placed immediate hold on ${members.length} accounts. Suspended shared hardware.`,
              isAction: true
            }, ...prev])
          }
        }
      }

      ws.onerror = () => console.warn('[WS] Connection error')
      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000)
      }
    }

    connect()
    return () => {
      clearTimeout(reconnectTimer)
      ws?.close()
    }
  }, [])

  const startInvestigation = async () => {
    if (investigating || !activeTargetId) return

    setInvestigating(true)
    setLogs([])
    setHighlightedNodes(new Set())

    try {
      await axios.post(`${BACKEND}/api/agent/investigate`, { node_id: activeTargetId })
    } catch (err) {
      console.error('Investigation dispatch failed:', err)
      setInvestigating(false)
      setActiveTargetId(null)
    }
  }

  return (
    <div className="app-container">
      <header className="header" style={{ paddingRight: '12px' }}>
        <div className="logo-container">
          <Shield size={20} className="logo-icon" />
          <span className="title">MuleTrace</span>
        </div>
        
        {/* Bloomberg Ticker */}
        <div className="bloomberg-ticker">
          <div className="ticker-item">
            <span className="ticker-label">CAPITAL MONITORED:</span>
            <span className="ticker-value">₹14.82 CR</span>
          </div>
          <div className="ticker-item">
            <span className="ticker-label">VELOCITY:</span>
            <span className="ticker-value">1,420 TX/S</span>
          </div>
          <div className="ticker-item">
            <span className="ticker-label">ISOLATED THREATS:</span>
            <span className="ticker-value danger">3 CLUSTERS</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* View Mode Toggle */}
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'topology' ? 'active' : ''}`}
              onClick={() => setViewMode('topology')}
            >
              <Network size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }}/> TOPOLOGY
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'heatmap' ? 'active' : ''}`}
              onClick={() => setViewMode('heatmap')}
            >
              <MapIcon size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }}/> INDIA MAP
            </button>
          </div>

          <button 
            className="btn primary"
            onClick={startInvestigation}
            disabled={investigating || !activeTargetId}
          >
            {investigating ? (
              <><Loader2 className="spinner" size={16} /> RUNNING AGENT...</>
            ) : (
              <><Crosshair size={16} /> RUN INVESTIGATION</>
            )}
          </button>
        </div>
      </header>
      
      <div className="main-content">
        {/* Left Panel: Active Threat Queue */}
        <div className="threat-queue">
          <div className="threat-header">Active Threat Queue</div>
          <div className="threat-list">
            <div className={`threat-card ${activeTargetId === 'acc_f145be95' ? 'active' : ''}`} onClick={() => setActiveTargetId('acc_f145be95')}>
              <div className="threat-title">Mule Cluster Alpha <span className="threat-badge">98/100</span></div>
              <div className="threat-meta">
                <span>15 accounts • ₹4.8L</span>
                <span>3 shared IPs</span>
              </div>
            </div>
            <div className={`threat-card ${activeTargetId === 'acc_a32b9c71' ? 'active' : ''}`} onClick={() => setActiveTargetId('acc_a32b9c71')}>
              <div className="threat-title">Mule Cluster Beta <span className="threat-badge">85/100</span></div>
              <div className="threat-meta">
                <span>6 accounts • ₹1.2L</span>
                <span>1 shared device</span>
              </div>
            </div>
            <div className={`threat-card ${activeTargetId === 'acc_d9230f81' ? 'active' : ''}`} onClick={() => setActiveTargetId('acc_d9230f81')}>
              <div className="threat-title">Mule Cluster Gamma <span className="threat-badge">78/100</span></div>
              <div className="threat-meta">
                <span>4 accounts • ₹45k</span>
                <span>circular transfer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Stage: View Switcher */}
        <div className="graph-container">
          {viewMode === 'topology' ? (
            <>
              <GraphView 
                data={graphData} 
                highlightedNodes={highlightedNodes} 
                activeTargetId={activeTargetId}
                onNodeClick={(node) => setActiveTargetId(node.id)}
              />
              <div className="mini-legend">
                <div className="legend-item"><div className="l-dot" style={{ background: '#ef4444' }}></div> Ring</div>
                <div className="legend-item"><div className="l-dot" style={{ background: '#f59e0b' }}></div> Flagged</div>
                <div className="legend-item"><div className="l-dot" style={{ background: '#8b5cf6' }}></div> Hardware</div>
                <div className="legend-item"><div className="l-dot" style={{ background: '#334155' }}></div> Clean</div>
              </div>
            </>
          ) : (
            <IndiaHeatmap activeTargetId={activeTargetId} />
          )}
        </div>

        {/* Right Panel: Agent Telemetry */}
        <AgentSidebar logs={logs} />
      </div>
    </div>
  )
}

export default App
