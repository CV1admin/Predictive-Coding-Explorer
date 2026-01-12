
const tanh = (x: number) => Math.tanh(x);
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

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
    return layerSizes.slice(0, -1).map((size, i) => {
      const currentDim = layerSizes[i+1];
      const outputDim = layerSizes[layerSizes.length - 1];
      return Array.from({ length: currentDim }, () =>
        Array.from({ length: outputDim }, () => (Math.random() - 0.5) * 0.1)
      );
    });
  }

  static forward(x: number[], W: number[][]): { y: number[]; goodness: number } {
    const y = W.map(row => tanh(row.reduce((acc, val, i) => acc + val * x[i], 0)));
    const goodness = y.reduce((acc, val) => acc + val * val, 0);
    return { y, goodness };
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

    for (let l = 0; l < weights.length; l++) {
      const { y: pred } = this.forward(nextR[l], weights[l]);
      if (l < weights.length - 1) {
        const error = nextR[l + 1].map((val, i) => val - pred[i]);
        nextR[l + 1] = nextR[l + 1].map((val, i) => val - eta * error[i]);
      } else if (target && beta !== undefined) {
        nextR[l + 1] = nextR[l + 1].map((val, i) => val + beta * (target[i] - val));
      }
    }
    return nextR;
  }

  static ffUpdate(
    weights: number[][][],
    xPos: number[][], // Activations for Positive Phase
    xNeg: number[][], // Activations for Negative Phase
    theta: number,
    alpha: number
  ): number[][][] {
    return weights.map((layerW, l) => {
      const pos_in = xPos[l];
      const neg_in = xNeg[l];
      const { y: pos_out, goodness: g_pos } = this.forward(pos_in, layerW);
      const { y: neg_out, goodness: g_neg } = this.forward(neg_in, layerW);

      // FF Loss Gradient Proxy: Contrastive local update
      // Logic: increase weights for pos if goodness < theta, decrease for neg if goodness > theta
      const contrast = sigmoid(g_pos - theta) - sigmoid(g_neg - theta);
      
      return layerW.map((row, i) => 
        row.map((val, j) => {
          // Local Hebbian-style update modulated by global goodness contrast
          const delta = (pos_out[i] * pos_in[j] - neg_out[i] * neg_in[j]);
          return val + alpha * contrast * delta;
        })
      );
    });
  }

  static feedbackAlignmentUpdate(
    weights: number[][][],
    B: number[][][],
    e: number[],
    rStates: number[][],
    alpha: number
  ): number[][][] {
    return weights.map((layerW, l) => {
      const h_curr = rStates[l];
      const h_next = rStates[l+1];
      const feedback = B[l];
      const delta = h_next.map((val, i) => {
        const fb_signal = feedback[i].reduce((acc, b_val, j) => acc + b_val * e[j], 0);
        return fb_signal * (1 - val * val);
      });
      return layerW.map((row, i) => 
        row.map((val, j) => val + alpha * delta[i] * h_curr[j])
      );
    });
  }
}
