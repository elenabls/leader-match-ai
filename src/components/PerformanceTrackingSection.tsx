import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PerformanceRecord } from "@/lib/types";
import { Activity, CheckCircle, XCircle, Clock, Plus } from "lucide-react";

const PerformanceTrackingSection = () => {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("performance_records")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setRecords(data as unknown as PerformanceRecord[]);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  const updateOutcome = async (id: string, outcome: "success" | "failure") => {
    const { error } = await supabase
      .from("performance_records")
      .update({ outcome })
      .eq("id", id);
    if (error) { toast.error("Failed to update."); return; }
    toast.success(`Marked as ${outcome}`);
    fetchRecords();
  };

  const outcomeIcon = (o: string) => {
    if (o === "success") return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    if (o === "failure") return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const outcomeColor = (o: string) => {
    if (o === "success") return "bg-emerald-500/10 text-emerald-600";
    if (o === "failure") return "bg-destructive/10 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  const successCount = records.filter((r) => r.outcome === "success").length;
  const failCount = records.filter((r) => r.outcome === "failure").length;
  const pendingCount = records.filter((r) => r.outcome === "pending").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border shadow-sm text-center py-4">
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-emerald-600">{successCount}</p>
            <p className="text-xs text-muted-foreground">Successful</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm text-center py-4">
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-destructive">{failCount}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm text-center py-4">
          <CardContent className="p-0">
            <p className="text-2xl font-bold text-muted-foreground">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            Pairing History
          </CardTitle>
          <CardDescription>Track outcomes of leader pairings to improve future predictions.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading records...</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No performance records yet. Run analyses and they'll appear here automatically.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                    const scoreColor = r.compatibility_score >= 75 ? "text-emerald-600" : r.compatibility_score >= 50 ? "text-amber-600" : "text-destructive";
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.leader_a_name}</TableCell>
                        <TableCell className="font-medium">{r.leader_b_name}</TableCell>
                        <TableCell className={`font-bold ${scoreColor}`}>{r.compatibility_score}%</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs capitalize">{r.scenario}</Badge></TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${outcomeColor(r.outcome)}`} variant="outline">
                            {outcomeIcon(r.outcome)}
                            <span className="ml-1 capitalize">{r.outcome}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {r.outcome === "pending" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateOutcome(r.id, "success")}>
                                <CheckCircle className="h-3 w-3 mr-1" />Success
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateOutcome(r.id, "failure")}>
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
