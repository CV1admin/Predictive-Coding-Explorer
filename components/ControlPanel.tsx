
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
    <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-8 shadow-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-200 tracking-tight">System Coupling</h3>
        <div className="flex gap-2">
          <button 
            onClick={onStep}
            disabled={isSimulating}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-[10px] uppercase font-bold rounded-full transition-all border border-slate-700"
          >
            Phase Shift
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="group">
          <div className="flex justify-between mb-3">
            <label className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Goodness Threshold (theta)</label>
            <span className="text-[10px] font-mono text-amber-400 font-bold">{params.thetaFF.toFixed(2)}</span>
          </div>
          <input 
            type="range" min="0.5" max="10" step="0.1" 
            value={params.thetaFF} 
            onChange={(e) => handleChange('thetaFF', parseFloat(e.target.value))}
            className="w-full accent-amber-500 bg-slate-800 rounded-lg appearance-none h-1.5"
          />
        </div>

        <div className="group">
          <div className="flex justify-between mb-3">
            <label className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Field Learning (alpha)</label>
            <span className="text-[10px] font-mono text-sky-400 font-bold">{params.alphaLearn.toFixed(4)}</span>
          </div>
          <input 
            type="range" min="0.0001" max="0.05" step="0.0001" 
            value={params.alphaLearn} 
            onChange={(e) => handleChange('alphaLearn', parseFloat(e.target.value))}
            className="w-full accent-sky-500 bg-slate-800 rounded-lg appearance-none h-1.5"
          />
        </div>

        <div className="group">
          <div className="flex justify-between mb-3">
            <label className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Nudging Beta (EP)</label>
            <span className="text-[10px] font-mono text-fuchsia-400 font-bold">{params.betaEp.toFixed(3)}</span>
          </div>
          <input 
            type="range" min="0.001" max="0.5" step="0.001" 
            value={params.betaEp} 
            onChange={(e) => handleChange('betaEp', parseFloat(e.target.value))}
            className="w-full accent-fuchsia-500 bg-slate-800 rounded-lg appearance-none h-1.5"
          />
        </div>
      </div>

      <div className="pt-4">
        <button 
          onClick={onToggle}
          className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl relative overflow-hidden group/btn ${
            isSimulating 
            ? 'bg-rose-500 text-white shadow-rose-900/40' 
            : 'bg-indigo-600 text-white shadow-indigo-900/40'
          }`}
        >
          <span className="relative z-10">{isSimulating ? 'Collapse Field' : 'Launch MKone'}</span>
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
        </button>
        <button 
            onClick={onReset}
            className="w-full mt-4 py-2 text-[10px] text-slate-600 hover:text-rose-400 uppercase font-bold tracking-widest transition-colors"
          >
            Re-Initialize Weights
          </button>
      </div>
    </div>
  );
};

export default ControlPanel;
