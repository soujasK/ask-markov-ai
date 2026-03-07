import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Dices } from "lucide-react";
import { runMonteCarlo, type MarkovParams, type MonteCarloResult } from "@/lib/markovSolver";

export default function MonteCarloPanel({ params }: { params: MarkovParams }) {
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [loading, setLoading] = useState(false);

  const run = () => {
    setLoading(true);
    // Use setTimeout so UI updates before heavy computation
    setTimeout(() => {
      const res = runMonteCarlo(params, 10000);
      setResult(res);
      setLoading(false);
    }, 50);
  };

  const data = result
    ? result.states.map((s, i) => ({
        state: s,
        Simulated: parseFloat((result.frequencies[i] * 100).toFixed(2)),
        Theoretical: parseFloat((result.theoretical[i] * 100).toFixed(2)),
      }))
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={run} disabled={loading} className="gap-2">
          <Dices className="w-4 h-4" />
          {loading ? "Running..." : "Run 10,000 Simulations"}
        </Button>
        {result && (
          <span className="text-sm text-muted-foreground font-mono">
            {result.simulations.toLocaleString()} simulations completed
          </span>
        )}
      </div>

      {data && (
        <div className="space-y-4">
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis
                  dataKey="state"
                  tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 12 }}
                  stroke="hsl(220, 14%, 18%)"
                />
                <YAxis
                  label={{ value: "Probability (%)", angle: -90, position: "insideLeft", fill: "hsl(215, 12%, 50%)" }}
                  tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 12 }}
                  stroke="hsl(220, 14%, 18%)"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 18%, 10%)",
                    border: "1px solid hsl(220, 14%, 18%)",
                    borderRadius: "8px",
                    color: "hsl(210, 20%, 92%)",
                    fontFamily: "JetBrains Mono",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value}%`]}
                />
                <Legend wrapperStyle={{ color: "hsl(210, 20%, 80%)", fontSize: 13 }} />
                <Bar dataKey="Simulated" fill="hsl(270, 60%, 60%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Theoretical" fill="hsl(162, 72%, 46%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="border-collapse w-full">
              <thead>
                <tr>
                  <th className="matrix-cell bg-secondary/50 text-muted-foreground">State</th>
                  <th className="matrix-cell bg-secondary/50 text-accent">Simulated</th>
                  <th className="matrix-cell bg-secondary/50 text-primary">Theoretical</th>
                  <th className="matrix-cell bg-secondary/50 text-muted-foreground">Difference</th>
                </tr>
              </thead>
              <tbody>
                {result!.states.map((s, i) => (
                  <tr key={s}>
                    <td className="matrix-cell font-semibold">{s}</td>
                    <td className="matrix-cell">{(result!.frequencies[i] * 100).toFixed(2)}%</td>
                    <td className="matrix-cell">{(result!.theoretical[i] * 100).toFixed(2)}%</td>
                    <td className="matrix-cell">
                      {(Math.abs(result!.frequencies[i] - result!.theoretical[i]) * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
