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
  RefreshCw,
  Terminal,
  CheckCircle2,
  Layers,
  ChevronDown,
  Flame,
  LayoutGrid,
  Columns,
  X,
  ArrowRight,
  ChevronRight,
  SlidersHorizontal,
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react';
import { IndiaGeoHeatmap } from './components/IndiaGeoHeatmap';
import { ExecutiveBentoDashboard } from './components/ExecutiveBentoDashboard';
import './App.css';

// Types
export interface ThreatAccount {
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

interface ScanLogStep {
  id: number;
  timestamp: string;
  tag: string;
  message: string;
  detail?: string;
  targetTimeMs: number;
}

interface GraphNode {
  id: string;
  label?: string;
  name?: string;
  type: 'seed' | 'mule' | 'shell' | 'flagged' | 'legitimate';
  riskScore: number;
  volume: number;
  bank: string;
  threatId?: string;
  val: number;
  colorIdx?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphLink {
  source: string;
  target: string;
  amount: number;
  type: 'upi' | 'rtgs' | 'imps';
  threatId?: string;
  isThreatLink?: boolean;
  isSevered?: boolean;
}

const THREAT_SEEDS: ThreatAccount[] = [
  {
    id: 'ACC-88219',
    name: 'Hydra Layering Nexus',
    riskScore: 98,
    type: 'Layered Ring',
    volume: '₹42,80,000',
    volumeNum: 4280000,
    muleCount: 14,
    duration: '180s',
    description: 'High-velocity UPI dispersal fanning out across 14 mules, consolidating via shell merchant VPAs.',
    detectionReason: 'Abrupt 340% velocity spike across inter-bank rails within 3 minutes of initial seeding.',
    topology: 'Star-to-mesh hybrid with terminal hawala sink',
    status: 'active',
    kycFlags: ['Synthetic identity match', 'Device fingerprint anomaly', 'VoIP geo mismatch']
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
    tag: 'LOUVAIN_COMMUNITY',
    message: 'Detecting dense modularity community subgraphs...',
    detail: 'Modularity score Q = 0.782. High cohesion indicates synthetic coordination.',
    targetTimeMs: 2400
  },
  {
    id: 4,
    timestamp: '00:03.180',
    tag: 'GEO_CORRIDOR_SYNC',
    message: 'Correlating with Indian cybercrime jurisdictional heatmaps...',
    detail: 'Corridor established: Jamtara (Origin) → Delhi NCR (Layering) → BKC Mumbai (Hawala Sink).',
    targetTimeMs: 3200
  },
  {
    id: 5,
    timestamp: '00:03.950',
    tag: 'SENTINEL_VERDICT',
    message: 'Agent Decision Engine confirms high-risk syndication pattern.',
    detail: 'Confidence: 99.4%. Recommended Action: Immediate autonomous escrow lock & freeze.',
    targetTimeMs: 3900
  }
];

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('muletrace_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('muletrace_theme', theme);
  }, [theme]);

  const [threats, setThreats] = useState<ThreatAccount[]>(THREAT_SEEDS);
  const [selectedThreatId, setSelectedThreatId] = useState<string>('ACC-88219');
  const [activeViewMode, setActiveViewMode] = useState<'bento' | 'heatmap' | 'graph' | 'dual'>('graph');
  const [isThreatDropdownOpen, setIsThreatDropdownOpen] = useState(false);
  const [showConsoleDrawer, setShowConsoleDrawer] = useState(false);

