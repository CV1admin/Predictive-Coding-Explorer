
const tanh = (x: number) => Math.tanh(x);

export class MKoneEngine {
  static createWeights(layerSizes: number[]): number[][][] {
    return layerSizes.slice(0, -1).map((size, i) => {
      const nextSize = layerSizes[i + 1];
      return Array.from({ length: nextSize }, () =>
        Array.from({ length: size }, () => (Math.random() - 0.5) * 0.1)
      );
    });
  }

  static createFeedbackMatrices(layerSizes: number[]): number[][][] {
    const outputDim = layerSizes[layerSizes.length - 1];
    return layerSizes.slice(0, -1).map((size, i) => {
      const currentDim = layerSizes[i+1];
      // Fixed random B matrix: [currentDim][outputDim]
      return Array.from({ length: currentDim }, () =>
        Array.from({ length: outputDim }, () => (Math.random() - 0.5) * 0.1)
      );
    });
  }

  // Linear pass: y = Wx + b (simplified b=0)
  static forward(x: number[], W: number[][]): number[] {
    return W.map(row => tanh(row.reduce((acc, val, i) => acc + val * x[i], 0)));
  }

  static runInference(
    input: number[],
    rStates: number[][],
    weights: number[][][],
    eta: number,
    target?: number[],
    beta?: number
  ): number[][] {
    const nextR = rStates.map(arr => [...arr]);
    nextR[0] = [...input];

    // Standard Predictive Coding Inference (simplification of Python loop)
    for (let l = 0; l < weights.length; l++) {
      const pred = this.forward(nextR[l], weights[l]);
      // Prediction error logic
      if (l < weights.length - 1) {
        const error = nextR[l + 1].map((val, i) => val - pred[i]);
        // Update r[l+1] based on bottom-up error and top-down prediction
        // This is a simplified version of the Python dR logic
        nextR[l + 1] = nextR[l + 1].map((val, i) => val - eta * error[i]);
      } else if (target && beta !== undefined) {
        // Nudging phase: pull output layer toward target
        nextR[l + 1] = nextR[l + 1].map((val, i) => val + beta * (target[i] - val));
      }
    }
    return nextR;
  }

  static feedbackAlignmentUpdate(
    weights: number[][][],
    B: number[][][],
    e: number[], // global error (r_nudge - r_free at top layer)
    rStates: number[][],
    alpha: number
  ): number[][][] {
    return weights.map((layerW, l) => {
      const h_curr = rStates[l];
      const h_next = rStates[l+1];
      const feedback = B[l]; // [dim_next][dim_output]
      
      // Delta = (B @ e) * (1 - h^2)
      const delta = h_next.map((val, i) => {
        const fb_signal = feedback[i].reduce((acc, b_val, j) => acc + b_val * e[j], 0);
        return fb_signal * (1 - val * val);
      });

      // W.data += alpha * outer(delta, h_curr)
      return layerW.map((row, i) => 
        row.map((val, j) => val + alpha * delta[i] * h_curr[j])
      );
    });
  }
}
