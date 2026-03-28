import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { type CandidateInput } from "@/lib/types";
import { FileText, MessageSquare, Award, Users } from "lucide-react";

interface Props {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  value: CandidateInput;
  onChange: (value: CandidateInput) => void;
}

const fields: { key: keyof CandidateInput; label: string; icon: React.ReactNode; placeholder: string }[] = [
  { key: "cv", label: "CV / Resume", icon: <FileText className="h-3.5 w-3.5" />, placeholder: "Paste the candidate's CV or resume content here..." },
  { key: "supervisorNotes", label: "Supervisor Notes", icon: <MessageSquare className="h-3.5 w-3.5" />, placeholder: "Paste supervisor evaluation notes..." },
  { key: "recommendationLetter", label: "Recommendation Letter", icon: <Award className="h-3.5 w-3.5" />, placeholder: "Paste recommendation letter content..." },
  { key: "peerReviews", label: "Peer / Manager Reviews", icon: <Users className="h-3.5 w-3.5" />, placeholder: "Paste peer and manager review feedback..." },
];

const CandidateInputSection = ({ title, subtitle, icon, value, onChange }: Props) => {
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
      <CardContent className="space-y-4">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {f.icon}
              {f.label}
            </Label>
            <Textarea
              value={value[f.key]}
              onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="min-h-[80px] resize-y text-sm"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CandidateInputSection;
