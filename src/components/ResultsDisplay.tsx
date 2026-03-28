import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CandidateProfileCard from "./CandidateProfileCard";
import type { AnalysisResult } from "@/lib/types";
import { CheckCircle, AlertTriangle, Brain, Zap, ArrowRightLeft, TrendingUp, Shield, Activity, Info } from "lucide-react";

interface Props {
  result: AnalysisResult;
}

const ResultsDisplay = ({ result }: Props) => {
  const { evaluation, interaction, candidateA, candidateB } = result;
  const score = evaluation.compatibility_score;

  const scoreColor = score >= 75 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-destructive";
  const scoreBorder = score >= 75 ? "border-emerald-500/20" : score >= 50 ? "border-amber-500/20" : "border-destructive/20";
  const scoreGlow = score >= 75 ? "shadow-emerald-500/10" : score >= 50 ? "shadow-amber-500/10" : "shadow-destructive/10";

  const scenarioIcons: Record<string, React.ReactNode> = {
    crisis: <Zap className="h-4 w-4" />,
    growth: <TrendingUp className="h-4 w-4" />,
    stability: <Shield className="h-4 w-4" />,
  };

  // Determine confidence based on data completeness
  const aHasExtra = candidateA.feedback_analysis?.leadership_behavior_signals?.length > 0;
  const bHasExtra = candidateB.feedback_analysis?.leadership_behavior_signals?.length > 0;
  const confidence = aHasExtra && bHasExtra ? "High" : aHasExtra || bHasExtra ? "Medium" : "Low";
  const confColor = confidence === "High" ? "text-emerald-400 border-emerald-500/30" : confidence === "Medium" ? "text-amber-400 border-amber-500/30" : "text-destructive border-destructive/30";

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Confidence badge */}
      <Card className="border-border/50 bg-secondary/30">
        <CardContent className="flex items-center gap-3 py-3">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground">Data Confidence:</p>
          <Badge variant="outline" className={`text-xs ${confColor}`}>{confidence}</Badge>
          {confidence !== "High" && (
            <p className="text-xs text-muted-foreground">— Adding more documents will improve accuracy</p>
          )}
        </CardContent>
      </Card>

      {/* Candidate Profiles */}
      <div className="grid gap-5 sm:grid-cols-2">
        <CandidateProfileCard profile={candidateA} />
        <CandidateProfileCard profile={candidateB} />
      </div>

      {/* Compatibility Score */}
      <Card className={`card-metallic glass-border shadow-lg ${scoreGlow} text-center`}>
        <CardContent className="py-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Compatibility Score</p>
          <div className={`mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full border-2 ${scoreBorder} bg-secondary/30`}>
            <span className={`text-5xl font-bold ${scoreColor} animate-count`}>{score}%</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Best suited for: <span className="font-semibold text-foreground">{evaluation.scenario_insight.best_scenario}</span>
          </p>
        </CardContent>
      </Card>

      {/* Interaction Analysis */}
      <Card className="card-metallic glass-border shadow-lg">
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
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-400">Alignments</p>
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
        <Card className="card-metallic glass-border shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
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
        <Card className="card-metallic glass-border shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
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
      <Card className="card-metallic glass-border shadow-lg">
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
      <Card className="card-metallic glass-border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            Scenario Comparison
          </CardTitle>
          <CardDescription>{evaluation.scenario_insight.current_scenario_fit}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {(["crisis", "growth", "stability"] as const).map((s) => {
              const val = evaluation.scenario_insight.score_variations[s];
              const isBest = evaluation.scenario_insight.best_scenario.toLowerCase() === s;
              const sColor = val >= 70 ? "text-emerald-400" : val >= 50 ? "text-amber-400" : "text-destructive";
              return (
                <div key={s} className={`rounded-lg border p-4 text-center transition-all duration-200 ${isBest ? "border-primary/30 bg-primary/5 glow-primary" : "border-border/50 bg-secondary/20"}`}>
                  <div className="mb-1 flex items-center justify-center gap-1 text-xs text-muted-foreground capitalize">
                    {scenarioIcons[s]} {s}
                  </div>
                  <p className={`text-2xl font-bold ${isBest ? "text-primary" : sColor} animate-count`}>{val}%</p>
                  {isBest && <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-primary">Best Fit</p>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reasoning */}
      <Card className="card-metallic glass-border shadow-lg">
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
