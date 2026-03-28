import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BulkAnalysisResult, BulkLeaderProfile, BulkPairing, BusinessFunction } from "@/lib/types";
import { Upload, FileSpreadsheet, Loader2, Users, Trophy, AlertTriangle } from "lucide-react";
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

  const handleAnalyze = async () => {
    if (leaders.length < 2) {
      toast.error("Need at least 2 leaders to analyze.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-leaders", {
        body: { mode: "bulk", leaders, businessFunction },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setResult(data as BulkAnalysisResult);
      toast.success("Bulk analysis complete!");
    } catch {
      toast.error("Bulk analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Upload Leader Data (Excel)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload an Excel file with a <strong>Name</strong> column and additional data columns (CV text, notes, skills, etc.).
          </p>
          {file ? (
            <div className="flex items-center justify-between rounded-md border border-border bg-secondary/50 px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="text-foreground">{file.name}</span>
                <Badge variant="secondary">{leaders.length} leaders</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setFile(null); setLeaders([]); setResult(null); }}>
                Change
              </Button>
            </div>
          ) : (
            <div
              className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background px-3 py-8 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-5 w-5" />
              <span>Click to upload Excel file (.xlsx)</span>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Business Domain</label>
            <Select value={businessFunction} onValueChange={setBusinessFunction}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {businessFunctions.map((bf) => (
                  <SelectItem key={bf.id} value={bf.id}>{bf.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAnalyze} disabled={leaders.length < 2 || loading} className="w-full">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing {leaders.length} leaders...</> : <>
              <Users className="mr-2 h-4 w-4" />Analyze All Leaders & Find Best Pairings
            </>}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          {/* Leader Profiles */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Leader Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Classification</TableHead>
                      <TableHead>Role Fit</TableHead>
                      <TableHead>Speed</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Reliability</TableHead>
                      <TableHead>EQ</TableHead>
                      <TableHead>Experience</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.leaders.map((l, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{l.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{l.classification}</Badge></TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{l.suggested_role_fit}</Badge></TableCell>
                        <TableCell>{l.traits.speed}</TableCell>
                        <TableCell>{l.traits.strictness}</TableCell>
                        <TableCell>{l.traits.risk_tolerance}</TableCell>
                        <TableCell>{l.traits.reliability}</TableCell>
                        <TableCell>{l.traits.emotional_intelligence}</TableCell>
                        <TableCell>{l.traits.experience}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Best Pairings */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-4 w-4 text-primary" />
                Ranked Pairings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.pairings
                .sort((a, b) => b.compatibility_score - a.compatibility_score)
                .map((p, i) => {
                  const scoreColor = p.compatibility_score >= 75 ? "text-emerald-600" : p.compatibility_score >= 50 ? "text-amber-600" : "text-destructive";
                  return (
                    <div key={i} className="rounded-lg border border-border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{p.leaderA}</span>
                          <span className="text-xs text-muted-foreground">&</span>
                          <span className="text-sm font-medium text-foreground">{p.leaderB}</span>
                        </div>
                        <span className={`text-lg font-bold ${scoreColor}`}>{p.compatibility_score}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Best: {p.best_scenario}</Badge>
                      </div>
                      {p.strengths.length > 0 && (
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {p.strengths.slice(0, 2).map((s, j) => (
                            <li key={j} className="flex gap-1.5">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />{s}
                            </li>
                          ))}
                        </ul>
                      )}
                      {p.risks.length > 0 && (
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {p.risks.slice(0, 2).map((r, j) => (
                            <li key={j} className="flex gap-1.5">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{r}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BulkAnalysisSection;
