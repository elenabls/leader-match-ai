import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BulkAnalysisResult, BulkLeaderProfile, BulkPairing, BusinessFunction } from "@/lib/types";
import { Upload, FileSpreadsheet, Loader2, Users, Trophy, AlertTriangle, Info, ShieldAlert } from "lucide-react";
import TraitBar from "./TraitBar";
import * as XLSX from "xlsx";

const businessFunctions: { id: BusinessFunction; label: string }[] = [
  { id: "manufacturing", label: "Manufacturing" },
  { id: "quality_assurance", label: "Quality Assurance" },
  { id: "innovation", label: "Innovation" },
  { id: "operations", label: "Operations" },
];

const BulkAnalysisSection = () => {
  const [file, setFile] = useState<File | null>(null);
  const [leaders, setLeaders] = useState<{ name: string; data: string }[]>([]);
  const [businessFunction, setBusinessFunction] = useState<string>("operations");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkAnalysisResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
        const parsed = rows
          .filter((r) => r.Name || r.name)
          .map((r) => ({
            name: (r.Name || r.name || "").toString(),
            data: Object.entries(r)
              .filter(([k]) => k.toLowerCase() !== "name")
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n"),
          }));
        setLeaders(parsed);
        if (parsed.length === 0) toast.error("No valid rows found. Ensure there's a 'Name' column.");
        else toast.success(`Found ${parsed.length} leaders in the file.`);
      } catch {
        toast.error("Failed to parse Excel file.");
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const saveToDb = async (res: BulkAnalysisResult) => {
    try {
      // Save all leader profiles
      for (const l of res.leaders) {
        await supabase.from("leader_profiles").insert({
          name: l.name,
          classification: l.classification,
          suggested_role_fit: l.suggested_role_fit,
          traits: l.traits as any,
        });
      }
      // Save all pairings as performance records
      for (const p of res.pairings) {
        await supabase.from("performance_records").insert({
          leader_a_name: p.leaderA,
          leader_b_name: p.leaderB,
          compatibility_score: p.compatibility_score,
          scenario: p.best_scenario,
          outcome: "pending",
          strengths: p.strengths,
          risks: p.risks,
        });
      }
    } catch (e) {
      console.error("Bulk DB save error:", e);
    }
  };

  const handleAnalyze = async () => {
    if (leaders.length < 2) { toast.error("Need at least 2 leaders to analyze."); return; }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-leaders", {
        body: { mode: "bulk", leaders, businessFunction },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      const bulkResult = data as BulkAnalysisResult;
      setResult(bulkResult);
      await saveToDb(bulkResult);
      toast.success("Bulk analysis complete! Data saved to tracking & analytics.");
    } catch {
      toast.error("Bulk analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const sorted = result?.pairings?.slice().sort((a, b) => b.compatibility_score - a.compatibility_score) || [];
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse();

  const scoreColor = (s: number) =>
    s >= 70 ? "text-emerald-400" : s >= 45 ? "text-amber-400" : "text-destructive";
  const scoreBg = (s: number) =>
    s >= 70 ? "bg-emerald-500/10 border-emerald-500/20" : s >= 45 ? "bg-amber-500/10 border-amber-500/20" : "bg-destructive/10 border-destructive/20";

  return (
    <div className="space-y-6">
      {/* Upload */}
      <Card className="card-metallic glass-border shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Upload Leader Data (Excel)
          </CardTitle>
          <CardDescription>
            Upload an Excel file with a <strong className="text-foreground">Name</strong> column and data columns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {file ? (
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="text-foreground font-medium">{file.name}</span>
                <Badge variant="secondary" className="text-xs">{leaders.length} leaders</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setFile(null); setLeaders([]); setResult(null); }}>
                Change
              </Button>
            </div>
          ) : (
            <div
              className="flex cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-secondary/20 px-4 py-10 text-sm text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:bg-primary/5"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-5 w-5" />
              <span>Click to upload Excel file (.xlsx)</span>
            </div>
          )}
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Business Domain</label>
            <Select value={businessFunction} onValueChange={setBusinessFunction}>
              <SelectTrigger className="glass-border bg-secondary/30"><SelectValue /></SelectTrigger>
              <SelectContent>
                {businessFunctions.map((bf) => (
                  <SelectItem key={bf.id} value={bf.id}>{bf.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAnalyze} disabled={leaders.length < 2 || loading}
            className="w-full glow-primary-hover transition-all duration-300">
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing {leaders.length} leaders...</>
            ) : (
              <><Users className="mr-2 h-4 w-4" />Analyze All Leaders & Find Best Pairings</>
            )}
          </Button>

          {loading && (
            <div className="space-y-2">
              <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-1 rounded-full bg-primary shimmer-loading" style={{ width: "60%" }} />
              </div>
              <p className="text-xs text-center text-muted-foreground">Running 8-agent AI pipeline on all leaders...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          {/* Confidence Note */}
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="flex items-start gap-3 py-4">
              <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Data Confidence: <span className="text-amber-400">Low (CV-level only)</span></p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  These scores are based on limited data (CV-level inputs only). Full evaluation including
                  supervisor notes, recommendation letters, and peer reviews may significantly improve accuracy.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Leader Profiles */}
          <Card className="card-metallic glass-border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Leader Profiles</CardTitle>
              <CardDescription>{result.leaders.length} leaders analyzed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead>Name</TableHead>
                      <TableHead>Classification</TableHead>
                      <TableHead>Role Fit</TableHead>
                      <TableHead>Speed</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Reliability</TableHead>
                      <TableHead>EQ</TableHead>
                      <TableHead>Exp</TableHead>
                      <TableHead>Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.leaders.map((l, i) => (
                      <TableRow key={i} className="border-border/30">
                        <TableCell className="font-medium">{l.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs border-primary/30 text-primary">{l.classification}</Badge></TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{l.suggested_role_fit}</Badge></TableCell>
                        <TableCell className="tabular-nums">{l.traits.speed}</TableCell>
                        <TableCell className="tabular-nums">{l.traits.strictness}</TableCell>
                        <TableCell className="tabular-nums">{l.traits.risk_tolerance}</TableCell>
                        <TableCell className="tabular-nums">{l.traits.reliability}</TableCell>
                        <TableCell className="tabular-nums">{l.traits.emotional_intelligence}</TableCell>
                        <TableCell className="tabular-nums">{l.traits.experience}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">Low</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Top 5 Best Pairings */}
          <Card className="card-metallic glass-border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-4 w-4 text-emerald-400" />
                Top 5 Best Pairings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {top5.map((p, i) => (
                <div key={i} className={`rounded-lg border p-4 space-y-2 ${scoreBg(p.compatibility_score)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary/70">#{i + 1}</span>
                      <span className="text-sm font-medium text-foreground">{p.leaderA}</span>
                      <span className="text-xs text-muted-foreground">&</span>
                      <span className="text-sm font-medium text-foreground">{p.leaderB}</span>
                    </div>
                    <span className={`text-lg font-bold ${scoreColor(p.compatibility_score)} animate-count`}>
                      {p.compatibility_score}%
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs border-primary/20">Best: {p.best_scenario}</Badge>
                  {p.strengths.length > 0 && (
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {p.strengths.slice(0, 2).map((s, j) => (
                        <li key={j} className="flex gap-1.5">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top 5 Worst Pairings */}
          {bottom5.length > 0 && (
            <Card className="card-metallic glass-border shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  Top 5 Riskiest Pairings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bottom5.map((p, i) => (
                  <div key={i} className={`rounded-lg border p-4 space-y-2 ${scoreBg(p.compatibility_score)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{p.leaderA}</span>
                        <span className="text-xs text-muted-foreground">&</span>
                        <span className="text-sm font-medium text-foreground">{p.leaderB}</span>
                      </div>
                      <span className={`text-lg font-bold ${scoreColor(p.compatibility_score)}`}>
                        {p.compatibility_score}%
                      </span>
                    </div>
                    {p.risks.length > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {p.risks.slice(0, 2).map((r, j) => (
                          <li key={j} className="flex gap-1.5">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />{r}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkAnalysisSection;
