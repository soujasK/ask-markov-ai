import type { MarkovParams } from "./markovSolver";
import { api } from "./api";

export async function parseQuestionWithAI(question: string): Promise<MarkovParams> {
  console.log("Calling local parse-markov endpoint...");
  
  try {
    const data = await api.post("/parse-markov", { question });
    console.log("Backend response:", data);
    
    if (!data) {
      throw new Error("No data returned from AI parser");
    }
    
    if (data.error) {
      throw new Error(data.error);
    }

  // Validate the response structure
  const { states, transition_matrix, initial_state, steps } = data;
  if (!Array.isArray(states) || !Array.isArray(transition_matrix) || !Array.isArray(initial_state) || typeof steps !== "number") {
    console.error("Invalid AI response structure:", data);
    throw new Error("AI returned invalid parameters");
  }

  return { states, transition_matrix, initial_state, steps };
  } catch (error) {
    console.error("Error in parseQuestionWithAI:", error);
    throw error;
  }
}

/**
 * Simple regex-based parser as fallback.
 */
export function parseQuestionLocally(question: string): MarkovParams | null {
  try {
    const statePatterns = [
      /states?\s*(?:are|can be|:)\s*([A-Z][a-z]+(?:\s*(?:,|or|and)\s*[A-Z][a-z]+)+)/i,
      /(?:be|is)\s+([A-Z][a-z]+)\s+(?:or|and)\s+([A-Z][a-z]+)/i,
    ];

    let states: string[] = [];
    for (const pat of statePatterns) {
      const match = question.match(pat);
      if (match) {
        const raw = match[1] || `${match[1]},${match[2]}`;
        states = raw.split(/\s*(?:,|or|and)\s*/).filter(Boolean).map(s => s.trim());
        break;
      }
    }

    if (states.length < 2) return null;

    const n = states.length;
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const patterns = [
          new RegExp(`${states[i]}\\s*→\\s*${states[j]}\\s*=\\s*([0-9.]+)`, "i"),
          new RegExp(`${states[i]}\\s*->\\s*${states[j]}\\s*=\\s*([0-9.]+)`, "i"),
          new RegExp(`${states[i]}\\s*to\\s*${states[j]}\\s*=\\s*([0-9.]+)`, "i"),
        ];
        for (const p of patterns) {
          const m = question.match(p);
          if (m) {
            matrix[i][j] = parseFloat(m[1]);
            break;
          }
        }
      }
    }

    const initial = Array(n).fill(0);
    const initialPatterns = [
      /(?:today is|starts?\s+(?:in|with|at|as)?)\s+([A-Z][a-z]+)/i,
      /(?:currently|beginning)\s+([A-Z][a-z]+)/i,
    ];
    let foundInitial = false;
    for (const p of initialPatterns) {
      const m = question.match(p);
      if (m) {
        const idx = states.findIndex(s => s.toLowerCase() === m[1].toLowerCase());
        if (idx >= 0) {
          initial[idx] = 1;
          foundInitial = true;
          break;
        }
      }
    }
    if (!foundInitial) initial[0] = 1;

    let steps = 3;
    const stepPatterns = [
      /after\s+(\d+)\s+(?:days?|steps?|periods?|iterations?|times?)/i,
      /(\d+)\s+(?:days?|steps?|periods?|iterations?|times?)\s+(?:later|from now|ahead)/i,
    ];
    for (const p of stepPatterns) {
      const m = question.match(p);
      if (m) {
        steps = parseInt(m[1]);
        break;
      }
    }

    return { states, transition_matrix: matrix, initial_state: initial, steps };
  } catch {
    return null;
  }
}
