import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PerformanceRecord } from "@/lib/types";
import { Activity, CheckCircle, XCircle, Clock } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

const PerformanceTrackingSection = () => {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("performance_records").select("*").order("created_at", { ascending: false });
    if (!error && data) setRecords(data as unknown as PerformanceRecord[]);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  const updateOutcome = async (id: string, outcome: "success" | "failure") => {
    const { error } = await supabase.from("performance_records").update({ outcome }).eq("id", id);
    if (error) { toast.error("Failed to update."); return; }
    toast.success(`Marked as ${outcome}`);
    fetchRecords();
  };

  const outcomeIcon = (o: string) => {
    if (o === "success") return <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />;
    if (o === "failure") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const successCount = records.filter((r) => r.outcome === "success").length;
  const failCount = records.filter((r) => r.outcome === "failure").length;
  const pendingCount = records.filter((r) => r.outcome === "pending").length;
  const avgScore = records.length > 0
    ? Math.round(records.reduce((a, r) => a + r.compatibility_score, 0) / records.length) : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Successful", value: successCount, color: "text-emerald-400" },
          { label: "Failed", value: failCount, color: "text-destructive" },
          { label: "Pending", value: pendingCount, color: "text-muted-foreground" },
          { label: "Avg Score", value: avgScore, color: "text-primary", suffix: "%" },
        ].map((stat) => (
          <Card key={stat.label} className="card-metallic glass-border text-center py-4">
            <CardContent className="p-0">
              <AnimatedCounter value={stat.value} suffix={stat.suffix || ""} className={`text-2xl font-bold ${stat.color}`} />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Records Table */}
      <Card className="card-metallic glass-border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            Pairing History
          </CardTitle>
          <CardDescription>Track outcomes to improve future predictions.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3 py-8">
              {[1,2,3].map((i) => <div key={i} className="h-10 rounded-lg shimmer-loading" />)}
            </div>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No performance records yet. Run analyses and they'll appear here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead>Leader A</TableHead>
                    <TableHead>Leader B</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Scenario</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => {
                    const sc = r.compatibility_score >= 70 ? "text-emerald-400" : r.compatibility_score >= 45 ? "text-amber-400" : "text-destructive";
                    return (
                      <TableRow key={r.id} className="border-border/30">
                        <TableCell className="font-medium">{r.leader_a_name}</TableCell>
                        <TableCell className="font-medium">{r.leader_b_name}</TableCell>
                        <TableCell className={`font-bold tabular-nums ${sc}`}>{r.compatibility_score}%</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs capitalize border-border/50">{r.scenario}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {outcomeIcon(r.outcome)}
                            <span className="text-xs capitalize text-muted-foreground">{r.outcome}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {r.outcome === "pending" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                                onClick={() => updateOutcome(r.id, "success")}>
                                <CheckCircle className="h-3 w-3 mr-1" />Success
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
                                onClick={() => updateOutcome(r.id, "failure")}>
                                <XCircle className="h-3 w-3 mr-1" />Failure
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceTrackingSection;