  // Agent scanning states
  const [agentState, setAgentState] = useState<'idle' | 'scanning' | 'verdict' | 'frozen'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanElapsedSec, setScanElapsedSec] = useState('0.0');
  const [scanLogs, setScanLogs] = useState<ScanLogStep[]>([]);

  // Force graph interaction states
  const fgRef = useRef<any>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [isolateRingOnly, setIsolateRingOnly] = useState(false);
  const [graphLayout, setGraphLayout] = useState<'geometric' | 'organic'>('geometric');
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });

  // Handle graph container resize
  useEffect(() => {
    const updateSize = () => {
      if (graphContainerRef.current) {
        const rect = graphContainerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setContainerDimensions({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
        }
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (graphContainerRef.current) observer.observe(graphContainerRef.current);
    return () => observer.disconnect();
  }, [activeViewMode]);

  const currentThreat = useMemo(() => {
    return threats.find((t) => t.id === selectedThreatId) || threats[0];
  }, [threats, selectedThreatId]);

  const isCurrentThreatFrozen = currentThreat.status === 'frozen';

  // Generate Graph Data - precisely reconstructed to match image.png
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    const banks = ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'State Bank of India', 'Kotak Mahindra', 'Yes Bank', 'Punjab National'];

    const R_MAIN = 260; // Radius for the 5 threat seeds
    const R_MULE = 85;  // Radius for mules around their seed
    const R_FLAGGED = 75; // Radius for the central flagged ring

    // 1. Seed Nodes
    threats.forEach((threat, tIdx) => {
      const isFrozen = threat.status === 'frozen';
      const isPrimary = threat.id === selectedThreatId;

      const threatAngle = (tIdx / threats.length) * 2 * Math.PI - Math.PI / 2;
      const sx = Math.cos(threatAngle) * R_MAIN;
      const sy = Math.sin(threatAngle) * R_MAIN;

      nodes.push({
        id: threat.id,
        name: threat.name,
        label: `${threat.name} (Seed)`,
        type: 'seed',
        riskScore: threat.riskScore,
        volume: threat.volumeNum,
        bank: 'HDFC Bank (HQ Gateway)',
        threatId: threat.id,
        val: 11,
        ...(graphLayout === 'geometric' ? { fx: sx, fy: sy } : {})
      });

      // 2. Active Mule Cluster for the active threat (Warm Amber / Orange nodes)
      const muleCount = threat.muleCount;
      for (let i = 1; i <= muleCount; i++) {
        const muleAngle = (i / muleCount) * 2 * Math.PI + threatAngle; // Offset by threatAngle for aesthetic flow
        const mx = sx + Math.cos(muleAngle) * R_MULE;
        const my = sy + Math.sin(muleAngle) * R_MULE;

        const muleId = `${threat.id}-M${i.toString().padStart(2, '0')}`;
        const muleRisk = Math.max(74, threat.riskScore - (i % 5) * 3);
        nodes.push({
          id: muleId,
          name: `Mule Node ${i}`,
          type: 'mule',
          riskScore: muleRisk,
          volume: Math.floor(threat.volumeNum / muleCount),
          bank: banks[i % banks.length],
          threatId: threat.id,
          colorIdx: i,
          val: i % 3 === 0 ? 8.2 : 7.2,
          ...(graphLayout === 'geometric' ? { fx: mx, fy: my } : {})
        });

        // Seed to Mule direct link (Highlighted Red)
        links.push({
          source: threat.id,
          target: muleId,
          amount: Math.floor(threat.volumeNum / muleCount),
          type: i % 2 === 0 ? 'upi' : 'rtgs',
          threatId: threat.id,
          isThreatLink: isPrimary,
          isSevered: isFrozen
        });
      }

      // Cross-links between mules for ALL threats (forming the connected cyclic mesh)
      const muleMeshPairs: [number, number][] = [
        [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8],
        [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 1],
        [1, 4], [2, 6], [3, 7], [5, 9], [6, 11], [8, 12], [10, 13], [3, 11], [4, 8]
      ];
      muleMeshPairs.forEach(([a, b]) => {
        if (a <= muleCount && b <= muleCount) {
          links.push({
            source: `${threat.id}-M${a.toString().padStart(2, '0')}`,
            target: `${threat.id}-M${b.toString().padStart(2, '0')}`,
            amount: Math.floor(threat.volumeNum / 6),
            type: 'rtgs',
            threatId: threat.id,
            isThreatLink: isPrimary,
            isSevered: isFrozen
          });
        }
      });
    });

    // 3. Translucent Red Background Nodes (Suspect / Secondary Flagged Accounts in image.png)
    // 28 nodes placed in an inner circle
    const flaggedSizes = [9.5, 8.8, 8.2, 6.2, 5.8, 5.5, 6.0, 4.2, 4.0, 4.5, 5.2, 9.0, 6.5, 4.8, 5.0, 8.5, 5.4, 4.3, 5.8, 6.2, 4.0, 4.6, 5.1, 8.0, 6.0, 4.4, 5.3, 4.1];
    for (let f = 1; f <= 28; f++) {
      const fAngle = (f / 28) * 2 * Math.PI;
      const fx_pos = Math.cos(fAngle) * R_FLAGGED;
      const fy_pos = Math.sin(fAngle) * R_FLAGGED;
      
      const flaggedId = `ACC-FL-${f.toString().padStart(2, '0')}`;
      nodes.push({
        id: flaggedId,
        type: 'flagged',
        riskScore: Math.floor(68 + Math.random() * 22),
        volume: Math.floor(80000 + Math.random() * 350000),
        bank: banks[f % banks.length],
        val: flaggedSizes[(f - 1) % flaggedSizes.length],
        ...(graphLayout === 'geometric' ? { fx: fx_pos, fy: fy_pos } : {})
      });

      // Link flagged nodes to active mules and seed to form interconnected network across ALL threats
      threats.forEach((t) => {
        if (f <= t.muleCount) {
          links.push({
            source: `${t.id}-M${f.toString().padStart(2, '0')}`,
            target: flaggedId,
            amount: 45000,
            type: 'upi',
            isThreatLink: false
          });
        }
      });
      if (f > 1 && f % 2 === 0) {
        links.push({
          source: flaggedId,
          target: `ACC-FL-${(f - 1).toString().padStart(2, '0')}`,
          amount: 32000,
          type: 'imps',
          isThreatLink: false
        });
      }
    }

    // 4. Translucent Slate-Blue Background Nodes (Benign Baseline Accounts in image.png)
    const R_BENIGN = 380; // Large outer ring encapsulating the network
    for (let k = 1; k <= 52; k++) {
      const bAngle = (k / 52) * 2 * Math.PI;
      const bx = Math.cos(bAngle) * R_BENIGN;
      const by = Math.sin(bAngle) * R_BENIGN;

      const benignId = `ACC-BN-${k.toString().padStart(3, '0')}`;
      nodes.push({
        id: benignId,
        type: 'legitimate',
        riskScore: Math.floor(12 + Math.random() * 22),
        volume: Math.floor(15000 + Math.random() * 120000),
        bank: banks[k % banks.length],
        val: k % 4 === 0 ? 5.0 : 3.8,
        ...(graphLayout === 'geometric' ? { fx: bx, fy: by } : {})
      });

      // Interconnect benign accounts and bridge into flagged nodes
      if (k > 1 && k % 2 === 0) {
        links.push({
          source: benignId,
          target: `ACC-BN-${(k - 1).toString().padStart(3, '0')}`,
          amount: 22000,
          type: 'upi',
          isThreatLink: false
        });
      }
      if (k % 3 === 0 && k / 3 <= 28) {
        links.push({
          source: benignId,
          target: `ACC-FL-${Math.floor(k / 3).toString().padStart(2, '0')}`,
          amount: 18000,
          type: 'upi',
          isThreatLink: false
        });
      }
    }

    return { nodes, links };
  }, [graphLayout]); // Regenerate nodes with or without fx/fy when layout changes

  // Select Threat
  const handleSelectThreat = (id: string) => {
    setSelectedThreatId(id);
    setIsThreatDropdownOpen(false);
    const threat = threats.find((t) => t.id === id);
    if (threat && threat.status === 'frozen') {
      setAgentState('frozen');
      setScanLogs(SCAN_STEPS_TEMPLATE);
      setScanProgress(100);
    } else {
      setScanProgress(0);
    }
  };

  // Run Agentic Scan
  const handleRunScan = async () => {
    try {
      setAgentState('scanning');
      setScanProgress(0);
      setScanLogs([]);
      await fetch('http://127.0.0.1:8000/api/agent/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node_id: selectedThreatId })
      });
      const startTime = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, (elapsed / 4000) * 100);
        setScanProgress(progress);
        setScanElapsedSec((elapsed / 1000).toFixed(1));

        SCAN_STEPS_TEMPLATE.forEach((step) => {
          if (elapsed >= step.targetTimeMs) {
            setScanLogs((prev) => {
              if (!prev.some((p) => p.id === step.id)) {
                return [...prev, step];
              }
              return prev;
            });
          }
        });

        if (elapsed >= 4000) {
          clearInterval(progressInterval);
          setAgentState('verdict');
        }
      }, 75);
    } catch (err) {
      console.error('Scan trigger failed', err);
      setAgentState('idle');
    }
  };

  // Sever & Freeze Ring
  const handleFreezeRing = () => {
    setThreats((prev) =>
      prev.map((t) => (t.id === selectedThreatId ? { ...t, status: 'frozen' } : t))
    );
    setAgentState('frozen');
  };

  // Reset Freeze
  const handleResetFreeze = () => {
    setThreats((prev) =>
      prev.map((t) => (t.id === selectedThreatId ? { ...t, status: 'active' } : t))
    );
    setAgentState('idle');
    setScanLogs([]);
    setScanProgress(0);
  };

  // Custom Physics Bounding Box for Organic Layout
  useEffect(() => {
    if (fgRef.current && graphLayout === 'organic') {
      // Use gentle radial gravity instead of a hard box to pull everything into an organic circular mesh
      fgRef.current.d3Force('box', null);
      
      fgRef.current.d3Force('radialGravity', (function() {
        let nodes: any[] = [];
        const strength = 0.04; // Gentle pull to center
        function force(alpha: number) {
          if (!nodes) return;
          for (let i = 0; i < nodes.length; ++i) {
            const node = nodes[i];
            node.vx -= node.x * strength * alpha;
            node.vy -= node.y * strength * alpha;
          }
        }
        force.initialize = function(_nodes: any[]) {
          nodes = _nodes;
        };
        return force;
      })());
      
      // Tweak organic gravity to keep it a bit more cohesive
      fgRef.current.d3Force('charge').strength(-45);
      fgRef.current.d3Force('link').distance(40);
      
      // Reheat engine to apply boundaries immediately
      fgRef.current.d3ReheatSimulation();
    } else if (fgRef.current && graphLayout === 'geometric') {
      fgRef.current.d3Force('radialGravity', null);
    }
  }, [graphLayout]);

  // Custom Node Canvas Renderer precisely matched to image.png
  const drawNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = node.threatId === selectedThreatId;
    const isHovered = hoveredNode?.id === node.id;
    const isFrozen = isCurrentThreatFrozen && isSelected;
    const isSeed = node.type === 'seed' && isSelected;
    const isDark = theme === 'dark';

    // 1. Central Active Seed Node (Crimson Red with label badge underneath)
    if (isSeed) {
      const r = 11;

      // Outer delicate halo
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI, false);
      ctx.fillStyle = isFrozen
        ? (isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)')
        : 'rgba(239, 68, 68, 0.25)';
      ctx.fill();

      // Main Seed Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = isFrozen ? '#64748b' : '#dc2626';
      ctx.strokeStyle = isFrozen ? (isDark ? '#94a3b8' : '#334155') : (isDark ? '#f87171' : '#991b1b');
      ctx.lineWidth = 1.6;
      ctx.fill();
      ctx.stroke();

      // Seed Pill Badge directly underneath (matching image.png)
      const labelText = `${currentThreat.name} (Seed)`;
      const fontSize = 11;
      ctx.font = `bold ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const textWidth = ctx.measureText(labelText).width;
      const pillPadX = 6;
      const pillPadY = 3;
      const pillY = node.y + r + 5;

      // Pill Background with rounded corners
      ctx.fillStyle = isDark ? 'rgba(22, 22, 29, 0.96)' : 'rgba(255, 255, 255, 0.96)';
      ctx.beginPath();
      ctx.roundRect(
        node.x - textWidth / 2 - pillPadX,
        pillY - pillPadY,
        textWidth + pillPadX * 2,
        fontSize + pillPadY * 2,
        4
      );
      ctx.fill();

      // Pill Border (subtle red outline)
      ctx.strokeStyle = isFrozen
        ? (isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1')
        : (isDark ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.45)');
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pill Text (Crimson Red)
      ctx.fillStyle = isFrozen
        ? (isDark ? '#94a3b8' : '#475569')
        : (isDark ? '#fca5a5' : '#b91c1c');
      ctx.fillText(labelText, node.x, pillY);
      return;
    }

    // 2. Active Mule Ring Nodes (Warm Amber / Orange fills with dark outline)
    if (isSelected && (node.type === 'mule' || node.type === 'shell')) {
      const r = node.val || 7.5;
      const amberFills = ['#ea580c', '#f97316', '#d97706', '#f59e0b', '#fb923c'];
      const fill = isFrozen ? (isDark ? '#64748b' : '#94a3b8') : amberFills[(node.colorIdx || 0) % amberFills.length];
      const stroke = isFrozen ? (isDark ? '#334155' : '#475569') : (isDark ? '#ffedd5' : '#7c2d12');

      if (isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 3, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'rgba(249, 115, 22, 0.35)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.4;
      ctx.fill();
      ctx.stroke();
    }
    // 3. Flagged / Secondary Suspect Nodes (Translucent Coral / Red circles)
    else if (node.type === 'flagged') {
      const r = node.val || 6;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = isDark ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.4)';
      ctx.fill();
    }
    // 4. Unselected Threat Nodes (Light Pink circles as seen in original)
    else if (node.threatId && !isSelected) {
      const r = node.type === 'seed' ? 8 : (node.val || 7.5);
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = isDark ? 'rgba(252, 165, 165, 0.4)' : '#fca5a5';
      ctx.strokeStyle = isDark ? 'rgba(239, 68, 68, 0.5)' : '#ef4444';
      ctx.lineWidth = 1.0;
      ctx.fill();
      ctx.stroke();
    }
    // 5. Benign / Legitimate Baseline Nodes (Translucent Slate-Blue circles)
    else {
      const r = node.val || 4;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = isHovered
        ? (isDark ? 'rgba(203, 213, 225, 0.8)' : 'rgba(100, 116, 139, 0.6)')
        : (isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.35)');
      ctx.fill();
    }

    // Floating Tooltip on Hover for non-seed nodes
    if (isHovered) {
      const labelText = `${node.id} • ${node.bank} • Risk ${node.riskScore}`;
      const fontSize = 10;
      ctx.font = `600 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const textWidth = ctx.measureText(labelText).width;
      const pillPadX = 5;
      const pillPadY = 2;
      const pillY = node.y + (node.val || 6) + 4;

      ctx.fillStyle = isDark ? 'rgba(26, 26, 36, 0.96)' : 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      ctx.roundRect(
        node.x - textWidth / 2 - pillPadX,
        pillY - pillPadY,
        textWidth + pillPadX * 2,
        fontSize + pillPadY * 2,
        4
      );
      ctx.fill();

      if (isDark) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, node.x, pillY);
    }
  };

  return (
    <div id="muletrace-root" className="flex flex-col h-screen w-screen overflow-hidden bg-[#f0f2f6] dark:bg-[#0c0d12] text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200">
      {/* 1. TOP NAVIGATION BAR */}
      <header id="top-navbar" className="h-16 bg-white/95 dark:bg-[#16161d]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
        {/* Left: Brand Mark + Syndicate Dropdown */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-sm shadow-purple-300">
              <Shield className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">MuleTrace</span>
                <span className="w-2 h-2 rounded-full bg-lime-400" />
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-900/60 hidden sm:inline">
                  AI Sentinel
                </span>
              </div>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-white/10 hidden md:block" />

          {/* Quick Active Syndicate Dropdown Pill */}
          <div className="relative">
            <button
              onClick={() => setIsThreatDropdownOpen(!isThreatDropdownOpen)}
              className="bg-slate-100/90 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold py-1.5 px-3 rounded-full flex items-center gap-2 transition-all border border-slate-200 dark:border-white/10"
            >
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              <span className="font-mono font-bold text-purple-700 dark:text-purple-300">{currentThreat.id}</span>
              <span className="hidden sm:inline font-medium truncate max-w-[150px]">{currentThreat.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            </button>

            {/* Dropdown Popover */}
            {isThreatDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-[#1c1c24] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1.5">
                  Select Active Mule Ring
                </div>
                {threats.map((threat) => (
                  <button
                    key={threat.id}
                    onClick={() => handleSelectThreat(threat.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between text-xs ${
                      threat.id === selectedThreatId
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold">{threat.id}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{threat.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-purple-700 dark:text-purple-400">{threat.volume}</div>
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Risk {threat.riskScore}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Segmented View Switcher Pills (matching Week | Month | Year in reference image) */}
        <div className="hidden md:flex items-center bg-slate-100/90 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/90 dark:border-white/10">
          <button
            onClick={() => setActiveViewMode('bento')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeViewMode === 'bento'
                ? 'bg-white dark:bg-[#252530] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Executive Bento</span>
          </button>

          <button
            onClick={() => setActiveViewMode('heatmap')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeViewMode === 'heatmap'
                ? 'bg-white dark:bg-[#252530] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>India Heatmap</span>
          </button>

          <button
            onClick={() => setActiveViewMode('graph')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeViewMode === 'graph'
                ? 'bg-white dark:bg-[#252530] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Graph Topology</span>
          </button>

          <button
            onClick={() => setActiveViewMode('dual')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeViewMode === 'dual'
                ? 'bg-white dark:bg-[#252530] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-cyan-600" />
            <span>Dual Sync</span>
          </button>
        </div>

        {/* Right: Live Monitoring Beacon + Theme Toggle + Agent Drawer Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-lime-50 dark:bg-lime-950/40 border border-lime-200 dark:border-lime-900/50 px-3 py-1 rounded-full text-xs text-lime-900 dark:text-lime-200">
            <span className="w-2 h-2 rounded-full bg-lime-500 beacon-pulse" />
            <span className="font-semibold hidden sm:inline">1.4k TPS Live</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            id="theme-toggle-btn"
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            className="p-2 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition-colors"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle Color Theme"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-purple-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          <button
            onClick={() => setShowConsoleDrawer(!showConsoleDrawer)}
            className="p-2 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition-colors"
            title="Toggle Agent Reasoner Console"
          >
            <Terminal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </button>
        </div>
      </header>

      {/* 2. EXECUTIVE TELEMETRY RIBBON (Never overlaps, responsive) */}
      <div id="telemetry-ribbon" className="h-10 bg-white dark:bg-[#16161d] border-b border-slate-200/70 dark:border-white/10 px-4 sm:px-6 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-5 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500">Intervention Speed:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">&lt; 17 min MTTR</span>
          </div>
          <div className="h-3 w-px bg-slate-200 dark:bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500">Attack Vectors:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">10 Surfaces Monitored</span>
          </div>
          <div className="h-3 w-px bg-slate-200 dark:bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500">Precision:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">87% FP Drop</span>
          </div>
          <div className="h-3 w-px bg-slate-200 dark:bg-white/10" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500">Escrow Locked:</span>
            <span className="font-bold text-purple-700 dark:text-purple-400 font-mono">₹1.41 Cr</span>
          </div>
        </div>

        {/* Mobile View Mode Switcher Dropdown */}
        <div className="md:hidden flex items-center gap-1">
          <button
            onClick={() => setActiveViewMode(activeViewMode === 'bento' ? 'heatmap' : 'bento')}
            className="text-[11px] text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full"
          >
            Toggle View
          </button>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 w-full relative overflow-hidden flex">
        {/* VIEW 1: EXECUTIVE BENTO DASHBOARD (Matching image.png!) */}
        {activeViewMode === 'bento' && (
          <div className="flex-1 w-full h-full overflow-y-auto">
            <ExecutiveBentoDashboard
              threats={threats}
              selectedThreatId={selectedThreatId}
              onSelectThreat={handleSelectThreat}
              onRunScan={handleRunScan}
              onSeverRing={handleFreezeRing}
              agentState={agentState}
              scanProgress={scanProgress}
              onSwitchView={(view) => setActiveViewMode(view)}
              theme={theme}
            />
          </div>
        )}

        {/* VIEW 2: FULL INDIA GEO HEATMAP VIEW */}
        {activeViewMode === 'heatmap' && (
          <div className="flex-1 w-full h-full p-4 sm:p-6 flex flex-col">
            <div className="flex-1 w-full h-full bento-card overflow-hidden relative">
              <IndiaGeoHeatmap
                selectedThreatId={selectedThreatId}
                onSelectThreat={handleSelectThreat}
                isThreatFrozen={isCurrentThreatFrozen}
                compact={false}
                theme={theme}
              />
            </div>
          </div>
        )}

        {/* VIEW 3: FULL GRAPH TOPOLOGY VIEW */}
        {activeViewMode === 'graph' && (
          <div className="flex-1 w-full h-full p-4 sm:p-6 flex flex-col">
            <div className="flex-1 w-full h-full bento-card overflow-hidden relative flex flex-col">
              {/* Canvas Top Bar */}
              <div className="h-12 border-b border-slate-150 dark:border-white/10 px-5 flex items-center justify-between z-10 shrink-0 bg-white dark:bg-[#16161d]">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Graph Modularity: {currentThreat.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-rose-700 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/60">
                    {currentThreat.id} &bull; {currentThreat.muleCount} Mules
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {agentState === 'idle' && (
                    <button
                      onClick={handleRunScan}
                      className="px-3 py-1 mr-2 rounded-full text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5 text-lime-300" />
                      Run Agentic Scan
                    </button>
                  )}
                  {agentState === 'scanning' && (
                    <button
                      disabled
                      className="px-3 py-1 mr-2 rounded-full text-xs font-bold bg-purple-800 text-purple-200 opacity-70 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Scanning...
                    </button>
                  )}
                  <button
                    onClick={() => setGraphLayout(graphLayout === 'geometric' ? 'organic' : 'geometric')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      graphLayout === 'geometric'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15'
                    }`}
                  >
                    {graphLayout === 'geometric' ? 'Structured Layout' : 'Organic Layout'}
                  </button>
                  <button
                    onClick={() => setIsolateRingOnly(!isolateRingOnly)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      isolateRingOnly
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15'
                    }`}
                  >
                    {isolateRingOnly ? 'Ring Only' : 'Isolate Ring'}
                  </button>
                  <button
                    onClick={() => fgRef.current?.zoomToFit(400, 60)}
                    className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400"
                    title="Fit Canvas"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Force Graph */}
              <div ref={graphContainerRef} className="flex-1 w-full h-full graph-bg-grid relative overflow-hidden">
                {graphData.nodes.length > 0 && (
                  <ForceGraph2D
                    ref={fgRef}
                    width={containerDimensions.width}
                    height={containerDimensions.height - 48}
                    backgroundColor="rgba(0,0,0,0)"
                    graphData={
                      isolateRingOnly
                        ? {
                            nodes: graphData.nodes.filter((n) => n.threatId === selectedThreatId),
                            links: graphData.links.filter((l) => l.threatId === selectedThreatId)
                          }
                        : graphData
                    }
                    nodeCanvasObject={drawNode}
                    onNodeHover={(node: any) => setHoveredNode(node || null)}
                    onNodeClick={(node: any) => {
                      if (node.threatId && node.threatId !== selectedThreatId) {
                        handleSelectThreat(node.threatId);
                      }
                    }}
                    linkDirectionalParticles={(link: any) => {
                      if (isCurrentThreatFrozen && link.threatId === selectedThreatId) return 0;
                      return link.threatId === selectedThreatId ? 2 : 0;
                    }}
                    linkDirectionalParticleSpeed={0.008}
                    linkDirectionalParticleWidth={2.4}
                    linkDirectionalParticleColor={() => '#ef4444'}
                    linkColor={(link: any) =>
                      link.threatId === selectedThreatId
                        ? isCurrentThreatFrozen
                          ? theme === 'dark'
                            ? 'rgba(148, 163, 184, 0.35)'
                            : 'rgba(100, 116, 139, 0.45)'
                          : theme === 'dark'
                          ? 'rgba(248, 113, 113, 0.85)'
                          : 'rgba(220, 38, 38, 0.72)'
                        : theme === 'dark'
                        ? 'rgba(255, 255, 255, 0.12)'
                        : 'rgba(203, 213, 225, 0.55)'
                    }
                    linkWidth={(link: any) => (link.threatId === selectedThreatId ? 2.2 : 0.85)}
                    d3VelocityDecay={0.28}
                    cooldownTicks={120}
                  />
                )}
              </div>

              {/* Bottom Legend */}
              <div className="h-10 border-t border-slate-150 dark:border-white/10 px-5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#16161d]">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Legend:</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" /> Seed</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ea580c]" /> Active Mule</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400/80" /> Suspect Mule</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400/70" /> Benign</span>
                </div>
                {hoveredNode && (
                  <div className="font-mono text-rose-700 dark:text-rose-400 font-bold">
                    {hoveredNode.id} &bull; {hoveredNode.bank} &bull; Risk: {hoveredNode.riskScore}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: DUAL MATRIX SYNC VIEW */}
        {activeViewMode === 'dual' && (
          <div className="flex-1 w-full h-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
            {/* Left Card: Graph Topology */}
            <div className="bento-card overflow-hidden flex flex-col h-full">
              <div className="h-11 border-b border-slate-150 dark:border-white/10 px-4 flex items-center justify-between bg-white dark:bg-[#16161d] shrink-0">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Graph Subgraph</span>
                  <span className="font-mono text-xs text-rose-700 dark:text-rose-400 font-semibold">[{currentThreat.id}]</span>
                </div>
                <div>
                  {agentState === 'idle' && (
                    <button
                      onClick={handleRunScan}
                      className="px-3 py-1 rounded-full text-[10px] font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Zap className="w-3 h-3 text-lime-300" />
                      Run Scan
                    </button>
                  )}
                  {agentState === 'scanning' && (
                    <button
                      disabled
                      className="px-3 py-1 rounded-full text-[10px] font-bold bg-purple-800 text-purple-200 opacity-70 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Scanning
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 w-full relative graph-bg-grid">
                {graphData.nodes.length > 0 && (
                  <ForceGraph2D
                    width={Math.floor(containerDimensions.width / 2) || 400}
                    height={containerDimensions.height - 44}
                    backgroundColor="rgba(0,0,0,0)"
                    graphData={{
                      nodes: isolateRingOnly
                        ? graphData.nodes.filter((n) => n.threatId === selectedThreatId)
                        : graphData.nodes,
                      links: isolateRingOnly
                        ? graphData.links.filter((l) => l.threatId === selectedThreatId)
                        : graphData.links
                    }}
                    nodeCanvasObject={drawNode}
                    linkDirectionalParticles={(link: any) => (link.threatId === selectedThreatId ? 2 : 0)}
                    linkDirectionalParticleSpeed={0.008}
                    linkDirectionalParticleWidth={2.4}
                    linkDirectionalParticleColor={() => '#ef4444'}
                    linkColor={(link: any) =>
                      link.threatId === selectedThreatId
                        ? isCurrentThreatFrozen
                          ? theme === 'dark'
                            ? 'rgba(100, 116, 139, 0.35)'
                            : 'rgba(100, 116, 139, 0.45)'
                          : theme === 'dark'
                          ? 'rgba(248, 113, 113, 0.85)'
                          : 'rgba(220, 38, 38, 0.72)'
                        : theme === 'dark'
                        ? 'rgba(255, 255, 255, 0.12)'
                        : 'rgba(203, 213, 225, 0.55)'
                    }
                    linkWidth={(link: any) => (link.threatId === selectedThreatId ? 2.2 : 0.85)}
                    d3VelocityDecay={0.28}
                  />
                )}
              </div>
            </div>

            {/* Right Card: India Geo Heatmap */}
            <div className="bento-card overflow-hidden flex flex-col h-full">
              <div className="h-11 border-b border-slate-150 dark:border-white/10 px-4 flex items-center justify-between bg-white dark:bg-[#16161d] shrink-0">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">India Laundering Corridors</span>
                  <span className="font-mono text-xs text-rose-600 dark:text-rose-400 font-semibold">[{currentThreat.id}]</span>
                </div>
              </div>
              <div className="flex-1 w-full relative">
                <IndiaGeoHeatmap
                  selectedThreatId={selectedThreatId}
                  onSelectThreat={handleSelectThreat}
                  isThreatFrozen={isCurrentThreatFrozen}
                  compact={true}
                  theme={theme}
                />
              </div>
            </div>
          </div>
        )}

        {/* SLIDE-OVER INVESTIGATION DRAWER */}
        {showConsoleDrawer && (
          <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-[#16161d] shadow-2xl border-l border-slate-200 dark:border-white/10 z-50 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-150 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sentinel Reasoner Trace</h3>
              </div>
              <button
                onClick={() => setShowConsoleDrawer(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-150 dark:border-white/10">
                <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-1">Target Ring</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{currentThreat.id} - {currentThreat.name}</div>
                <div className="text-purple-700 dark:text-purple-400 font-semibold mt-1">Intercepted Escrow: {currentThreat.volume}</div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Execution Telemetry</div>
                {scanLogs.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-white/5 rounded-xl">
                    No active trace log. Click "Run Agentic Scan" in the dashboard to execute.
                  </div>
                ) : (
                  scanLogs.map((log) => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-150 dark:border-white/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded">
                          {log.tag}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{log.timestamp}</span>
                      </div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{log.message}</div>
                      {log.detail && <div className="text-slate-500 dark:text-slate-400 text-[11px]">{log.detail}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-150 dark:border-white/10">
              <button
                disabled={isCurrentThreatFrozen}
                onClick={handleFreezeRing}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 ${
                  isCurrentThreatFrozen
                    ? 'bg-slate-200 dark:bg-white/10 text-slate-500 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>{isCurrentThreatFrozen ? 'Mule Ring Frozen' : 'Sever & Lock Gateway'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
