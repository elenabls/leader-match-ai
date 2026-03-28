import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import type { PerformanceRecord } from "@/lib/types";
import AnimatedCounter from "./AnimatedCounter";

const ExportSection = () => {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: recs }, { data: profs }] = await Promise.all([
        supabase.from("performance_records").select("*").order("created_at", { ascending: false }),
        supabase.from("leader_profiles").select("*").order("created_at", { ascending: false }),
      ]);
      if (recs) setRecords(recs as unknown as PerformanceRecord[]);
      if (profs) setProfiles(profs);
    };
    fetchData();
  }, []);

  const handleExport = () => {
    setLoading(true);
    try {
      const wb = XLSX.utils.book_new();

      if (profiles.length > 0) {
        const classData = profiles.map((p) => ({
          Name: p.name, Classification: p.classification, "Role Fit": p.suggested_role_fit,
          Speed: p.traits?.speed || "", Quality: p.traits?.strictness || "",
          "Risk Tolerance": p.traits?.risk_tolerance || "", Reliability: p.traits?.reliability || "",
          EQ: p.traits?.emotional_intelligence || "", Experience: p.traits?.experience || "",
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(classData), "Leader Classifications");
      }

      if (records.length > 0) {
        const compData = records.map((r) => ({
          "Leader A": r.leader_a_name, "Leader B": r.leader_b_name,
          "Compatibility Score": r.compatibility_score, Scenario: r.scenario, Outcome: r.outcome,
          Strengths: ((r as any).strengths || []).join("; "),
          Risks: ((r as any).risks || []).join("; "),
          Date: new Date(r.created_at).toLocaleDateString(),
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(compData), "Compatibility Scores");
      }

      // Best team combinations
      if (records.length > 0) {
        const bestData = records.filter((r) => r.compatibility_score >= 70)
          .sort((a, b) => b.compatibility_score - a.compatibility_score)
          .map((r) => ({
            "Leader A": r.leader_a_name, "Leader B": r.leader_b_name,
            Score: r.compatibility_score, Scenario: r.scenario,
          }));
        if (bestData.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bestData), "Best Team Combinations");
      }

      // Underperformers
      const leaderMap = new Map<string, { scores: number[]; outcomes: string[] }>();
      records.forEach((r) => {
        for (const name of [r.leader_a_name, r.leader_b_name]) {
          if (!leaderMap.has(name)) leaderMap.set(name, { scores: [], outcomes: [] });
          const e = leaderMap.get(name)!;
          e.scores.push(r.compatibility_score); e.outcomes.push(r.outcome);
        }
      });

      const underData = Array.from(leaderMap.entries()).map(([name, data]) => {
        const avg = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
        const decided = data.outcomes.filter((o) => o !== "pending").length;
        const success = data.outcomes.filter((o) => o === "success").length;
        const rate = decided > 0 ? Math.round((success / decided) * 100) : 0;
        const conflicts = data.scores.filter((s) => s < 40).length;

        const suggestions: string[] = [];
        if (avg < 50) suggestions.push("Pair with complementary leaders");
        if (conflicts > 2) suggestions.push("Improve communication & flexibility");
        if (rate < 50 && decided > 0) suggestions.push("Review speed vs quality balance");

        return {
          Name: name, "Avg Compatibility": avg, "Success Rate": `${rate}%`,
          "Total Pairings": data.scores.length, "Conflict Count": conflicts,
          "Suggested Improvements": suggestions.join("; "),
        };
      }).filter((d) => d["Avg Compatibility"] < 50);

      if (underData.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(underData), "Underperformers");

      // Conflict-heavy leaders
      const conflictData = Array.from(leaderMap.entries())
        .map(([name, data]) => ({
          Name: name,
          "Conflict Count": data.scores.filter((s) => s < 40).length,
          "Avg Score": Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        }))
        .filter((d) => d["Conflict Count"] >= 2)
        .sort((a, b) => b["Conflict Count"] - a["Conflict Count"]);

      if (conflictData.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(conflictData), "Conflict Leaders");

      XLSX.writeFile(wb, "LeaderMatch_Report.xlsx");
      toast.success("Report exported successfully!");
    } catch { toast.error("Export failed."); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <Card className="card-metallic glass-border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Export Report
          </CardTitle>
          <CardDescription>Download a comprehensive Excel report with all analysis data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: profiles.length, label: "Leader Profiles" },
              { value: records.length, label: "Pairing Records" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border/50 bg-secondary/20 p-4 text-center">
                <AnimatedCounter value={stat.value} suffix="" className="text-2xl font-bold text-foreground" />
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground text-sm">Report includes:</p>
            <ul className="grid grid-cols-2 gap-1">
              {["Leader Classifications", "Compatibility Rankings", "Best Team Combinations", "Underperformers", "Conflict Leaders", "Improvement Suggestions"].map((item) => (
                <li key={item} className="flex gap-1.5 items-center">
                  <span className="h-1 w-1 rounded-full bg-primary shrink-0" />{item}
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={handleExport} disabled={loading || (profiles.length === 0 && records.length === 0)}
            className="w-full glow-primary-hover transition-all duration-300 h-12">
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
            ) : (
              <><Download className="mr-2 h-4 w-4" />Export Full Report (.xlsx)</>
            )}
          </Button>
          {profiles.length === 0 && records.length === 0 && (
            <p className="text-xs text-muted-foreground text-center">Run analyses first to have data to export.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportSection;
