import { useState, useEffect } from 'react'
import axios from 'axios'
import { Shield, Play } from 'lucide-react'
import GraphView from './components/GraphView'
import AgentSidebar from './components/AgentSidebar'
import './App.css'

function App() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [logs, setLogs] = useState<any[]>([])
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set())
  const [investigating, setInvestigating] = useState(false)

  // Load initial graph data (mocking a fetch of the network)
  useEffect(() => {
    // In a real app, this would fetch from the backend.
    // For the demo, we'll just fetch a small subgraph to avoid overwhelming the browser
    import('../../backend/data/transactions.json').then((txns) => {
      import('../../backend/data/accounts.json').then((accs) => {
        // Just take a slice for the visual demo (e.g., 200 nodes)
        const nodes: any[] = []
        const links: any[] = []
        const nodeIds = new Set()
        
        accs.default.slice(0, 150).forEach(a => {
          nodes.push({ id: a.account_id, type: 'account', name: a.name })
          nodeIds.add(a.account_id)
        })
        
        txns.default.slice(0, 300).forEach(t => {
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
      })
    })
  }, [])

  // Connect to WebSocket
  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:8000/api/ws/investigation')
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setLogs(prev => [data, ...prev])
      
      if (data.target && typeof data.target === 'string' && data.target.startsWith('acc_')) {
        setHighlightedNodes(prev => new Set(prev).add(data.target))
      }
      
      if (data.type === 'investigation_complete') {
        setInvestigating(false)
        if (data.verdict.verdict.is_mule_ring) {
          const members = data.verdict.verdict.ring_members || []
          setHighlightedNodes(new Set(members))
        }
      }
    }
    
    return () => ws.close()
  }, [])

  const startInvestigation = async () => {
    if (investigating) return
    
    setInvestigating(true)
    setLogs([])
    setHighlightedNodes(new Set())
    
    try {
      // Pick a random mule account to investigate for the demo
      // In reality, this would be passed from a fraud alert system
      const targetId = graphData.nodes.find(n => n.id.startsWith('acc_mule_'))?.id || graphData.nodes[0].id
      
      await axios.post('http://127.0.0.1:8000/api/agent/investigate', {
        node_id: targetId
      })
    } catch (err) {
      console.error(err)
      setInvestigating(false)
    }
  }

  return (
    <div className="app-container">
      <div className="main-content">
        <header className="header">
          <div className="logo-container">
            <Shield size={24} className="logo-icon" />
            <span className="title">Vulcan Sentinel</span>
            <span className="badge">Mule Ring Hunter</span>
          </div>
        </header>
        
        <div className="graph-container">
          <GraphView data={graphData} highlightedNodes={highlightedNodes} />
          
          <div className="control-panel">
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
