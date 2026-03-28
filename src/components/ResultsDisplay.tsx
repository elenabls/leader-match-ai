import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CandidateProfileCard from "./CandidateProfileCard";
import type { AnalysisResult } from "@/lib/types";
import { CheckCircle, AlertTriangle, Brain, Zap, ArrowRightLeft, TrendingUp, Shield, Activity } from "lucide-react";

interface Props {
  result: AnalysisResult;
}

const ResultsDisplay = ({ result }: Props) => {
  const { evaluation, interaction, candidateA, candidateB } = result;
  const score = evaluation.compatibility_score;

  const scoreColor = score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-destructive";
  const scoreBg = score >= 75 ? "bg-emerald-500/10" : score >= 50 ? "bg-amber-500/10" : "bg-destructive/10";

  const scenarioIcons: Record<string, React.ReactNode> = {
    crisis: <Zap className="h-4 w-4" />,
    growth: <TrendingUp className="h-4 w-4" />,
    stability: <Shield className="h-4 w-4" />,
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Candidate Profiles */}
      <div className="grid gap-5 sm:grid-cols-2">
        <CandidateProfileCard profile={candidateA} role="Production Head" color="primary" />
        <CandidateProfileCard profile={candidateB} role="Quality Head" color="accent" />
      </div>

      {/* Compatibility Score */}
      <Card className="border-border shadow-sm text-center">
        <CardContent className="py-8">
          <p className="mb-1 text-sm font-medium uppercase tracking-wide text-muted-foreground">Compatibility Score</p>
          <div className={`mx-auto mb-3 flex h-28 w-28 items-center justify-center rounded-full ${scoreBg}`}>
            <span className={`text-5xl font-bold ${scoreColor}`}>{score}%</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Best suited for: <span className="font-semibold text-foreground">{evaluation.scenario_insight.best_scenario}</span>
          </p>
        </CardContent>
      </Card>

      {/* Interaction Analysis */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            Interaction Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {interaction.conflicts.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-destructive">Conflicts</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {interaction.conflicts.map((c, i) => (
                  <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />{c}</li>
                ))}
              </ul>
            </div>
          )}
          {interaction.alignments.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-500">Alignments</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {interaction.alignments.map((a, i) => (
                  <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{a}</li>
                ))}
              </ul>
            </div>
          )}
          {interaction.complementarities.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary">Complementarities</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {interaction.complementarities.map((c, i) => (
                  <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{c}</li>
                ))}
              </ul>
            </div>
          )}
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
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{s}</li>
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
              {evaluation.risks.map((r, i) => (
                <li key={i} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Explanation */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-primary" />
            Why This Pairing Works (or Fails)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">{evaluation.explanation}</p>
        </CardContent>
      </Card>

      {/* Scenario Insight */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            Scenario Insight
          </CardTitle>
          <CardDescription>{evaluation.scenario_insight.current_scenario_fit}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {(["crisis", "growth", "stability"] as const).map((s) => {
              const val = evaluation.scenario_insight.score_variations[s];
              const isBest = evaluation.scenario_insight.best_scenario.toLowerCase() === s;
              return (
                <div key={s} className={`rounded-lg border p-3 text-center ${isBest ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className="mb-1 flex items-center justify-center gap-1 text-xs text-muted-foreground capitalize">
                    {scenarioIcons[s]} {s}
                  </div>
                  <p className={`text-2xl font-bold ${isBest ? "text-primary" : "text-foreground"}`}>{val}%</p>
                  {isBest && <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">Best Fit</p>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reasoning */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-primary" />
            Reasoning Chain
          </CardTitle>
          <CardDescription>Step-by-step analysis from the multi-agent system</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
            {evaluation.reasoning.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsDisplay;
