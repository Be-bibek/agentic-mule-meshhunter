import React, { useState, useEffect, useRef, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  AlertTriangle,
  Lock,
  Search,
  Maximize2,
  Minimize2,
  RefreshCw,
  Terminal,
  CheckCircle2,
  ArrowRight,
  Download,
  AlertCircle,
  ExternalLink,
  Layers,
  ChevronRight,
  Filter,
  Info
} from 'lucide-react';
import './App.css';

// Types
interface ThreatAccount {
  id: string;
  name: string;
  riskScore: number;
  type: string;
  volume: string;
  volumeNum: number;
  muleCount: number;
  duration: string;
  description: string;
  detectionReason: string;
  topology: string;
  status: 'active' | 'investigating' | 'frozen';
  kycFlags: string[];
}

interface GraphNode {
  id: string;
  label: string;
  type: 'seed' | 'mule' | 'shell' | 'legitimate';
  threatId?: string;
  riskScore: number;
  balance: string;
  bank: string;
  isFrozen?: boolean;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  amount: string;
  threatId?: string;
  isThreat?: boolean;
}

interface ScanLogStep {
  id: number;
  timestamp: string;
  tag: string;
  message: string;
  detail?: string;
  targetTimeMs: number;
}

const INITIAL_THREATS: ThreatAccount[] = [
  {
    id: 'ACC-88219',
    name: 'Hydra Layering Nexus',
    riskScore: 98,
    type: 'Fan-Out Layering',
    volume: '₹42,80,000',
    volumeNum: 4280000,
    muleCount: 14,
    duration: '180s',
    description: 'Rapid fan-out across 14 newly KYC-cleared accounts within 3 minutes of bulk inflow.',
    detectionReason: 'Abnormal velocity delta, shared device IMEI fingerprints, synthetic identity markers.',
    topology: 'High-dispersion star graph with cyclic cash-out nodes',
    status: 'active',
    kycFlags: ['Dormant 90+ days', 'Simultaneous VPA creation', 'Shared Geo-IP cluster']
  },
  {
    id: 'ACC-41092',
    name: 'Velox Smurfing Hub',
    riskScore: 93,
    type: 'Micro-Smurfing',
    volume: '₹28,50,000',
    volumeNum: 2850000,
    muleCount: 9,
    duration: '420s',
    description: 'Hundreds of sub-₹10k micro-deposits systematically channeled into a shell merchant VPA.',
    detectionReason: 'Structurally calibrated transaction values below ₹10,000 reporting threshold.',
    topology: 'Inverted funnel with terminal aggregation point',
    status: 'active',
    kycFlags: ['Aadhaar re-use alert', 'High-frequency OTP validation']
  },
  {
    id: 'ACC-77401',
    name: 'Shadow-Hop Cyclic Nexus',
    riskScore: 88,
    type: 'Circular Loop',
    volume: '₹34,20,000',
    volumeNum: 3420000,
    muleCount: 11,
    duration: '600s',
    description: 'Cyclic transaction loops routed between non-bank prepaid wallets to scrub audit trails.',
    detectionReason: 'Graph cycle detection triggered: 11 closed loops with near-zero retained balance.',
    topology: 'Multi-ring Hamiltonian circuit topology',
    status: 'active',
    kycFlags: ['Rapid wallet-to-bank drain', 'VPN IP hopping']
  },
  {
    id: 'ACC-39205',
    name: 'Ghost Merchant Outflow',
    riskScore: 82,
    type: 'Carding Funnel',
    volume: '₹19,40,000',
    volumeNum: 1940000,
    muleCount: 7,
    duration: '15m',
    description: 'Card testing charges converted into instant merchant payouts to P2P crypto arbitrage mules.',
    detectionReason: 'Disproportionate chargeback ratio paired with instant settlement requests.',
    topology: 'Branching tree with ephemeral leaf nodes',
    status: 'active',
    kycFlags: ['Mismatched billing zip', 'Disposable email domain']
  },
  {
    id: 'ACC-19482',
    name: 'Dormant Spike Ingress',
    riskScore: 76,
    type: 'Dormancy Hijack',
    volume: '₹16,10,000',
    volumeNum: 1610000,
    muleCount: 6,
    duration: '12m',
    description: '3-year dormant retail account suddenly energized to route high-velocity RTGS tranches.',
    detectionReason: 'Abrupt 450x increase above baseline historical 365-day moving average.',
    topology: 'Linear relay chain through 4 intermediate accounts',
    status: 'active',
    kycFlags: ['Recent mobile number change', 'Access via Tor Exit Node']
  }
];

