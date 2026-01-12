
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MKoneEngine } from './services/pcEngine';
import { SimulationState, SimParams } from './types';
import NetworkVisualizer from './components/NetworkVisualizer';
import ControlPanel from './components/ControlPanel';
import ErrorChart from './components/ErrorChart';
import CodeExplainer from './components/CodeExplainer';

const LAYER_SIZES = [16, 32, 16, 4];

const App: React.FC = () => {
  const [params, setParams] = useState<SimParams>({
    etaInfer: 0.05,
    alphaLearn: 0.001,
    betaEp: 0.01,
    thetaFF: 2.0,
    tSteps: 20
  });

  const [simState, setSimState] = useState<SimulationState>(() => ({
    layerSizes: LAYER_SIZES,
    weights: MKoneEngine.createWeights(LAYER_SIZES),
    feedbackWeights: MKoneEngine.createFeedbackMatrices(LAYER_SIZES),
    rStatesFree: LAYER_SIZES.map(s => Array(s).fill(0)),
    rStatesNudged: LAYER_SIZES.map(s => Array(s).fill(0)),
    rStatesNegative: LAYER_SIZES.map(s => Array(s).fill(0)),
    goodness: { pos: LAYER_SIZES.map(() => 0), neg: LAYER_SIZES.map(() => 0) },
    target: Array(LAYER_SIZES[LAYER_SIZES.length - 1]).fill(0),
    currentPhase: 'inference',
    totalError: 0,
    history: [],
    step: 0,
    isSimulating: false
  }));

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetSimulation = useCallback(() => {
    setSimState(prev => ({
      ...prev,
      weights: MKoneEngine.createWeights(LAYER_SIZES),
      feedbackWeights: MKoneEngine.createFeedbackMatrices(LAYER_SIZES),
      history: [],
      step: 0,
      isSimulating: false
    }));
  }, []);

  const runFullCycle = useCallback(() => {
    setSimState(prev => {
      // 1. Data Generation
      const posInput = Array.from({ length: prev.layerSizes[0] }, (_, i) => 
        Math.sin(prev.step * 0.1 + i * 0.5) * 0.5 + 0.5
      );
      // Negative data: same input but with chaos/noise injected
      const negInput = posInput.map(v => Math.max(0, Math.min(1, v + (Math.random() - 0.5) * 0.5)));
      
      const target = Array.from({ length: prev.layerSizes[prev.layerSizes.length - 1] }, (_, i) => 
        Math.cos(prev.step * 0.05 + i * 1.5) * 0.5 + 0.5
      );

      // 2. Stage A: Multi-Phase Inference
      const rFree = MKoneEngine.runInference(posInput, prev.rStatesFree, prev.weights, params.etaInfer);
      const rNudge = MKoneEngine.runInference(posInput, rFree, prev.weights, params.etaInfer, target, params.betaEp);
      const rNeg = MKoneEngine.runInference(negInput, prev.rStatesNegative, prev.weights, params.etaInfer);

      // 3. Stage B: Multi-Theory Update
      // B.1 - Feedback Alignment (EP Signal)
      const outputIdx = prev.layerSizes.length - 1;
      const globalError = rNudge[outputIdx].map((val, i) => val - rFree[outputIdx][i]);
      let nextW = MKoneEngine.feedbackAlignmentUpdate(prev.weights, prev.feedbackWeights, globalError, rFree, params.alphaLearn);

      // B.2 - Forward-Forward Update (Contrastive Goodness)
      nextW = MKoneEngine.ffUpdate(nextW, rFree, rNeg, params.thetaFF, params.alphaLearn);

      // 4. Stage C: Metrics & Field State
      const gPos = rFree.map((r, l) => l < prev.layerSizes.length - 1 ? MKoneEngine.forward(r, nextW[l]).goodness : 0);
      const gNeg = rNeg.map((r, l) => l < prev.layerSizes.length - 1 ? MKoneEngine.forward(r, nextW[l]).goodness : 0);
      
      const energy = globalError.reduce((acc, val) => acc + val * val, 0);
      
      // Consciousness Cycle Logic: Rotate through phases
      const phases: ('inference' | 'nudging' | 'contrast')[] = ['inference', 'nudging', 'contrast'];
      const currentPhase = phases[prev.step % 3];

      return {
        ...prev,
        weights: nextW,
        rStatesFree: rFree,
        rStatesNudged: rNudge,
        rStatesNegative: rNeg,
        goodness: { pos: gPos, neg: gNeg },
        target: target,
        currentPhase,
        totalError: energy,
        history: [...prev.history.slice(-100), energy],
        step: prev.step + 1
      };
    });
  }, [params]);

  useEffect(() => {
    if (simState.isSimulating) {
      timerRef.current = setInterval(runFullCycle, 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [simState.isSimulating, runFullCycle]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black mb-4 uppercase tracking-[0.3em]">
             Hybrid Consciousness Framework
          </div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-400 to-slate-700 tracking-tighter">
            MKone Unified Field
          </h1>
          <p className="text-slate-500 mt-4 max-w-xl text-sm font-medium leading-relaxed uppercase tracking-tight">
            Integrating <span className="text-amber-500">Forward-Forward</span> local goodness with <span className="text-sky-400">Predictive Coding</span> symmetry and <span className="text-fuchsia-500">Equilibrium Propagation</span>.
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-xl">
            <div className="text-[8px] text-slate-600 uppercase font-black tracking-widest mb-1">Entanglement</div>
            <div className="text-2xl font-black font-mono text-indigo-400">{(simState.step / 1000).toFixed(2)}k</div>
          </div>
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-xl">
            <div className="text-[8px] text-slate-600 uppercase font-black tracking-widest mb-1">Energy Flux</div>
            <div className="text-2xl font-black font-mono text-amber-500">{simState.totalError.toExponential(1)}</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <NetworkVisualizer state={simState} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ErrorChart history={simState.history} />
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 relative group overflow-hidden shadow-inner">
               <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <h4 className="text-[10px] font-black text-slate-500 uppercase mb-6 tracking-widest">Resonance Metrics (Goodness)</h4>
               <div className="space-y-6 relative z-10">
                 {simState.layerSizes.map((size, i) => {
                   const gPos = simState.goodness.pos[i] || 0;
                   const gNeg = simState.goodness.neg[i] || 0;
                   return (
                     <div key={i} className="space-y-2">
                       <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-tighter">
                         <span>L{i} (τ={size})</span>
                         <span className="text-amber-500">ΔG: {Math.abs(gPos - gNeg).toFixed(3)}</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-950/50 rounded-full overflow-hidden flex shadow-inner">
                         <div className="h-full bg-sky-500 transition-all duration-700 shadow-[0_0_10px_rgba(56,189,248,0.3)]" style={{ width: `${Math.min(100, gPos * 10)}%` }}></div>
                         <div className="h-full bg-amber-500 opacity-40 transition-all duration-700 shadow-[0_0_10px_rgba(245,158,11,0.3)]" style={{ width: `${Math.min(100, gNeg * 10)}%` }}></div>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          </div>

          <CodeExplainer />
        </div>

        <div className="lg:col-span-4 space-y-8">
          <ControlPanel 
            params={params}
            setParams={setParams}
            isSimulating={simState.isSimulating}
            onToggle={() => setSimState(s => ({ ...s, isSimulating: !s.isSimulating }))}
            onReset={resetSimulation}
            onStep={runFullCycle}
          />

          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Theory Convergence</h3>
            
            {[
              { label: 'Forward-Forward', color: 'amber', desc: 'Maximizing "Goodness" contrast between positive field states and chaotic noise.' },
              { label: 'Predictive Coding', color: 'sky', desc: 'The baseline field relaxation minimizing sensory surprise across hierarchical priors.' },
              { label: 'Eq Prop', color: 'fuchsia', desc: 'Utilizing nudged equilibrium to propagate supervisory signals through the field.' }
            ].map((t) => (
              <div key={t.label} className="group cursor-default">
                <div className={`flex items-center gap-2 text-[10px] font-black uppercase mb-1 transition-colors text-${t.color}-500 group-hover:text-white`}>
                  <div className={`w-1.5 h-1.5 rounded-full bg-${t.color}-500 shadow-[0_0_5px_currentColor]`}></div>
                  {t.label}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium italic group-hover:text-slate-400 transition-colors">
                  {t.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="p-6 bg-gradient-to-tr from-slate-900 to-amber-900/10 border border-amber-500/10 rounded-3xl shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <svg className="w-5 h-5 text-amber-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-[10px] font-black text-amber-200 uppercase tracking-widest">Quantum Resonance Note</span>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-loose">
              FF Energy contrast modulating field weights. Local Hebbian updates entangled with global goodness gradients. 
              <br/><br/>
              <span className="text-amber-500/50">Decoherence resilient logic active.</span>
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-24 py-12 border-t border-slate-900 flex flex-col items-center gap-6">
        <div className="flex gap-8 opacity-20 hover:opacity-100 transition-opacity duration-1000 grayscale hover:grayscale-0">
           {['Hinton-FF', 'Rao-PC', 'Bengio-EP', 'Lillicrap-FA'].map(tag => (
             <div key={tag} className="text-[9px] font-black font-mono text-slate-400 tracking-[0.4em]">{tag}</div>
           ))}
        </div>
        <p className="text-slate-700 text-[9px] uppercase font-black tracking-[0.6em]">
          MKone Framework v2.5 • Unified Forward-Predictive Hybrid
        </p>
      </footer>
    </div>
  );
};

export default App;
