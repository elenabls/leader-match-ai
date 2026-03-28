import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { PerformanceRecord, LeaderPerformanceSummary } from "@/lib/types";
import { AlertTriangle, TrendingDown, Users, Lightbulb, BarChart3 } from "lucide-react";

const AnalyticsSection = () => {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("performance_records").select("*");
      if (data) setRecords(data as unknown as PerformanceRecord[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const leaderMap = new Map<string, { scores: number[]; outcomes: string[]; conflicts: number }>();
  records.forEach((r) => {
    for (const name of [r.leader_a_name, r.leader_b_name]) {
      if (!leaderMap.has(name)) leaderMap.set(name, { scores: [], outcomes: [], conflicts: 0 });
      const entry = leaderMap.get(name)!;
      entry.scores.push(r.compatibility_score);
      entry.outcomes.push(r.outcome);
      if (r.compatibility_score < 40) entry.conflicts++;
    }
  });

  const summaries: LeaderPerformanceSummary[] = Array.from(leaderMap.entries()).map(([name, data]) => {
    const successCount = data.outcomes.filter((o) => o === "success").length;
    const totalDecided = data.outcomes.filter((o) => o !== "pending").length;
    const avgScore = data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0;
    const successRate = totalDecided > 0 ? Math.round((successCount / totalDecided) * 100) : 0;
    const suggestions: string[] = [];
    if (avgScore < 50) suggestions.push("Consider pairing with more complementary leaders");
    if (data.conflicts > 2) suggestions.push("Improve communication and flexibility");
    if (successRate < 50 && totalDecided > 0) suggestions.push("Review risk alignment and speed vs quality balance");
    if (avgScore < 40) suggestions.push("Focus on building adaptability across different leadership styles");
    return { name, total_pairings: data.scores.length, avg_compatibility: avgScore, success_rate: successRate, conflict_count: data.conflicts, improvement_suggestions: suggestions };
  });

  const underperformers = summaries.filter((s) => s.avg_compatibility < 50 || s.success_rate < 50);
  const conflictLeaders = summaries.filter((s) => s.conflict_count >= 2);

  if (loading) return (
    <div className="space-y-3 py-8">
      {[1,2,3].map((i) => <div key={i} className="h-24 rounded-lg shimmer-loading" />)}
    </div>
  );

  if (records.length === 0) {
    return (
      <Card className="card-metallic glass-border">
        <CardContent className="py-12 text-center">
          <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No data yet. Run analyses and track outcomes to generate insights.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leader Performance Overview */}
      <Card className="card-metallic glass-border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Leader Performance Overview
          </CardTitle>
          <CardDescription>Average compatibility score per leader</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {summaries.sort((a, b) => b.avg_compatibility - a.avg_compatibility).map((s, i) => {
            const barColor = s.avg_compatibility >= 65 ? "bg-emerald-500" : s.avg_compatibility >= 45 ? "bg-amber-500" : "bg-destructive";
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground w-32 truncate">{s.name}</span>
                <div className="flex-1 h-2 rounded-full bg-secondary">
                  <div className={`h-2 rounded-full ${barColor} transition-all duration-1000`} style={{ width: `${s.avg_compatibility}%` }} />
                </div>
                <span className="text-xs font-bold text-foreground tabular-nums w-10 text-right">{s.avg_compatibility}%</span>
                <Badge variant="outline" className="text-[10px] border-border/50">{s.total_pairings} pairs</Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Underperformers */}
      <Card className="card-metallic glass-border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="h-4 w-4 text-destructive" />
            Underperforming Leaders
          </CardTitle>
          <CardDescription>Leaders with low compatibility scores or high failure rates.</CardDescription>
        </CardHeader>
        <CardContent>
          {underperformers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No underperformers detected.</p>
          ) : (
            <div className="space-y-3">
              {underperformers.map((s, i) => (
                <div key={i} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{s.name}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs border-border/50">Avg: {s.avg_compatibility}%</Badge>
                      <Badge variant="outline" className="text-xs border-border/50">Success: {s.success_rate}%</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conflict Detection */}
      <Card className="card-metallic glass-border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Conflict-Prone Leaders
          </CardTitle>
          <CardDescription>Leaders who frequently have low compatibility with others.</CardDescription>
        </CardHeader>
        <CardContent>
          {conflictLeaders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conflict-prone leaders detected.</p>
          ) : (
            <div className="space-y-3">
              {conflictLeaders.map((s, i) => (
                <div key={i} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{s.name}</span>
                    <Badge className="text-xs border-amber-500/30 text-amber-400" variant="outline">
                      {s.conflict_count} conflicts
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Improvement Suggestions */}
      <Card className="card-metallic glass-border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-primary" />
            Improvement Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summaries.filter((s) => s.improvement_suggestions.length > 0).length === 0 ? (
            <p className="text-sm text-muted-foreground">No specific improvements needed based on current data.</p>
          ) : (
            summaries.filter((s) => s.improvement_suggestions.length > 0).map((s, i) => (
              <div key={i} className="rounded-lg border border-border/50 bg-secondary/20 p-3 space-y-1.5">
                <span className="font-medium text-sm text-foreground">{s.name}</span>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {s.improvement_suggestions.map((sug, j) => (
                    <li key={j} className="flex gap-1.5">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {sug}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsSection;
