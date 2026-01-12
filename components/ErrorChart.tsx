
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  history: number[];
}

const ErrorChart: React.FC<Props> = ({ history }) => {
  const data = history.map((val, i) => ({ step: i, error: val }));

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-64">
      <div className="text-xs font-mono text-slate-500 uppercase mb-4">Total Energy (Prediction Error)</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="step" hide />
          <YAxis scale="log" domain={['auto', 'auto']} hide />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#f8fafc' }}
            itemStyle={{ color: '#0ea5e9' }}
          />
          <Line 
            type="monotone" 
            dataKey="error" 
            stroke="#0ea5e9" 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ErrorChart;
