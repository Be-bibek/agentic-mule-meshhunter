import { useState, useEffect } from 'react'
import axios from 'axios'
import { Shield, Play } from 'lucide-react'
import GraphView from './components/GraphView'
import AgentSidebar from './components/AgentSidebar'
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

function App() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
  const [logs, setLogs] = useState<any[]>([])
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set())
  const [investigating, setInvestigating] = useState(false)

  // Load initial graph data from the backend graph endpoint
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

    // Fetch from backend API (served as static JSON endpoints)
    Promise.all([
      fetch(`${BACKEND}/api/graph/transactions`).then(r => r.json()),
      fetch(`${BACKEND}/api/graph/accounts`).then(r => r.json()),
    ]).then(([txns, accs]) => {
      buildGraph(txns, accs)
    }).catch(err => {
      console.warn('Backend graph data fetch failed, using mock:', err)
      // Provide a minimal demo graph so the visualizer still shows something
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

  // Connect to WebSocket for real-time agent telemetry with auto-reconnect
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
          if (data.verdict?.verdict?.is_mule_ring) {
            const members: string[] = data.verdict.verdict.ring_members || []
            setHighlightedNodes(new Set(members))
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
    if (investigating || graphData.nodes.length === 0) return

    setInvestigating(true)
    setLogs([])
    setHighlightedNodes(new Set())

    try {
      const muleNode = graphData.nodes.find(n => n.id.startsWith('acc_mule_'))
      const targetId = muleNode?.id ?? graphData.nodes[0]?.id
      if (!targetId) { setInvestigating(false); return }

      await axios.post(`${BACKEND}/api/agent/investigate`, { node_id: targetId })
    } catch (err) {
      console.error('Investigation failed:', err)
      setInvestigating(false)
    }
  }

  return (
    <div className="app-container">
      <div className="main-content">
        <header className="header">
          <div className="logo-container">
            <Shield size={24} className="logo-icon" />
            <span className="title">MuleTrace AI</span>
            <span className="badge">Abuse-Ring Sentinel</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Razorpay AI Buildathon — Track 02: Risk Manager
          </div>
        </header>

        <div className="graph-container">
          <GraphView data={graphData} highlightedNodes={highlightedNodes} />

          <div className="control-panel">
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {graphData.nodes.length} nodes · {graphData.links.length} edges
            </div>
            <button
              className={`btn primary ${investigating ? 'disabled' : ''}`}
              onClick={startInvestigation}
              disabled={investigating}
            >
              <Play size={16} />
              {investigating ? 'Agent Investigating...' : 'Trigger Agent Investigation'}
            </button>
          </div>
        </div>
      </div>

      <AgentSidebar logs={logs} />
    </div>
  )
}

export default App
