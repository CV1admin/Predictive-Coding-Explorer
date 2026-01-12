
export interface SimulationState {
  layerSizes: number[];
  weights: number[][][];
  feedbackWeights: number[][][];
  rStatesFree: number[][]; // Also used as Positive Phase for FF
  rStatesNudged: number[][]; 
  rStatesNegative: number[][]; // Negative Phase for FF
  goodness: { pos: number[]; neg: number[] };
  target: number[];
  currentPhase: 'inference' | 'nudging' | 'contrast';
  totalError: number;
  history: number[];
  step: number;
  isSimulating: boolean;
}

export interface SimParams {
  etaInfer: number;
  alphaLearn: number;
  betaEp: number;
  thetaFF: number; // Threshold for Goodness
  tSteps: number;
}
