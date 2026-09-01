import { motion, AnimatePresence } from 'framer-motion';
import { Search, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AgentSidebarProps {
  logs: any[];
}

export default function AgentSidebar({ logs }: AgentSidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          <Activity size={20} className="logo-icon" />
          Agent Investigation Log
        </h2>
      </div>
      
      <div className="sidebar-content">
        <AnimatePresence>
          {logs.map((log, i) => (
            <motion.div
              key={i}
              className="log-entry"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {log.type === 'investigation_complete' ? (
                <div className={`verdict-box ${log.verdict.verdict.is_mule_ring ? '' : 'clean'}`}>
                  <div className="verdict-header">
                    <div className="verdict-title">
                      {log.verdict.verdict.is_mule_ring ? (
                        <span style={{color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <AlertCircle size={18} /> Mule Ring Detected
                        </span>
                      ) : (
                        <span style={{color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px'}}>
                          <CheckCircle2 size={18} /> Cleared
                        </span>
                      )}
                    </div>
                    <div className="verdict-score">
                      Conf: {(log.verdict.verdict.confidence_score * 100).toFixed(0)}%
                    </div>
                  </div>
                  <p className="log-details" style={{ background: 'transparent', padding: 0, border: 'none' }}>
                    {log.verdict.verdict.summary}
                  </p>
                  
                  {log.verdict.verdict.is_mule_ring && (
                    <div className="evidence-list">
                      <strong>Evidence:</strong>
                      {log.verdict.verdict.evidence.map((ev: any, idx: number) => (
                        <div key={idx} className="evidence-item">
                          <div className="evidence-dot" />
                          <div>{ev.reason}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="log-header">
                    <div className={`log-icon-container ${log.action ? 'tool' : 'investigate'}`}>
                      {log.action ? <Activity size={14} /> : <Search size={14} />}
                    </div>
                    <div className="log-title">
                      {log.action ? `Tool: ${log.action}` : 'Agent Action'}
                    </div>
                  </div>
                  <div className="log-details">
                    Target: {log.target}
                    <br/>
                    Result: {log.result_size !== undefined ? `${log.result_size} items found` : 'Success'}
                  </div>
                </>
              )}
            </motion.div>
          ))}
          {logs.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
              Waiting for investigation to start...
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
