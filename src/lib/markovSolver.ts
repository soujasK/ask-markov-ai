export interface MarkovParams {
  states: string[];
  transition_matrix: number[][];
  initial_state: number[];
  steps: number;
}

export interface MarkovResult {
  params: MarkovParams;
  stepByStep: StepResult[];
  finalDistribution: number[];
  matrixPowers: number[][][];
  probabilityEvolution: number[][];
  steadyState: number[] | null;
}

export interface StepResult {
  step: number;
  title: string;
  description: string;
  data?: unknown;
}

export interface MonteCarloResult {
  simulations: number;
  frequencies: number[];
  theoretical: number[];
  states: string[];
}

function multiplyMatrices(a: number[][], b: number[][]): number[][] {
  const n = a.length;
  const m = b[0].length;
  const p = b.length;
  const result: number[][] = Array.from({ length: n }, () => Array(m).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      for (let k = 0; k < p; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return result;
}

function matrixPower(matrix: number[][], power: number): number[][] {
  const n = matrix.length;
  if (power === 0) {
    return Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
    );
  }
  let result = matrix.map(r => [...r]);
  for (let i = 1; i < power; i++) {
    result = multiplyMatrices(result, matrix);
  }
  return result;
}

function vectorMatrixMultiply(vec: number[], mat: number[][]): number[] {
  const n = mat[0].length;
  const result = Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < vec.length; i++) {
      result[j] += vec[i] * mat[i][j];
    }
  }
  return result;
}

function computeSteadyState(matrix: number[][]): number[] | null {
  try {
    const n = matrix.length;
    // Use power iteration: raise matrix to high power
    const highPower = matrixPower(matrix, 100);
    // Steady state is any row of the high power matrix (they should all converge)
    const steady = highPower[0];
    // Verify convergence: all rows should be similar
    for (let i = 1; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (Math.abs(highPower[i][j] - steady[j]) > 0.001) {
          return null; // Not ergodic
        }
      }
    }
    return steady;
  } catch {
    return null;
  }
}

export function solveMarkov(params: MarkovParams): MarkovResult {
  const { states, transition_matrix, initial_state, steps } = params;

  const stepByStep: StepResult[] = [];
  const matrixPowers: number[][][] = [];
  const probabilityEvolution: number[][] = [initial_state];

  // Step 1
  stepByStep.push({
    step: 1,
    title: "Identify States",
    description: `Identified ${states.length} states: ${states.join(", ")}`,
    data: states,
  });

  // Step 2
  stepByStep.push({
    step: 2,
    title: "Build Transition Matrix",
    description: `Constructed ${states.length}×${states.length} transition matrix T where T[i][j] = P(going from state i to state j)`,
    data: transition_matrix,
  });

  // Step 3
  for (let n = 1; n <= steps; n++) {
    const Tn = matrixPower(transition_matrix, n);
    matrixPowers.push(Tn);
    const dist = vectorMatrixMultiply(initial_state, Tn);
    probabilityEvolution.push(dist);
  }

  stepByStep.push({
    step: 3,
    title: `Calculate Probabilities for ${steps} Steps`,
    description: `Computed T^1 through T^${steps} and multiplied by the initial state vector to get probability distributions at each step`,
    data: matrixPowers,
  });

  // Step 4: Final distribution
  const finalDistribution = probabilityEvolution[probabilityEvolution.length - 1];
  const resultDesc = states
    .map((s, i) => `P(${s}) = ${(finalDistribution[i] * 100).toFixed(2)}%`)
    .join(", ");
  stepByStep.push({
    step: 4,
    title: "Final Probability Distribution",
    description: `After ${steps} steps: ${resultDesc}`,
    data: finalDistribution,
  });

  // Step 5: Steady state
  const steadyState = computeSteadyState(transition_matrix);
  if (steadyState) {
    const steadyDesc = states
      .map((s, i) => `π(${s}) = ${(steadyState[i] * 100).toFixed(2)}%`)
      .join(", ");
    stepByStep.push({
      step: 5,
      title: "Steady State Distribution",
      description: `The long-run equilibrium distribution: ${steadyDesc}`,
      data: steadyState,
    });
  }

  return {
    params,
    stepByStep,
    finalDistribution,
    matrixPowers,
    probabilityEvolution,
    steadyState,
  };
}

export function runMonteCarlo(
  params: MarkovParams,
  numSimulations: number = 10000
): MonteCarloResult {
  const { states, transition_matrix, initial_state, steps } = params;
  const n = states.length;
  const counts = Array(n).fill(0);

  let startState = 0;
  const maxProb = Math.max(...initial_state);
  startState = initial_state.indexOf(maxProb);

  for (let sim = 0; sim < numSimulations; sim++) {
    let currentState = startState;
    for (let step = 0; step < steps; step++) {
      const rand = Math.random();
      let cumProb = 0;
      for (let j = 0; j < n; j++) {
        cumProb += transition_matrix[currentState][j];
        if (rand <= cumProb) {
          currentState = j;
          break;
        }
      }
    }
    counts[currentState]++;
  }

  const frequencies = counts.map(c => c / numSimulations);
  const theoretical = solveMarkov(params).finalDistribution;

  return { simulations: numSimulations, frequencies, theoretical, states };
}

