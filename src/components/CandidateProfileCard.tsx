import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TraitBar from "./TraitBar";
import type { CandidateProfile } from "@/lib/types";

interface Props {
  profile: CandidateProfile;
  role: string;
  color: string;
}

const CandidateProfileCard = ({ profile, role, color }: Props) => {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{profile.name}</CardTitle>
          <Badge variant="secondary" className="text-xs">{role}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Communication: <span className="font-medium text-foreground capitalize">{profile.traits.communication_style}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aggregated Traits</p>
          <TraitBar label="Speed (Execution)" value={profile.traits.speed} />
          <TraitBar label="Strictness (Detail)" value={profile.traits.strictness} />
          <TraitBar label="Risk Tolerance" value={profile.traits.risk_tolerance} />
          <TraitBar label="Emotional Intelligence" value={profile.traits.emotional_intelligence} />
          <TraitBar label="Experience" value={profile.traits.experience} />
        </div>

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
