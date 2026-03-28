import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BulkAnalysisResult, BulkLeaderProfile, BulkPairing, BusinessFunction } from "@/lib/types";
import { Upload, FileSpreadsheet, Loader2, Users, Trophy, ShieldAlert, Info } from "lucide-react";
import TraitBar from "./TraitBar";
import RadarChartComponent from "./RadarChart";
import CompatibilityHeatmap from "./CompatibilityHeatmap";
import ColumnMappingDisplay, { ColumnMapping } from "./ColumnMappingDisplay";
import AnimatedCounter from "./AnimatedCounter";
import * as XLSX from "xlsx";

const businessFunctions: { id: BusinessFunction; label: string }[] = [
  { id: "manufacturing", label: "Manufacturing" },
  { id: "quality_assurance", label: "Quality Assurance" },
  { id: "innovation", label: "Innovation" },
  { id: "operations", label: "Operations" },
];

// Smart column detection and mapping
const TRAIT_COLUMN_PATTERNS: Record<string, string[]> = {
  name: ["name", "employee", "leader", "person", "full name", "employee name", "staff"],
  experience: ["experience", "years", "tenure", "seniority", "yrs", "exp"],
  performance: ["performance", "rating", "score", "evaluation", "kpi", "review"],
  department: ["department", "dept", "division", "unit", "team", "group"],
  feedback: ["feedback", "comments", "notes", "description", "remarks", "review text", "summary", "bio", "about", "skills", "competencies"],
  role: ["role", "position", "title", "job title", "designation"],
};

