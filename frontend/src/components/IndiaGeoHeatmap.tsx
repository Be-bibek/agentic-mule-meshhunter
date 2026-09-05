import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  CYBER_HOTSPOTS,
  INDIA_STATES_RISK,
  THREAT_CORRIDORS,
  CyberHotspot,
  StateRiskData
} from '../data/indiaGeoData';
import {
  Flame,
  Layers,
  MapPin,
  AlertTriangle,
  RotateCcw,
  Zap,
  X,
  ChevronRight,
  Maximize2
} from 'lucide-react';

interface IndiaGeoHeatmapProps {
  selectedThreatId: string;
  onSelectThreat?: (threatId: string) => void;
  isThreatFrozen?: boolean;
  compact?: boolean;
  onExpandView?: () => void;
  theme?: 'light' | 'dark';
}

export const IndiaGeoHeatmap: React.FC<IndiaGeoHeatmapProps> = ({
  selectedThreatId,
  onSelectThreat,
  isThreatFrozen = false,
  compact = false,
  onExpandView,
  theme = 'light'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [dimensions, setDimensions] = useState({ width: 700, height: 550 });
  const [geoData, setGeoData] = useState<any | null>(null);
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);

  // Interaction states
  const [hoveredHotspot, setHoveredHotspot] = useState<CyberHotspot | null>(null);
  const [hoveredState, setHoveredState] = useState<StateRiskData | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<CyberHotspot | null>(null);
  const [selectedState, setSelectedState] = useState<StateRiskData | null>(null);

  // Visualization toggles
  const [showThermalLayer, setShowThermalLayer] = useState(true);
  const [showCorridorFlows, setShowCorridorFlows] = useState(true);
  const [showStateBorders, setShowStateBorders] = useState(true);
  const [filterMode, setFilterMode] = useState<'selected' | 'all' | 'critical'>('selected');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Animation frame for flowing particles
  const [animationTick, setAnimationTick] = useState(0);

  // 1. Fetch GeoJSON for Indian States
  useEffect(() => {
    let isMounted = true;
    fetch('/india_states.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load India GeoJSON');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setGeoData(data);
          setIsLoadingGeo(false);
        }
      })
      .catch((err) => {
        console.error('Error loading India GeoJSON:', err);
        if (isMounted) setIsLoadingGeo(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Measure Container Resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setDimensions({
            width: Math.floor(rect.width),
            height: Math.floor(rect.height)
          });
        }
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 3. Continuous particle animation loop
  useEffect(() => {
    let animId: number;
    const loop = () => {
      setAnimationTick((prev) => (prev + 1) % 1000);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // 4. Projection & Path Generator for India
  const { projection, pathGenerator } = useMemo(() => {
    const scaleFactor = compact ? 1.4 : 1.55;
    const proj = d3
      .geoMercator()
      .center([82.5, 22.8]) // Center of Indian subcontinent
      .scale(Math.min(dimensions.width, dimensions.height) * scaleFactor * zoomLevel)
      .translate([
        dimensions.width / 2 + panOffset.x,
        dimensions.height / 2 + panOffset.y
      ]);

    const path = d3.geoPath().projection(proj);
    return { projection: proj, pathGenerator: path };
  }, [dimensions, zoomLevel, panOffset, compact]);

  // Active Corridor Data
  const activeCorridor = useMemo(() => {
    const corridor =
      THREAT_CORRIDORS[selectedThreatId] ||
      THREAT_CORRIDORS['ACC-88219'] ||
      Object.values(THREAT_CORRIDORS)[0];
    if (!corridor) return null;

    const keyNodes =
      corridor.keyNodes && Array.isArray(corridor.keyNodes)
        ? corridor.keyNodes
        : corridor.hops
        ? corridor.hops.map((h) => h.hotspotId)
        : [];

    let flowArcs =
      corridor.flowArcs && Array.isArray(corridor.flowArcs) ? corridor.flowArcs : [];

    if (flowArcs.length === 0 && corridor.hops && corridor.hops.length > 1) {
      flowArcs = [];
      for (let i = 0; i < corridor.hops.length - 1; i++) {
        flowArcs.push({
          id: `arc-${corridor.threatId}-${corridor.hops[i].hotspotId}-${corridor.hops[i + 1].hotspotId}-${i}`,
          from: corridor.hops[i].hotspotId,
          to: corridor.hops[i + 1].hotspotId,
          amount: corridor.hops[i].amount,
          rail: 'UPI'
        });
      }
    }

    return {
      ...corridor,
      keyNodes,
      flowArcs
    };
  }, [selectedThreatId]);

  // Filtered Hotspots based on mode
  const displayedHotspots = useMemo(() => {
    if (filterMode === 'critical') {
      return CYBER_HOTSPOTS.filter((s) => s.riskScore >= 90);
    }
    if (filterMode === 'all') {
      return CYBER_HOTSPOTS;
    }
    // 'selected' mode: active corridor nodes + other high-profile hubs
    const activeKeyNodes = activeCorridor?.keyNodes || [];
    return CYBER_HOTSPOTS.map((spot) => ({
      ...spot,
      isInActiveCorridor: activeKeyNodes.includes(spot.id)
    }));
  }, [filterMode, activeCorridor]);

  // Corridor Flow Arcs (Quadratic Bezier paths)
  const corridorArcs = useMemo(() => {
    if (!activeCorridor?.flowArcs || !projection) return [];

    return activeCorridor.flowArcs
      .map((arc, index) => {
        const srcSpot = CYBER_HOTSPOTS.find((h) => h.id === arc.from);
        const tgtSpot = CYBER_HOTSPOTS.find((h) => h.id === arc.to);
        if (!srcSpot || !tgtSpot) return null;

        const srcCoords = projection(srcSpot.coordinates);
        const tgtCoords = projection(tgtSpot.coordinates);
        if (!srcCoords || !tgtCoords) return null;

        // Calculate curved control point
        const dx = tgtCoords[0] - srcCoords[0];
        const dy = tgtCoords[1] - srcCoords[1];
        const dist = Math.sqrt(dx * dx + dy * dy);

        const curvature = 0.22;
        const midX = (srcCoords[0] + tgtCoords[0]) / 2 - dy * curvature;
        const midY = (srcCoords[1] + tgtCoords[1]) / 2 + dx * curvature;

        const pathStr = `M ${srcCoords[0]} ${srcCoords[1]} Q ${midX} ${midY} ${tgtCoords[0]} ${tgtCoords[1]}`;
        const arcUniqueId = arc.id || `${activeCorridor.threatId || 'corridor'}-${arc.from}-${arc.to}-${index}`;

        return {
          ...arc,
          id: arcUniqueId,
          sourceCoords: srcCoords,
          targetCoords: tgtCoords,
          midCoords: [midX, midY],
          curvePath: pathStr,
          sourceName: srcSpot.name,
          targetName: tgtSpot.name
        };
      })
      .filter(Boolean) as any[];
  }, [activeCorridor, projection]);

  // 5. Thermal Density Canvas Renderer
  useEffect(() => {
    if (!showThermalLayer || !canvasRef.current || !projection) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Render Gaussian Heat Splats for hotspots
    displayedHotspots.forEach((spot) => {
      const coords = projection(spot.coordinates);
      if (!coords) return;
      const [x, y] = coords;

      const isHighPriority = spot.isInActiveCorridor || spot.riskScore >= 90;
      const radius = isHighPriority ? 50 * zoomLevel : 35 * zoomLevel;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      if (spot.riskScore >= 95) {
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
        grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.25)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else if (spot.riskScore >= 85) {
        grad.addColorStop(0, 'rgba(168, 85, 247, 0.38)');
        grad.addColorStop(0.6, 'rgba(217, 249, 157, 0.22)');
        grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
      } else {
        grad.addColorStop(0, 'rgba(124, 58, 237, 0.28)');
        grad.addColorStop(1, 'rgba(124, 58, 237, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [dimensions, displayedHotspots, projection, zoomLevel, showThermalLayer]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      id="india-geo-heatmap-container"
      className="relative w-full h-full bg-[#f8fafc] dark:bg-[#0c0d12] flex flex-col overflow-hidden select-none rounded-2xl"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
    >
      {/* Subtle Dot Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-15"
        style={{
          backgroundImage: theme === 'dark'
            ? 'radial-gradient(rgba(255,255,255,0.4) 0.75px, transparent 0.75px)'
            : 'radial-gradient(#94a3b8 0.75px, transparent 0.75px)',
          backgroundSize: '20px 20px'
        }}
      />

      {/* TOP HEADER CONTROLS BAR (Non-overlapping, responsive flex-wrap) */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Floating Brand Badge matching the reference design */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {activeCorridor && (
            <div className="bg-slate-900/90 dark:bg-[#16161d]/90 backdrop-blur-md text-white shadow-md rounded-full px-3.5 py-1.5 flex items-center gap-2 border border-slate-700/50 dark:border-white/10">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              <span className="text-xs font-bold font-mono tracking-tight text-lime-300">
                {activeCorridor.threatId}
              </span>
              <span className="text-slate-400 text-xs">&bull;</span>
              <span className="text-xs font-medium text-slate-100 truncate max-w-[140px] sm:max-w-none">
                {activeCorridor.threatName}
              </span>
              <span className="text-[11px] font-mono text-purple-300 font-semibold bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/60">
                {activeCorridor.totalLaundered}
              </span>
            </div>
          )}

          {!compact && (
            <div className="hidden lg:flex items-center bg-white/95 dark:bg-[#16161d]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-full p-1 shadow-sm gap-1">
              <button
                onClick={() => setFilterMode('selected')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  filterMode === 'selected'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Corridor Focus
              </button>
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  filterMode === 'all'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All 35 Hotspots
              </button>
            </div>
          )}
        </div>

        {/* Right: Layer Toggles & Zoom Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto ml-auto">
          {!compact && (
            <div className="bg-white/95 dark:bg-[#16161d]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm rounded-full px-2 py-1 flex items-center gap-1">
              <button
                onClick={() => setShowThermalLayer(!showThermalLayer)}
                title="Toggle Thermal Density"
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 transition-all ${
                  showThermalLayer
                    ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Flame className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span className="hidden sm:inline">Thermal</span>
              </button>
              <button
                onClick={() => setShowCorridorFlows(!showCorridorFlows)}
                title="Toggle Corridors"
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 transition-all ${
                  showCorridorFlows
                    ? 'bg-lime-100 dark:bg-lime-900/50 text-lime-900 dark:text-lime-200 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Zap className="w-3 h-3 text-lime-600 dark:text-lime-400" />
                <span className="hidden sm:inline">Flows</span>
              </button>
            </div>
          )}

          {/* Zoom Buttons */}
          <div className="bg-white/95 dark:bg-[#16161d]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm rounded-full p-1 flex items-center gap-1">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z * 1.2, 3.5))}
              title="Zoom In"
              className="w-6 h-6 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-xs font-bold"
            >
              +
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z * 0.8, 0.7))}
              title="Zoom Out"
              className="w-6 h-6 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-xs font-bold"
            >
              &minus;
            </button>
            <button
              onClick={resetView}
              title="Reset View"
              className="w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            {compact && onExpandView && (
              <button
                onClick={onExpandView}
                title="Expand to Full Map"
                className="w-6 h-6 flex items-center justify-center text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-full"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* HEATMAP CANVAS LAYER (Underneath SVG for clean compositing) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          opacity: showThermalLayer ? 0.85 : 0,
          transition: 'opacity 300ms ease'
        }}
      />

      {/* SVG INTERACTION LAYER (States, Corridors, Hotspots) */}
      <svg
        className="absolute inset-0 w-full h-full z-10 pointer-events-auto"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="corridor-flow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#84cc16" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* 1. Indian States Choropleth & Boundaries */}
        {geoData && showStateBorders && (
          <g id="indian-states-layer">
            {geoData.features.map((feature: any, idx: number) => {
              const stateName = feature.properties?.name || '';
              const stateMeta = INDIA_STATES_RISK[stateName];
              const isHovered = hoveredState?.name === stateName;
              const isSelected = selectedState?.name === stateName;

              // Color based on risk index and reference aesthetic (soft purple highlight like China in reference image)
              const isDark = theme === 'dark';
              let fillColor = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)';
              let strokeColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0';
              let strokeWidth = 0.8;

              if (stateMeta) {
                if (stateMeta.riskScore >= 90) {
                  fillColor = isHovered
                    ? (isDark ? 'rgba(168, 85, 247, 0.45)' : 'rgba(168, 85, 247, 0.35)')
                    : (isDark ? 'rgba(147, 51, 234, 0.3)' : 'rgba(237, 233, 254, 0.75)');
                  strokeColor = isDark ? '#c084fc' : '#a855f7';
                } else if (stateMeta.riskScore >= 80) {
                  fillColor = isHovered
                    ? (isDark ? 'rgba(192, 132, 252, 0.35)' : 'rgba(192, 132, 252, 0.25)')
                    : (isDark ? 'rgba(126, 34, 206, 0.2)' : 'rgba(243, 232, 255, 0.6)');
                  strokeColor = isDark ? '#a855f7' : '#c084fc';
                } else {
                  fillColor = isHovered
                    ? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(241, 245, 249, 0.9)')
                    : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(248, 250, 252, 0.6)');
                  strokeColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1';
                }
              }

              if (isHovered || isSelected) {
                strokeWidth = 1.6;
                strokeColor = isDark ? '#c084fc' : '#7c3aed';
              }

              const pathString = pathGenerator(feature);
              if (!pathString) return null;

              return (
                <path
                  key={`state-${stateName}-${idx}`}
                  d={pathString}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  className="transition-colors duration-150 cursor-pointer"
                  onMouseEnter={() => {
                    if (stateMeta) setHoveredState(stateMeta);
                  }}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => {
                    if (stateMeta) setSelectedState(stateMeta);
                  }}
                />
              );
            })}
          </g>
        )}

        {/* 2. Laundering Corridor Curved Flow Arcs */}
        {showCorridorFlows && (
          <g id="laundering-arcs-layer">
            {corridorArcs.map((arc, index) => {
              const dashOffset = -((animationTick * 1.5 + index * 40) % 200);

              return (
                <g key={`arc-${arc.id || `${arc.from}-${arc.to}-${index}`}`}>
                  {/* Subtle Glow Curve */}
                  <path
                    d={arc.curvePath}
                    fill="none"
                    stroke="rgba(124, 58, 237, 0.15)"
                    strokeWidth={5}
                    strokeLinecap="round"
                  />

                  {/* Main Flow Vector Line */}
                  <path
                    d={arc.curvePath}
                    fill="none"
                    stroke="url(#corridor-flow-gradient)"
                    strokeWidth={2.4}
                    strokeDasharray="6 4"
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                  />

                  {/* Transfer Amount Pill along the mid-curve */}
                  {true && (
                    <g
                      transform={`translate(${
                        (arc.sourceCoords[0] + arc.targetCoords[0]) / 2
                      }, ${
                        (arc.sourceCoords[1] + arc.targetCoords[1]) / 2 - 10
                      })`}
                      className="pointer-events-none"
                    >
                      <rect
                        x={-26}
                        y={-8}
                        width={52}
                        height={16}
                        rx={8}
                        fill="rgba(15, 23, 42, 0.88)"
                      />
                      <text
                        x={0}
                        y={3.5}
                        textAnchor="middle"
                        className="text-[9px] font-mono font-bold fill-lime-300"
                      >
                        {arc.amount}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* 3. Cyber Hotspot Nodes */}
        <g id="hotspots-nodes-layer">
          {displayedHotspots.map((spot) => {
            const coords = projection(spot.coordinates);
            if (!coords) return null;
            const [x, y] = coords;

            const isHovered = hoveredHotspot?.id === spot.id;
            const isInActive = spot.isInActiveCorridor;
            const isCritical = spot.riskScore >= 95;

            return (
              <g
                key={`spot-${spot.id}`}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredHotspot(spot)}
                onMouseLeave={() => setHoveredHotspot(null)}
                onClick={() => {
                  setSelectedHotspot(spot);
                  const sMeta = INDIA_STATES_RISK[spot.state];
                  if (sMeta) setSelectedState(sMeta);
                }}
              >
                {/* Outer Pulsing Ping for Active Corridor Hotspots */}
                {isInActive && (
                  <circle
                    r={isCritical ? 14 : 11}
                    fill="none"
                    stroke={isCritical ? '#ef4444' : '#7c3aed'}
                    strokeWidth={1.2}
                    className="animate-ping opacity-60"
                  />
                )}

                {/* Outer Solid Halo Ring */}
                <circle
                  r={isHovered ? 10 : isCritical ? 8 : 6}
                  fill={
                    isCritical
                      ? 'rgba(239, 68, 68, 0.2)'
                      : isInActive
                      ? 'rgba(124, 58, 237, 0.25)'
                      : 'rgba(6, 182, 212, 0.2)'
                  }
                  stroke={isCritical ? '#ef4444' : isInActive ? '#7c3aed' : '#06b6d4'}
                  strokeWidth={1.2}
                />

                {/* Core Center Dot */}
                <circle
                  r={isHovered ? 4.5 : 3.5}
                  fill={isCritical ? '#dc2626' : isInActive ? '#6d28d9' : '#0891b2'}
                />

                {/* Node Label Pill (Clean, non-clashing) */}
                {(isHovered || isInActive || isCritical) && (
                  <g transform="translate(0, 13)" className="pointer-events-none">
                    <rect
                      x={-spot.name.length * 3.2 - 8}
                      y={-6}
                      width={spot.name.length * 6.4 + 16}
                      height={14}
                      rx={7}
                      fill={theme === 'dark' ? 'rgba(22, 22, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'}
                      stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : '#e2e8f0'}
                      strokeWidth={0.8}
                    />
                    <text
                      x={0}
                      y={4}
                      textAnchor="middle"
                      className={`text-[9px] font-semibold ${theme === 'dark' ? 'fill-slate-200' : 'fill-slate-800'}`}
                    >
                      {spot.name}{' '}
                      <tspan
                        className="font-mono font-bold"
                        fill={isCritical ? '#f87171' : theme === 'dark' ? '#c084fc' : '#7c3aed'}
                      >
                        {spot.riskScore}
                      </tspan>
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* BOTTOM-LEFT SLIM SCALE BAR (Never covers the entire width) */}
      <div className="absolute bottom-3 left-3 z-20 pointer-events-auto bg-white/95 dark:bg-[#16161d]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-sm rounded-2xl px-3 py-2 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400" />
          <span>Thermal Corridors</span>
        </div>
        <div className="h-2 w-16 rounded-full overflow-hidden flex">
          <div className="w-1/3 h-full bg-purple-300 dark:bg-purple-400" />
          <div className="w-1/3 h-full bg-purple-600 dark:bg-purple-600" />
          <div className="w-1/3 h-full bg-lime-400 dark:bg-lime-400" />
        </div>
        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">35 States</span>
      </div>

      {/* INSPECTOR POP-OVER DRAWER (Docked bottom-right or side, with close button so it never overlaps legend) */}
      {(hoveredHotspot || hoveredState || selectedHotspot || selectedState) && (
        <div className="absolute bottom-3 right-3 z-20 pointer-events-auto max-w-xs w-full">
          <div className="bg-white/95 dark:bg-[#16161d]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-lg rounded-2xl p-3.5 transition-all animate-in fade-in slide-in-from-bottom-2 duration-150 relative">
            <button
              onClick={() => {
                setHoveredHotspot(null);
                setSelectedHotspot(null);
                setHoveredState(null);
                setSelectedState(null);
              }}
              className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2 mb-1.5 pr-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-900/60">
                {hoveredHotspot ? 'District Cyber Hotspot' : 'State Jurisdiction'}
              </span>
              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                Risk: {hoveredHotspot?.riskScore || hoveredState?.riskScore}/100
              </span>
            </div>

            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {hoveredHotspot
                ? `${hoveredHotspot.name}, ${hoveredHotspot.state}`
                : hoveredState?.name || selectedState?.name}
            </h4>

            {hoveredHotspot && (
              <div className="mt-2 space-y-1.5 text-[11px]">
                <p className="text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {hoveredHotspot.description}
                </p>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <div className="bg-slate-50 dark:bg-white/5 p-1.5 rounded-xl border border-slate-100 dark:border-white/10">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-medium">Mules</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{hoveredHotspot.activeMules}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 p-1.5 rounded-xl border border-slate-100 dark:border-white/10">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-medium">Laundered</span>
                    <span className="text-xs font-bold font-mono text-purple-700 dark:text-purple-400">{hoveredHotspot.volume}</span>
                  </div>
                </div>
              </div>
            )}

            {!hoveredHotspot && (hoveredState || selectedState) && (
              <div className="mt-2 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 dark:text-slate-500">Primary Abuse Vector:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {(hoveredState || selectedState)?.primaryVector}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <div className="bg-slate-50 dark:bg-white/5 p-1.5 rounded-xl border border-slate-100 dark:border-white/10">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-medium">Detected Mules</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {(hoveredState || selectedState)?.activeMules}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 p-1.5 rounded-xl border border-slate-100 dark:border-white/10">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-medium">Intercepted</span>
                    <span className="text-xs font-bold font-mono text-purple-700 dark:text-purple-400">
                      {(hoveredState || selectedState)?.volume}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
