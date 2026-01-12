
import React from 'react';
import { SimulationState } from '../types';

interface Props {
  state: SimulationState;
}

const NetworkVisualizer: React.FC<Props> = ({ state }) => {
  const { layerSizes, rStatesFree, rStatesNegative, currentPhase, goodness } = state;
  const width = 800;
  const height = 450;
  const padding = 100;

  const layerSpacing = (width - 2 * padding) / (layerSizes.length - 1);
  const rCurrent = currentPhase === 'contrast' ? rStatesNegative : rStatesFree;

  return (
    <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
      {/* Quantum Field Noise Filter */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none">
        <svg className="w-full h-full">
          <filter id="ff-resonance">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" seed={state.step} />
            <feColorMatrix type="saturate" values="2" />
            <feGaussianBlur stdDeviation="2" />
          </filter>
          <rect width="100%" height="100%" filter="url(#ff-resonance)" className="fill-indigo-600" />
        </svg>
      </div>

      <div className="flex justify-between items-center mb-6 relative z-10">
        <div>
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-1">Entanglement State Visualizer</div>
          <div className="text-xs font-bold text-slate-400">MKone v2.5 / Hybrid-Forward</div>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-700 shadow-lg ${
          currentPhase === 'inference' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sky-500/5' : 
          currentPhase === 'nudging' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 shadow-fuchsia-500/5' :
          'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-amber-500/5'
        }`}>
          {currentPhase} Mode
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto relative z-10">
        <defs>
          <radialGradient id="node-glow">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Connection paths */}
        {layerSizes.slice(0, -1).map((_, i) => {
          const x1 = padding + i * layerSpacing;
          const x2 = padding + (i + 1) * layerSpacing;
          const g_val = goodness.pos[i] || 0;
          return (
            <g key={`path-${i}`}>
              {/* Field Coupling */}
              <path 
                d={`M ${x1} ${height/2} C ${(x1+x2)/2} ${height/2 - 40}, ${(x1+x2)/2} ${height/2 + 40}, ${x2} ${height/2}`}
                fill="none"
                stroke={currentPhase === 'contrast' ? '#f59e0b' : '#38bdf8'}
                strokeWidth={1 + g_val * 0.5}
                strokeOpacity={0.1 + g_val * 0.1}
                className="transition-all duration-700"
              />
              <line x1={x1} y1={height / 2} x2={x2} y2={height / 2} stroke="#1e293b" strokeWidth="2" />
            </g>
          );
        })}

        {/* Layers */}
        {layerSizes.map((size, i) => {
          const x = padding + i * layerSpacing;
          const y = height / 2;
          const nodeRadius = 22;
          
          const gPos = goodness.pos[i] || 0;
          const gNeg = goodness.neg[i] || 0;
          
          const activity = rCurrent[i]?.reduce((a, b) => a + Math.abs(b), 0) / (size || 1);
          const colorClass = currentPhase === 'contrast' ? 'text-amber-500' : currentPhase === 'nudging' ? 'text-fuchsia-500' : 'text-sky-500';

          return (
            <g key={`layer-${i}`} className="transition-all duration-700">
              {/* Resonance Halo */}
              <circle 
                cx={x} cy={y} r={nodeRadius + (gPos * 5)} 
                className={colorClass}
                fill="url(#node-glow)" 
              />
              
              {/* Core Node */}
              <circle 
                cx={x} cy={y} r={nodeRadius} 
                fill="#0f172a" 
                stroke="currentColor" 
                strokeWidth="2"
                className={`${colorClass} transition-all duration-700`}
              />

              {/* Activity Indicator Bar inside node */}
              <rect x={x-10} y={y-2} width={20} height={4} rx={2} fill="#1e293b" />
              <rect x={x-10} y={y-2} width={Math.min(20, activity * 40)} height={4} rx={2} fill="currentColor" className={colorClass} />

              <text x={x} y={y + 48} className="fill-slate-500 text-[9px] font-mono uppercase tracking-tighter" textAnchor="middle">Layer {i}</text>
              <text x={x} y={y - 35} className={`text-[8px] font-bold uppercase tracking-tighter transition-all ${colorClass}`} textAnchor="middle">
                {currentPhase === 'contrast' ? `NEG G: ${gNeg.toFixed(1)}` : `POS G: ${gPos.toFixed(1)}`}
              </text>
            </g>
          );
        })}
      </svg>
      
      <div className="mt-6 flex flex-wrap justify-center gap-8 text-[10px] uppercase font-mono tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]"></div>
          <span className="text-slate-400">Coherent Resonance (Goodness)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
          <span className="text-slate-400">Decoherent Contrast (Negative)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-px bg-slate-700"></div>
          <span className="text-slate-500">Field Entanglement</span>
        </div>
      </div>
    </div>
  );
};

export default NetworkVisualizer;
