
import React, { useMemo } from 'react';
import { TrafficNode } from '../types';

interface LiveMapProps {
  nodes: TrafficNode[];
}

const LiveMap: React.FC<LiveMapProps> = ({ nodes }) => {
  // Simple World SVG Representation
  return (
    <div className="relative w-full h-full bg-[#020617] flex items-center justify-center overflow-hidden">
      {/* Background World Map (Stylized) */}
      <svg viewBox="0 0 1000 500" className="w-full h-full opacity-20 pointer-events-none">
        <path
          fill="#1e293b"
          d="M150,150 L200,100 L300,150 L400,120 L500,180 L600,150 L700,200 L800,150 L900,200 L950,300 L900,400 L800,450 L700,420 L600,450 L500,400 L400,450 L300,400 L200,450 L100,400 L50,300 Z"
          className="animate-pulse"
        />
        {/* Simple grid lines */}
        {[...Array(20)].map((_, i) => (
          <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="500" stroke="#0f172a" strokeWidth="1" />
        ))}
        {[...Array(10)].map((_, i) => (
          <line key={`h-${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} stroke="#0f172a" strokeWidth="1" />
        ))}
      </svg>

      {/* Nodes and Pings */}
      <div className="absolute inset-0">
        {nodes.map((node, i) => {
          // Normalize coordinates to percentage (just for visualization)
          const left = 50 + (node.lng / 3);
          const top = 50 - (node.lat / 1.5);
          
          return (
            <div 
              key={node.id} 
              className="absolute"
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              <div className="relative group">
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)] z-20"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                
                {/* Connection Line to Center Target (Pseudo) */}
                <svg className="absolute top-1.5 left-1.5 w-[500px] h-[500px] pointer-events-none -translate-x-1/2 -translate-y-1/2 overflow-visible">
                  <line 
                    x1="250" y1="250" 
                    x2="250" y2="250" 
                    className="stroke-green-500/10 stroke-1"
                  />
                </svg>

                {/* Node Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[8px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 font-mono text-slate-300">
                  <p className="text-green-500 font-bold">{node.country}</p>
                  <p>{node.ip}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Center Target Indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="w-12 h-12 rounded-full border-2 border-green-500/20 flex items-center justify-center animate-[spin_10s_linear_infinite]">
          <div className="w-8 h-8 rounded-full border border-green-500/40 flex items-center justify-center">
             <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
