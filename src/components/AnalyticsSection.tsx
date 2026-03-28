import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { PerformanceRecord, LeaderPerformanceSummary } from "@/lib/types";
import { AlertTriangle, TrendingDown, Users, Lightbulb, BarChart3, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import AnimatedCounter from "./AnimatedCounter";

const CHART_COLORS = ["hsl(213, 80%, 54%)", "hsl(152, 55%, 42%)", "hsl(38, 92%, 50%)", "hsl(280, 60%, 55%)", "hsl(0, 68%, 52%)"];

const AnalyticsSection = () => {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: recs }, { data: profs }] = await Promise.all([
        supabase.from("performance_records").select("*"),
        supabase.from("leader_profiles").select("*"),
      ]);
      if (recs) setRecords(recs as unknown as PerformanceRecord[]);
      if (profs) setProfiles(profs);
      setLoading(false);
    };
    fetchData();
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

  // Chart data
  const barChartData = summaries
    .sort((a, b) => b.avg_compatibility - a.avg_compatibility)
    .slice(0, 15)
    .map((s) => ({ name: s.name.split(" ")[0], score: s.avg_compatibility, conflicts: s.conflict_count }));

  // Distribution of leader types
  const classificationCount: Record<string, number> = {};
  profiles.forEach((p) => {
    const cls = p.classification || "Unknown";
    classificationCount[cls] = (classificationCount[cls] || 0) + 1;
  });
  const pieData = Object.entries(classificationCount).map(([name, value]) => ({ name, value }));

  // Performance over time
  const timeData = records
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .reduce((acc, r, i) => {
      const runningAvg = Math.round(
        records.slice(0, i + 1).reduce((sum, rec) => sum + rec.compatibility_score, 0) / (i + 1)
      );
      acc.push({
        date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        score: r.compatibility_score,
        avg: runningAvg,
      });
      return acc;
    }, [] as { date: string; score: number; avg: number }[])
    .slice(-20);

  const underperformers = summaries.filter((s) => s.avg_compatibility < 50 || s.success_rate < 50);
  const conflictLeaders = summaries.filter((s) => s.conflict_count >= 2);

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: "hsl(220, 15%, 11%)",
      border: "1px solid hsl(220, 12%, 22%)",
      borderRadius: "8px",
      fontSize: 12,
      color: "hsl(210, 20%, 82%)",
    },
  };

  if (loading) return (
    <div className="space-y-3 py-8">
      {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-lg shimmer-loading" />)}
    </div>
  );

  if (records.length === 0 && profiles.length === 0) {
    return (
      <Card className="card-metallic glass-border">
        <CardContent className="py-12 text-center">
          <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No data yet. Run analyses to generate insights.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Leaders", value: new Set([...records.map(r => r.leader_a_name), ...records.map(r => r.leader_b_name)]).size },
          { label: "Pairings", value: records.length },
          { label: "Avg Score", value: records.length > 0 ? Math.round(records.reduce((a, r) => a + r.compatibility_score, 0) / records.length) : 0, suffix: "%" },
          { label: "Conflicts", value: records.filter(r => r.compatibility_score < 40).length },
        ].map((stat) => (
          <Card key={stat.label} className="card-metallic glass-border text-center py-4">
            <CardContent className="p-0">
              <AnimatedCounter value={stat.value} suffix={stat.suffix || ""} className="text-2xl font-bold text-primary" />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar Chart: Average Compatibility */}
      {barChartData.length > 0 && (
        <Card className="card-metallic glass-border shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Average Compatibility Per Leader
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 18%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(215, 12%, 52%)", fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "hsl(215, 12%, 52%)", fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="score" fill="hsl(213, 80%, 54%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Line Chart + Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {timeData.length > 1 && (
          <Card className="card-metallic glass-border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Performance Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 18%)" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(215, 12%, 52%)", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(215, 12%, 52%)", fontSize: 10 }} />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="score" stroke="hsl(213, 80%, 54%)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="avg" stroke="hsl(152, 55%, 42%)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {pieData.length > 0 && (
          <Card className="card-metallic glass-border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Leader Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

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
                    <div className="flex gap-2">
                      <Badge className="text-xs border-amber-500/30 text-amber-400" variant="outline">{s.conflict_count} conflicts</Badge>
                      <Badge variant="outline" className="text-xs border-border/50">Avg: {s.avg_compatibility}%</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Underperformers */}
      <Card className="card-metallic glass-border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="h-4 w-4 text-destructive" />
            Underperforming Leaders
          </CardTitle>
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
