import type { MarkovResult } from "@/lib/markovSolver";

export default function MatrixDisplay({ result }: { result: MarkovResult }) {
  const { params, matrixPowers } = result;

  return (
    <div className="space-y-6">
      {/* Original Matrix */}
      <div>
        <h4 className="font-semibold text-foreground mb-2 text-sm">
          T (Transition Matrix)
        </h4>
        <MatrixTable matrix={params.transition_matrix} states={params.states} />
      </div>

      {/* Matrix Powers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matrixPowers.map((mat, idx) => (
          <div key={idx}>
            <h4 className="font-semibold text-foreground mb-2 text-sm">
              T<sup>{idx + 1}</sup>
            </h4>
            <MatrixTable matrix={mat} states={params.states} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MatrixTable({ matrix, states }: { matrix: number[][]; states: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="matrix-cell bg-secondary/50 text-muted-foreground text-xs" />
            {states.map(s => (
              <th key={s} className="matrix-cell bg-secondary/50 text-primary text-xs font-semibold">
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="matrix-cell bg-secondary/50 text-primary text-xs font-semibold">
                {states[i]}
              </td>
              {row.map((val, j) => (
                <td key={j} className="matrix-cell">
                  {val.toFixed(4)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
