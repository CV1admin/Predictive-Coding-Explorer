
import React from 'react';
import { SimParams } from '../types';

interface Props {
  params: SimParams;
  setParams: (p: SimParams) => void;
  isSimulating: boolean;
  onToggle: () => void;
  onReset: () => void;
  onStep: () => void;
}

const ControlPanel: React.FC<Props> = ({ params, setParams, isSimulating, onToggle, onReset, onStep }) => {
  const handleChange = (key: keyof SimParams, val: number) => {
    setParams({ ...params, [key]: val });
  };

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-200">Simulation Controls</h3>
        <div className="flex gap-2">
          <button 
            onClick={onStep}
            disabled={isSimulating}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs rounded transition-colors"
          >
            Step
          </button>
          <button 
            onClick={onReset}
            className="px-3 py-1 bg-slate-800 hover:bg-rose-900/40 text-rose-400 text-xs rounded transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-500 font-mono mb-2">Inference Rate (eta_infer): {params.etaInfer.toFixed(3)}</label>
          <input 
            type="range" min="0.001" max="0.2" step="0.001" 
            value={params.etaInfer} 
            onChange={(e) => handleChange('etaInfer', parseFloat(e.target.value))}
            className="w-full accent-sky-500 bg-slate-800 rounded-lg appearance-none h-2"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 font-mono mb-2">Learning Rate (alpha_learn): {params.alphaLearn.toFixed(4)}</label>
          <input 
            type="range" min="0.0001" max="0.01" step="0.0001" 
            value={params.alphaLearn} 
            onChange={(e) => handleChange('alphaLearn', parseFloat(e.target.value))}
            className="w-full accent-sky-500 bg-slate-800 rounded-lg appearance-none h-2"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 font-mono mb-2">Inference Steps (T_steps): {params.tSteps}</label>
          <input 
            type="range" min="1" max="100" step="1" 
            value={params.tSteps} 
            onChange={(e) => handleChange('tSteps', parseInt(e.target.value))}
            className="w-full accent-sky-500 bg-slate-800 rounded-lg appearance-none h-2"
          />
        </div>
      </div>

      <button 
        onClick={onToggle}
        className={`w-full py-3 rounded-lg font-bold transition-all ${
          isSimulating 
          ? 'bg-rose-500 hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
          : 'bg-sky-500 hover:bg-sky-600 shadow-[0_0_15px_rgba(14,165,233,0.3)]'
        }`}
      >
        {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
      </button>
    </div>
  );
};

export default ControlPanel;