const SCAN_STEPS_TEMPLATE: ScanLogStep[] = [
  {
    id: 1,
    timestamp: '00:00.420',
    tag: 'NEO4J_TRAVERSAL',
    message: 'Traversing 3-hop graph neighborhood from seed node...',
    detail: 'Extracted subgraph: 14 interconnected wallets across 5 banking rails.',
    targetTimeMs: 600
  },
  {
    id: 2,
    timestamp: '00:01.350',
    tag: 'VELOCITY_TELEMETRY',
    message: 'Computing temporal velocity vectors & dispersion rate...',
    detail: 'Detected burst delta: ₹42.8 Lakhs fan-out in 180s. Peak velocity: 34 TPS.',
    targetTimeMs: 1500
  },
  {
    id: 3,
    timestamp: '00:02.240',
    tag: 'FINGERPRINT_CORRELATION',
    message: 'Correlating hardware telemetry, device hashes & IP subnets...',
    detail: 'Match confirmed: 3 common IMEI hashes across 11 accounts; ASN spoofing detected.',
    targetTimeMs: 2400
  },
  {
    id: 4,
    timestamp: '00:03.180',
    tag: 'COMMUNITY_MODULARITY',
    message: 'Running Louvain modularity & Tarjan SCC cycle detection...',
    detail: 'Modularity score: 0.892 (High cluster cohesion). Confirmed synthetic mule ring.',
    targetTimeMs: 3300
  },
  {
    id: 5,
    timestamp: '00:03.950',
    tag: 'DECISION_SYNTHESIS',
    message: 'Synthesizing final risk dossier & gateway isolation order...',
    detail: 'Confidence: 99.4%. Recommendation: Immediate API Freeze & UPI VPA Revocation.',
    targetTimeMs: 4000
  }
];

