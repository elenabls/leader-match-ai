import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import MatrixBackground from "@/components/MatrixBackground";
import ThemeToggle from "@/components/ThemeToggle";
import CandidateInputSection from "@/components/CandidateInputSection";
import ResultsDisplay from "@/components/ResultsDisplay";
import BulkAnalysisSection from "@/components/BulkAnalysisSection";
import PerformanceTrackingSection from "@/components/PerformanceTrackingSection";
import AnalyticsSection from "@/components/AnalyticsSection";
import ExportSection from "@/components/ExportSection";
import DashboardHome from "@/components/DashboardHome";
import { extractTextFromPdf } from "@/lib/pdf-utils";
import { toast } from "sonner";
import type { CandidateFiles, CandidateInput, AnalysisResult, BusinessFunction } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Users, Loader2, Factory, Cog, Lightbulb, Shield, Settings, LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";

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

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; company_name: string } | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [filesA, setFilesA] = useState<CandidateFiles>({ ...emptyFiles });
  const [filesB, setFilesB] = useState<CandidateFiles>({ ...emptyFiles });
  const [scenario, setScenario] = useState("");
  const [businessFunction, setBusinessFunction] = useState<string>("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, company_name").eq("id", user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const hasFiles = (f: CandidateFiles) => Object.values(f).some((v) => v !== null);
  const canEvaluate = hasFiles(filesA) && hasFiles(filesB) && scenario;

  const extractTexts = async (files: CandidateFiles): Promise<CandidateInput> => {
    const extract = async (file: File | null): Promise<string> => {
      if (!file) return "";
      try { return await extractTextFromPdf(file); } catch (err) {
        console.error("PDF extraction error:", err);
        toast.error(`Failed to parse ${file.name}.`);
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
    if (!user) return;
    try {
      for (const c of [res.candidateA, res.candidateB]) {
        await supabase.from("leader_profiles").insert({
          name: c.name, classification: c.classification,
          suggested_role_fit: c.suggested_role_fit, traits: c.traits as any,
          user_id: user.id,
        });
      }
      await supabase.from("performance_records").insert({
        leader_a_name: res.candidateA.name, leader_b_name: res.candidateB.name,
        compatibility_score: res.evaluation.compatibility_score, scenario,
        outcome: "pending", strengths: res.evaluation.strengths, risks: res.evaluation.risks,
        user_id: user.id,
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
      if (totalText.trim().length === 0) { toast.error("No text could be extracted."); return; }

      const { data, error } = await supabase.functions.invoke("analyze-leaders", {
        body: { candidateA, candidateB, scenario, businessFunction: businessFunction || undefined },
      });

      if (error) { toast.error("Analysis failed. Please try again."); return; }
      if (data?.error) { toast.error(data.error); return; }

      const analysisResult = data as AnalysisResult;
      setResult(analysisResult);
      await saveToDb(analysisResult);
      toast.success("Analysis complete!");
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong.");
    } finally {
      clearInterval(interval);
      setLoading(false);
      setStatus("");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <DashboardHome profile={profile} onNavigate={setActiveTab} />;
      case "analyze":
        return (
          <div className="space-y-6">
            <CandidateInputSection title="Leader A" subtitle="Upload documents" icon={<Users className="h-5 w-5 text-primary" />} files={filesA} onFilesChange={setFilesA} />
            <CandidateInputSection title="Leader B" subtitle="Upload documents" icon={<Users className="h-5 w-5 text-primary" />} files={filesB} onFilesChange={setFilesB} />

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Settings className="h-4 w-4 text-primary" /> Business Domain <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Select value={businessFunction} onValueChange={setBusinessFunction}>
                <SelectTrigger className="glass-border bg-secondary/30"><SelectValue placeholder="Select domain" /></SelectTrigger>
                <SelectContent>{businessFunctions.map((bf) => (<SelectItem key={bf.id} value={bf.id}>{bf.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <TrendingUp className="h-4 w-4 text-primary" /> Business Scenario
              </label>
              <Select value={scenario} onValueChange={setScenario}>
                <SelectTrigger className="glass-border bg-secondary/30"><SelectValue placeholder="Select a scenario" /></SelectTrigger>
                <SelectContent>{scenarios.map((s) => (<SelectItem key={s.id} value={s.id}>{s.label} — {s.description}</SelectItem>))}</SelectContent>
              </Select>
            </div>

            <Button onClick={handleEvaluate} disabled={!canEvaluate || loading} className="w-full glow-primary-hover h-12 text-sm font-semibold" size="lg">
              {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{status || "Processing..."}</>) : (<><Zap className="mr-2 h-4 w-4" />Analyze & Evaluate Pairing</>)}
            </Button>

            {loading && (
              <div className="space-y-3 animate-in fade-in-0 duration-300">
                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-1000 ease-out" style={{ width: `${((statusIdx + 1) / statusSteps.length) * 100}%` }} />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-xs text-muted-foreground">{status}</p>
                </div>
              </div>
            )}

            {result && <ResultsDisplay result={result} />}
          </div>
        );
      case "bulk": return <BulkAnalysisSection />;
      case "tracking": return <PerformanceTrackingSection />;
      case "analytics": return <AnalyticsSection />;
      case "export": return <ExportSection />;
      default: return null;
    }
  };

  const tabTitles: Record<string, { title: string; desc: string }> = {
    home: { title: "Dashboard", desc: `Welcome${profile ? `, ${profile.full_name}` : ""}` },
    analyze: { title: "Individual Analysis", desc: "Evaluate compatibility between two leaders" },
    bulk: { title: "Bulk Analysis", desc: "Process multiple leaders from Excel data" },
    tracking: { title: "Performance Tracking", desc: "Historical pairing outcomes and trends" },
    analytics: { title: "Analytics Dashboard", desc: "Visualize leader performance and insights" },
    export: { title: "Export Reports", desc: "Download comprehensive analysis reports" },
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background relative">
      <MatrixBackground />
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="ml-56 relative z-10 min-h-screen">
        <div className="sticky top-0 z-20 border-b border-border/30 bg-background/80 backdrop-blur-xl px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">{tabTitles[activeTab]?.title}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{tabTitles[activeTab]?.desc}</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Online</span>
              </div>
              {profile && (
                <span className="text-xs text-muted-foreground border-l border-border/30 pl-3">
                  {profile.company_name}
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl px-8 py-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
