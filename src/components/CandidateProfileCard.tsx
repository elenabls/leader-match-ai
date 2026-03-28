import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TraitBar from "./TraitBar";
import type { CandidateProfile } from "@/lib/types";
import { Briefcase } from "lucide-react";

interface Props {
  profile: CandidateProfile;
  role?: string;
}

const classificationColor = (c: string) => {
  if (c.toLowerCase().includes("speed")) return "border-primary/30 text-primary";
  if (c.toLowerCase().includes("quality")) return "border-purple-500/30 text-purple-400";
  if (c.toLowerCase().includes("hybrid")) return "border-amber-500/30 text-amber-400";
  return "border-emerald-500/30 text-emerald-400";
};

const CandidateProfileCard = ({ profile, role }: Props) => {
  return (
    <Card className="card-metallic glass-border shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{profile.name}</CardTitle>
          {role && <Badge variant="secondary" className="text-xs">{role}</Badge>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-xs border ${classificationColor(profile.classification)}`} variant="outline">
            {profile.classification}
          </Badge>
          {profile.suggested_role_fit && (
            <Badge className="text-xs border-muted-foreground/20 text-muted-foreground" variant="outline">
              <Briefcase className="h-3 w-3 mr-1" />
              {profile.suggested_role_fit}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground capitalize">{profile.traits.communication_style}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Aggregated Traits</p>
          <TraitBar label="Speed (Execution)" value={profile.traits.speed} />
          <TraitBar label="Quality (Strictness)" value={profile.traits.strictness} />
          <TraitBar label="Risk Tolerance" value={profile.traits.risk_tolerance} />
          <TraitBar label="Reliability" value={profile.traits.reliability} />
          <TraitBar label="Emotional Intelligence" value={profile.traits.emotional_intelligence} />
          <TraitBar label="Experience" value={profile.traits.experience} />
        </div>

        {profile.detected_keywords && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Detected Keywords</p>
            <div className="space-y-1">
              {Object.entries(profile.detected_keywords).map(([category, keywords]) => {
                if (!keywords || keywords.length === 0) return null;
                const label = category.replace(/_/g, " ").replace("keywords", "").trim();
                return (
                  <div key={category} className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground w-16 shrink-0">{label}</span>
                    {(keywords as string[]).slice(0, 5).map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] font-normal px-1.5 py-0 border-border/50">{kw}</Badge>
                    ))}
                    {(keywords as string[]).length > 5 && (
                      <span className="text-[10px] text-muted-foreground">+{(keywords as string[]).length - 5}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {profile.cv_analysis?.leadership_indicators?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Leadership Indicators</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.cv_analysis.leadership_indicators.map((ind, i) => (
                <Badge key={i} variant="outline" className="text-xs font-normal border-primary/20 text-primary/80">{ind}</Badge>
              ))}
            </div>
          </div>
        )}

        {profile.feedback_analysis?.leadership_behavior_signals?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Behavioral Signals</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.feedback_analysis.leadership_behavior_signals.map((sig, i) => (
                <Badge key={i} variant="outline" className="text-xs font-normal border-border/50">{sig}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CandidateProfileCard;