export function runSimulationOverTime(
  params: MarkovParams,
  totalSteps: number
): { step: number; distribution: number[] }[] {
  const { states, transition_matrix, initial_state } = params;
  const n = states.length;
  const results: { step: number; distribution: number[] }[] = [];

  let startState = 0;
  const maxProb = Math.max(...initial_state);
  startState = initial_state.indexOf(maxProb);

  const numSims = 1000;
  const sampleInterval = Math.max(1, Math.floor(totalSteps / 50));

  // Track counts at each sampled step
  const stepCounts = new Map<number, number[]>();
  for (let s = 0; s <= totalSteps; s += sampleInterval) {
    stepCounts.set(s, Array(n).fill(0));
  }
  // Always include the last step
  if (!stepCounts.has(totalSteps)) {
    stepCounts.set(totalSteps, Array(n).fill(0));
  }

  for (let sim = 0; sim < numSims; sim++) {
    let currentState = startState;
    for (let step = 1; step <= totalSteps; step++) {
      const rand = Math.random();
      let cumProb = 0;
      for (let j = 0; j < n; j++) {
        cumProb += transition_matrix[currentState][j];
        if (rand <= cumProb) {
          currentState = j;
          break;
        }
      }
      const counts = stepCounts.get(step);
      if (counts) counts[currentState]++;
    }
  }

  const sortedSteps = Array.from(stepCounts.keys()).sort((a, b) => a - b);
  for (const step of sortedSteps) {
    const counts = stepCounts.get(step)!;
    results.push({
      step,
      distribution: counts.map(c => c / numSims),
    });
  }

  return results;
}

export function validateTransitionMatrix(matrix: number[][]): string | null {
  for (let i = 0; i < matrix.length; i++) {
    const sum = matrix[i].reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1) > 0.001) {
      return `Row ${i + 1} probabilities sum to ${sum.toFixed(4)}, not 1.0`;
    }
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] < 0 || matrix[i][j] > 1) {
        return `Invalid probability ${matrix[i][j]} at position [${i + 1},${j + 1}]`;
      }
    }
  }
  return null;
}

export const EXAMPLE_PROBLEMS = [
  {
    label: "☀️ Weather Prediction",
    question: "If the weather can be Sunny or Rainy with transition probabilities Sunny→Sunny = 0.7, Sunny→Rainy = 0.3, Rainy→Sunny = 0.4, Rainy→Rainy = 0.6 and today is Sunny, what is the probability of Rain after 3 days?",
    params: {
      states: ["Sunny", "Rainy"],
      transition_matrix: [[0.7, 0.3], [0.4, 0.6]],
      initial_state: [1, 0],
      steps: 3,
    },
  },
  {
    label: "📉 Customer Churn",
    question: "A customer can be Active, At-Risk, or Churned. Active→Active=0.7, Active→At-Risk=0.2, Active→Churned=0.1, At-Risk→Active=0.3, At-Risk→At-Risk=0.4, At-Risk→Churned=0.3, Churned→Active=0.05, Churned→At-Risk=0.05, Churned→Churned=0.9. Starting as Active, what's the distribution after 6 months?",
    params: {
      states: ["Active", "At-Risk", "Churned"],
      transition_matrix: [
        [0.7, 0.2, 0.1],
        [0.3, 0.4, 0.3],
        [0.05, 0.05, 0.9],
      ],
      initial_state: [1, 0, 0],
      steps: 6,
    },
  },
  {
    label: "📈 Stock Market",
    question: "A stock can be Bull or Bear. Bull→Bull=0.9, Bull→Bear=0.1, Bear→Bull=0.6, Bear→Bear=0.4. Starting in Bull market, what's the distribution after 10 steps?",
    params: {
      states: ["Bull", "Bear"],
      transition_matrix: [[0.9, 0.1], [0.6, 0.4]],
      initial_state: [1, 0],
      steps: 10,
    },
  },
  {
    label: "🎲 Board Game",
    question: "In a board game, a player can be in Start, Middle, or End zones. Start→Start=0.3, Start→Middle=0.7, Start→End=0.0, Middle→Start=0.1, Middle→Middle=0.4, Middle→End=0.5, End→Start=0.0, End→Middle=0.2, End→End=0.8. Starting at Start, what's the position after 8 turns?",
    params: {
      states: ["Start", "Middle", "End"],
      transition_matrix: [
        [0.3, 0.7, 0.0],
        [0.1, 0.4, 0.5],
        [0.0, 0.2, 0.8],
      ],
      initial_state: [1, 0, 0],
      steps: 8,
    },
  },
];
