
import React from 'react';
import { SimulationState } from '../types';

interface Props {
  state: SimulationState;
}

const NetworkVisualizer: React.FC<Props> = ({ state }) => {
  const { layerSizes, rStates, errors } = state;
  const width = 800;
  const height = 400;
  const padding = 50;

  const layerSpacing = (width - 2 * padding) / (layerSizes.length - 1);

  // Normalize values for visualization
  const getMax = (arr: number[][]) => Math.max(...arr.flatMap(a => a.map(Math.abs))) || 1;
  const maxR = getMax(rStates);
  const maxE = getMax(errors);

  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
      <div className="absolute top-4 left-4 text-xs font-mono text-slate-500 uppercase tracking-widest">
        Neural Architecture Visualization
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto mt-4">
        {/* Connection paths */}
        {layerSizes.slice(0, -1).map((_, i) => {
          const x1 = padding + i * layerSpacing;
          const x2 = padding + (i + 1) * layerSpacing;
          return (
            <g key={`path-${i}`}>
              <line 
                x1={x1} y1={height / 2} 
                x2={x2} y2={height / 2} 
                stroke="#1e293b" 
                strokeWidth="4" 
              />
              <text 
                x={(x1 + x2) / 2} 
                y={height / 2 - 20} 
                className="fill-slate-600 text-[10px] italic text-center font-mono"
                textAnchor="middle"
              >
                Weights W[{i}]
              </text>
            </g>
          );
        })}

        {/* Layers */}
        {layerSizes.map((size, i) => {
          const x = padding + i * layerSpacing;
          const y = height / 2;
          const nodeRadius = 25;
          
          // Activity color
          const avgActivity = rStates[i]?.reduce((a, b) => a + Math.abs(b), 0) / (size || 1);
          const activityColor = `rgba(56, 189, 248, ${Math.min(1, avgActivity / maxR + 0.2)})`;
          
          // Error color
          const avgError = errors[i]?.reduce((a, b) => a + Math.abs(b), 0) / (size || 1);
          const errorColor = `rgba(244, 63, 94, ${Math.min(1, avgError / maxE + 0.1)})`;

          return (
            <g key={`layer-${i}`}>
              {/* Layer Node */}
              <circle 
                cx={x} cy={y} r={nodeRadius} 
                fill={activityColor} 
                stroke="#0ea5e9" 
                strokeWidth="2"
                className="transition-all duration-300"
              />
              
              {/* Error indicator (Ring) */}
              {i < errors.length && (
                <circle 
                  cx={x} cy={y} r={nodeRadius + 10} 
                  fill="none" 
                  stroke={errorColor} 
                  strokeWidth="2" 
                  strokeDasharray="4 2"
                  className="transition-all duration-300"
                />
              )}

              <text 
                x={x} y={y + nodeRadius + 30} 
                className="fill-slate-400 text-[12px] font-bold" 
                textAnchor="middle"
              >
                Layer {i}
              </text>
              <text 
                x={x} y={y + nodeRadius + 45} 
                className="fill-slate-500 text-[10px] font-mono" 
                textAnchor="middle"
              >
                Dim: {size}
              </text>

              {i === 0 && (
                <text x={x} y={y - 40} className="fill-blue-400 text-[10px] font-bold uppercase" textAnchor="middle">
                  Sensory Input
                </text>
              )}
              {i === layerSizes.length - 1 && (
                <text x={x} y={y - 40} className="fill-purple-400 text-[10px] font-bold uppercase" textAnchor="middle">
                  Deep Model
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-4 flex justify-center gap-6 text-[10px] uppercase font-mono tracking-wider">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sky-500"></div>
          <span className="text-slate-400">Activity (r_states)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border border-dashed border-rose-500"></div>
          <span className="text-slate-400">Prediction Error (eps)</span>
        </div>
      </div>
    </div>
  );
};

export default NetworkVisualizer;
