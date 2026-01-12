
import React from 'react';
import { SimulationState } from '../types';

interface Props {
  state: SimulationState;
}

const NetworkVisualizer: React.FC<Props> = ({ state }) => {
  const { layerSizes, rStatesFree, rStatesNudged, currentPhase, target } = state;
  const width = 800;
  const height = 450;
  const padding = 80;

  const layerSpacing = (width - 2 * padding) / (layerSizes.length - 1);
  const rCurrent = currentPhase === 'free' ? rStatesFree : rStatesNudged;

  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden group">
      {/* Quantum Coupler Aesthetic Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <svg className="w-full h-full">
          <filter id="quantum-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" seed="5" />
            <feDisplacementMap in="SourceGraphic" scale="20" />
          </filter>
          <rect width="100%" height="100%" filter="url(#quantum-noise)" className="animate-pulse fill-indigo-500" />
        </svg>
      </div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
          MKone Unified Framework Visualizer
        </div>
        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter transition-all duration-500 ${
          currentPhase === 'free' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30'
        }`}>
          Phase: {currentPhase}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto mt-4 relative z-10">
        {/* Connection paths */}
        {layerSizes.slice(0, -1).map((_, i) => {
          const x1 = padding + i * layerSpacing;
          const x2 = padding + (i + 1) * layerSpacing;
          return (
            <g key={`path-${i}`}>
              {/* Forward Weights */}
              <line 
                x1={x1} y1={height / 2} 
                x2={x2} y2={height / 2} 
                stroke="#1e293b" 
                strokeWidth="4" 
              />
              {/* Feedback Alignment Path Visual (FA) */}
              <path 
                d={`M ${x2} ${height/2} Q ${(x1+x2)/2} ${height/2 + 60} ${x1} ${height/2}`}
                fill="none"
                stroke="rgba(162, 28, 175, 0.1)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            </g>
          );
        })}

        {/* Layers */}
        {layerSizes.map((size, i) => {
          const x = padding + i * layerSpacing;
          const y = height / 2;
          const nodeRadius = 24;
          
          const activity = rCurrent[i]?.reduce((a, b) => a + Math.abs(b), 0) / (size || 1);
          const color = currentPhase === 'free' ? '56, 189, 248' : '192, 38, 211';
          const nodeFill = `rgba(${color}, ${Math.min(1, activity * 5 + 0.1)})`;
          const nodeStroke = `rgb(${color})`;

          return (
            <g key={`layer-${i}`}>
              <circle 
                cx={x} cy={y} r={nodeRadius} 
                fill={nodeFill} 
                stroke={nodeStroke} 
                strokeWidth="2"
                className="transition-all duration-500"
              />
              
              <text x={x} y={y + 45} className="fill-slate-400 text-[10px] font-bold" textAnchor="middle">Layer {i}</text>
              
              {/* Target Signal Visual (Supervisory) */}
              {i === layerSizes.length - 1 && (
                <g className="animate-bounce">
                  <circle cx={x} cy={y - 80} r={12} fill="none" stroke="#f472b6" strokeWidth="2" strokeDasharray="2 2" />
                  <line x1={x} y1={y - 68} x2={x} y2={y - 25} stroke="#f472b6" strokeWidth="2" strokeDasharray="4 2" />
                  <text x={x} y={y - 100} className="fill-pink-400 text-[10px] font-bold uppercase" textAnchor="middle">Supervisory Target (y)</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      
      <div className="mt-4 flex flex-wrap justify-center gap-6 text-[10px] uppercase font-mono tracking-wider">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-500"></div>
          <span className="text-slate-400">Free Activity (r_free)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-fuchsia-500"></div>
          <span className="text-slate-400">Nudged Activity (r_nudge)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-t border-fuchsia-400 border-dashed"></div>
          <span className="text-slate-400">EP Nudging Force</span>
        </div>
      </div>
    </div>
  );
};

export default NetworkVisualizer;
