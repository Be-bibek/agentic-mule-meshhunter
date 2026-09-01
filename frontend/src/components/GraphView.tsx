import { useEffect, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { ForceGraphMethods } from 'react-force-graph-2d';

interface GraphNode {
  id: string;
  type: string;
  name?: string;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  amount?: number;
}

interface GraphViewProps {
  data: { nodes: GraphNode[]; links: GraphLink[] };
  highlightedNodes: Set<string>;
}

export default function GraphView({ data, highlightedNodes }: GraphViewProps) {
  const fgRef = useRef<ForceGraphMethods<GraphNode, GraphLink>>(null!);

  useEffect(() => {
    if (fgRef.current && data.nodes.length > 0) {
      setTimeout(() => {
        fgRef.current.zoomToFit(600, 60);
      }, 1000);
    }
  }, [data]);

  const getNodeId = useCallback((node: string | GraphNode) =>
    typeof node === 'string' ? node : node.id, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ForceGraph2D<GraphNode, GraphLink>
        ref={fgRef}
        graphData={data}
        nodeColor={(node) => {
          if (highlightedNodes.has(node.id)) return '#EF4444';
          if (node.type === 'device') return '#94A3B8';
          return '#3B82F6';
        }}
        nodeVal={(node) => {
          if (highlightedNodes.has(node.id)) return 15;
          return node.type === 'device' ? 5 : 8;
        }}
        linkColor={(link) => {
          const src = getNodeId(link.source);
          const tgt = getNodeId(link.target);
          if (highlightedNodes.has(src) && highlightedNodes.has(tgt)) {
            return 'rgba(239, 68, 68, 0.7)';
          }
          return 'rgba(255, 255, 255, 0.1)';
        }}
        linkWidth={(link) => {
          const src = getNodeId(link.source);
          const tgt = getNodeId(link.target);
          return highlightedNodes.has(src) && highlightedNodes.has(tgt) ? 2.5 : 0.8;
        }}
        linkDirectionalParticles={(link) => (link.amount ? 2 : 0)}
        linkDirectionalParticleSpeed={0.005}
        nodeLabel="id"
        backgroundColor="transparent"
      />
    </div>
  );
}
