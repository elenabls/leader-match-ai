import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CandidateInputSection from "@/components/CandidateInputSection";
import ResultsDisplay from "@/components/ResultsDisplay";
import type { CandidateInput, AnalysisResult } from "@/lib/types";
import { Brain, Zap, TrendingUp, Shield, Users, Loader2 } from "lucide-react";

const emptyCandidate: CandidateInput = { cv: "", supervisorNotes: "", recommendationLetter: "", peerReviews: "" };

const scenarios = [
  { id: "crisis", label: "Crisis", description: "Speed and quick decisions matter most" },
  { id: "growth", label: "Growth", description: "Risk-taking and innovation are key" },
  { id: "stability", label: "Stability", description: "Consistency and strictness are valued" },
];

const Index = () => {
  const [candidateA, setCandidateA] = useState<CandidateInput>({ ...emptyCandidate });
  const [candidateB, setCandidateB] = useState<CandidateInput>({ ...emptyCandidate });
  const [scenario, setScenario] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const hasInput = (c: CandidateInput) => Object.values(c).some((v) => v.trim().length > 0);
  const canEvaluate = hasInput(candidateA) && hasInput(candidateB) && scenario;

  const handleEvaluate = async () => {
    if (!canEvaluate) return;
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-leaders", {
        body: { candidateA, candidateB, scenario },
      });

      if (error) {
        console.error("Edge function error:", error);
        toast.error("Analysis failed. Please try again.");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setResult(data as AnalysisResult);
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Brain className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">LeaderMatch AI</h1>
          <p className="mt-1 text-lg font-medium text-muted-foreground">Advanced Decision System</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Multi-agent AI analysis of leadership compatibility from CVs, reviews, and recommendations.
          </p>
        </div>

        {/* Input Sections */}
        <div className="space-y-6 mb-6">
          <CandidateInputSection
            title="Candidate A"
            subtitle="Production Head"
            icon={<Users className="h-5 w-5 text-primary" />}
            value={candidateA}
            onChange={setCandidateA}
          />

          <CandidateInputSection
            title="Candidate B"
            subtitle="Quality Head"
            icon={<Shield className="h-5 w-5 text-primary" />}
            value={candidateB}
            onChange={setCandidateB}
          />

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
          <Button onClick={handleEvaluate} disabled={!canEvaluate || loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing with AI Agents...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Analyze & Evaluate Team
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {result && <ResultsDisplay result={result} />}
      </div>
    </div>
  );
};

export default Index;
