
import React from 'react';
import { SimulationStats } from '../types';

interface MetricsPanelProps {
  stats: SimulationStats;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ stats }) => {
  const metrics = [
    { label: 'Total Requests', value: stats.totalRequests.toLocaleString(), icon: '🌐', color: 'text-blue-500' },
    { label: 'Avg Latency', value: `${stats.avgLatency}ms`, icon: '⏱️', color: 'text-yellow-500' },
    { label: 'Success Rate', value: `${stats.successRate}%`, icon: '✅', color: 'text-green-500' },
    { label: 'Cluster Nodes', value: stats.activeNodes, icon: '🖥️', color: 'text-purple-500' }
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((m, i) => (
        <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{m.icon}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${m.color}`}>
            {m.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsPanel;
