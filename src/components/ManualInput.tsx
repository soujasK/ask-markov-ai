import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus } from "lucide-react";
import type { MarkovParams } from "@/lib/markovSolver";
import { validateTransitionMatrix } from "@/lib/markovSolver";

interface Props {
  onSolve: (params: MarkovParams) => void;
}

export default function ManualInput({ onSolve }: Props) {
  const [states, setStates] = useState<string[]>(["Sunny", "Rainy"]);
  const [matrix, setMatrix] = useState<number[][]>([
    [0.7, 0.3],
    [0.4, 0.6],
  ]);
  const [initialIdx, setInitialIdx] = useState(0);
  const [steps, setSteps] = useState(3);
  const [error, setError] = useState<string | null>(null);

  const n = states.length;

  const addState = () => {
    const newName = `State ${n + 1}`;
    setStates([...states, newName]);
    const newMatrix = matrix.map(row => [...row, 0]);
    newMatrix.push(Array(n + 1).fill(0));
    setMatrix(newMatrix);
  };

  const removeState = () => {
    if (n <= 2) return;
    setStates(states.slice(0, -1));
    setMatrix(matrix.slice(0, -1).map(row => row.slice(0, -1)));
    if (initialIdx >= n - 1) setInitialIdx(0);
  };

  const handleSolve = () => {
    const err = validateTransitionMatrix(matrix);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    const initial = Array(n).fill(0);
    initial[initialIdx] = 1;
    onSolve({ states, transition_matrix: matrix, initial_state: initial, steps });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground">States:</Label>
        <Button variant="outline" size="sm" onClick={addState} className="gap-1 h-7 px-2">
          <Plus className="w-3 h-3" /> Add
        </Button>
        <Button variant="outline" size="sm" onClick={removeState} disabled={n <= 2} className="gap-1 h-7 px-2">
          <Minus className="w-3 h-3" /> Remove
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {states.map((s, i) => (
          <Input
            key={i}
            value={s}
            onChange={e => {
              const ns = [...states];
              ns[i] = e.target.value;
              setStates(ns);
            }}
            className="w-28 h-8 text-sm"
          />
        ))}
      </div>

      <div>
        <Label className="text-sm text-muted-foreground mb-2 block">Transition Matrix:</Label>
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="matrix-cell text-xs" />
                {states.map(s => (
                  <th key={s} className="matrix-cell text-primary text-xs">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i}>
                  <td className="matrix-cell text-primary text-xs font-semibold">{states[i]}</td>
                  {row.map((val, j) => (
                    <td key={j} className="p-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={val}
                        onChange={e => {
                          const nm = matrix.map(r => [...r]);
                          nm[i][j] = parseFloat(e.target.value) || 0;
                          setMatrix(nm);
                        }}
                        className="w-20 h-8 text-sm text-center font-mono"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Initial State:</Label>
          <select
            value={initialIdx}
            onChange={e => setInitialIdx(parseInt(e.target.value))}
            className="h-8 px-2 rounded-md border border-border bg-muted text-sm text-foreground"
          >
            {states.map((s, i) => (
              <option key={i} value={i}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Steps:</Label>
          <Input
            type="number"
            min="1"
            max="100"
            value={steps}
            onChange={e => setSteps(parseInt(e.target.value) || 1)}
            className="w-20 h-8 text-sm text-center"
          />
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button onClick={handleSolve} className="gap-2">
        Solve
      </Button>
    </div>
  );
}
