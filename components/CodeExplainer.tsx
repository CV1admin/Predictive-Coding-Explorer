
import React, { useState } from 'react';
import { explainPredictiveCoding } from '../services/geminiService';

const CodeExplainer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const handleExplain = async (topic: string) => {
    setLoading(true);
    try {
      const prompt = `Explain the following predictive coding concept in the context of neural networks: "${topic}". Use simple but precise terms.`;
      const result = await explainPredictiveCoding(prompt);
      setExplanation(result || "No explanation received.");
    } catch (e) {
      setExplanation("Failed to fetch explanation. Check API key.");
    } finally {
      setLoading(false);
    }
  };

  const topics = [
    "Hierarchical Inference",
    "Hebbian Learning Rule",
    "Energy Minimization",
    "Top-down vs Bottom-up signals"
  ];

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 mt-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
        AI Neuroscience Assistant
      </h3>
      <div className="flex flex-wrap gap-2 mb-6">
        {topics.map(t => (
          <button 
            key={t}
            onClick={() => handleExplain(t)}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-purple-900/40 text-slate-300 border border-slate-700 hover:border-purple-500/50 rounded-full text-xs transition-all disabled:opacity-50"
          >
            {t}
          </button>
        ))}
      </div>
      
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-slate-800 rounded w-3/4"></div>
          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
        </div>
      ) : explanation ? (
        <div className="text-sm text-slate-400 leading-relaxed bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
          {explanation}
        </div>
      ) : (
        <div className="text-xs text-slate-500 italic">Select a topic to get an AI-powered explanation of the math.</div>
      )}
    </div>
  );
};

export default CodeExplainer;
