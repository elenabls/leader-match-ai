import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Upload, Search, Users, BarChart3, Zap, Shield, Activity, FileSpreadsheet, TrendingUp, ArrowRight } from "lucide-react";
import MatrixBackground from "@/components/MatrixBackground";
import ThemeToggle from "@/components/ThemeToggle";

const steps = [
  { icon: Upload, title: "Upload Data", desc: "Upload candidate PDFs or Excel spreadsheets with employee data" },
  { icon: Search, title: "AI Trait Extraction", desc: "Multi-agent system extracts leadership traits from documents" },
  { icon: Brain, title: "Dynamic Classification", desc: "Leaders are classified based on detected behavioral patterns" },
  { icon: Users, title: "Compatibility Evaluation", desc: "Pairwise compatibility is scored using interaction modeling" },
  { icon: BarChart3, title: "Insights & Reports", desc: "Actionable recommendations and exportable analytics" },
];

const features = [
  { icon: Brain, title: "AI-Driven Analysis", desc: "8-agent pipeline extracts traits from unstructured documents" },
  { icon: Zap, title: "Scenario Modeling", desc: "Evaluate leaders under crisis, growth, and stability conditions" },
  { icon: Users, title: "Compatibility Matching", desc: "Intelligent pairing with conflict detection and scoring" },
  { icon: FileSpreadsheet, title: "Bulk Optimization", desc: "Process entire teams from Excel with auto column detection" },
  { icon: Activity, title: "Performance Tracking", desc: "Historical outcomes drive continuous learning" },
  { icon: Shield, title: "Data Isolation", desc: "Company-scoped data with secure, authenticated access" },
];

const useCases = [
  { title: "Hiring Decisions", desc: "Evaluate candidate fit before making critical leadership hires" },
  { title: "Team Formation", desc: "Build high-performing teams with compatible leadership styles" },
  { title: "Leadership Evaluation", desc: "Assess existing leaders and identify development areas" },
  { title: "Organizational Planning", desc: "Optimize reporting structures and succession planning" },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixBackground />

      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between px-8 py-4 border-b border-border/30 bg-background/60 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 glow-primary">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">LeaderMatch <span className="text-primary">AI</span></span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" onClick={() => navigate("/login")}>Login</Button>
          <Button onClick={() => navigate("/signup")} className="glow-primary-hover">Get Started</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/40 px-4 py-1.5 text-xs text-muted-foreground mb-6">
          <Zap className="h-3 w-3 text-primary" /> Multi-Agent Decision Intelligence
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
          LeaderMatch <span className="text-primary">AI</span>
          <br />
          <span className="text-gradient-silver text-3xl md:text-4xl lg:text-5xl font-semibold">Intelligent Leadership Decision System</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Make smarter leadership and hiring decisions using AI-powered analysis and multi-agent reasoning.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button size="lg" onClick={() => navigate("/signup")} className="glow-primary-hover h-12 px-8 text-sm font-semibold">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="h-12 px-8 text-sm font-semibold">
            Login / Create Account
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center p-4 rounded-lg border border-border/30 bg-card/60 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-xs text-muted-foreground mb-1">Step {i + 1}</div>
              <h3 className="text-sm font-semibold mb-1">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="p-5 rounded-lg border border-border/30 bg-card/60 backdrop-blur-sm">
              <f.icon className="h-5 w-5 text-primary mb-3" />
              <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Use Cases</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {useCases.map((uc, i) => (
            <div key={i} className="flex items-start gap-4 p-5 rounded-lg border border-border/30 bg-card/60 backdrop-blur-sm">
              <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold mb-1">{uc.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{uc.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-8 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Leadership Decisions?</h2>
        <p className="text-muted-foreground mb-8">Start analyzing leaders in minutes with AI-powered intelligence.</p>
        <Button size="lg" onClick={() => navigate("/signup")} className="glow-primary-hover h-12 px-10">
          Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </section>

      <footer className="relative z-10 border-t border-border/30 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} LeaderMatch AI. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;
