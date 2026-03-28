import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, Database } from "lucide-react";

export interface ColumnMapping {
  original: string;
  mappedTo: string;
  confidence: "high" | "medium" | "low";
}

interface Props {
  mappings: ColumnMapping[];
  totalRows: number;
}

const confColor = {
  high: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
  medium: "border-amber-500/30 text-amber-400 bg-amber-500/10",
  low: "border-destructive/30 text-destructive bg-destructive/10",
};

const ColumnMappingDisplay = ({ mappings, totalRows }: Props) => (
  <Card className="card-metallic glass-border">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-sm">
        <Database className="h-4 w-4 text-primary" />
        Data Standardization
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-center gap-2 text-xs">
        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-emerald-400 font-medium">Data successfully standardized for analysis</span>
        <Badge variant="secondary" className="text-[10px]">{totalRows} records</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {mappings.map((m) => (
          <div key={m.original} className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 px-3 py-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">{m.original}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-foreground font-medium">{m.mappedTo}</span>
            </div>
            <Badge className={`text-[9px] ${confColor[m.confidence]}`} variant="outline">
              {m.confidence}
            </Badge>
          </div>
        ))}
      </div>
      {mappings.some((m) => m.confidence === "low") && (
        <div className="flex items-start gap-2 text-xs text-amber-400 mt-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>Some columns were mapped with low confidence. Trait estimates may be less accurate.</span>
        </div>
      )}
    </CardContent>
  </Card>
);

export default ColumnMappingDisplay;
