import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import CandidateInputSection from "@/components/CandidateInputSection";
import ResultsDisplay from "@/components/ResultsDisplay";
import BulkAnalysisSection from "@/components/BulkAnalysisSection";
import PerformanceTrackingSection from "@/components/PerformanceTrackingSection";
import AnalyticsSection from "@/components/AnalyticsSection";
import ExportSection from "@/components/ExportSection";
import { extractTextFromPdf } from "@/lib/pdf-utils";
import type { CandidateFiles, CandidateInput, AnalysisResult, BusinessFunction } from "@/lib/types";
import { Brain, Zap, TrendingUp, Shield, Users, Loader2, Factory, Cog, Lightbulb, Settings, Activity, BarChart3, Download, FileSpreadsheet } from "lucide-react";

const emptyFiles: CandidateFiles = { cv: null, supervisorNotes: null, recommendationLetter: null, peerReviews: null };

const scenarios = [
  { id: "crisis", label: "Crisis", description: "Speed and quick decisions matter most" },
  { id: "growth", label: "Growth", description: "Risk-taking and innovation are key" },
  { id: "stability", label: "Stability", description: "Consistency and strictness are valued" },
];

const businessFunctions: { id: BusinessFunction; label: string; icon: React.ReactNode }[] = [
  { id: "manufacturing", label: "Manufacturing", icon: <Factory className="h-4 w-4" /> },
  { id: "quality_assurance", label: "Quality Assurance", icon: <Shield className="h-4 w-4" /> },
  { id: "innovation", label: "Innovation", icon: <Lightbulb className="h-4 w-4" /> },
  { id: "operations", label: "Operations", icon: <Cog className="h-4 w-4" /> },
];

const statusSteps = [
  "Extracting text from PDFs...",
  "Agent 1: Parsing documents...",
  "Agent 2: Detecting keywords...",
  "Agent 3: Extracting traits...",
  "Agent 4: Classifying leaders...",
  "Agent 5: Evaluating interactions...",
  "Agent 6: Applying scenario weights...",
  "Agent 7: Learning from patterns...",
  "Agent 8: Computing final decision...",
];

