
// Utility for simple matrix math
const tanh = (x: number) => Math.tanh(x);

export class PCEngine {
  static createWeights(layerSizes: number[]): number[][][] {
    return layerSizes.slice(0, -1).map((size, i) => {
      const nextSize = layerSizes[i + 1];
      return Array.from({ length: size }, () =>
        Array.from({ length: nextSize }, () => (Math.random() - 0.5) * 0.1)
      );
    });
  }

  static createRStates(layerSizes: number[]): number[][] {
    return layerSizes.map(size => Array(size).fill(0));
  }

  // Vector subtraction
  static sub(a: number[], b: number[]): number[] {
    return a.map((val, i) => val - (b[i] || 0));
  }

  // Matrix-vector multiplication (y = Wx) where x is from r_states[l+1]
  // In the Python code: pred = f(r_states[l+1] @ W[l].T)
  // This means if r_states[l+1] is (1 x N_next) and W[l] is (N_prev x N_next),
  // then @ W[l].T results in (1 x N_prev).
  static predict(rNext: number[], weightMatrix: number[][]): number[] {
    const prevSize = weightMatrix.length;
    const nextSize = weightMatrix[0].length;
    const pred = Array(prevSize).fill(0);
    for (let i = 0; i < prevSize; i++) {
      let sum = 0;
      for (let j = 0; j < nextSize; j++) {
        sum += rNext[j] * weightMatrix[i][j];
      }
      pred[i] = tanh(sum);
    }
    return pred;
  }

  // r_states[l] += eta_infer * (eps[l-1] @ W[l-1] - eps[l])
  // This is the inference update for hidden layers
  static updateHidden(
    r: number[], 
    epsPrev: number[], 
    wPrev: number[][], 
    epsCurrent: number[], 
    eta: number
  ): number[] {
    const size = r.length;
    const nextSize = epsPrev ? 0 : 0; // placeholder logic check
    
    // Part 1: eps[l-1] @ W[l-1]
    // Python: eps[l-1] @ W[l-1] -> (1 x N_prev) @ (N_prev x N_curr) = (1 x N_curr)
    const topDownInfluence = Array(size).fill(0);
    if (epsPrev && wPrev) {
      for (let j = 0; j < size; j++) {
        let sum = 0;
        for (let i = 0; i < epsPrev.length; i++) {
          sum += epsPrev[i] * wPrev[i][j];
        }
        topDownInfluence[j] = sum;
      }
    }

    return r.map((val, i) => val + eta * (topDownInfluence[i] - epsCurrent[i]));
  }

  static calculateErrors(rStates: number[][], weights: number[][][]): number[][] {
    const eps: number[][] = [];
    for (let l = 0; l < weights.length; l++) {
      const prediction = this.predict(rStates[l + 1], weights[l]);
      eps.push(this.sub(rStates[l], prediction));
    }
    return eps;
  }

  static runInferenceStep(
    input: number[],
    rStates: number[][],
    weights: number[][][],
    eta: number
  ): { rStates: number[][]; errors: number[][] } {
    const nextR = rStates.map(arr => [...arr]);
    nextR[0] = [...input]; // Fix input

    // 1. Calculate errors
    const eps = this.calculateErrors(nextR, weights);

    // 2. Update hidden representations (skip input and top-most layer)
    for (let l = 1; l < nextR.length - 1; l++) {
      nextR[l] = this.updateHidden(
        nextR[l],
        eps[l - 1],
        weights[l - 1],
        eps[l],
        eta
      );
    }

    return { rStates: nextR, errors: eps };
  }

  static runLearningStep(
    weights: number[][][],
    eps: number[][],
    rStates: number[][],
    alpha: number
  ): number[][][] {
    const nextW = weights.map(layer => layer.map(row => [...row]));
    for (let l = 0; l < weights.length; l++) {
      const layerEps = eps[l];
      const rNext = rStates[l + 1];
      for (let i = 0; i < layerEps.length; i++) {
        for (let j = 0; j < rNext.length; j++) {
          nextW[l][i][j] += alpha * layerEps[i] * rNext[j];
        }
      }
    }
    return nextW;
  }
}
