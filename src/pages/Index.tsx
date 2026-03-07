import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain,
  Sparkles,
  ChevronRight,
  Grid3X3,
  LineChart,
  FlaskConical,
  Keyboard,
  ListChecks,
  TrendingUp,
  Dices,
  Download,
} from "lucide-react";
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

type ExplanationMode = "beginner" | "mathematical" | "intuitive";

export default function Index() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<MarkovResult | null>(null);
  const [parsedParams, setParsedParams] = useState<MarkovParams | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"nl" | "manual">("nl");
  const [explanationMode, setExplanationMode] = useState<ExplanationMode>("beginner");
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
      setResult(solveMarkov(params));
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
      setResult(solveMarkov(params));
    }
    setLoading(false);
  };

  const handleManualSolve = (params: MarkovParams) => {
    setParsedParams(params);
    setResult(solveMarkov(params));
  };

  const handleExample = (idx: number) => {
    const ex = EXAMPLE_PROBLEMS[idx];
    setQuestion(ex.question);
    setParsedParams(ex.params);
    setResult(solveMarkov(ex.params));
    setMode("nl");
  };

  const getExplanationText = (step: { step: number; title: string; description: string }) => {
    if (explanationMode === "beginner") {
      const beginnerMap: Record<number, string> = {
        1: `We first figure out what "states" or situations exist in this problem. Here we found: ${parsedParams?.states.join(", ")}. Think of these as the different boxes the system can be in.`,
        2: "Next, we organize all the transition probabilities into a grid (matrix). Each row shows where you can go from that state, and the numbers show how likely each transition is.",
        3: "Now we calculate what happens over multiple steps. It's like asking 'if I flip a coin multiple times following these rules, where will I likely end up?'",
        4: step.description,
        5: "After many, many steps, the system settles into a stable pattern. No matter where you start, you'll eventually spend a predictable fraction of time in each state.",
      };
      return beginnerMap[step.step] || step.description;
    }
    if (explanationMode === "mathematical") {
      const mathMap: Record<number, string> = {
        1: `State space S = {${parsedParams?.states.join(", ")}} with |S| = ${parsedParams?.states.length}`,
        2: `Transition matrix T ∈ ℝ^(n×n) where T[i,j] = P(X_{t+1} = j | X_t = i), ∑_j T[i,j] = 1 ∀i`,
        3: `P(n) = P(0) · T^n, computed via matrix exponentiation for n = 1, ..., ${parsedParams?.steps}`,
        4: step.description,
        5: `Steady state π satisfies πT = π and ∑ π_i = 1. Found via eigenvalue decomposition or power iteration.`,
      };
      return mathMap[step.step] || step.description;
    }
    return step.description;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-5xl mx-auto flex items-center gap-3 py-4 px-4">
          <div className="step-indicator">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">Ask Markov AI</h1>
            <p className="text-xs text-muted-foreground">Explainable Markov Chain Solver</p>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Hero Section */}
        <section className="text-center space-y-4 py-8 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-bold gradient-text leading-tight">
            Learn Markov Chains Visually with AI
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Ask probability questions in plain English and see the Markov chain solution with
            interactive graphs, step-by-step explanations, and Monte Carlo simulations.
          </p>
        </section>

        {/* Example Problems */}
        <section className="space-y-3 animate-fade-in-up">
          <h3 className="text-sm font-semibold text-muted-foreground">Try an example:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {EXAMPLE_PROBLEMS.map((ex, i) => (
              <button
                key={i}
                onClick={() => handleExample(i)}
                className="text-left p-3 rounded-lg border border-border bg-card hover:border-primary/40 hover:glow-primary transition-all text-xs leading-relaxed"
              >
                <span className="font-semibold text-foreground block mb-1">{ex.label}</span>
                <span className="text-muted-foreground">{ex.question.slice(0, 60)}…</span>
              </button>
            ))}
          </div>
        </section>

        {/* Input Section */}
        <Card className="animate-fade-in-up">
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-2">
              <Button
                variant={mode === "nl" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("nl")}
                className="gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" /> Natural Language
              </Button>
              <Button
                variant={mode === "manual" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("manual")}
                className="gap-1"
              >
                <Keyboard className="w-3.5 h-3.5" /> Manual Input
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
                  <Button onClick={handleSolve} disabled={loading || !question.trim()} className="gap-2">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Solving...
                      </>
                    ) : (
                      <>
                        Solve with AI <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                  {/* Explanation Mode */}
                  <select
                    value={explanationMode}
                    onChange={e => setExplanationMode(e.target.value as ExplanationMode)}
                    className="h-9 px-3 rounded-md border border-border bg-muted text-sm text-foreground"
                  >
                    <option value="beginner">🎓 Beginner</option>
                    <option value="mathematical">📐 Mathematical</option>
                    <option value="intuitive">💡 Intuitive</option>
                  </select>
                </div>
              </div>
            ) : (
              <ManualInput onSolve={handleManualSolve} />
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {result && parsedParams && (
          <section className="animate-fade-in-up space-y-6">
            {/* Export */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Results
              </h3>
              <ExportButtons params={parsedParams} result={result} />
            </div>

            <Tabs defaultValue="steps" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-secondary">
                <TabsTrigger value="steps" className="gap-1 text-xs">
                  <ListChecks className="w-3.5 h-3.5" /> Steps
                </TabsTrigger>
                <TabsTrigger value="matrix" className="gap-1 text-xs">
                  <Grid3X3 className="w-3.5 h-3.5" /> Matrix
                </TabsTrigger>
                <TabsTrigger value="graph" className="gap-1 text-xs">
                  <TrendingUp className="w-3.5 h-3.5" /> Graph
                </TabsTrigger>
                <TabsTrigger value="chart" className="gap-1 text-xs">
                  <LineChart className="w-3.5 h-3.5" /> Chart
                </TabsTrigger>
                <TabsTrigger value="simulation" className="gap-1 text-xs">
                  <FlaskConical className="w-3.5 h-3.5" /> Simulate
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
                      <div key={step.step} className="flex gap-3 animate-fade-in-up" style={{ animationDelay: `${step.step * 80}ms` }}>
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
