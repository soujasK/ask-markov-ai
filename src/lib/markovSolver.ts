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

import { api } from "./api";

export async function solveMarkov(params: MarkovParams): Promise<MarkovResult> {
  const data = await api.post("/solve-markov", params);
  return data as MarkovResult;
}

export async function runMonteCarlo(
  params: MarkovParams,
  numSimulations: number = 10000
): Promise<MonteCarloResult> {
  const data = await api.post("/run-monte-carlo", {
    params,
    numSimulations,
  });
  return data as MonteCarloResult;
}

export async function runSimulationOverTime(
  params: MarkovParams,
  totalSteps: number
): Promise<{ step: number; distribution: number[] }[]> {
  const data = await api.post("/simulation-over-time", {
    params,
    totalSteps,
  });
  return data as { step: number; distribution: number[] }[];
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
    label: "Weather Prediction",
    question: "If the weather can be Sunny or Rainy with transition probabilities Sunny→Sunny = 0.7, Sunny→Rainy = 0.3, Rainy→Sunny = 0.4, Rainy→Rainy = 0.6 and today is Sunny, what is the probability of Rain after 3 days?",
    params: {
      states: ["Sunny", "Rainy"],
      transition_matrix: [[0.7, 0.3], [0.4, 0.6]],
      initial_state: [1, 0],
      steps: 3,
    },
  },
  {
    label: "Customer Churn",
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
    label: "Stock Market",
    question: "A stock can be Bull or Bear. Bull→Bull=0.9, Bull→Bear=0.1, Bear→Bull=0.6, Bear→Bear=0.4. Starting in Bull market, what's the distribution after 10 steps?",
    params: {
      states: ["Bull", "Bear"],
      transition_matrix: [[0.9, 0.1], [0.6, 0.4]],
      initial_state: [1, 0],
      steps: 10,
    },
  },
  {
    label: "Board Game",
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
  {
    label: "Drunkard's Walk",
    question: "A drunk man is trying to cross a bridge 5 feet wide. Let states 0 to 5 be his position from the left side, where 0 and 5 mean he fell in the river. From states 1, 2, 3, 4, he steps left with probability 0.5 or right with probability 0.5. Starting at state 2, where is he after 5 steps?",
    params: {
      states: ["0 (Left River)", "1", "2", "3", "4", "5 (Right River)"],
      transition_matrix: [
        [1, 0, 0, 0, 0, 0],
        [0.5, 0, 0.5, 0, 0, 0],
        [0, 0.5, 0, 0.5, 0, 0],
        [0, 0, 0.5, 0, 0.5, 0],
        [0, 0, 0, 0.5, 0, 0.5],
        [0, 0, 0, 0, 0, 1]
      ],
      initial_state: [0, 0, 1, 0, 0, 0],
      steps: 5,
    },
  },
  {
    label: "Mumbai Weather",
    question: "Weather conditions at Mumbai can be Pleasant, Bad, or Fair. The transition probability from Pleasant is [0.5, 0.4, 0.1]. From Bad is [0.4, 0.5, 0.1]. From Fair is [0.3, 0.5, 0.2]. If today (Monday) is Bad, what is the probability that Wednesday (after 2 days) is Pleasant?",
    params: {
      states: ["Pleasant", "Bad", "Fair"],
      transition_matrix: [
        [0.5, 0.4, 0.1],
        [0.4, 0.5, 0.1],
        [0.3, 0.5, 0.2],
      ],
      initial_state: [0, 1, 0],
      steps: 2,
    },
  },
  {
    label: "3-State Matrix Dist",
    question: "The transition probability matrix of a Markov Chain with three states 0, 1, 2 is given by rows: [3/4, 1/4, 0], [1/4, 1/2, 1/4], and [0, 3/4, 1/4]. If the initial distribution is [1/3, 1/3, 1/3], find the probability distribution after 2 steps.",
    params: {
      states: ["State 0", "State 1", "State 2"],
      transition_matrix: [
        [0.75, 0.25, 0],
        [0.25, 0.5, 0.25],
        [0, 0.75, 0.25],
      ],
      initial_state: [0.3333, 0.3333, 0.3334],
      steps: 2,
    },
  },
  {
    label: "Forecasting Rain",
    question: "The chance of rain tomorrow depends only on today's weather. If it rains today, it will rain tomorrow with probability 0.7. If it does not rain today, it will rain tomorrow with probability 0.4. Calculate the probability that it will rain 4 days from today given that it is raining today.",
    params: {
      states: ["Rain", "No Rain"],
      transition_matrix: [
        [0.7, 0.3],
        [0.4, 0.6],
      ],
      initial_state: [1, 0],
      steps: 4,
    },
  },
  {
    label: "2-Day Weather Chain",
    question: "Whether it rains depends on the last 2 days. Rain next day probs: 0.7 if rained both days, 0.5 if rained today but not yesterday, 0.4 if rained yesterday but not today, 0.2 if no rain both days. If it rained on Monday and Tuesday (Rained Both), what is the probability it will rain on Thursday (after 2 steps)?",
    params: {
      states: ["Rain Both (RR)", "Rain Today-No Rain Yest (RN)", "No Rain Today-Rain Yest (NR)", "No Rain Both (NN)"],
      transition_matrix: [
        [0.7, 0, 0.3, 0],
        [0.5, 0, 0.5, 0],
        [0, 0.4, 0, 0.6],
        [0, 0.2, 0, 0.8],
      ],
      initial_state: [1, 0, 0, 0],
      steps: 2,
    },
  },
];
