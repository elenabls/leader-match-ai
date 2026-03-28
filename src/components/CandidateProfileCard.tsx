import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TraitBar from "./TraitBar";
import type { CandidateProfile } from "@/lib/types";

interface Props {
  profile: CandidateProfile;
  role: string;
  color: string;
}

const classificationColor = (c: string) => {
  if (c.toLowerCase().includes("speed")) return "bg-blue-500/10 text-blue-600 border-blue-200";
  if (c.toLowerCase().includes("quality")) return "bg-purple-500/10 text-purple-600 border-purple-200";
  return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
};

const CandidateProfileCard = ({ profile, role }: Props) => {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{profile.name}</CardTitle>
          <Badge variant="secondary" className="text-xs">{role}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`text-xs border ${classificationColor(profile.classification)}`} variant="outline">
            {profile.classification}
          </Badge>
          <span className="text-xs text-muted-foreground capitalize">
            {profile.traits.communication_style}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aggregated Traits</p>
          <TraitBar label="Speed (Execution)" value={profile.traits.speed} />
          <TraitBar label="Strictness (Detail)" value={profile.traits.strictness} />
          <TraitBar label="Risk Tolerance" value={profile.traits.risk_tolerance} />
          <TraitBar label="Reliability" value={profile.traits.reliability} />
          <TraitBar label="Emotional Intelligence" value={profile.traits.emotional_intelligence} />
          <TraitBar label="Experience" value={profile.traits.experience} />
        </div>

        {/* Detected Keywords */}
        {profile.detected_keywords && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Detected Keywords</p>
            <div className="space-y-1">
              {Object.entries(profile.detected_keywords).map(([category, keywords]) => {
                if (!keywords || keywords.length === 0) return null;
                const label = category.replace(/_/g, " ").replace("keywords", "").trim();
                return (
                  <div key={category} className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground w-16 shrink-0">{label}</span>
                    {(keywords as string[]).slice(0, 5).map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] font-normal px-1.5 py-0">{kw}</Badge>
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

        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Leadership Indicators</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.cv_analysis.leadership_indicators.map((ind, i) => (
              <Badge key={i} variant="outline" className="text-xs font-normal">{ind}</Badge>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Behavioral Signals</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.feedback_analysis.leadership_behavior_signals.map((sig, i) => (
              <Badge key={i} variant="outline" className="text-xs font-normal">{sig}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CandidateProfileCard;
