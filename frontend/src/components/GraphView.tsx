import { useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface GraphViewProps {
  data: any;
  highlightedNodes: Set<string>;
}

export default function GraphView({ data, highlightedNodes }: GraphViewProps) {
  const fgRef = useRef<any>();

  useEffect(() => {
    if (fgRef.current && data.nodes.length > 0) {
      // Add slight delay to let physics settle, then zoom to fit
      setTimeout(() => {
        fgRef.current.zoomToFit(400, 50);
      }, 1000);
    }
  }, [data]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        nodeColor={(node: any) => {
          if (highlightedNodes.has(node.id)) return '#EF4444'; // Red for under investigation/verdict
          if (node.type === 'device') return '#94A3B8'; // Muted grey for devices
          return '#3B82F6'; // Blue for normal accounts
        }}
        nodeVal={(node: any) => {
          if (highlightedNodes.has(node.id)) return 15;
          return node.type === 'device' ? 5 : 8;
        }}
        linkColor={(link: any) => {
          if (highlightedNodes.has(link.source.id || link.source) && highlightedNodes.has(link.target.id || link.target)) {
            return 'rgba(239, 68, 68, 0.6)'; // Highlight connections between investigated nodes
          }
          return 'rgba(255, 255, 255, 0.1)';
        }}
        linkWidth={(link: any) => {
          if (highlightedNodes.has(link.source.id || link.source) && highlightedNodes.has(link.target.id || link.target)) {
            return 2;
          }
          return 1;
        }}
        linkDirectionalParticles={(link: any) => link.amount ? 2 : 0}
        linkDirectionalParticleSpeed={0.005}
        nodeLabel="id"
        backgroundColor="transparent"
      />
    </div>
  );
}