const Index = () => {
  const [filesA, setFilesA] = useState<CandidateFiles>({ ...emptyFiles });
  const [filesB, setFilesB] = useState<CandidateFiles>({ ...emptyFiles });
  const [scenario, setScenario] = useState("");
  const [businessFunction, setBusinessFunction] = useState<string>("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusIdx, setStatusIdx] = useState(0);

  const hasFiles = (f: CandidateFiles) => Object.values(f).some((v) => v !== null);
  const canEvaluate = hasFiles(filesA) && hasFiles(filesB) && scenario;

  const extractTexts = async (files: CandidateFiles): Promise<CandidateInput> => {
    const extract = async (file: File | null): Promise<string> => {
      if (!file) return "";
      try { return await extractTextFromPdf(file); } catch (err) {
        console.error("PDF extraction error:", err);
        toast.error(`Failed to parse ${file.name}. Ensure it's a valid PDF.`);
        return "";
      }
    };
    return {
      cv: await extract(files.cv),
      supervisorNotes: await extract(files.supervisorNotes),
      recommendationLetter: await extract(files.recommendationLetter),
      peerReviews: await extract(files.peerReviews),
    };
  };

  const saveToDb = async (res: AnalysisResult) => {
    try {
      for (const c of [res.candidateA, res.candidateB]) {
        await supabase.from("leader_profiles").insert({
          name: c.name, classification: c.classification,
          suggested_role_fit: c.suggested_role_fit, traits: c.traits as any,
        });
      }
      await supabase.from("performance_records").insert({
        leader_a_name: res.candidateA.name, leader_b_name: res.candidateB.name,
        compatibility_score: res.evaluation.compatibility_score, scenario,
        outcome: "pending", strengths: res.evaluation.strengths, risks: res.evaluation.risks,
      });
    } catch (e) { console.error("DB save error:", e); }
  };

  const handleEvaluate = async () => {
    if (!canEvaluate) return;
    setLoading(true);
    setResult(null);
    setStatusIdx(0);

    const interval = setInterval(() => {
      setStatusIdx((prev) => {
        const next = Math.min(prev + 1, statusSteps.length - 1);
        setStatus(statusSteps[next]);
        return next;
      });
    }, 2800);

    try {
      setStatus(statusSteps[0]);
      const [candidateA, candidateB] = await Promise.all([extractTexts(filesA), extractTexts(filesB)]);
      const totalText = Object.values(candidateA).join("") + Object.values(candidateB).join("");
      if (totalText.trim().length === 0) { toast.error("No text could be extracted from the uploaded PDFs."); return; }

      const { data, error } = await supabase.functions.invoke("analyze-leaders", {
        body: { candidateA, candidateB, scenario, businessFunction: businessFunction || undefined },
      });

      if (error) { console.error("Edge function error:", error); toast.error("Analysis failed. Please try again."); return; }
      if (data?.error) { toast.error(data.error); return; }

      const analysisResult = data as AnalysisResult;
      setResult(analysisResult);
      await saveToDb(analysisResult);
      toast.success("Analysis complete!");
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      clearInterval(interval);
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle top accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 glow-primary">
            <Brain className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            LeaderMatch <span className="text-primary">AI</span>
          </h1>
          <p className="mt-1.5 text-sm font-medium tracking-wide uppercase text-gradient-silver">
            Organizational Decision Intelligence System
          </p>
          <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Analyze leaders from uploaded documents, classify them dynamically, evaluate compatibility,
            and track performance over time.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analyze" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 bg-secondary/50 glass-border p-1 h-auto">
            {[
              { value: "analyze", icon: Brain, label: "Analysis" },
              { value: "bulk", icon: FileSpreadsheet, label: "Bulk" },
              { value: "tracking", icon: Activity, label: "Tracking" },
              { value: "analytics", icon: BarChart3, label: "Analytics" },
              { value: "export", icon: Download, label: "Export" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs sm:text-sm data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none py-2.5 transition-all duration-200"
              >
                <tab.icon className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab 1: Individual Analysis */}
          <TabsContent value="analyze" className="space-y-6">
            <div className="space-y-6">
              <CandidateInputSection
                title="Leader A"
                subtitle="Upload documents"
                icon={<Users className="h-5 w-5 text-primary" />}
                files={filesA}
                onFilesChange={setFilesA}
              />
              <CandidateInputSection
                title="Leader B"
                subtitle="Upload documents"
                icon={<Users className="h-5 w-5 text-primary" />}
                files={filesB}
                onFilesChange={setFilesB}
              />

              {/* Business Domain */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Settings className="h-4 w-4 text-primary" />
                  Business Domain <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Select value={businessFunction} onValueChange={setBusinessFunction}>
                  <SelectTrigger className="glass-border bg-secondary/30">
                    <SelectValue placeholder="Select domain for context-aware analysis" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessFunctions.map((bf) => (
                      <SelectItem key={bf.id} value={bf.id}>{bf.label}</SelectItem>
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
                  <SelectTrigger className="glass-border bg-secondary/30">
                    <SelectValue placeholder="Select a scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarios.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label} — {s.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Button */}
              <Button
                onClick={handleEvaluate}
                disabled={!canEvaluate || loading}
                className="w-full glow-primary-hover transition-all duration-300"
                size="lg"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{status || "Processing..."}</>
                ) : (
                  <><Zap className="mr-2 h-4 w-4" />Analyze & Evaluate Pairing</>
                )}
              </Button>

              {/* Loading progress */}
              {loading && (
                <div className="space-y-3 animate-in fade-in-0 duration-300">
                  <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-1 rounded-full bg-primary transition-all duration-1000 ease-out"
                      style={{ width: `${((statusIdx + 1) / statusSteps.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">{status}</p>
                </div>
              )}
            </div>

            {result && <ResultsDisplay result={result} />}
          </TabsContent>

          <TabsContent value="bulk"><BulkAnalysisSection /></TabsContent>
          <TabsContent value="tracking"><PerformanceTrackingSection /></TabsContent>
          <TabsContent value="analytics"><AnalyticsSection /></TabsContent>
          <TabsContent value="export"><ExportSection /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
