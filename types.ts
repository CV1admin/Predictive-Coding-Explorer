
export interface SimulationState {
  layerSizes: number[];
  weights: number[][][]; // Forward weights W
  feedbackWeights: number[][][]; // Fixed random feedback matrices B
  rStatesFree: number[][]; // "Free" equilibrium states
  rStatesNudged: number[][]; // "Nudged" equilibrium states
  target: number[]; // Supervisory signal y
  currentPhase: 'free' | 'nudged';
  errors: number[][];
  totalError: number;
  history: number[];
  step: number;
  isSimulating: boolean;
}

export interface SimParams {
  etaInfer: number;
  alphaLearn: number;
  betaEp: number;
  tSteps: number;
}
