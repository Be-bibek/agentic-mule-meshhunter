import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { ForceGraphMethods, NodeObject } from 'react-force-graph-2d';


interface GraphNode extends NodeObject {
  id: string;
  type: string;
  name?: string;
  inDegree?: number;
  outDegree?: number;
  isMule?: boolean;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  amount?: number;
}

interface GraphViewProps {
  data: { nodes: GraphNode[]; links: GraphLink[] };
  highlightedNodes: Set<string>;
  activeTargetId?: string | null;
  onNodeClick?: (node: GraphNode) => void;
}

export default function GraphView({ data, highlightedNodes, activeTargetId, onNodeClick }: GraphViewProps) {
  const fgRef = useRef<ForceGraphMethods<GraphNode, GraphLink>>(null!);
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);

  // Compute degrees for hover display if needed
  const enrichedData = useMemo(() => {
    const nodesMap = new Map<string, GraphNode>();
    data.nodes.forEach(n => {
      n.inDegree = 0;
      n.outDegree = 0;
      n.isMule = highlightedNodes.has(n.id);
      nodesMap.set(n.id, n);
    });
    
    data.links.forEach(l => {
      const src = typeof l.source === 'string' ? l.source : l.source.id;
      const tgt = typeof l.target === 'string' ? l.target : l.target.id;
      const srcNode = nodesMap.get(src);
      const tgtNode = nodesMap.get(tgt);
      if (srcNode) srcNode.outDegree = (srcNode.outDegree || 0) + 1;
      if (tgtNode) tgtNode.inDegree = (tgtNode.inDegree || 0) + 1;
    });
    
    return data;
  }, [data, highlightedNodes]);

  useEffect(() => {
    if (fgRef.current && data.nodes.length > 0) {
      if (activeTargetId) {
        // Find node coordinates
        const target = enrichedData.nodes.find(n => n.id === activeTargetId);
        if (target && target.x !== undefined && target.y !== undefined) {
          fgRef.current.centerAt(target.x, target.y, 800);
          fgRef.current.zoom(3, 800);
        }
      } else {
        setTimeout(() => {
          fgRef.current.zoomToFit(600, 60);
        }, 500);
      }
    }
  }, [data, activeTargetId, enrichedData.nodes]);

  const drawHexagon = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
    }
    ctx.closePath();
  };

  const nodeCanvasObject = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D) => {
    const isTarget = node.id === activeTargetId;
    const isHighlighted = highlightedNodes.has(node.id);
    const isDevice = node.type === 'device';
    const isBenign = !isHighlighted && !isTarget;
    
    const x = node.x || 0;
    const y = node.y || 0;
    
    ctx.save();
    
    if (isTarget) {
      // Amber Halo for active target
      const pulse = Math.sin(Date.now() / 200) * 2 + 10;
      ctx.beginPath();
      ctx.arc(x, y, pulse, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)'; // Amber 15%
      ctx.fill();
    }

    if (isDevice) {
      drawHexagon(ctx, x, y, 5);
      ctx.fillStyle = '#8b5cf6'; // Indigo/Violet
      ctx.fill();
    } else {
      ctx.beginPath();
      const radius = isHighlighted ? 6 : (isBenign ? 3.5 : 5);
      ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
      
      if (isHighlighted) {
        ctx.fillStyle = '#ef4444'; // Crimson
        ctx.fill();
        
        // Double border ring for mule flow
        ctx.beginPath();
        ctx.arc(x, y, radius + 2, 0, 2 * Math.PI, false);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (isTarget) {
        ctx.fillStyle = '#f59e0b'; // Amber
        ctx.fill();
      } else {
        ctx.fillStyle = '#334155'; // Slate 700 (Clean)
        ctx.fill();
      }
    }
    
    ctx.restore();
  }, [highlightedNodes, activeTargetId]);

  const getNodeId = useCallback((n: string | GraphNode) => typeof n === 'string' ? n : (n as any).id, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ForceGraph2D<GraphNode, GraphLink>
        ref={fgRef}
        graphData={enrichedData}
        nodeCanvasObject={nodeCanvasObject}
        linkColor={(link) => {
          const src = getNodeId(link.source);
          const tgt = getNodeId(link.target);
          if (highlightedNodes.has(src) && highlightedNodes.has(tgt)) {
            return 'rgba(239, 68, 68, 0.6)'; // Crimson for mule flow
          }
          if (activeTargetId === src || activeTargetId === tgt) {
            return 'rgba(245, 158, 11, 0.4)'; // Amber for active target flow
          }
          return 'rgba(51, 65, 85, 0.4)'; // Slate 700
        }}
        linkWidth={(link) => {
          const src = getNodeId(link.source);
          const tgt = getNodeId(link.target);
          return highlightedNodes.has(src) && highlightedNodes.has(tgt) ? 1.5 : 0.5;
        }}
        linkDirectionalParticles={3}
        linkDirectionalParticleSpeed={(link) => {
          const src = getNodeId(link.source);
          const tgt = getNodeId(link.target);
          return highlightedNodes.has(src) && highlightedNodes.has(tgt) ? 0.012 : 0.003;
        }}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={(link) => {
          const src = getNodeId(link.source);
          const tgt = getNodeId(link.target);
          return highlightedNodes.has(src) && highlightedNodes.has(tgt) ? '#ef4444' : '#64748b'; // Crimson vs Slate
        }}
        onNodeHover={(node) => setHoverNode(node || null)}
        onNodeClick={(node) => {
          if (onNodeClick) onNodeClick(node);
          if (fgRef.current && node.x !== undefined && node.y !== undefined) {
            fgRef.current.centerAt(node.x, node.y, 600);
            fgRef.current.zoom(3, 600);
          }
        }}
        backgroundColor="transparent"
      />

      {/* Crosshair target overlay if hover */}
      {hoverNode && (
        <div 
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-color)',
            padding: '8px 12px',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-main)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            pointerEvents: 'none'
          }}
        >
          TARGET: {hoverNode.id}
        </div>
      )}
    </div>
  );
}
