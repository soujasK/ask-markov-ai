import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  MarkerType,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { MarkovParams } from "@/lib/markovSolver";

function StateNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-5 py-3 rounded-xl bg-card border-2 border-primary/40 glow-primary font-semibold text-foreground text-sm">
      {data.label}
    </div>
  );
}

const nodeTypes = { state: StateNode };

export default function TransitionDiagram({ params }: { params: MarkovParams }) {
  const { states, transition_matrix } = params;
  const n = states.length;

  const nodes: Node[] = useMemo(() => {
    const angleStep = (2 * Math.PI) / n;
    const radius = 120 + n * 30;
    return states.map((s, i) => ({
      id: `s-${i}`,
      type: "state",
      position: {
        x: 250 + radius * Math.cos(angleStep * i - Math.PI / 2),
        y: 200 + radius * Math.sin(angleStep * i - Math.PI / 2),
      },
      data: { label: s },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }));
  }, [states, n]);

  const edges: Edge[] = useMemo(() => {
    const result: Edge[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (transition_matrix[i][j] > 0) {
          result.push({
            id: `e-${i}-${j}`,
            source: `s-${i}`,
            target: `s-${j}`,
            label: transition_matrix[i][j].toFixed(2),
            type: i === j ? "default" : "default",
            animated: transition_matrix[i][j] > 0.5,
            markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(162, 72%, 46%)" },
            style: {
              stroke: i === j ? "hsl(270, 60%, 60%)" : "hsl(162, 72%, 46%)",
              strokeWidth: Math.max(1, transition_matrix[i][j] * 3),
            },
            labelStyle: {
              fill: "hsl(210, 20%, 80%)",
              fontFamily: "JetBrains Mono",
              fontSize: 11,
              fontWeight: 600,
            },
            labelBgStyle: {
              fill: "hsl(220, 18%, 10%)",
              fillOpacity: 0.9,
            },
          });
        }
      }
    }
    return result;
  }, [transition_matrix, n]);

  const onInit = useCallback(() => {}, []);

  return (
    <div className="w-full h-[400px] rounded-lg border border-border bg-card/50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        proOptions={{ hideAttribution: true }}
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background color="hsl(220, 14%, 18%)" gap={20} size={1} />
        <Controls
          showInteractive={false}
          style={{ background: "hsl(220, 18%, 10%)", borderColor: "hsl(220, 14%, 18%)" }}
        />
      </ReactFlow>
    </div>
  );
}
