import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  solveMarkov,
  validateTransitionMatrix,
  EXAMPLE_PROBLEMS,
  type MarkovParams,
  type MarkovResult,
} from "@/lib/markovSolver";
import { parseQuestionWithAI, parseQuestionLocally } from "@/lib/parseQuestion";
import TransitionDiagram from "@/components/TransitionDiagram";
import ProbabilityChart from "@/components/ProbabilityChart";
import MatrixDisplay from "@/components/MatrixDisplay";
import MonteCarloPanel from "@/components/MonteCarloPanel";
import SimulationPanel from "@/components/SimulationPanel";
import ManualInput from "@/components/ManualInput";
import ExportButtons from "@/components/ExportButtons";
import { useToast } from "@/hooks/use-toast";



export default function Index() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<MarkovResult | null>(null);
  const [parsedParams, setParsedParams] = useState<MarkovParams | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"nl" | "manual">("nl");

  const { toast } = useToast();

  const handleSolve = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const params = await parseQuestionWithAI(question);
      const err = validateTransitionMatrix(params.transition_matrix);
      if (err) {
        toast({ title: "Invalid matrix from AI", description: err, variant: "destructive" });
        setLoading(false);
        return;
      }
      setParsedParams(params);
      const res = await solveMarkov(params);
      setResult(res);
    } catch (aiError) {
      console.warn("AI parsing failed, trying local parser:", aiError);
      const params = parseQuestionLocally(question);
      if (!params) {
        toast({
          title: "Could not parse question",
          description: aiError instanceof Error && aiError.message ? aiError.message : "Try using one of the example problems or manual input mode.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      const err = validateTransitionMatrix(params.transition_matrix);
      if (err) {
        toast({ title: "Invalid matrix", description: err, variant: "destructive" });
        setLoading(false);
        return;
      }
      setParsedParams(params);
      const res = await solveMarkov(params);
      setResult(res);
    }
    setLoading(false);
  };

  const handleManualSolve = async (params: MarkovParams) => {
    setLoading(true);
    try {
      setParsedParams(params);
      const res = await solveMarkov(params);
      setResult(res);
    } catch (e) {
      toast({ title: "Solve Failed", description: "Failed to connect to backend", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExample = async (idx: number) => {
    const ex = EXAMPLE_PROBLEMS[idx];
    setQuestion(ex.question);
    setMode("nl");
    setLoading(true);
    try {
      setParsedParams(ex.params);
      const res = await solveMarkov(ex.params);
      setResult(res);
    } catch (e) {
      toast({ title: "Solve Failed", description: "Failed to connect to backend", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getExplanationText = (step: { step: number; title: string; description: string }) => {
    return step.description;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-5xl mx-auto flex items-center justify-between py-4 px-4">
          <div>
            <h1 className="text-lg font-bold">Markov Analyzer</h1>
            <p className="text-xs text-muted-foreground">Statistical State Problem Solver</p>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Hero Section */}
        <section className="text-center space-y-4 py-8">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            Markov Chain Scenario Analyzer
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Input probability questions and observe the Markov chain solution step-by-step
            with interactive graphs and Monte Carlo simulations.
          </p>
        </section>

        {/* Example Problems */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Select a scenario to analyze:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {EXAMPLE_PROBLEMS.map((ex, i) => (
              <button
                key={i}
                onClick={() => handleExample(i)}
                className="text-left p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-all text-xs leading-relaxed"
              >
                <span className="font-semibold text-foreground block mb-1">{ex.label}</span>
                <span className="text-muted-foreground">{ex.question.slice(0, 60)}…</span>
              </button>
            ))}
          </div>
        </section>

        {/* Input Section */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-2">
              <Button
                variant={mode === "nl" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("nl")}
              >
                Text Input
              </Button>
              <Button
                variant={mode === "manual" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("manual")}
              >
                Manual Input
              </Button>
            </div>

            {mode === "nl" ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Example: If today's weather is sunny and the probability of sunny to rainy is 0.3 and sunny to sunny is 0.7, what is the probability it rains after 2 days?"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  rows={3}
                  className="resize-none bg-muted/50 border-border focus:ring-primary/30 text-sm"
                />
                <div className="flex items-center gap-3">
                  <Button onClick={handleSolve} disabled={loading || !question.trim()}>
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        Solving...
                      </>
                    ) : (
                      "Analyze Scenario"
                    )}
                  </Button>


                </div>
              </div>
            ) : (
              <ManualInput onSolve={handleManualSolve} />
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {result && parsedParams && (
          <section className="space-y-6">
            {/* Export */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                Results
              </h3>
              <ExportButtons params={parsedParams} result={result} />
            </div>

            <Tabs defaultValue="steps" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-secondary">
                <TabsTrigger value="steps" className="text-xs">
                  Steps
                </TabsTrigger>
                <TabsTrigger value="matrix" className="text-xs">
                  Matrix
                </TabsTrigger>
                <TabsTrigger value="graph" className="text-xs">
                  Graph
                </TabsTrigger>
                <TabsTrigger value="chart" className="text-xs">
                  Chart
                </TabsTrigger>
                <TabsTrigger value="simulation" className="text-xs">
                  Simulate
                </TabsTrigger>
              </TabsList>

              {/* Step-by-Step */}
              <TabsContent value="steps" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Step-by-Step Solution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.stepByStep.map(step => (
                      <div key={step.step} className="flex gap-3">
                        <div className="step-indicator shrink-0 mt-0.5">{step.step}</div>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{step.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {getExplanationText(step)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Matrix */}
              <TabsContent value="matrix" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Transition Matrix</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MatrixDisplay result={result} />

                    {/* Probability Evolution Table */}
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-foreground mb-2">Probability at Each Step</h4>
                      <div className="overflow-x-auto">
                        <table className="border-collapse">
                          <thead>
                            <tr>
                              <th className="matrix-cell bg-secondary/50 text-muted-foreground text-xs">Step</th>
                              {parsedParams.states.map(s => (
                                <th key={s} className="matrix-cell bg-secondary/50 text-primary text-xs">{s}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.probabilityEvolution.map((dist, i) => (
                              <tr key={i}>
                                <td className="matrix-cell text-xs font-semibold">{i}</td>
                                {dist.map((v, j) => (
                                  <td key={j} className="matrix-cell text-xs">{v.toFixed(4)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Graph */}
              <TabsContent value="graph" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">State Transition Diagram</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TransitionDiagram params={parsedParams} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Chart */}
              <TabsContent value="chart" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Probability Evolution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div data-chart="probability">
                      <ProbabilityChart result={result} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Simulation */}
              <TabsContent value="simulation" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Simulation Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div data-chart="simulation">
                      <SimulationPanel params={parsedParams} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Monte Carlo Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MonteCarloPanel params={parsedParams} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>
        )}
      </main>
    </div>
  );
}
