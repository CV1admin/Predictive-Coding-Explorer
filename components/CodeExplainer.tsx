
import React, { useState } from 'react';
import { explainPredictiveCoding } from '../services/geminiService';

const CodeExplainer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const handleExplain = async (topic: string) => {
    setLoading(true);
    try {
      const prompt = `Explain the following neural network concept in the context of unified learning frameworks: "${topic}". Focus on how it avoids standard backpropagation.`;
      const result = await explainPredictiveCoding(prompt);
      setExplanation(result || "No explanation received.");
    } catch (e) {
      setExplanation("Failed to fetch explanation. Check API key.");
    } finally {
      setLoading(false);
    }
  };

  const topics = [
    "Forward-Forward Algorithm",
    "Positive vs Negative Phases",
    "Local Goodness Metric",
    "Contrastive Learning",
    "Biological Plausibility",
    "Equilibrium Propagation"
  ];

  return (
    <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 mt-8 shadow-inner relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <svg className="w-24 h-24" viewBox="0 0 100 100">
           <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="2" strokeDasharray="10 5" className="animate-spin-slow" />
        </svg>
      </div>

      <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-3">
        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
        Theoretical Field Assistant
      </h3>
      
      <div className="flex flex-wrap gap-2 mb-8">
        {topics.map(t => (
          <button 
            key={t}
            onClick={() => handleExplain(t)}
            disabled={loading}
            className="px-4 py-2 bg-slate-950/50 hover:bg-amber-900/20 text-slate-400 border border-slate-800 hover:border-amber-500/50 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {t}
          </button>
        ))}
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-3 bg-slate-800 rounded-full w-3/4"></div>
          <div className="h-3 bg-slate-800 rounded-full w-1/2"></div>
          <div className="h-3 bg-slate-800 rounded-full w-5/6"></div>
        </div>
      ) : explanation ? (
        <div className="text-xs text-slate-400 leading-relaxed bg-slate-950/80 p-6 rounded-2xl border border-slate-800/50 shadow-2xl">
          <p className="mb-4 text-[10px] uppercase font-mono text-amber-500 font-bold tracking-[0.2em]">Framework insight:</p>
          {explanation}
        </div>
      ) : (
        <div className="text-[10px] text-slate-500 italic uppercase tracking-widest font-mono">Select a field topic for AI-driven quantum inference...</div>
      )}
    </div>
  );
};

export default CodeExplainer;