export default function App() {
  // Application State
  const [threats, setThreats] = useState<ThreatAccount[]>(INITIAL_THREATS);
  const [selectedThreatId, setSelectedThreatId] = useState<string>('ACC-88219');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Agent Operations State: 'idle' | 'scanning' | 'verdict' | 'frozen'
  const [agentState, setAgentState] = useState<'idle' | 'scanning' | 'verdict' | 'frozen'>('idle');
  const [activeLogIndex, setActiveLogIndex] = useState<number>(-1);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanElapsedSec, setScanElapsedSec] = useState<string>('0.00');
  const [auditNotification, setAuditNotification] = useState<string | null>(null);

  // Graph Data State
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [isolateRingOnly, setIsolateRingOnly] = useState<boolean>(false);

  // Canvas Sizing Ref
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });

  // Selected Threat Object
  const currentThreat = useMemo(() => {
    return threats.find((t) => t.id === selectedThreatId) || threats[0];
  }, [threats, selectedThreatId]);

  // Is current threat frozen?
  const isCurrentThreatFrozen = currentThreat.status === 'frozen';

  // Responsive Canvas Dimensions observer
  useEffect(() => {
    const updateDims = () => {
      if (graphContainerRef.current) {
        const { clientWidth, clientHeight } = graphContainerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setContainerDimensions({ width: clientWidth, height: clientHeight });
        }
      }
    };

    updateDims();
    const observer = new ResizeObserver(updateDims);
    if (graphContainerRef.current) {
      observer.observe(graphContainerRef.current);
    }
    window.addEventListener('resize', updateDims);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDims);
    };
  }, []);

  // 1. Graph Data Generation (150 nodes, 300 links) in useEffect
  useEffect(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    const banks = ['Razorpay VPA', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'State Bank of India', 'Kotak Mahindra'];

    // Map threats to designated ring node IDs
    const threatSeedMap: Record<string, string[]> = {
      'ACC-88219': [],
      'ACC-41092': [],
      'ACC-77401': [],
      'ACC-39205': [],
      'ACC-19482': []
    };

    // First: Create Seed Nodes for the 5 threats
    INITIAL_THREATS.forEach((threat) => {
      nodes.push({
        id: threat.id,
        label: `${threat.name} (Seed)`,
        type: 'seed',
        threatId: threat.id,
        riskScore: threat.riskScore,
        balance: threat.volume,
        bank: 'Razorpay Escrow Gateway',
        isFrozen: false
      });
      threatSeedMap[threat.id].push(threat.id);
    });

    // Second: Create specific Mule nodes for each threat
    INITIAL_THREATS.forEach((threat) => {
      for (let i = 1; i <= threat.muleCount; i++) {
        const nodeId = `${threat.id}-M${i.toString().padStart(2, '0')}`;
        threatSeedMap[threat.id].push(nodeId);
        nodes.push({
          id: nodeId,
          label: `Mule Node ${i}`,
          type: i % 3 === 0 ? 'shell' : 'mule',
          threatId: threat.id,
          riskScore: Math.floor(threat.riskScore - Math.random() * 12),
          balance: `₹${(Math.floor(Math.random() * 450) * 1000 + 12000).toLocaleString('en-IN')}`,
          bank: banks[Math.floor(Math.random() * banks.length)],
          isFrozen: false
        });
      }
    });

    // Populate threat links inside each threat syndicate
    INITIAL_THREATS.forEach((threat) => {
      const ringNodes = threatSeedMap[threat.id];
      const seed = ringNodes[0];

      // Connect seed to all mules in star/burst
      for (let i = 1; i < ringNodes.length; i++) {
        links.push({
          source: seed,
          target: ringNodes[i],
          amount: `₹${(Math.floor(Math.random() * 320) * 1000 + 25000).toLocaleString('en-IN')}`,
          threatId: threat.id,
          isThreat: true
        });
      }

      // Add cross-mule layered links or circular loops
      for (let i = 1; i < ringNodes.length - 1; i += 2) {
        links.push({
          source: ringNodes[i],
          target: ringNodes[i + 1],
          amount: `₹${(Math.floor(Math.random() * 180) * 1000 + 10000).toLocaleString('en-IN')}`,
          threatId: threat.id,
          isThreat: true
        });
      }
      if (ringNodes.length > 4) {
        // cyclic link back to an intermediary
        links.push({
          source: ringNodes[ringNodes.length - 1],
          target: ringNodes[2],
          amount: '₹1,50,000',
          threatId: threat.id,
          isThreat: true
        });
      }
    });

    // Third: Fill remaining nodes up to 150 with legitimate / benign accounts
    const currentCount = nodes.length;
    const targetNodeCount = 150;
    const legitimateNodes: string[] = [];

    for (let i = currentCount + 1; i <= targetNodeCount; i++) {
      const legitId = `USR-${i.toString().padStart(4, '0')}`;
      legitimateNodes.push(legitId);
      nodes.push({
        id: legitId,
        label: `Enterprise Node ${i}`,
        type: 'legitimate',
        riskScore: Math.floor(Math.random() * 22 + 4),
        balance: `₹${(Math.floor(Math.random() * 900) * 1000 + 4000).toLocaleString('en-IN')}`,
        bank: banks[Math.floor(Math.random() * banks.length)],
        isFrozen: false
      });
    }

    // Fourth: Fill remaining links up to 300 with benign background transactions
    const remainingLinksNeeded = 300 - links.length;
    const allNodeIds = nodes.map((n) => n.id);

    for (let i = 0; i < remainingLinksNeeded; i++) {
      // Pick two random nodes (favor legitimate)
      const srcIdx = Math.floor(Math.random() * allNodeIds.length);
      let tgtIdx = Math.floor(Math.random() * allNodeIds.length);
      if (srcIdx === tgtIdx) {
        tgtIdx = (srcIdx + 1) % allNodeIds.length;
      }

      links.push({
        source: allNodeIds[srcIdx],
        target: allNodeIds[tgtIdx],
        amount: `₹${(Math.floor(Math.random() * 50) * 1000 + 1500).toLocaleString('en-IN')}`,
        isThreat: false
      });
    }

    setGraphData({ nodes, links });
  }, []);

  // When selected threat changes, reset agent state if not already frozen
  useEffect(() => {
    const isFrozen = currentThreat.status === 'frozen';
    if (isFrozen) {
      setAgentState('frozen');
      setActiveLogIndex(SCAN_STEPS_TEMPLATE.length - 1);
    } else {
      setAgentState('idle');
      setActiveLogIndex(-1);
      setScanProgress(0);
      setScanElapsedSec('0.00');
    }

    // Smoothly recenter graph towards the threat
    if (fgRef.current) {
      setTimeout(() => {
        fgRef.current.zoomToFit(600, 70);
      }, 300);
    }
  }, [selectedThreatId, currentThreat.status]);

  // Handle Threat Card Click
  const handleSelectThreat = (threatId: string) => {
    setSelectedThreatId(threatId);
  };

  // Run Agentic Scan: 4-second simulated AI reasoning run with step logs
  const handleRunScan = () => {
    if (agentState === 'scanning') return;

    setAgentState('scanning');
    setActiveLogIndex(0);
    setScanProgress(0);
    const startTime = Date.now();
    const durationMs = 4000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / durationMs) * 100);
      setScanProgress(progress);
      setScanElapsedSec((elapsed / 1000).toFixed(2));

      // Calculate which log step is active
      const currentStep = SCAN_STEPS_TEMPLATE.findIndex((step) => elapsed < step.targetTimeMs);
      if (currentStep === -1) {
        setActiveLogIndex(SCAN_STEPS_TEMPLATE.length - 1);
      } else {
        setActiveLogIndex(currentStep);
      }

      if (elapsed >= durationMs) {
        clearInterval(interval);
        setScanProgress(100);
        setScanElapsedSec('4.00');
        setActiveLogIndex(SCAN_STEPS_TEMPLATE.length - 1);
        setAgentState('verdict');

        // Center on the detected ring
        if (fgRef.current) {
          fgRef.current.zoomToFit(500, 60);
        }
      }
    }, 50);
  };

  // Sever & Freeze Ring Action
  const handleSeverAndFreeze = () => {
    // 1. Update threat status
    setThreats((prev) =>
      prev.map((t) => (t.id === selectedThreatId ? { ...t, status: 'frozen' as const } : t))
    );

    // 2. Mark relevant nodes in graph as frozen
    setGraphData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) => {
        if (node.threatId === selectedThreatId) {
          return { ...node, isFrozen: true };
        }
        return node;
      })
    }));

    // 3. Move agent state to frozen success state
    setAgentState('frozen');
  };

  // Reset / Unfreeze for interactive re-testing
  const handleResetFreeze = () => {
    setThreats((prev) =>
      prev.map((t) => (t.id === selectedThreatId ? { ...t, status: 'active' as const } : t))
    );
    setGraphData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) => {
        if (node.threatId === selectedThreatId) {
          return { ...node, isFrozen: false };
        }
        return node;
      })
    }));
    setAgentState('idle');
    setActiveLogIndex(-1);
    setScanProgress(0);
    setScanElapsedSec('0.00');
  };

  // Filtered threats for sidebar search
  const filteredThreats = useMemo(() => {
    if (!searchQuery.trim()) return threats;
    const query = searchQuery.toLowerCase();
    return threats.filter(
      (t) =>
        t.id.toLowerCase().includes(query) ||
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.type.toLowerCase().includes(query)
    );
  }, [threats, searchQuery]);

  // Graph custom rendering functions
  const isNodeInActiveThreat = (node: GraphNode) => node.threatId === selectedThreatId;

  // Custom Node Canvas Painting
  const drawNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = isNodeInActiveThreat(node);
    const isFrozen = node.isFrozen;
    const isSeed = node.type === 'seed' && isSelected;
    const isHovered = hoveredNode?.id === node.id;

    // Node radius
    let r = 4.5;
    if (node.type === 'seed') r = 8;
    else if (isSelected) r = 6;
    else if (node.type === 'legitimate') r = 3.5;

    // Outer Halo for active threats
    if (isSelected && !isFrozen) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + (isSeed ? 7 : 4), 0, 2 * Math.PI, false);
      ctx.fillStyle = isSeed ? 'rgba(239, 68, 68, 0.18)' : 'rgba(249, 115, 22, 0.15)';
      ctx.fill();
    }

    // Outer Ring for Frozen Nodes
    if (isFrozen && isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.fill();
    }

    // Main Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);

    if (isFrozen && isSelected) {
      ctx.fillStyle = '#64748b'; // slate-500
      ctx.strokeStyle = '#334155';
    } else if (isSeed) {
      ctx.fillStyle = '#ef4444'; // red-500
      ctx.strokeStyle = '#b91c1c';
    } else if (isSelected) {
      ctx.fillStyle = node.type === 'shell' ? '#eab308' : '#f97316'; // amber or orange
      ctx.strokeStyle = '#c2410c';
    } else if (node.threatId) {
      // Other unselected threat ring nodes
      ctx.fillStyle = '#fca5a5';
      ctx.strokeStyle = '#ef4444';
    } else {
      // Legitimate background node
      ctx.fillStyle = isHovered ? '#6366f1' : '#cbd5e1';
      ctx.strokeStyle = isHovered ? '#4338ca' : '#94a3b8';
    }

    ctx.lineWidth = isHovered || isSelected ? 1.5 : 0.8;
    ctx.fill();
    ctx.stroke();

    // Draw Lock icon indicator on frozen nodes
    if (isFrozen && isSelected) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.max(7, Math.floor(7 / globalScale * 2))}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✕', node.x, node.y);
    }

    // Labels for seed, selected, or hovered nodes
    if (isSeed || (isSelected && globalScale > 1.2) || isHovered) {
      const labelText = node.label || node.id;
      const fontSize = Math.max(9, Math.min(13, 11 / globalScale * 1.3));
      ctx.font = `600 ${fontSize}px Inter, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Background pill for label
      const textWidth = ctx.measureText(labelText).width;
      const pillPadX = 4;
      const pillPadY = 2;
      const pillY = node.y + r + 3;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.fillRect(
        node.x - textWidth / 2 - pillPadX,
        pillY - pillPadY,
        textWidth + pillPadX * 2,
        fontSize + pillPadY * 2
      );

      ctx.strokeStyle = isFrozen ? '#94a3b8' : isSeed ? '#fca5a5' : '#e2e8f0';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(
        node.x - textWidth / 2 - pillPadX,
        pillY - pillPadY,
        textWidth + pillPadX * 2,
        fontSize + pillPadY * 2
      );

      ctx.fillStyle = isFrozen ? '#475569' : isSeed ? '#991b1b' : '#0f172a';
      ctx.fillText(labelText, node.x, pillY);
    }
  };

  return (
    <div id="muletrace-root" className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans select-none">
      {/* 1. TOP NAVIGATION BAR */}
      <header id="top-navbar" className="h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between z-20 shrink-0">
        {/* Left: Logo & Product ID */}
        <div id="nav-brand-container" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <Shield className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-slate-900 text-[15px] tracking-tight">MuleTrace AI</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
              Sentinel Core v2.4
            </span>
          </div>
          <div className="h-4 w-px bg-slate-200 ml-1" />
          <span className="text-xs text-slate-500 font-medium hidden md:inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Razorpay AI Buildathon &bull; Abuse-Ring Sentinel
          </span>
        </div>

        {/* Center: Live Pipeline Status Metrics */}
        <div id="nav-status-metrics" className="hidden lg:flex items-center gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Graph Database:</span>
            <span className="font-mono font-medium text-slate-800">Neo4j Active (150N / 300L)</span>
          </div>
          <div className="h-3 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Escrow Locked:</span>
            <span className="font-mono font-medium text-slate-800">₹1,41,00,000</span>
          </div>
          <div className="h-3 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Detection Model:</span>
            <span className="font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
              GNN-Louvain-v4
            </span>
          </div>
        </div>

        {/* Right: Pulsing Live Beacon & System Status */}
        <div id="nav-live-indicator" className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/80 px-3 py-1 rounded-full text-xs text-emerald-800">
            <div className="relative flex items-center justify-center w-2 h-2">
              <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 beacon-pulse" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </div>
            <span className="font-medium tracking-tight whitespace-nowrap">Live Monitoring: 1.4k TPS</span>
          </div>
          <button
            id="btn-recenter-graph"
            onClick={() => fgRef.current?.zoomToFit(400, 60)}
            title="Recenter and fit canvas"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors border border-transparent hover:border-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN LAYOUT */}
      <div id="main-dashboard-grid" className="flex-1 flex overflow-hidden">
        {/* COLUMN 1: LEFT SIDEBAR (Threat Queue) */}
        <aside id="left-sidebar" className="w-80 md:w-88 xl:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10">
          {/* Sidebar Header */}
          <div id="threat-queue-header" className="p-4 border-b border-slate-200 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Threat Queue</h2>
                <span className="px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  {threats.length} Flagged
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Real-time Stream</span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-threat-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by ID, ring, or pattern..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 text-slate-800 transition-all"
              />
            </div>
          </div>

          {/* Scrollable Threat List */}
          <div id="threat-list-container" className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredThreats.map((threat) => {
              const isSelected = threat.id === selectedThreatId;
              const isFrozen = threat.status === 'frozen';

              return (
                <div
                  key={threat.id}
                  id={`threat-item-${threat.id}`}
                  onClick={() => handleSelectThreat(threat.id)}
                  className={`p-3.5 cursor-pointer transition-all relative ${
                    isSelected
                      ? 'bg-indigo-50/70 border-l-[3px] border-l-indigo-600 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]'
                      : 'hover:bg-slate-50/90 border-l-[3px] border-l-transparent'
                  }`}
                >
                  {/* Top row: Account ID & Risk Score Badge */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold text-slate-900">{threat.id}</span>
                      {isFrozen && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                          <Lock className="w-2.5 h-2.5" /> FROZEN
                        </span>
                      )}
                    </div>

                    {/* Risk Score Pill */}
                    <div
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold tracking-tight border flex items-center gap-1 ${
                        threat.riskScore >= 90
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : threat.riskScore >= 80
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>{threat.riskScore}</span>
                    </div>
                  </div>

                  {/* Ring Syndicate Name & Volume */}
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="text-xs font-semibold text-slate-800 tracking-tight truncate pr-2">
                      {threat.name}
                    </h3>
                    <span className="font-mono text-[11px] font-medium text-slate-600 whitespace-nowrap">
                      {threat.volume}
                    </span>
                  </div>

                  {/* Short meta description */}
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mb-2">
                    {threat.description}
                  </p>

                  {/* Threat Stats Tags */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                      {threat.muleCount} Mules
                    </span>
                    <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                      {threat.duration} Window
                    </span>
                    <span className="text-slate-400 truncate">{threat.type}</span>
                  </div>
                </div>
              );
            })}

            {filteredThreats.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No threat accounts match &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>

          {/* Threat Queue Footer Info */}
          <div id="threat-queue-footer" className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Automated Ingestion Feed
            </span>
            <span className="font-mono text-slate-400">Razorpay Sentinel API</span>
          </div>
        </aside>

        {/* COLUMN 2: CENTER CANVAS (The Graph Visualization) */}
        <main id="center-canvas-container" className="flex-1 relative flex flex-col bg-slate-50 overflow-hidden">
          {/* Canvas Floating Header Overlay */}
          <div id="canvas-overlay-header" className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-auto">
            <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm rounded-lg px-3 py-2 flex items-center gap-3">
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Focus Syndicate</div>
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="font-mono text-indigo-600">{currentThreat.id}</span>
                  <span>&bull;</span>
                  <span>{currentThreat.name}</span>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Status</div>
                <div className="text-xs font-medium flex items-center gap-1">
                  {isCurrentThreatFrozen ? (
                    <span className="text-slate-600 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-500" /> Severed &amp; Locked
                    </span>
                  ) : agentState === 'scanning' ? (
                    <span className="text-indigo-600 font-semibold animate-pulse flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Autonomous Scan...
                    </span>
                  ) : agentState === 'verdict' ? (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Ring Confirmed (99.4%)
                    </span>
                  ) : (
                    <span className="text-amber-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Unverified Threat
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Pills */}
            <button
              id="btn-toggle-isolate"
              onClick={() => setIsolateRingOnly(!isolateRingOnly)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border shadow-sm transition-colors flex items-center gap-1.5 ${
                isolateRingOnly
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white/90 backdrop-blur-md text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isolateRingOnly ? 'Showing Ring Only' : 'Isolate Ring'}</span>
            </button>
          </div>

          {/* Canvas Floating Controls (Top-Right) */}
          <div id="canvas-floating-controls" className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm rounded-lg p-1 pointer-events-auto">
            <button
              onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.25, 300)}
              title="Zoom In"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
            >
              <span className="font-bold text-sm leading-none">+</span>
            </button>
            <button
              onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 0.8, 300)}
              title="Zoom Out"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
            >
              <span className="font-bold text-sm leading-none">&minus;</span>
            </button>
            <div className="h-4 w-px bg-slate-200 mx-0.5" />
            <button
              onClick={() => fgRef.current?.zoomToFit(500, 60)}
              title="Fit to Screen"
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* The Force Graph Component */}
          <div ref={graphContainerRef} className="flex-1 w-full h-full graph-bg-grid relative overflow-hidden">
            {/* Scanning radar indicator overlay during agent scan */}
            {agentState === 'scanning' && (
              <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="w-full h-24 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent scan-radar-line" />
              </div>
            )}

            {graphData.nodes.length > 0 && (
              <ForceGraph2D
                ref={fgRef}
                width={containerDimensions.width}
                height={containerDimensions.height}
                graphData={{
                  nodes: isolateRingOnly
                    ? graphData.nodes.filter((n) => n.threatId === selectedThreatId)
                    : graphData.nodes,
                  links: isolateRingOnly
                    ? graphData.links.filter((l) => l.threatId === selectedThreatId)
                    : graphData.links
                }}
                nodeCanvasObject={drawNode}
                nodePointerAreaPaint={(node: any, color, ctx) => {
                  ctx.fillStyle = color;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, 9, 0, 2 * Math.PI, false);
                  ctx.fill();
                }}
                onNodeHover={(node: any) => setHoveredNode(node || null)}
                onNodeClick={(node: any) => {
                  if (node.threatId && node.threatId !== selectedThreatId) {
                    setSelectedThreatId(node.threatId);
                  }
                }}
                linkDirectionalParticles={(link: any) => {
                  if (isCurrentThreatFrozen && link.threatId === selectedThreatId) return 0;
                  if (link.threatId === selectedThreatId) return 3;
                  return 0;
                }}
                linkDirectionalParticleSpeed={0.009}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleColor={() => '#ef4444'}
                linkColor={(link: any) => {
                  const isThreatLink = link.threatId === selectedThreatId;
                  if (isThreatLink) {
                    return isCurrentThreatFrozen ? 'rgba(100, 116, 139, 0.4)' : 'rgba(239, 68, 68, 0.7)';
                  }
                  return 'rgba(203, 213, 225, 0.45)'; // slate-300 light
                }}
                linkWidth={(link: any) => (link.threatId === selectedThreatId ? 1.8 : 0.8)}
                linkLineDash={(link: any) => (isCurrentThreatFrozen && link.threatId === selectedThreatId ? [3, 2] : null)}
                d3VelocityDecay={0.3}
                cooldownTicks={120}
              />
            )}
          </div>

          {/* Canvas Bottom Legend Bar */}
          <div id="canvas-bottom-legend" className="h-10 bg-white border-t border-slate-200 px-5 flex items-center justify-between text-xs text-slate-600 z-10 shrink-0">
            <div className="flex items-center gap-5">
              <span className="text-slate-400 font-medium">Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-100" />
                <span>Seed Account</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>Identified Mule</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Shell Intermediary</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span>Benign Baseline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 flex items-center justify-center text-[8px] text-white font-bold">
                  ✕
                </span>
                <span>Severed / Frozen</span>
              </div>
            </div>

            {/* Hovered Node Quick Tooltip Indicator */}
            <div className="hidden sm:flex items-center gap-2">
              {hoveredNode ? (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-[11px] font-mono">
                  <span className="font-semibold text-slate-900">{hoveredNode.id}</span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="text-slate-600">{hoveredNode.bank}</span>
                  <span className="text-slate-400">&bull;</span>
                  <span className={hoveredNode.riskScore > 75 ? 'text-red-600 font-bold' : 'text-slate-600'}>
                    Risk {hoveredNode.riskScore}
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 text-[11px]">Hover over any node to inspect account telemetry</span>
              )}
            </div>
          </div>
        </main>

        {/* COLUMN 3: RIGHT SIDEBAR (Agent Operations) */}
        <aside id="right-sidebar" className="w-84 md:w-96 xl:w-108 bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 shadow-sm">
          {/* Agent Header */}
          <div id="agent-operations-header" className="p-4 border-b border-slate-200 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Agent Operations</h2>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Sentinel-Reasoner v4
              </span>
            </div>

            {/* Active Target Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Investigative Target</div>
                <div className="text-xs font-bold text-slate-900 font-mono">{currentThreat.id}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Exposed Volume</div>
                <div className="text-xs font-mono font-bold text-slate-900">{currentThreat.volume}</div>
              </div>
            </div>
          </div>

          {/* Agent Action Button / Control Strip */}
          <div className="p-4 border-b border-slate-200 shrink-0 bg-slate-50/50">
            {agentState === 'idle' && (
              <button
                id="btn-run-agentic-scan"
                onClick={handleRunScan}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg font-medium text-xs tracking-tight shadow-sm transition-all flex items-center justify-center gap-2 group active:scale-[0.99]"
              >
                <Zap className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
                <span>Run Agentic Scan</span>
                <span className="ml-auto font-mono text-[10px] text-indigo-200 bg-indigo-700/60 px-1.5 py-0.5 rounded">
                  4.0s
                </span>
              </button>
            )}

            {agentState === 'scanning' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-700 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 animate-spin" />
                    Autonomous Reasoning in Progress...
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">{scanElapsedSec}s / 4.0s</span>
                </div>
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-75 shimmer-progress"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}

            {agentState === 'verdict' && (
              <div className="flex items-center justify-between text-xs bg-rose-50 border border-rose-200 text-rose-800 p-2 rounded-lg">
                <span className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  Abuse Ring Verified &bull; Action Required
                </span>
                <button
                  onClick={handleRunScan}
                  className="text-[11px] font-medium text-rose-700 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Re-scan
                </button>
              </div>
            )}

            {agentState === 'frozen' && (
              <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-lg">
                <span className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Gateway Ring Frozen
                </span>
                <button
                  onClick={handleResetFreeze}
                  className="text-[11px] font-medium text-emerald-700 hover:underline"
                >
                  Reset Demo
                </button>
              </div>
            )}
          </div>

          {/* Scrollable Agent Operations Body: Timeline + Verdict/Success */}
          <div id="agent-operations-content" className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Timeline of Agent's Thoughts (like Vercel deployment logs) */}
            <div id="agent-timeline-container" className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-slate-400" />
                  <span>Agent Execution Log</span>
                </div>
                {agentState !== 'idle' && (
                  <span className="text-[10px] font-mono text-slate-400">
                    {activeLogIndex + 1}/{SCAN_STEPS_TEMPLATE.length} steps
                  </span>
                )}
              </div>

              {/* Step list */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3 font-mono text-[11px]">
                {SCAN_STEPS_TEMPLATE.map((step, idx) => {
                  const isDone = activeLogIndex > idx || agentState === 'verdict' || agentState === 'frozen';
                  const isCurrent = activeLogIndex === idx && agentState === 'scanning';
                  const isPending = activeLogIndex < idx && agentState !== 'verdict' && agentState !== 'frozen';

                  return (
                    <div
                      key={step.id}
                      className={`transition-all ${
                        isPending ? 'opacity-35' : 'opacity-100'
                      } ${isCurrent ? 'log-entry-enter' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {/* Step Marker */}
                        <div className="mt-0.5 shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : isCurrent ? (
                            <Activity className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                              {step.id}
                            </span>
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 font-semibold">{step.tag}</span>
                            <span className="text-slate-400">{step.timestamp}</span>
                          </div>
                          <div className="text-slate-800 font-sans text-xs font-medium leading-snug mt-0.5">
                            {step.message}
                          </div>
                          {(isDone || isCurrent) && step.detail && (
                            <div className="text-[11px] text-slate-500 leading-tight mt-1 bg-white/80 p-1.5 rounded border border-slate-200/70 font-mono">
                              &gt; {step.detail}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {agentState === 'idle' && (
                  <div className="text-center py-4 text-slate-400 font-sans text-xs">
                    Ready to initiate investigation. Click &ldquo;Run Agentic Scan&rdquo; to traverse fraud graph.
                  </div>
                )}
              </div>
            </div>

            {/* Verdict Card (Appears after 4s scan completes) */}
            {agentState === 'verdict' && (
              <div id="verdict-card" className="border border-rose-200 bg-white rounded-xl shadow-sm p-4 space-y-3 log-entry-enter">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Verdict Card</div>
                      <div className="text-xs font-bold text-slate-900">Abuse Ring Confirmed</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                    Confidence: 99.4%
                  </span>
                </div>

                {/* Ring Overview Metric Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Cluster Size</div>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                      {currentThreat.muleCount} Mules
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Ring Volume</div>
                    <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                      {currentThreat.volume}
                    </div>
                  </div>
                </div>

                {/* Topology & Modularity summary */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Topology:</span>
                    <span className="font-semibold text-slate-800">{currentThreat.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Velocity Window:</span>
                    <span className="font-mono text-slate-800">{currentThreat.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Modularity Q:</span>
                    <span className="font-mono text-emerald-700 font-semibold">0.892 (High Cohesion)</span>
                  </div>
                </div>

                {/* Regulatory / KYC Flags */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Flagged Anomalies:</span>
                  <div className="flex flex-wrap gap-1">
                    {currentThreat.kycFlags.map((flag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-medium"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* PRIMARY DANGER ACTION: BIG RED "SEVER & FREEZE RING" BUTTON */}
                <div className="pt-2">
                  <button
                    id="btn-sever-and-freeze"
                    onClick={handleSeverAndFreeze}
                    className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-3 px-4 rounded-lg font-semibold text-xs tracking-tight shadow-md shadow-red-200 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <Lock className="w-4 h-4 text-white" />
                    <span>Sever &amp; Freeze Ring</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-1.5">
                    Will revoke API access &amp; hold ₹{currentThreat.volumeNum.toLocaleString('en-IN')} in escrow
                  </p>
                </div>
              </div>
            )}

            {/* Success State: Replaces Verdict Card after Freeze is clicked */}
            {agentState === 'frozen' && (
              <div id="frozen-success-card" className="border border-emerald-200 bg-white rounded-xl shadow-sm p-4 space-y-3 log-entry-enter frozen-card">
                {/* Header */}
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Mule Ring Severed &amp; Frozen</h3>
                    <p className="text-[11px] text-emerald-700 font-medium">100% Perimeter Quarantine Active</p>
                  </div>
                </div>

                {/* Action Audit Confirmation Items */}
                <div className="space-y-2 text-xs">
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2.5 text-slate-800 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Razorpay Sentinel Automated Actions:</span>
                    </div>
                    <ul className="text-[11px] text-slate-600 space-y-1 pl-5 list-disc">
                      <li>Suspended 14 Account VPAs across payment gateway</li>
                      <li>Locked ₹{currentThreat.volumeNum.toLocaleString('en-IN')} in fraud escrow holding</li>
                      <li>Revoked OAuth tokens &amp; merchant payout settlement</li>
                      <li>Auto-transmitted SAR #RAZ-2026-88219 to FIU-IND</li>
                    </ul>
                  </div>

                  {/* Audit Cryptographic Stamp */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] font-mono text-slate-600 space-y-1">
                    <div className="text-[10px] text-slate-400 font-sans uppercase font-bold">Audit Cryptographic Stamp</div>
                    <div className="truncate text-slate-800">SHA256: 7f8a91c49b02a118e9f...</div>
                    <div className="text-[10px] text-slate-400">Timestamp: {new Date().toISOString()}</div>
                  </div>
                </div>

                {/* Secondary Actions */}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAuditNotification(`SAR Audit Dossier generated for ${currentThreat.id} (Ref: #RAZ-2026-88219). Escrow ₹${currentThreat.volumeNum.toLocaleString('en-IN')} locked.`);
                      setTimeout(() => setAuditNotification(null), 4000);
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 px-3 rounded-lg text-xs font-medium border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export Audit PDF</span>
                  </button>
                  <button
                    onClick={handleResetFreeze}
                    className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                  >
                    Undo Freeze
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Floating In-App Toast Notification */}
      {auditNotification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-800 flex items-center gap-3 text-xs log-entry-enter max-w-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex-1 leading-snug">{auditNotification}</div>
          <button
            onClick={() => setAuditNotification(null)}
            className="text-slate-400 hover:text-white text-sm ml-1"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
