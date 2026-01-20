
import React from 'react';
import { SimulationStats } from '../types';

interface MetricsPanelProps {
  stats: SimulationStats;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ stats }) => {
  const metrics = [
    { label: 'Total Hits', value: stats.totalRequests.toLocaleString(), icon: 'analytics' },
    { label: 'Latency', value: `${stats.avgLatency}ms`, icon: 'speed' },
    { label: 'Success Rate', value: `${stats.successRate}%`, icon: 'check_circle' },
    { label: 'Throughput', value: `${stats.requestsPerSecond}/s`, icon: 'bolt' }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((m, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] hover:bg-slate-800/50 transition-all group">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">{m.label}</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tighter">
            {m.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsPanel;
