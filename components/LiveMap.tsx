
import React from 'react';
import { TrafficNode } from '../types';

interface LiveMapProps {
  nodes: TrafficNode[];
}

const LiveMap: React.FC<LiveMapProps> = ({ nodes }) => {
  return (
    <div className="relative w-full h-full bg-[#020617] flex items-center justify-center overflow-hidden">
      {/* Background World Map (Stylized Grid) */}
      <svg viewBox="0 0 1000 500" className="w-full h-full opacity-30 pointer-events-none">
        <rect width="1000" height="500" fill="#020617" />
        
        {/* World Outlines (Abstracted) */}
        <path
          fill="none"
          stroke="#1e293b"
          strokeWidth="1.5"
          d="M150,150 L200,100 L300,150 L400,120 L500,180 L600,150 L700,200 L800,150 L900,200 L950,300 L900,400 L800,450 L700,420 L600,450 L500,400 L400,450 L300,400 L200,450 L100,400 L50,300 Z"
        />

        {/* Dynamic Scanlines */}
        {[...Array(40)].map((_, i) => (
          <line key={`v-${i}`} x1={i * 25} y1="0" x2={i * 25} y2="500" stroke="#0f172a" strokeWidth="0.5" />
        ))}
        {[...Array(20)].map((_, i) => (
          <line key={`h-${i}`} x1="0" y1={i * 25} x2="1000" y2={i * 25} stroke="#0f172a" strokeWidth="0.5" />
        ))}
      </svg>

      {/* Nodes and Pings */}
      <div className="absolute inset-0 pointer-events-none">
        {nodes.map((node) => {
          // Map Lat/Lng to X/Y
          const x = ((node.lng + 180) / 360) * 100;
          const y = ((90 - node.lat) / 180) * 100;
          
          return (
            <div 
              key={node.id} 
              className="absolute transition-all duration-700"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="relative group">
                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)] z-20"></div>
                <div className="absolute -inset-2 w-6 h-6 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                
                {/* Visual Label (sampled) */}
                {Math.random() > 0.8 && (
                   <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded text-[7px] font-black text-emerald-500 uppercase tracking-tighter whitespace-nowrap z-30 shadow-2xl">
                     {node.country}
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Crosshair Overlay */}
      <div className="absolute inset-0 border-[40px] border-slate-950/20 pointer-events-none"></div>
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-emerald-500/10"></div>
      <div className="absolute top-0 left-1/2 w-[1px] h-full bg-emerald-500/10"></div>
    </div>
  );
};

export default LiveMap;
