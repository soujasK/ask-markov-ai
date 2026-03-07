import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { runSimulationOverTime, type MarkovParams } from "@/lib/markovSolver";

const COLORS = [
  "hsl(162, 72%, 46%)",
  "hsl(270, 60%, 60%)",
  "hsl(40, 90%, 60%)",
  "hsl(0, 72%, 55%)",
  "hsl(200, 70%, 55%)",
  "hsl(330, 70%, 55%)",
];

const STEP_OPTIONS = [10, 100, 1000];

export default function SimulationPanel({ params }: { params: MarkovParams }) {
  const [simSteps, setSimSteps] = useState<number | null>(null);
  const [simData, setSimData] = useState<Record<string, number>[] | null>(null);
  const [loading, setLoading] = useState(false);

  const runSim = (steps: number) => {
    setLoading(true);
    setSimSteps(steps);
    setTimeout(() => {
      const results = runSimulationOverTime(params, steps);
      const chartData = results.map(r => {
        const point: Record<string, number> = { step: r.step };
        params.states.forEach((s, i) => {
          point[s] = parseFloat((r.distribution[i] * 100).toFixed(2));
        });
        return point;
      });
      setSimData(chartData);
      setLoading(false);
    }, 50);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Simulate:</span>
        {STEP_OPTIONS.map(s => (
          <Button
            key={s}
            variant={simSteps === s ? "default" : "outline"}
            size="sm"
            onClick={() => runSim(s)}
            disabled={loading}
            className="gap-1"
          >
            <Play className="w-3 h-3" />
            {s} steps
          </Button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Running simulation...
        </div>
      )}

      {simData && !loading && (
        <div className="w-full h-[350px] animate-fade-in-up">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis
                dataKey="step"
                label={{ value: "Step", position: "insideBottom", offset: -5, fill: "hsl(215, 12%, 50%)" }}
                tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 12 }}
                stroke="hsl(220, 14%, 18%)"
              />
              <YAxis
                label={{ value: "Probability (%)", angle: -90, position: "insideLeft", fill: "hsl(215, 12%, 50%)" }}
                tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 12 }}
                stroke="hsl(220, 14%, 18%)"
                domain={[0, 100]}
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
              {params.states.map((s, i) => (
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
