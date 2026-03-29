import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Users, Activity, BarChart3, FileSpreadsheet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedCounter from "@/components/AnimatedCounter";

interface Props {
  profile: { full_name: string; company_name: string } | null;
  onNavigate: (tab: string) => void;
}

const DashboardHome = ({ profile, onNavigate }: Props) => {
  const [leaderCount, setLeaderCount] = useState(0);
  const [pairingCount, setPairingCount] = useState(0);
  const [avgScore, setAvgScore] = useState(0);

  useEffect(() => {
    supabase.from("leader_profiles").select("id", { count: "exact", head: true })
      .then(({ count }) => setLeaderCount(count ?? 0));
    supabase.from("performance_records").select("compatibility_score")
      .then(({ data }) => {
        if (data) {
          setPairingCount(data.length);
          if (data.length > 0) {
            const avg = Math.round(data.reduce((s, r) => s + r.compatibility_score, 0) / data.length);
            setAvgScore(avg);
          }
        }
      });
  }, []);

  const stats = [
    { label: "Leader Profiles", value: leaderCount, icon: Users },
    { label: "Evaluations", value: pairingCount, icon: Activity },
    { label: "Avg Compatibility", value: avgScore, icon: BarChart3, suffix: "%" },
  ];

  const quickActions = [
    { label: "Analyze Leaders", desc: "Individual pair evaluation", icon: Brain, tab: "analyze" },
    { label: "Bulk Analysis", desc: "Upload Excel data", icon: FileSpreadsheet, tab: "bulk" },
    { label: "Analytics", desc: "View insights & charts", icon: BarChart3, tab: "analytics" },
    { label: "Tracking", desc: "Performance history", icon: Activity, tab: "tracking" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">
          Welcome back, <span className="text-primary">{profile?.full_name || "User"}</span>
        </h2>
        {profile?.company_name && (
          <p className="text-sm text-muted-foreground mt-1">{profile.company_name}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="p-5 rounded-lg border border-border/30 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">
              <AnimatedCounter value={s.value} />{s.suffix || ""}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickActions.map((a) => (
            <button
              key={a.tab}
              onClick={() => onNavigate(a.tab)}
              className="flex items-center gap-4 p-4 rounded-lg border border-border/30 bg-card/60 hover:bg-secondary/40 transition-all text-left group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <a.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{a.label}</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
