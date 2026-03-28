import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import type { PerformanceRecord } from "@/lib/types";

const ExportSection = () => {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: recs }, { data: profs }] = await Promise.all([
        supabase.from("performance_records").select("*").order("created_at", { ascending: false }),
        supabase.from("leader_profiles").select("*").order("created_at", { ascending: false }),
      ]);
      if (recs) setRecords(recs as unknown as PerformanceRecord[]);
      if (profs) setProfiles(profs);
    };
    fetch();
  }, []);

  const handleExport = () => {
    setLoading(true);
    try {
      const wb = XLSX.utils.book_new();

      // Leader Classifications
      if (profiles.length > 0) {
        const classData = profiles.map((p) => ({
          Name: p.name,
          Classification: p.classification,
          "Role Fit": p.suggested_role_fit,
          Speed: p.traits?.speed || "",
          Quality: p.traits?.strictness || "",
          "Risk Tolerance": p.traits?.risk_tolerance || "",
          Reliability: p.traits?.reliability || "",
          EQ: p.traits?.emotional_intelligence || "",
          Experience: p.traits?.experience || "",
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(classData), "Leader Classifications");
      }

      // Compatibility Scores
      if (records.length > 0) {
        const compData = records.map((r) => ({
          "Leader A": r.leader_a_name,
          "Leader B": r.leader_b_name,
          "Compatibility Score": r.compatibility_score,
          Scenario: r.scenario,
          Outcome: r.outcome,
          Strengths: ((r as any).strengths || []).join("; "),
          Risks: ((r as any).risks || []).join("; "),
          Date: new Date(r.created_at).toLocaleDateString(),
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(compData), "Compatibility Scores");
      }

      // Underperformers
      const leaderMap = new Map<string, { scores: number[]; outcomes: string[] }>();
      records.forEach((r) => {
        for (const name of [r.leader_a_name, r.leader_b_name]) {
          if (!leaderMap.has(name)) leaderMap.set(name, { scores: [], outcomes: [] });
          const e = leaderMap.get(name)!;
          e.scores.push(r.compatibility_score);
          e.outcomes.push(r.outcome);
        }
      });

      const underData = Array.from(leaderMap.entries())
        .map(([name, data]) => {
          const avg = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
          const decided = data.outcomes.filter((o) => o !== "pending").length;
          const success = data.outcomes.filter((o) => o === "success").length;
          const rate = decided > 0 ? Math.round((success / decided) * 100) : 0;
          return { Name: name, "Avg Compatibility": avg, "Success Rate": `${rate}%`, "Total Pairings": data.scores.length };
        })
        .filter((d) => d["Avg Compatibility"] < 50);

      if (underData.length > 0) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(underData), "Underperformers");
      }

      // Best Pairings
      if (records.length > 0) {
        const bestData = records
          .filter((r) => r.compatibility_score >= 70)
          .sort((a, b) => b.compatibility_score - a.compatibility_score)
          .map((r) => ({
            "Leader A": r.leader_a_name,
            "Leader B": r.leader_b_name,
            Score: r.compatibility_score,
            Scenario: r.scenario,
          }));
        if (bestData.length > 0) {
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bestData), "Best Pairings");
        }
      }

      XLSX.writeFile(wb, "LeaderMatch_Report.xlsx");
      toast.success("Report exported successfully!");
    } catch {
      toast.error("Export failed.");
    } finally {
      setLoading(false);
    }
  };

  const totalProfiles = profiles.length;
  const totalRecords = records.length;

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Export Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download a comprehensive Excel report including leader classifications, compatibility scores, best pairings, underperformers, and training recommendations.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{totalProfiles}</p>
              <p className="text-xs text-muted-foreground">Leader Profiles</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{totalRecords}</p>
              <p className="text-xs text-muted-foreground">Pairing Records</p>
            </div>
          </div>
          <Button onClick={handleExport} disabled={loading || (totalProfiles === 0 && totalRecords === 0)} className="w-full">
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
            ) : (
              <><Download className="mr-2 h-4 w-4" />Export Full Report (.xlsx)</>
            )}
          </Button>
          {totalProfiles === 0 && totalRecords === 0 && (
            <p className="text-xs text-muted-foreground text-center">Run analyses first to have data to export.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportSection;
