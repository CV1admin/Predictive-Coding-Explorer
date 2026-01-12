import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PCEngine } from './services/pcEngine';
import { SimulationState, SimParams } from './types';
import NetworkVisualizer from './components/NetworkVisualizer';
import ControlPanel from './components/ControlPanel';
import ErrorChart from './components/ErrorChart';
import CodeExplainer from './components/CodeExplainer';

const LAYER_SIZES = [16, 12, 8, 4]; // Simplified for better visualization

const App: React.FC = () => {
  const [params, setParams] = useState<SimParams>({
    etaInfer: 0.05,
    alphaLearn: 0.001,
    tSteps: 20
  });

  const [simState, setSimState] = useState<SimulationState>({
    layerSizes: LAYER_SIZES,
    weights: PCEngine.createWeights(LAYER_SIZES),
    rStates: PCEngine.createRStates(LAYER_SIZES),
    errors: LAYER_SIZES.slice(0, -1).map(s => Array(s).fill(0)),
    totalError: 0,
    history: [],
    step: 0,
    isSimulating: false
  });

  // Fixed: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> for browser compatibility
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetSimulation = useCallback(() => {
    setSimState({
      layerSizes: LAYER_SIZES,
      weights: PCEngine.createWeights(LAYER_SIZES),
      rStates: PCEngine.createRStates(LAYER_SIZES),
      errors: LAYER_SIZES.slice(0, -1).map(s => Array(s).fill(0)),
      totalError: 0,
      history: [],
      step: 0,
      isSimulating: false
    });
  }, []);

  const runStep = useCallback(() => {
    setSimState(prev => {
      // 1. Generate new sensory input occasionally or keep it constant
      const input = Array.from({ length: prev.layerSizes[0] }, (_, i) => 
        Math.sin(prev.step * 0.1 + i * 0.5) * 0.5 + 0.5
      );

      let currentR = prev.rStates;
      let currentEps = prev.errors;

      // 2. Perform Inference
      for (let i = 0; i < params.tSteps; i++) {
        const result = PCEngine.runInferenceStep(input, currentR, prev.weights, params.etaInfer);
        currentR = result.rStates;
        currentEps = result.errors;
      }

      // 3. Perform Learning
      const nextW = PCEngine.runLearningStep(prev.weights, currentEps, currentR, params.alphaLearn);

      // 4. Calculate total error (Energy)
      const energy = currentEps.reduce((sum, layer) => 
        sum + layer.reduce((lSum, val) => lSum + val * val, 0), 0
      );

      return {
        ...prev,
        weights: nextW,
        rStates: currentR,
        errors: currentEps,
        totalError: energy,
        history: [...prev.history.slice(-100), energy],
        step: prev.step + 1
      };
    });
  }, [params]);

  useEffect(() => {
    if (simState.isSimulating) {
      timerRef.current = setInterval(runStep, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [simState.isSimulating, runStep]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
            Predictive Coding Explorer
          </h1>
          <p className="text-slate-400 mt-2 max-w-2xl">
            Simulate how the brain generates hierarchical models of the world by minimizing 
            the difference between sensory input and internal predictions.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-800">
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Current Step</div>
            <div className="text-xl font-bold font-mono text-sky-400">{simState.step}</div>
          </div>
          <div className="w-px h-8 bg-slate-800 mx-2"></div>
          <div className="text-center">
            <div className="text-[10px] text-slate-500 uppercase font-mono">System Energy</div>
            <div className="text-xl font-bold font-mono text-rose-400">{simState.totalError.toFixed(4)}</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Viz */}
        <div className="lg:col-span-8 space-y-6">
          <NetworkVisualizer state={simState} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ErrorChart history={simState.history} />
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <h4 className="text-xs font-mono text-slate-500 uppercase mb-4">Neural Activity Breakdown</h4>
              <div className="space-y-3">
                {simState.layerSizes.map((size, i) => {
                  const avg = simState.rStates[i].reduce((a, b) => a + Math.abs(b), 0) / size;
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-[10px] font-mono text-slate-500 w-16">Layer {i}</span>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-sky-500 transition-all duration-300"
                          style={{ width: `${Math.min(100, avg * 200)}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{(avg * 10).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <CodeExplainer />
        </div>

        {/* Right Col: Controls */}
        <div className="lg:col-span-4 space-y-6">
          <ControlPanel 
            params={params}
            setParams={setParams}
            isSimulating={simState.isSimulating}
            onToggle={() => setSimState(s => ({ ...s, isSimulating: !s.isSimulating }))}
            onReset={resetSimulation}
            onStep={runStep}
          />

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <h3 className="text-xs font-mono text-slate-500 uppercase mb-4 tracking-wider">How it works</h3>
            <ul className="text-sm text-slate-400 space-y-4">
              <li className="flex gap-3">
                <span className="text-sky-400 font-bold">01.</span>
                <span>Layers generate <strong>top-down predictions</strong> using current weights.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sky-400 font-bold">02.</span>
                <span>Differences between predictions and actual states produce <strong>prediction errors</strong> (ε).</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sky-400 font-bold">03.</span>
                <span><strong>Inference:</strong> Hidden states update to minimize ε locally.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-sky-400 font-bold">04.</span>
                <span><strong>Learning:</strong> Weights adapt slowly to reduce ε over long-term observations.</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs">
            <p className="font-bold mb-1">Theoretical Background</p>
            The Python code provided implements the <strong>Rao & Ballard (1999)</strong> model, which suggests cortex layers form a generative hierarchy. Each layer acts as a 'prior' for the one below it.
          </div>
        </div>
      </div>

      <footer className="mt-20 py-8 border-t border-slate-800 text-center text-slate-600 text-[10px] uppercase tracking-widest">
        Predictive Coding Engine v1.0 • Built with React & Gemini AI
      </footer>
    </div>
  );
};

export default App;