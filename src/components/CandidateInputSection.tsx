import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { CandidateFiles } from "@/lib/types";
import { FileText, MessageSquare, Award, Users, Upload, X, CheckCircle } from "lucide-react";

interface Props {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  files: CandidateFiles;
  onFilesChange: (files: CandidateFiles) => void;
}

const fields: { key: keyof CandidateFiles; label: string; icon: React.ReactNode }[] = [
  { key: "cv", label: "CV / Resume (PDF)", icon: <FileText className="h-3.5 w-3.5" /> },
  { key: "supervisorNotes", label: "Supervisor Notes (PDF)", icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { key: "recommendationLetter", label: "Recommendation Letter (PDF)", icon: <Award className="h-3.5 w-3.5" /> },
  { key: "peerReviews", label: "Peer / Manager Reviews (PDF)", icon: <Users className="h-3.5 w-3.5" /> },
];

const CandidateInputSection = ({ title, subtitle, icon, files, onFilesChange }: Props) => {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileChange = (key: keyof CandidateFiles, file: File | null) => {
    onFilesChange({ ...files, [key]: file });
  };

  const removeFile = (key: keyof CandidateFiles) => {
    onFilesChange({ ...files, [key]: null });
    if (inputRefs.current[key]) {
      inputRefs.current[key]!.value = "";
    }
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2.5 text-lg">
          {icon}
          <div>
            <span>{title}</span>
            <span className="ml-2 text-sm font-normal text-muted-foreground">{subtitle}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.map((f) => {
          const file = files[f.key];
          return (
            <div key={f.key} className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {f.icon}
                {f.label}
              </Label>
              {file ? (
                <div className="flex items-center justify-between rounded-md border border-border bg-secondary/50 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="truncate text-foreground">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeFile(f.key)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background px-3 py-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5"
                  onClick={() => inputRefs.current[f.key]?.click()}
                >
                  <Upload className="h-4 w-4" />
                  <span>Click to upload PDF</span>
                </div>
              )}
              <input
                ref={(el) => { inputRefs.current[f.key] = el; }}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFileChange(f.key, e.target.files?.[0] || null)}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default CandidateInputSection;
