import { useState } from 'react';
import { X, Copy, Crosshair, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GraphNode {
  id: string;
  type: string;
  name?: string;
  inDegree?: number;
  outDegree?: number;
  isMule?: boolean;
}

interface EntityInspectorProps {
  node: GraphNode | null;
  isOpen: boolean;
  onClose: () => void;
  onTriggerInvestigation: (nodeId: string) => void;
  isInvestigating: boolean;
}

type TabKey = 'overview' | 'metrics' | 'traversal';

export default function EntityInspector({ 
  node, 
  isOpen, 
  onClose, 
  onTriggerInvestigation, 
  isInvestigating 
}: EntityInspectorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  
  if (!node) return null;

  const isDevice = node.type === 'device';
  const isMule = node.isMule;
  
  const riskScore = isMule ? 96 : (isDevice ? 50 : 12);
  const isHighRisk = riskScore > 80;
  
  const totalVolume = `₹${((node.inDegree || 0) * 15000 + 5000).toLocaleString()}`;
  const velocity = isMule ? '24 tx / hr' : '2 tx / wk';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="entity-inspector"
          initial={{ x: -420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -420, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
        >
          {/* Header */}
          <div className="inspector-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 className="inspector-id">{node.id}</h3>
                  <button className="copy-badge" onClick={() => navigator.clipboard.writeText(node.id)}>
                    <Copy size={12} />
                  </button>
                </div>
                
                <div className="inspector-badges" style={{ marginTop: '8px' }}>
                  {isDevice ? (
                    <span className="entity-badge device">SHARED HARDWARE</span>
                  ) : isMule ? (
                    <span className="entity-badge mule">FLAGGED MULE</span>
                  ) : (
                    <span className="entity-badge customer">BENIGN USER</span>
                  )}
                </div>
              </div>
              <button className="close-btn" onClick={onClose}>
                <X size={18} />
              </button>
            </div>
            
            <div className={`risk-badge ${isHighRisk ? 'high' : 'low'}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isHighRisk ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
                <span>Risk Score: {riskScore}/100 • {isHighRisk ? 'HIGH RISK' : 'LOW RISK'}</span>
              </div>
            </div>
          </div>

          <div className="inspector-tabs">
            <div className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</div>
            <div className={`tab ${activeTab === 'metrics' ? 'active' : ''}`} onClick={() => setActiveTab('metrics')}>Metrics</div>
            <div className={`tab ${activeTab === 'traversal' ? 'active' : ''}`} onClick={() => setActiveTab('traversal')}>Audit Log</div>
          </div>

          <div className="inspector-content">
            {activeTab === 'overview' && (
              <>
                <div className="telemetry-grid">
                  <div className="telemetry-card">
                    <span className="t-label">Total ₹ Volume</span>
                    <span className="t-val">{totalVolume}</span>
                  </div>
                  <div className="telemetry-card">
                    <span className="t-label">Velocity</span>
                    <span className="t-val">{velocity}</span>
                  </div>
                  <div className="telemetry-card">
                    <span className="t-label">Degree Centrality</span>
                    <span className="t-val">{node.inDegree} In / {node.outDegree} Out</span>
                  </div>
                  <div className="telemetry-card">
                    <span className="t-label">Assoc. Hardware</span>
                    <span className="t-val">{isDevice ? '4 Accounts' : '2 Devices'}</span>
                  </div>
                </div>

                <div className="sparkline-container">
                  <span className="section-title">24h Velocity Profile</span>
                  <div className="sparkline-graph">
                    {[1, 2, 1, 3, 2, 4, 15, 22, 18, 5, 2, 1].map((val, idx) => (
                      <div 
                        key={idx} 
                        className="spark-bar" 
                        style={{ 
                          height: `${(val / 22) * 100}%`,
                          background: val > 10 ? 'var(--accent-crimson)' : 'var(--accent-cyan)'
                        }} 
                      />
                    ))}
                  </div>
                </div>

                {isHighRisk && (
                  <div className="warning-box">
                    <AlertTriangle size={16} />
                    <span>Multiple active accounts linked to device fingerprint in the last 4 hours. Probable sybil cluster.</span>
                  </div>
                )}
              </>
            )}

            {activeTab === 'metrics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <span className="section-title">Graph Centrality</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>In-Degree</span><span>{node.inDegree}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Out-Degree</span><span>{node.outDegree}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Clustering Coeff</span><span>{isMule ? '0.89' : '0.12'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>PageRank</span><span>{isMule ? 'High (top 2%)' : 'Normal'}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'traversal' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span className="section-title">Forensic Audit Trail</span>
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Time (UTC)</th>
                      <th>Type</th>
                      <th>Ref Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>14:02:11</td>
                      <td>AUTH</td>
                      <td>200 OK</td>
                    </tr>
                    <tr>
                      <td>14:02:12</td>
                      <td>TX_INIT</td>
                      <td>PENDING</td>
                    </tr>
                    <tr>
                      <td>14:02:13</td>
                      <td>SETTLE</td>
                      <td>201 CREATED</td>
                    </tr>
                    <tr>
                      <td>14:05:00</td>
                      <td><span style={{ color: 'var(--accent-crimson)' }}>FLAG</span></td>
                      <td>RULE_VELOCITY</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Direct Action */}
            <button 
              className={`btn primary action-btn ${isInvestigating ? 'disabled' : ''}`}
              onClick={() => onTriggerInvestigation(node.id)}
              disabled={isInvestigating}
            >
              <Crosshair size={16} />
              {isInvestigating ? 'Agent Investigating...' : 'Target Node for Agent Investigation'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