function detectColumnMappings(headers: string[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

  for (const header of headers) {
    const lower = header.toLowerCase().trim();
    let mapped = false;

    for (const [traitKey, patterns] of Object.entries(TRAIT_COLUMN_PATTERNS)) {
      if (patterns.some((p) => lower.includes(p) || p.includes(lower))) {
        mappings.push({
          original: header,
          mappedTo: traitKey === "name" ? "Leader Name" : traitKey === "experience" ? "Experience Level" :
            traitKey === "performance" ? "Performance Metrics" : traitKey === "department" ? "Department Context" :
              traitKey === "feedback" ? "Text for Trait Analysis" : "Role Context",
          confidence: traitKey === "name" || lower === traitKey ? "high" : "medium",
        });
        mapped = true;
        break;
      }
    }

    if (!mapped) {
      mappings.push({
        original: header,
        mappedTo: "Text for Trait Analysis",
        confidence: "low",
      });
    }
  }

  return mappings;
}

function findNameColumn(headers: string[]): string | null {
  for (const h of headers) {
    if (TRAIT_COLUMN_PATTERNS.name.some((p) => h.toLowerCase().includes(p))) return h;
  }
  return headers[0]; // fallback to first column
}

const BulkAnalysisSection = () => {
  const [file, setFile] = useState<File | null>(null);
  const [leaders, setLeaders] = useState<{ name: string; data: string }[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [businessFunction, setBusinessFunction] = useState<string>("operations");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
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

        if (rows.length === 0) { toast.error("No data rows found in the file."); return; }

        const headers = Object.keys(rows[0]);
        const mappings = detectColumnMappings(headers);
        setColumnMappings(mappings);

        const nameCol = findNameColumn(headers);

        const parsed = rows
          .filter((r) => nameCol && r[nameCol])
          .map((r) => ({
            name: (nameCol ? r[nameCol] : "Unknown").toString().trim(),
            data: Object.entries(r)
              .filter(([k]) => k !== nameCol)
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n"),
          }));

        setLeaders(parsed);
        if (parsed.length === 0) toast.error("No valid rows found.");
        else toast.success(`Found ${parsed.length} leaders. Columns auto-detected and mapped.`);
      } catch {
        toast.error("Failed to parse Excel file. Ensure it's a valid .xlsx file.");
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const saveToDb = async (res: BulkAnalysisResult) => {
    try {
      for (const l of res.leaders) {
        await supabase.from("leader_profiles").insert({
          name: l.name, classification: l.classification,
          suggested_role_fit: l.suggested_role_fit, traits: l.traits as any,
        });
      }
      for (const p of res.pairings) {
        await supabase.from("performance_records").insert({
          leader_a_name: p.leaderA, leader_b_name: p.leaderB,
          compatibility_score: p.compatibility_score, scenario: p.best_scenario,
          outcome: "pending", strengths: p.strengths, risks: p.risks,
        });
      }
    } catch (e) { console.error("Bulk DB save error:", e); }
  };

  const handleAnalyze = async () => {
    if (leaders.length < 2) { toast.error("Need at least 2 leaders to analyze."); return; }
    setLoading(true);
    setResult(null);
    setLoadingStep("Sending data to AI pipeline...");
    try {
      const steps = [
        "Standardizing input data...",
        "Running 8-agent AI pipeline...",
        "Extracting traits for all leaders...",
        "Generating pairings & compatibility scores...",
        "Finalizing analysis...",
      ];
      let stepIdx = 0;
      const stepInterval = setInterval(() => {
        stepIdx = Math.min(stepIdx + 1, steps.length - 1);
        setLoadingStep(steps[stepIdx]);
      }, 3000);

      const { data, error } = await supabase.functions.invoke("analyze-leaders", {
        body: { mode: "bulk", leaders, businessFunction },
      });

      clearInterval(stepInterval);

      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      const bulkResult = data as BulkAnalysisResult;
      setResult(bulkResult);
      await saveToDb(bulkResult);
      toast.success("Bulk analysis complete! Data saved to tracking & analytics.");
    } catch {
      toast.error("Bulk analysis failed. Please try again.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const sorted = result?.pairings?.slice().sort((a, b) => b.compatibility_score - a.compatibility_score) || [];
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse();
  const leaderNames = result?.leaders?.map((l) => l.name) || [];

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
            Upload Company Data
          </CardTitle>
          <CardDescription>
            Upload <strong className="text-foreground">any</strong> Excel file with employee data. The system will auto-detect columns and map them to leadership traits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {file ? (
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="text-foreground font-medium">{file.name}</span>
                <Badge variant="secondary" className="text-xs">{leaders.length} leaders detected</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setFile(null); setLeaders([]); setResult(null); setColumnMappings([]); }}>
                Change
              </Button>
            </div>
          ) : (
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/20 px-4 py-12 text-sm text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:bg-primary/5"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-6 w-6" />
              <span>Click to upload Excel file (.xlsx)</span>
              <span className="text-[10px] text-muted-foreground">Any format — columns will be auto-detected</span>
            </div>
          )}
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {/* Column Mapping Display */}
          {columnMappings.length > 0 && <ColumnMappingDisplay mappings={columnMappings} totalRows={leaders.length} />}

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
            className="w-full glow-primary-hover transition-all duration-300 h-12">
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{loadingStep}</>
            ) : (
              <><Users className="mr-2 h-4 w-4" />Analyze All Leaders & Generate Pairings</>
            )}
          </Button>

          {loading && (
            <div className="space-y-2">
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-primary to-primary/60 shimmer-loading" style={{ width: "70%" }} />
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <p className="text-xs text-muted-foreground">{loadingStep}</p>
              </div>
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

          {/* Radar Chart */}
          <Card className="card-metallic glass-border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Leader Trait Profiles</CardTitle>
              <CardDescription>Radar visualization of extracted leadership traits</CardDescription>
            </CardHeader>
            <CardContent>
              <RadarChartComponent leaders={result.leaders} />
            </CardContent>
          </Card>

          {/* Leader Profiles Table */}
          <Card className="card-metallic glass-border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Leader Classifications</CardTitle>
              <CardDescription>{result.leaders.length} leaders analyzed and classified</CardDescription>
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

          {/* Compatibility Heatmap */}
          {sorted.length > 0 && (
            <Card className="card-metallic glass-border shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Compatibility Matrix</CardTitle>
                <CardDescription>Heatmap showing pairwise compatibility scores</CardDescription>
              </CardHeader>
              <CardContent>
                <CompatibilityHeatmap leaders={leaderNames} pairings={sorted} />
              </CardContent>
            </Card>
          )}

          {/* Top 5 Best */}
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
                    <AnimatedCounter value={p.compatibility_score} className={`text-lg font-bold ${scoreColor(p.compatibility_score)}`} />
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

          {/* Top 5 Worst */}
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
                      <AnimatedCounter value={p.compatibility_score} className={`text-lg font-bold ${scoreColor(p.compatibility_score)}`} />
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
