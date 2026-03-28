import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { productionLeaders, qualityLeaders, scenarios, evaluate, type Scenario, type EvaluationResult } from "@/lib/leaders";
import { Users, Zap, Shield, TrendingUp, AlertTriangle, CheckCircle, Brain } from "lucide-react";

const Index = () => {
  const [leaderA, setLeaderA] = useState("");
  const [leaderB, setLeaderB] = useState("");
  const [scenario, setScenario] = useState("");
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const handleEvaluate = () => {
    const a = productionLeaders.find((l) => l.id === leaderA);
    const b = qualityLeaders.find((l) => l.id === leaderB);
    if (!a || !b || !scenario) return;
    setResult(evaluate(a, b, scenario as Scenario));
  };

  const canEvaluate = leaderA && leaderB && scenario;

  const scoreColor = result
    ? result.score >= 75
      ? "text-emerald-500"
      : result.score >= 50
        ? "text-amber-500"
        : "text-destructive"
    : "";

  const scoreBg = result
    ? result.score >= 75
      ? "bg-emerald-500/10"
      : result.score >= 50
        ? "bg-amber-500/10"
        : "bg-destructive/10"
    : "";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Brain className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">LeaderMatch AI</h1>
          <p className="mt-2 text-muted-foreground">Evaluate how well two leaders work together in any business scenario.</p>
        </div>

        {/* Input Card */}
        <Card className="mb-8 border-border shadow-sm">
          <CardContent className="space-y-6 pt-6">
            {/* Leader A */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Users className="h-4 w-4 text-primary" />
                Leader A — Production Head
              </label>
              <Select value={leaderA} onValueChange={setLeaderA}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a production leader" />
                </SelectTrigger>
                <SelectContent>
                  {productionLeaders.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} — {l.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Leader B */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Shield className="h-4 w-4 text-primary" />
                Leader B — Quality Head
              </label>
              <Select value={leaderB} onValueChange={setLeaderB}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a quality leader" />
                </SelectTrigger>
                <SelectContent>
                  {qualityLeaders.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} — {l.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scenario */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                Business Scenario
              </label>
              <Select value={scenario} onValueChange={setScenario}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a scenario" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label} — {s.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Button */}
            <Button onClick={handleEvaluate} disabled={!canEvaluate} className="w-full" size="lg">
              <Zap className="mr-2 h-4 w-4" />
              Evaluate Team
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            {/* Score */}
            <Card className="border-border text-center shadow-sm">
              <CardContent className="py-8">
                <p className="mb-1 text-sm font-medium text-muted-foreground uppercase tracking-wide">Compatibility Score</p>
                <div className={`mx-auto mb-3 flex h-28 w-28 items-center justify-center rounded-full ${scoreBg}`}>
                  <span className={`text-5xl font-bold ${scoreColor}`}>{result.score}%</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Best suited for: <span className="font-semibold text-foreground">{result.bestScenario}</span>
                </p>
              </CardContent>
            </Card>

            {/* Strengths & Risks */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Risks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {result.risks.map((r, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Reasoning */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-4 w-4 text-primary" />
                  Reasoning
                </CardTitle>
                <CardDescription>How the score was calculated</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                  {result.reasoning.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
