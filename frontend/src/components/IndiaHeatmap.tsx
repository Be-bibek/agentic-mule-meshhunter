import { useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from 'react-simple-maps';

const INDIA_CENTER: [number, number] = [80, 22];

const cities = [
  { id: 'del', name: 'Delhi', coordinates: [77.1025, 28.7041] as [number, number] },
  { id: 'mum', name: 'Mumbai', coordinates: [72.8777, 19.0760] as [number, number] },
  { id: 'blr', name: 'Bengaluru', coordinates: [77.5946, 12.9716] as [number, number] },
  { id: 'hyd', name: 'Hyderabad', coordinates: [78.4867, 17.3850] as [number, number] },
  { id: 'ccu', name: 'Kolkata', coordinates: [88.3639, 22.5726] as [number, number] },
];

interface IndiaHeatmapProps {
  activeTargetId: string | null;
}

export default function IndiaHeatmap({ activeTargetId }: IndiaHeatmapProps) {
  // If a target is active, we simulate mule transfers between random hubs
  const flows = useMemo(() => {
    if (!activeTargetId) return [];
    
    // Create some pseudo-random but deterministic arcs based on the ID
    const charCode = activeTargetId.charCodeAt(activeTargetId.length - 1);
    
    if (charCode % 3 === 0) {
      return [
        { from: cities[0], to: cities[1] }, // Delhi -> Mumbai
        { from: cities[1], to: cities[2] }, // Mumbai -> Bengaluru
      ];
    } else if (charCode % 3 === 1) {
      return [
        { from: cities[1], to: cities[3] }, // Mumbai -> Hyderabad
        { from: cities[3], to: cities[4] }, // Hyderabad -> Kolkata
      ];
    } else {
      return [
        { from: cities[0], to: cities[4] }, // Delhi -> Kolkata
        { from: cities[4], to: cities[2] }, // Kolkata -> Bengaluru
        { from: cities[2], to: cities[1] }, // Bengaluru -> Mumbai
      ];
    }
  }, [activeTargetId]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: 'var(--bg-dark)' }}>
      {/* Background grid texture */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(14, 165, 233, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        zIndex: 0
      }} />

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1200,
          center: INDIA_CENTER,
        }}
        style={{ width: '100%', height: '100%', position: 'absolute', zIndex: 1 }}
      >
        <Geographies geography="/world-110m.json">
          {({ geographies }) =>
            geographies.map((geo) => {
              // Highlight India (ID 356 in standard world-110m.json)
              const isIndia = geo.id === "356";
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isIndia ? '#111827' : '#0b0f17'}
                  stroke={isIndia ? 'rgba(14, 165, 233, 0.4)' : '#1f2937'}
                  strokeWidth={isIndia ? 1.5 : 0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: isIndia ? '#1f2937' : '#0b0f17' },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* Transfer Flows */}
        {flows.map((flow, i) => (
          <Line
            key={`line-${i}`}
            from={flow.from.coordinates}
            to={flow.to.coordinates}
            stroke="#ef4444"
            strokeWidth={2}
            strokeLinecap="round"
            className="pulse-path"
          />
        ))}

        {/* Payment Hubs */}
        {cities.map((city) => (
          <Marker key={city.name} coordinates={city.coordinates}>
            <circle r={4} fill="#f59e0b" className={activeTargetId ? "hub-pulse" : ""} />
            <text
              textAnchor="middle"
              y={-10}
              style={{
                fontFamily: "var(--font-mono)",
                fill: "#94a3b8",
                fontSize: "10px",
                fontWeight: 600
              }}
            >
              {city.name}
            </text>
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
}
