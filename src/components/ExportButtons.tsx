import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { MarkovParams, MarkovResult } from "@/lib/markovSolver";

interface Props {
  params: MarkovParams;
  result: MarkovResult;
}

function exportMatrixCSV(params: MarkovParams) {
  const { states, transition_matrix } = params;
  let csv = "," + states.join(",") + "\n";
  for (let i = 0; i < states.length; i++) {
    csv += states[i] + "," + transition_matrix[i].join(",") + "\n";
  }
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transition_matrix.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function exportChartPNG(selector: string, filename: string) {
  const el = document.querySelector(selector);
  if (!el) return;
  const svg = el.querySelector("svg");
  if (!svg) return;

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    ctx!.scale(2, 2);
    ctx!.fillStyle = "hsl(220, 20%, 6%)";
    ctx!.fillRect(0, 0, canvas.width, canvas.height);
    ctx!.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
    });
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

export default function ExportButtons({ params }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportMatrixCSV(params)}
        className="gap-1.5 text-xs"
      >
        <Download className="w-3.5 h-3.5" />
        Matrix CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportChartPNG("[data-chart='probability']", "probability_chart.png")}
        className="gap-1.5 text-xs"
      >
        <Download className="w-3.5 h-3.5" />
        Chart PNG
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportChartPNG("[data-chart='simulation']", "simulation_chart.png")}
        className="gap-1.5 text-xs"
      >
        <Download className="w-3.5 h-3.5" />
        Simulation PNG
      </Button>
    </div>
  );
}
