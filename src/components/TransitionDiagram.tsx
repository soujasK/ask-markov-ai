import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  MarkerType,
  Position,
  Handle,
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { MarkovParams } from "@/lib/markovSolver";

function ArcEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  label,
}: EdgeProps) {
  const nodeRadius = 45; // Fixed radius since w-[90px] h-[90px]

  if (source === target) {
    // Self-loop: Create a loop that starts and ends on the top edge of the circle
    // sourceX and sourceY represent the exact center of the node
    const angle1 = -Math.PI / 3;
    const angle2 = (-2 * Math.PI) / 3;

    // Use sourceX and sourceY to calculate the exact starting/ending point on the circumference
    const startX = sourceX + nodeRadius * Math.cos(angle1);
    const startY = sourceY + nodeRadius * Math.sin(angle1);
    
    // We want the arrow head to point to startX, startY. 
    // And start from endX, endY
    const endX = sourceX + nodeRadius * Math.cos(angle2);
    const endY = sourceY + nodeRadius * Math.sin(angle2);
    
    // Control points to drag the curve upwards from the top of the node
    const cp1x = startX + 60;
    const cp1y = startY - 90;
    const cp2x = endX - 60;
    const cp2y = endY - 90;
    
    // Reverse the path so the arrow points correctly
    const edgePath = `M ${endX} ${endY} C ${cp2x} ${cp2y}, ${cp1x} ${cp1y}, ${startX} ${startY}`;
    
    return (
      <>
        <path d={edgePath} stroke={style?.stroke} strokeWidth={style?.strokeWidth} fill="none" markerEnd={markerEnd} className="react-flow__edge-path" />
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${sourceX}px,${sourceY - nodeRadius - 45}px)`,
              background: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
              padding: '2px 6px',
              borderRadius: '6px',
              fontSize: 11,
              fontWeight: 700,
              pointerEvents: 'all',
              border: '1px solid hsl(var(--border))'
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }

  // Normal edge between two different nodes
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist === 0) return null;

  // Midpoint
  const mx = sourceX + dx / 2;
  const my = sourceY + dy / 2;

  // Normal vector (perpendicular to line connecting centers)
  const nx = -dy / dist;
  const ny = dx / dist;
  
  // Curve offset amount
  const curveOffset = 40; 
  
  // Control point for the quadratic bezier
  const cx = mx + nx * curveOffset;
  const cy = my + ny * curveOffset;

  // To make the arrow land perfectly on the circle's edge, we must calculate 
  // the intersection of the bezier curve with the target circle.
  
  // Approximation for smooth landing: 
  // Vector from control point to target
  let tdx = targetX - cx;
  let tdy = targetY - cy;
  let tdist = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
  const targetInsetX = targetX - (tdx / tdist) * (nodeRadius + 4); // +4 for arrowhead size
  const targetInsetY = targetY - (tdy / tdist) * (nodeRadius + 4);

  // Vector from control point to source
  let sdx = sourceX - cx;
  let sdy = sourceY - cy;
  let sdist = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
  const sourceOutsetX = sourceX - (sdx / sdist) * nodeRadius;
  const sourceOutsetY = sourceY - (sdy / sdist) * nodeRadius;

  const edgePath = `M ${sourceOutsetX} ${sourceOutsetY} Q ${cx} ${cy} ${targetInsetX} ${targetInsetY}`;

  // Evaluate Bezier curve at t=0.5 for label position
  const labelX = 0.25 * sourceOutsetX + 0.5 * cx + 0.25 * targetInsetX;
  const labelY = 0.25 * sourceOutsetY + 0.5 * cy + 0.25 * targetInsetY;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            padding: '2px 6px',
            borderRadius: '6px',
            fontSize: 11,
            fontWeight: 700,
            pointerEvents: 'all',
            border: '1px solid hsl(var(--border))'
          }}
          className="nodrag nopan"
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

function StateNode({ data }: { data: { label: string } }) {
  return (
    <div className="w-[90px] h-[90px] rounded-full bg-card border-[3px] border-primary flex items-center justify-center font-bold text-foreground text-center shadow-lg p-2 relative">
      <Handle type="target" position={Position.Top} className="opacity-0 w-full h-full absolute inset-0 cursor-default rounded-full" style={{ border: 'none', background: 'transparent' }} />
      <Handle type="source" position={Position.Bottom} className="opacity-0 w-full h-full absolute inset-0 cursor-default rounded-full" style={{ border: 'none', background: 'transparent' }} />
      <span className="text-[10px] sm:text-xs break-words leading-tight w-full max-h-full overflow-hidden flex items-center justify-center p-1" style={{ wordBreak: 'break-word', hyphens: 'auto' }}>
        {data.label}
      </span>
    </div>
  );
}

const nodeTypes = { state: StateNode };
const edgeTypes = { arc: ArcEdge };

export default function TransitionDiagram({ params }: { params: MarkovParams }) {
  const { states, transition_matrix } = params;
  const n = states.length;

  const nodes: Node[] = useMemo(() => {
    const angleStep = (2 * Math.PI) / Math.max(n, 1);
    const radius = Math.max(140, n * 35);
    return states.map((s, i) => ({
      id: `s-${i}`,
      type: "state",
      position: n === 1 ? { x: 300, y: 300 } : {
        x: 300 + radius * Math.cos(angleStep * i - Math.PI / 2),
        y: 300 + radius * Math.sin(angleStep * i - Math.PI / 2),
      },
      data: { label: s },
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
            type: "arc",
            animated: transition_matrix[i][j] > 0.5,
            markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(220, 70%, 50%)", width: 22, height: 22 },
            style: {
              stroke: i === j ? "hsl(220, 10%, 40%)" : "hsl(220, 70%, 50%)",
              strokeWidth: Math.max(1.5, transition_matrix[i][j] * 3),
            },
          });
        }
      }
    }
    return result;
  }, [transition_matrix, n]);

  const onInit = useCallback(() => {}, []);

  return (
    <div className="w-full h-[500px] rounded-lg border border-border bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={onInit}
        fitView
        proOptions={{ hideAttribution: true }}
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background color="hsl(220, 14%, 88%)" gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
