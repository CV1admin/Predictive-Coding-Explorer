
export interface SimulationState {
  layerSizes: number[];
  weights: number[][][]; // [layer][row][col]
  rStates: number[][];   // [layer][neuron]
  errors: number[][];    // [layer][neuron]
  totalError: number;
  history: number[];
  step: number;
  isSimulating: boolean;
}

export interface SimParams {
  etaInfer: number;
  alphaLearn: number;
  tSteps: number;
}
