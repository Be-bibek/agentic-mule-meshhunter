import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowUpRight,
  Flame,
  Activity,
  Zap,
  Lock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Wallet,
  TrendingUp,
  Database,
  Search,
  ChevronRight,
  Maximize2,
  Clock,
  PieChart,
  BarChart2
} from 'lucide-react';
import { IndiaGeoHeatmap } from './IndiaGeoHeatmap';

export interface ThreatItem {
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

export interface ExecutiveBentoDashboardProps {
  threats: ThreatItem[];
  selectedThreatId: string;
  onSelectThreat: (threatId: string) => void;
  onRunScan: () => void;
  onSeverRing: () => void;
  agentState: 'idle' | 'scanning' | 'verdict' | 'frozen';
  scanProgress: number;
  onSwitchView: (view: 'bento' | 'heatmap' | 'graph' | 'dual') => void;
  theme?: 'light' | 'dark';
}

export const ExecutiveBentoDashboard: React.FC<ExecutiveBentoDashboardProps> = ({
  threats,
  selectedThreatId,
  onSelectThreat,
  onRunScan,
  onSeverRing,
  agentState,
  scanProgress,
  onSwitchView,
  theme = 'light'
}) => {
  const [timeframe, setTimeframe] = useState<'Week' | 'Month' | 'Year'>('Week');
  const [hoveredCell, setHoveredCell] = useState<{ day: string; time: string; velocity: number } | null>(null);
  const [analyticsMetric, setAnalyticsMetric] = useState<'income' | 'expenses'>('income');

  const currentThreat = threats.find((t) => t.id === selectedThreatId) || threats[0];
  const isFrozen = currentThreat.status === 'frozen';
  const isDark = theme === 'dark';

  // Activity by time grid data (Days x Hours 1pm - 6pm)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['1 pm', '2 pm', '3 pm', '4 pm', '5 pm', '6 pm'];

  // Matrix intensities (0 to 5) precisely matching reference visual
  const activityMatrix: number[][] = [
    [1, 2, 4, 3, 5, 2], // Mon
    [3, 4, 5, 4, 2, 1], // Tue
    [2, 3, 5, 5, 4, 3], // Wed
    [4, 5, 4, 3, 2, 1], // Thu
    [5, 4, 3, 5, 4, 2], // Fri
    [2, 1, 2, 4, 5, 4], // Sat
    [1, 2, 3, 2, 1, 0]  // Sun
  ];

  const getHeatmapColorClass = (intensity: number) => {
    if (isDark) {
      switch (intensity) {
        case 0: return 'bg-[#221c33] border border-white/5';
        case 1: return 'bg-[#3b1d66] border border-purple-900/40';
        case 2: return 'bg-[#5b219e] border border-purple-800/50';
        case 3: return 'bg-[#7c3aed] border border-purple-600/60';
        case 4: return 'bg-[#9333ea] border border-purple-500/70 shadow-xs shadow-purple-500/20';
        case 5: return 'bg-[#a855f7] border border-purple-400 shadow-sm shadow-purple-400/30';
        default: return 'bg-[#221c33]';
      }
    } else {
      switch (intensity) {
        case 0: return 'bg-purple-50/70 border border-purple-100/50';
        case 1: return 'bg-purple-100 border border-purple-200';
        case 2: return 'bg-purple-200 border border-purple-300';
        case 3: return 'bg-purple-400 border border-purple-500 text-white';
        case 4: return 'bg-purple-600 border border-purple-700 text-white shadow-xs';
        case 5: return 'bg-purple-800 border border-purple-900 text-white shadow-xs';
        default: return 'bg-purple-50';
      }
    }
  };

  return (
    <div id="executive-bento-dashboard" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto overflow-y-auto">
      
      {/* 1. TOP BENTO ROW: Map Card + Radar/Pill Bars + Quarantined Escrow Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Card 1: India Cyber Risk Geo Map (large, spans 5 cols) */}
        <div className="lg:col-span-5 bento-card p-6 flex flex-col justify-between relative overflow-hidden min-h-[440px]">
          <div className="flex items-center justify-between mb-3 z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 dark:bg-purple-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Inter-State Corridor Analysis
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time laundering pipelines across 35 jurisdictions
              </p>
            </div>
            <button
              onClick={() => onSwitchView('heatmap')}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
              title="Open Full Heatmap View"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Embedded India Map */}
          <div className="flex-1 w-full relative min-h-[300px] rounded-2xl overflow-hidden border border-slate-100 dark:border-white/10 bg-[#f8fafc] dark:bg-[#0c0d12]">
            <IndiaGeoHeatmap
              selectedThreatId={selectedThreatId}
              onSelectThreat={onSelectThreat}
              isThreatFrozen={isFrozen}
              compact={true}
              onExpandView={() => onSwitchView('heatmap')}
              theme={theme}
            />
          </div>

          {/* Bottom Card Footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold border border-purple-100 dark:border-purple-900/60 text-[11px]">
                {currentThreat.id}
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{currentThreat.name}</span>
            </div>
            <span className="font-mono font-bold text-purple-700 dark:text-purple-400">{currentThreat.volume}</span>
          </div>
        </div>

        {/* Card 2: Attack Surface Radar + Striped Pill Bars (spans 3 cols) */}
        <div className="lg:col-span-3 bento-card p-6 flex flex-col justify-between relative">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Attack Surface</h3>
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-900/60">
              Louvain GNN
            </span>
          </div>

          {/* Radar Polygon Visual */}
          <div className="relative w-full aspect-square max-w-[200px] mx-auto flex items-center justify-center my-2">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {/* Web Rings */}
              <polygon
                points="50,15 80,32 80,68 50,85 20,68 20,32"
                fill="none"
                stroke={isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'}
                strokeWidth="0.8"
              />
              <polygon
                points="50,26 71,38 71,62 50,74 29,62 29,38"
                fill="none"
                stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9'}
                strokeWidth="0.8"
              />
              <polygon
                points="50,38 61,44 61,56 50,62 39,56 39,44"
                fill="none"
                stroke={isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc'}
                strokeWidth="0.8"
              />

              {/* Axes */}
              <line x1="50" y1="50" x2="50" y2="15" stroke={isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1'} strokeWidth="0.6" strokeDasharray="1 1" />
              <line x1="50" y1="50" x2="80" y2="32" stroke={isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1'} strokeWidth="0.6" strokeDasharray="1 1" />
              <line x1="50" y1="50" x2="80" y2="68" stroke={isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1'} strokeWidth="0.6" strokeDasharray="1 1" />
              <line x1="50" y1="50" x2="50" y2="85" stroke={isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1'} strokeWidth="0.6" strokeDasharray="1 1" />
              <line x1="50" y1="50" x2="20" y2="68" stroke={isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1'} strokeWidth="0.6" strokeDasharray="1 1" />
              <line x1="50" y1="50" x2="20" y2="32" stroke={isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1'} strokeWidth="0.6" strokeDasharray="1 1" />

              {/* Data Polygon (Neon Lime / Chartreuse Fill like reference image) */}
              <polygon
                points="50,18 78,35 68,64 50,78 28,60 22,34"
                fill={isDark ? 'rgba(163, 230, 53, 0.35)' : 'rgba(212, 248, 67, 0.45)'}
                stroke="#a3e635"
                strokeWidth="1.8"
              />
              {/* Data Polygon 2 (Purple Accent) */}
              <polygon
                points="50,28 72,40 76,58 50,66 32,54 30,42"
                fill={isDark ? 'rgba(168, 85, 247, 0.35)' : 'rgba(124, 58, 237, 0.25)'}
                stroke="#c084fc"
                strokeWidth="1.5"
              />

              {/* Axis Labels */}
              <text x="50" y="10" textAnchor="middle" className={`text-[6.5px] font-semibold ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}>SIM</text>
              <text x="86" y="32" textAnchor="start" className={`text-[6.5px] font-semibold ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}>Smurf</text>
              <text x="86" y="70" textAnchor="start" className={`text-[6.5px] font-semibold ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}>Hawala</text>
              <text x="50" y="93" textAnchor="middle" className={`text-[6.5px] font-semibold ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}>Crypto</text>
              <text x="14" y="70" textAnchor="end" className={`text-[6.5px] font-semibold ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}>NeoBank</text>
              <text x="14" y="32" textAnchor="end" className={`text-[6.5px] font-semibold ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}>Carding</text>
            </svg>
          </div>

          {/* Diagonal-striped Pill Columns (as seen in image.png top-middle) */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
            <div className="h-14 rounded-xl bg-purple-600 flex items-end p-1.5 shadow-xs">
              <span className="text-[9px] font-mono font-bold text-white leading-none">₹2.8M</span>
            </div>
            <div className="h-14 rounded-xl bg-slate-100 dark:bg-white/5 stripe-diagonal-muted flex items-end p-1.5" />
            <div className="h-14 rounded-xl bg-slate-100 dark:bg-white/5 stripe-diagonal-muted flex items-end p-1.5" />
            <div className="h-14 rounded-xl bg-slate-100 dark:bg-white/5 stripe-diagonal-muted flex items-end p-1.5" />
          </div>
        </div>

        {/* Card 3: Quarantined Escrow Breakdown (matching "Total value 1" in image.png) (spans 4 cols) */}
        <div className="lg:col-span-4 bento-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Escrow Distribution</h3>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Live Ingress</span>
            </div>

            <div className="flex items-baseline justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Intercepted</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">₹1,41,00,000</span>
            </div>

            {/* Segmented Multi-Color Progress Bar (violet, lavender, neon-lime, cyan, dark-slate) */}
            <div className="h-3 w-full rounded-full overflow-hidden flex gap-0.5 shadow-inner mb-5">
              <div className="w-[42%] h-full bg-purple-600" title="Instant UPI: 42%" />
              <div className="w-[26%] h-full bg-purple-300 dark:bg-purple-400" title="RTGS Shell Relay: 26%" />
              <div className="w-[16%] h-full bg-lime-400" title="P2P Crypto Sink: 16%" />
              <div className="w-[11%] h-full bg-cyan-400" title="Hawala Clearing: 11%" />
              <div className="w-[5%] h-full bg-slate-800 dark:bg-slate-300" title="Other Dispersals: 5%" />
            </div>

            {/* Aligned Category Rows */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-600" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Instant UPI Funnels</span>
                </div>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">₹59,22,000</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-300 dark:bg-purple-400" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">RTGS Shell Relays</span>
                </div>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">₹36,66,000</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-lime-400" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">P2P Crypto Sinks</span>
                </div>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">₹22,56,000</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Hawala Clearing</span>
                </div>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">₹15,51,000</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 dark:bg-slate-300" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">Other Dispersals</span>
                </div>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">₹7,05,000</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>Escrow Account Retention:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Intercepted</span>
          </div>
        </div>
      </div>

      {/* 2. SECOND BENTO ROW: Activity by time (7x6 heatmap grid) + Transfer history 2 (Segmented Donut) + Autonomous Sentinel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Card 4: Activity by time (Matching the top-right heatmap in image.png) (spans 5 cols) */}
        <div className="lg:col-span-5 bento-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Activity by time</h3>
              </div>
              <button
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                title="Activity details"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Mule velocity concentration across days and peak trading hours</p>

            {/* Matrix Container */}
            <div className="w-full">
              {/* Day column headers */}
              <div className="grid grid-cols-8 gap-2 mb-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="text-left text-[11px] text-slate-400">Hour</span>
                {days.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              {/* Matrix rows: 6 hours x 7 days */}
              <div className="space-y-2">
                {hours.map((hr, hrIdx) => (
                  <div key={hr} className="grid grid-cols-8 gap-2 items-center">
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate">
                      {hr}
                    </span>
                    {days.map((day, dayIdx) => {
                      const intensity = activityMatrix[dayIdx][hrIdx];
                      const velocity = Math.round(120 + intensity * 85 + (dayIdx + hrIdx) * 12);
                      const isHovered = hoveredCell?.day === day && hoveredCell?.time === hr;

                      return (
                        <div
                          key={`${day}-${hr}`}
                          onMouseEnter={() => setHoveredCell({ day, time: hr, velocity })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`h-7 rounded-lg transition-all cursor-pointer ${getHeatmapColorClass(
                            intensity
                          )} ${isHovered ? 'scale-110 ring-2 ring-purple-500 z-10' : ''}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Heatmap Legend + Hover Readout */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
            <div className="font-mono text-purple-700 dark:text-purple-300 font-semibold text-xs">
              {hoveredCell ? (
                <span>{hoveredCell.day} {hoveredCell.time} &bull; {hoveredCell.velocity} tx/min</span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 font-normal">Hover tiles to inspect velocity</span>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              <span>Less</span>
              <span className={`w-3 h-3 rounded-sm ${isDark ? 'bg-[#221c33]' : 'bg-purple-100'}`} />
              <span className={`w-3 h-3 rounded-sm ${isDark ? 'bg-[#5b219e]' : 'bg-purple-300'}`} />
              <span className={`w-3 h-3 rounded-sm ${isDark ? 'bg-[#7c3aed]' : 'bg-purple-500'}`} />
              <span className={`w-3 h-3 rounded-sm ${isDark ? 'bg-[#a855f7]' : 'bg-purple-700'}`} />
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Card 5: Transfer history 2 (Segmented Donut with 30%, 23%, 18%, 17%, 13% matching image.png) (spans 4 cols) */}
        <div className="lg:col-span-4 bento-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Transfer history 2</h3>
              </div>
              <button
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                title="Transfer details"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Monitor how your money is being utilized</p>

            {/* Timeframe pill switcher */}
            <div className="flex items-center bg-slate-100/90 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/90 dark:border-white/10 w-full mb-4">
              {(['Week', 'Month', 'Year'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`flex-1 py-1 text-xs font-semibold rounded-xl transition-all ${
                    timeframe === t
                      ? 'bg-white dark:bg-[#22222b] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Donut Chart + Category Breakdown */}
            <div className="flex items-center justify-between gap-3">
              {/* Category Legend list with colored squares */}
              <div className="space-y-2.5 text-xs flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-purple-600" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Product</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">30%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-lime-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Restorans and bars</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">23%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Internet and media</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">18%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 dark:bg-slate-300" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Pay for workplace</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">17%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-600" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Other</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">13%</span>
                </div>
              </div>

              {/* Segmented SVG Donut Ring */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="38" fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'} strokeWidth="11" />
                  {/* Arc 1: 30% (Purple) */}
                  <circle
                    cx="50" cy="50" r="38" fill="none" stroke="#7c3aed" strokeWidth="11"
                    strokeDasharray="71.6 167" strokeDashoffset="0"
                  />
                  {/* Arc 2: 23% (Lime) */}
                  <circle
                    cx="50" cy="50" r="38" fill="none" stroke="#a3e635" strokeWidth="11"
                    strokeDasharray="54.9 183.8" strokeDashoffset="-73.6"
                  />
                  {/* Arc 3: 18% (Cyan) */}
                  <circle
                    cx="50" cy="50" r="38" fill="none" stroke="#06b6d4" strokeWidth="11"
                    strokeDasharray="43 195.7" strokeDashoffset="-130.5"
                  />
                  {/* Arc 4: 17% (Slate) */}
                  <circle
                    cx="50" cy="50" r="38" fill="none" stroke={isDark ? '#cbd5e1' : '#1e293b'} strokeWidth="11"
                    strokeDasharray="40.6 198.1" strokeDashoffset="-175.5"
                  />
                  {/* Arc 5: 13% (Muted Gray) */}
                  <circle
                    cx="50" cy="50" r="38" fill="none" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="11"
                    strokeDasharray="31 207.7" strokeDashoffset="-218.1"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-mono font-bold text-slate-400">Total</span>
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white">100%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>Aggregated Volume:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">₹1,41,00,000</span>
          </div>
        </div>

        {/* Card 6: Autonomous Sentinel Agent (Investigation & Remediation) (spans 3 cols) */}
        <div className="lg:col-span-3 bento-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Sentinel Agent</h3>
                  <span className="text-[10px] text-slate-400 font-mono">GNN-Reasoning Engine</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/60">
                {currentThreat.id}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 mb-4 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Target Syndicate:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{currentThreat.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Topology:</span>
                <span className="font-mono text-purple-700 dark:text-purple-300 font-semibold">{currentThreat.topology}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Autonomous Verdict:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">99.4% Mule Ring</span>
              </div>
            </div>

            {agentState === 'idle' && (
              <button
                onClick={onRunScan}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Zap className="w-3.5 h-3.5 text-lime-300" />
                <span>Run Agentic Scan</span>
                <span className="ml-auto font-mono text-[10px] text-purple-200 bg-purple-800/60 px-2 py-0.5 rounded-full">
                  4.0s
                </span>
              </button>
            )}

            {agentState === 'scanning' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-purple-700 dark:text-purple-300">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 animate-spin" />
                    Traversing Multi-Hop Subgraphs...
                  </span>
                  <span className="font-mono text-slate-400">{Math.round(scanProgress)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 shimmer-progress rounded-full transition-all"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>
            )}

            {(agentState === 'verdict' || agentState === 'frozen') && (
              <div className="space-y-2">
                <button
                  disabled={isFrozen}
                  onClick={onSeverRing}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 ${
                    isFrozen
                      ? 'bg-slate-200 dark:bg-white/10 text-slate-500 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-[0.99]'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isFrozen ? 'Ring Severed & Locked' : 'Sever & Freeze Mule Ring'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>Intervention Latency:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">&lt; 17 min MTTR</span>
          </div>
        </div>
      </div>

      {/* 3. THIRD BENTO ROW: Revenue 3 (Horizontal Pill Bars) + Ring Topology Donut + Saved Capital + Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Card 7: Revenue 3 (Horizontal Pill Bars matching image.png) (spans 4 cols) */}
        <div className="lg:col-span-4 bento-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Revenue 3</h3>
              </div>
              <button
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                title="Revenue analytics"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Available revenue in your escrow wallet</p>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight mb-4">
              ₹1,41,00,000
            </div>

            {/* Horizontal Pill Bars for Q4, Q3, Q2, Q1 */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                  <span>Q4 Escrow</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400">92%</span>
                </div>
                <div className="h-6 w-full rounded-xl bg-slate-100 dark:bg-white/5 overflow-hidden flex shadow-inner">
                  <div className="w-[92%] h-full bg-purple-600 stripe-diagonal-purple rounded-xl flex items-center px-2">
                    <span className="text-[10px] font-mono text-white font-bold">₹1.30 Cr</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                  <span>Q3 Escrow</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400">76%</span>
                </div>
                <div className="h-6 w-full rounded-xl bg-slate-100 dark:bg-white/5 overflow-hidden flex shadow-inner">
                  <div className="w-[76%] h-full bg-purple-600 rounded-xl flex items-center px-2">
                    <span className="text-[10px] font-mono text-white font-bold">₹98 L</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                  <span>Q2 Escrow</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400">58%</span>
                </div>
                <div className="h-6 w-full rounded-xl bg-slate-100 dark:bg-white/5 overflow-hidden flex shadow-inner">
                  <div className="w-[58%] h-full bg-purple-500/80 stripe-diagonal-purple rounded-xl flex items-center px-2">
                    <span className="text-[10px] font-mono text-white font-bold">₹72 L</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                  <span>Q1 Escrow</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400">42%</span>
                </div>
                <div className="h-6 w-full rounded-xl bg-slate-100 dark:bg-white/5 overflow-hidden flex shadow-inner">
                  <div className="w-[42%] h-full bg-purple-400 rounded-xl flex items-center px-2">
                    <span className="text-[10px] font-mono text-white font-bold">₹48 L</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500">
            <span>0</span>
            <span>50 L</span>
            <span>1.0 Cr</span>
            <span>1.5 Cr</span>
          </div>
        </div>

        {/* Card 8: Concentric Ring Topology Gauge (spans 4 cols) */}
        <div className="lg:col-span-4 bento-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Ring Topology Analysis</h3>
              </div>
              <button
                onClick={() => onSwitchView('graph')}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                title="Graph topology"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Concentric multi-tier laundering tranches</p>

            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block">Total Monitored</span>
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">150 Nodes</span>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-purple-600" />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Seed Accounts (9)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Active Mules (84)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-lime-400" />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Shell Relays (57)</span>
                  </div>
                </div>
              </div>

              {/* Concentric 3-Ring SVG Gauge with 99.4% in center */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                  {/* Outer Ring Background & Progress (Purple) */}
                  <circle cx="80" cy="80" r="68" fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'} strokeWidth="9" />
                  <circle
                    cx="80" cy="80" r="68" fill="none" stroke="#7c3aed" strokeWidth="9"
                    strokeDasharray="427" strokeDashoffset="110" strokeLinecap="round"
                  />

                  {/* Middle Ring Background & Progress (Cyan) */}
                  <circle cx="80" cy="80" r="54" fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'} strokeWidth="8" />
                  <circle
                    cx="80" cy="80" r="54" fill="none" stroke="#06b6d4" strokeWidth="8"
                    strokeDasharray="339" strokeDashoffset="90" strokeLinecap="round"
                  />

                  {/* Inner Ring Background & Progress (Neon Lime) */}
                  <circle cx="80" cy="80" r="42" fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'} strokeWidth="7" />
                  <circle
                    cx="80" cy="80" r="42" fill="none" stroke="#a3e635" strokeWidth="7"
                    strokeDasharray="263" strokeDashoffset="80" strokeLinecap="round"
                  />
                </svg>

                {/* Center Percentage Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight font-mono">99.4%</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Confidence</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>Intervention Trigger:</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400 font-mono">Cycle Cut Threshold &gt; 90%</span>
          </div>
        </div>

        {/* Card 9: Saved Capital Liquid Circle + Velocity TPS (spans 4 cols, 2 sub-cards) */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
          
          {/* Subcard A: Saved Liquid Wave Circle */}
          <div className="bento-card p-5 flex flex-col items-center justify-between text-center">
            <div className="w-full flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Saved Capital</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>

            {/* Liquid Purple Circle */}
            <div className="relative w-24 h-24 rounded-full bg-purple-500 overflow-hidden flex items-center justify-center shadow-inner my-2">
              <div className="absolute inset-0 flex items-end">
                <div className="w-[200%] h-12 bg-purple-600 wave-animation rounded-[40%]" />
              </div>
              <div className="relative z-10 text-white font-mono font-bold text-sm tracking-tight">
                ₹4.82 Cr
              </div>
            </div>

            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Intercepted YTD</span>
          </div>

          {/* Subcard B: Velocity TPS Bar Chart */}
          <div className="bento-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Velocity</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Live Ingress</span>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">1,420 TPS</div>

              {/* Mini Sparkline Bar Chart */}
              <div className="flex items-end gap-1 h-9 mt-2">
                {[40, 65, 30, 80, 95, 45, 60, 75, 90, 100, 50, 70, 85].map((val, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm transition-all ${
                      i % 3 === 0 ? 'bg-lime-400' : 'bg-purple-600'
                    }`}
                    style={{ height: `${val}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span>Peak Delta:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+340%</span>
            </div>
          </div>

          {/* Subcard C & D in bottom row */}
          <div className="col-span-2 bento-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-lime-400/20 text-lime-600 dark:text-lime-400 flex items-center justify-center font-bold text-sm">
                ✓
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Autonomous Quarantine</div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500">Escrow retention actively locked</div>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              isFrozen ? 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300' : 'bg-lime-100 dark:bg-lime-900/40 text-lime-900 dark:text-lime-200'
            }`}>
              {isFrozen ? 'FROZEN' : 'ACTIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. FOURTH BENTO ROW: Multi-Rail Ingress Velocity Splines with Floating Tooltip (matching "Top expenses" in image.png) */}
      <div className="bento-card p-6 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Top Rails Liquidity</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Real-time dispersion curves across inter-bank rails</p>
          </div>
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">16 Feb, 2026</span>
        </div>

        {/* Spline Chart SVG */}
        <div className="relative w-full h-44 mt-2">
          <svg viewBox="0 0 500 150" className="w-full h-full overflow-visible">
            {/* Horizontal Reference Lines */}
            <line x1="0" y1="30" x2="500" y2="30" stroke={isDark ? 'rgba(255, 255, 255, 0.07)' : '#f1f5f9'} strokeWidth="1" />
            <line x1="0" y1="70" x2="500" y2="70" stroke={isDark ? 'rgba(255, 255, 255, 0.07)' : '#f1f5f9'} strokeWidth="1" />
            <line x1="0" y1="110" x2="500" y2="110" stroke={isDark ? 'rgba(255, 255, 255, 0.07)' : '#f1f5f9'} strokeWidth="1" />
            <line x1="0" y1="140" x2="500" y2="140" stroke={isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'} strokeWidth="1" />

            {/* Spline Curve 1: Purple (UPI rail) */}
            <path
              d="M 0,90 C 50,50 80,110 130,90 C 180,70 200,40 250,75 C 300,105 340,60 390,40 C 440,20 470,80 500,60"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="2.4"
            />

            {/* Spline Curve 2: High contrast line (RTGS Tranches) */}
            <path
              d="M 0,55 C 40,75 70,40 120,45 C 170,50 200,100 250,85 C 300,70 330,25 380,30 C 430,35 460,75 500,50"
              fill="none"
              stroke={isDark ? '#f8fafc' : '#0f172a'}
              strokeWidth="2.2"
            />

            {/* Spline Curve 3: Neon Lime (IMPS Instant) */}
            <path
              d="M 0,125 C 60,120 100,128 160,122 C 220,116 260,130 320,124 C 380,118 430,126 500,120"
              fill="none"
              stroke="#a3e635"
              strokeWidth="2"
            />

            {/* Dashed Indicator Line for Thu/Fri */}
            <line x1="330" y1="10" x2="330" y2="140" stroke={isDark ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1'} strokeWidth="1" strokeDasharray="3 3" />
          </svg>

          {/* Floating Glassy White/Dark Tooltip Card (matching image.png) */}
          <div className="absolute top-2 right-12 z-10 bg-white/95 dark:bg-[#1e1e28]/95 backdrop-blur-md border border-slate-200/90 dark:border-white/15 shadow-lg rounded-2xl p-3.5 text-xs pointer-events-none animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-purple-600" />
                  <span className="text-slate-600 dark:text-slate-300">Instant UPI</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹42,80,000</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-slate-900 dark:bg-white" />
                  <span className="text-slate-600 dark:text-slate-300">RTGS Tranche</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹64,20,000</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-lime-400" />
                  <span className="text-slate-600 dark:text-slate-300">P2P Escrow</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹18,00,000</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-cyan-400" />
                  <span className="text-slate-600 dark:text-slate-300">Crypto OTC</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹16,00,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Days of Week Axis */}
        <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium pt-2 border-t border-slate-100 dark:border-white/10">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </div>
    </div>
  );
};
