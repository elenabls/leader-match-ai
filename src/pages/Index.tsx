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

const Index = () => {
  const [filesA, setFilesA] = useState<CandidateFiles>({ ...emptyFiles });
  const [filesB, setFilesB] = useState<CandidateFiles>({ ...emptyFiles });
  const [scenario, setScenario] = useState("");
  const [businessFunction, setBusinessFunction] = useState<string>("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const hasFiles = (f: CandidateFiles) => Object.values(f).some((v) => v !== null);
  const canEvaluate = hasFiles(filesA) && hasFiles(filesB) && scenario;

  const extractTexts = async (files: CandidateFiles): Promise<CandidateInput> => {
    const extract = async (file: File | null): Promise<string> => {
      if (!file) return "";
      try {
        return await extractTextFromPdf(file);
      } catch (err) {
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
      // Save leader profiles
      for (const c of [res.candidateA, res.candidateB]) {
        await supabase.from("leader_profiles").insert({
          name: c.name,
          classification: c.classification,
          suggested_role_fit: c.suggested_role_fit,
          traits: c.traits as any,
        });
      }
      // Save performance record
      await supabase.from("performance_records").insert({
        leader_a_name: res.candidateA.name,
        leader_b_name: res.candidateB.name,
        compatibility_score: res.evaluation.compatibility_score,
        scenario,
        outcome: "pending",
        strengths: res.evaluation.strengths,
        risks: res.evaluation.risks,
      });
    } catch (e) {
      console.error("DB save error:", e);
    }
  };

  const handleEvaluate = async () => {
    if (!canEvaluate) return;
    setLoading(true);
    setResult(null);

    try {
      setStatus("Extracting text from PDFs...");
      const [candidateA, candidateB] = await Promise.all([extractTexts(filesA), extractTexts(filesB)]);

      const totalText = Object.values(candidateA).join("") + Object.values(candidateB).join("");
      if (totalText.trim().length === 0) {
        toast.error("No text could be extracted from the uploaded PDFs.");
        return;
      }

      setStatus("Running 8-agent AI analysis...");
      const { data, error } = await supabase.functions.invoke("analyze-leaders", {
        body: { candidateA, candidateB, scenario, businessFunction: businessFunction || undefined },
      });

      if (error) {
        console.error("Edge function error:", error);
        toast.error("Analysis failed. Please try again.");
        return;
      }
      if (data?.error) { toast.error(data.error); return; }

      const analysisResult = data as AnalysisResult;
      setResult(analysisResult);
      await saveToDb(analysisResult);
      toast.success("Analysis complete!");
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Brain className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">LeaderMatch AI</h1>
          <p className="mt-1 text-lg font-medium text-muted-foreground">Organizational Decision Intelligence System</p>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            Analyze leaders from uploaded documents, classify them dynamically, evaluate compatibility,
            and track performance over time.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analyze" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analyze" className="text-xs sm:text-sm">
              <Brain className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Analysis
            </TabsTrigger>
            <TabsTrigger value="bulk" className="text-xs sm:text-sm">
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Bulk
            </TabsTrigger>
            <TabsTrigger value="tracking" className="text-xs sm:text-sm">
              <Activity className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Tracking
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Analytics
            </TabsTrigger>
            <TabsTrigger value="export" className="text-xs sm:text-sm">
              <Download className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Export
            </TabsTrigger>
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
                icon={<Users className="h-5 w-5 text-accent" />}
                files={filesB}
                onFilesChange={setFilesB}
              />

              {/* Business Domain */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Settings className="h-4 w-4 text-primary" />
                  Business Domain (optional)
                </label>
                <Select value={businessFunction} onValueChange={setBusinessFunction}>
                  <SelectTrigger>
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
                  <SelectTrigger>
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
              <Button onClick={handleEvaluate} disabled={!canEvaluate || loading} className="w-full" size="lg">
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{status || "Processing..."}</>
                ) : (
                  <><Zap className="mr-2 h-4 w-4" />Analyze & Evaluate Pairing</>
                )}
              </Button>
            </div>

            {result && <ResultsDisplay result={result} />}
          </TabsContent>

          {/* Tab 2: Bulk Analysis */}
          <TabsContent value="bulk">
            <BulkAnalysisSection />
          </TabsContent>

          {/* Tab 3: Performance Tracking */}
          <TabsContent value="tracking">
            <PerformanceTrackingSection />
          </TabsContent>

          {/* Tab 4: Analytics */}
          <TabsContent value="analytics">
            <AnalyticsSection />
          </TabsContent>

          {/* Tab 5: Export */}
          <TabsContent value="export">
            <ExportSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
