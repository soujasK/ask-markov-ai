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
import type { MarkovResult } from "@/lib/markovSolver";

const COLORS = [
  "hsl(162, 72%, 46%)",
  "hsl(270, 60%, 60%)",
  "hsl(40, 90%, 60%)",
  "hsl(0, 72%, 55%)",
  "hsl(200, 70%, 55%)",
  "hsl(330, 70%, 55%)",
];

export default function ProbabilityChart({ result }: { result: MarkovResult }) {
  const { params, probabilityEvolution } = result;

  const data = probabilityEvolution.map((dist, step) => {
    const point: Record<string, number> = { step };
    params.states.forEach((s, i) => {
      point[s] = parseFloat((dist[i] * 100).toFixed(2));
    });
    return point;
  });

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              dot={{ r: 4, fill: COLORS[i % COLORS.length] }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
