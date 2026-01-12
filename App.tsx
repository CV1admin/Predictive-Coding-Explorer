
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
    tSteps: 20
  });

  const [simState, setSimState] = useState<SimulationState>(() => ({
    layerSizes: LAYER_SIZES,
    weights: MKoneEngine.createWeights(LAYER_SIZES),
    feedbackWeights: MKoneEngine.createFeedbackMatrices(LAYER_SIZES),
    rStatesFree: LAYER_SIZES.map(s => Array(s).fill(0)),
    rStatesNudged: LAYER_SIZES.map(s => Array(s).fill(0)),
    target: Array(LAYER_SIZES[LAYER_SIZES.length - 1]).fill(0),
    currentPhase: 'free',
    errors: [],
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
      rStatesFree: LAYER_SIZES.map(s => Array(s).fill(0)),
      rStatesNudged: LAYER_SIZES.map(s => Array(s).fill(0)),
      history: [],
      step: 0,
      isSimulating: false
    }));
  }, []);

  const runFullCycle = useCallback(() => {
    setSimState(prev => {
      // 1. Inputs and Targets
      const input = Array.from({ length: prev.layerSizes[0] }, (_, i) => 
        Math.sin(prev.step * 0.1 + i * 0.5) * 0.5 + 0.5
      );
      const target = Array.from({ length: prev.layerSizes[prev.layerSizes.length - 1] }, (_, i) => 
        Math.cos(prev.step * 0.05 + i * 1.5) * 0.5 + 0.5
      );

      // 2. Phase 1: Free Equilibrium (Predictive Coding relaxation)
      const rFree = MKoneEngine.runInference(input, prev.rStatesFree, prev.weights, params.etaInfer);

      // 3. Phase 2: Nudged Equilibrium (Equilibrium Propagation)
      const rNudge = MKoneEngine.runInference(input, rFree, prev.weights, params.etaInfer, target, params.betaEp);

      // 4. Feedback Alignment Update
      // Error e = (r_nudge - r_free) at the top layer
      const outputIdx = prev.layerSizes.length - 1;
      const globalError = rNudge[outputIdx].map((val, i) => val - rFree[outputIdx][i]);
      
      const nextW = MKoneEngine.feedbackAlignmentUpdate(
        prev.weights,
        prev.feedbackWeights,
        globalError,
        rFree,
        params.alphaLearn
      );

      // 5. Statistics
      const energy = globalError.reduce((acc, val) => acc + val * val, 0);

      return {
        ...prev,
        weights: nextW,
        rStatesFree: rFree,
        rStatesNudged: rNudge,
        target: target,
        currentPhase: prev.step % 2 === 0 ? 'free' : 'nudged',
        totalError: energy,
        history: [...prev.history.slice(-100), energy],
        step: prev.step + 1
      };
    });
  }, [params]);

  useEffect(() => {
    if (simState.isSimulating) {
      timerRef.current = setInterval(runFullCycle, 150);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [simState.isSimulating, runFullCycle]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-block px-2 py-0.5 rounded text-[10px] bg-indigo-500 text-white font-bold mb-2 uppercase tracking-widest">Unified Framework</div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-500 to-fuchsia-500">
            MKone Unified Learning
          </h1>
          <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
            A hybrid simulation combining <span className="text-sky-400">Predictive Coding</span>, <span className="text-indigo-400">Feedback Alignment</span>, 
            and <span className="text-fuchsia-400">Equilibrium Propagation</span>.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/80 px-4 py-3 rounded-xl border border-slate-800 shadow-xl">
          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase font-mono tracking-tighter">System Step</div>
            <div className="text-xl font-bold font-mono text-indigo-400">{simState.step}</div>
          </div>
          <div className="w-px h-8 bg-slate-800 mx-1"></div>
          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase font-mono tracking-tighter">Phase Gradient</div>
            <div className="text-xl font-bold font-mono text-fuchsia-400">{simState.totalError.toExponential(2)}</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <NetworkVisualizer state={simState} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ErrorChart history={simState.history} />
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full"></div>
              <h4 className="text-xs font-mono text-slate-500 uppercase mb-4 relative z-10">Equilibrium Relaxation</h4>
              <div className="space-y-4 relative z-10">
                {simState.layerSizes.map((size, i) => {
                  const free = simState.rStatesFree[i].reduce((a, b) => a + Math.abs(b), 0) / size;
                  const nudge = simState.rStatesNudged[i].reduce((a, b) => a + Math.abs(b), 0) / size;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-slate-500">
                        <span>L{i} (Dim {size})</span>
                        <span>Δ: {Math.abs(nudge - free).toFixed(4)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${Math.min(100, free * 50)}%` }}></div>
                        <div className="h-full bg-fuchsia-500 opacity-50 transition-all duration-500" style={{ width: `${Math.min(100, Math.abs(nudge-free) * 100)}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <CodeExplainer />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <ControlPanel 
            params={params}
            setParams={setParams}
            isSimulating={simState.isSimulating}
            onToggle={() => setSimState(s => ({ ...s, isSimulating: !s.isSimulating }))}
            onReset={resetSimulation}
            onStep={runFullCycle}
          />

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl">
            <h3 className="text-xs font-mono text-slate-500 uppercase mb-4 tracking-wider">MKone Architecture</h3>
            <div className="space-y-4">
              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                <p className="text-xs font-bold text-sky-400 mb-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  Inference Phase
                </p>
                <p className="text-[11px] text-slate-500 leading-snug italic">
                  Standard predictive coding. The network relaxes until top-down predictions match bottom-up input.
                </p>
              </div>
              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                <p className="text-xs font-bold text-fuchsia-400 mb-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500"></span>
                  Nudging Phase
                </p>
                <p className="text-[11px] text-slate-500 leading-snug italic">
                  The target (y) pulls the output layer. The shift between free and nudged states creates a contrastive signal.
                </p>
              </div>
              <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                <p className="text-xs font-bold text-indigo-400 mb-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Feedback Alignment
                </p>
                <p className="text-[11px] text-slate-500 leading-snug italic">
                  Weights update using fixed random matrices (B) instead of the true gradient. This is more biologically plausible.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-indigo-900/20 to-fuchsia-900/10 border border-indigo-500/20 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></div>
              </div>
              <span className="text-xs font-bold text-indigo-200">Quantum Field Note</span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-normal">
              Quantum Coupler active. Field state evolving via simulated unitaries. Couplings modulated by layer entropy.
            </p>
          </div>
        </div>
      </div>

      <footer className="mt-20 py-8 border-t border-slate-800 text-center">
        <div className="flex justify-center gap-4 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all">
           {/* Visual separators for tech stack */}
           <div className="text-[10px] font-mono text-slate-500">RAO-BALLARD</div>
           <div className="text-[10px] font-mono text-slate-500">BENGIO-EP</div>
           <div className="text-[10px] font-mono text-slate-500">LILLICRAP-FA</div>
        </div>
        <p className="text-slate-600 text-[10px] uppercase tracking-[0.3em]">
          MKone Unified Framework v2.0 • Neural-Quantum Integration
        </p>
      </footer>
    </div>
  );
};

export default App;
