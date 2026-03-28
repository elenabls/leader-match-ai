import { ResponsiveContainer, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from "recharts";
import type { BulkLeaderProfile, CandidateProfile } from "@/lib/types";

interface Props {
  leaders: (BulkLeaderProfile | CandidateProfile)[];
  maxLeaders?: number;
}

const COLORS = [
  "hsl(213, 80%, 54%)",
  "hsl(152, 55%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 68%, 52%)",
  "hsl(180, 50%, 45%)",
];

const RadarChartComponent = ({ leaders, maxLeaders = 6 }: Props) => {
  const displayed = leaders.slice(0, maxLeaders);
  const traits = ["speed", "strictness", "risk_tolerance", "reliability", "emotional_intelligence", "experience"] as const;
  const traitLabels: Record<string, string> = {
    speed: "Speed",
    strictness: "Quality",
    risk_tolerance: "Risk",
    reliability: "Reliability",
    emotional_intelligence: "EQ",
    experience: "Experience",
  };

  const data = traits.map((trait) => {
    const point: Record<string, string | number> = { trait: traitLabels[trait] };
    displayed.forEach((l) => {
      point[l.name] = l.traits[trait] || 0;
    });
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsRadar data={data}>
        <PolarGrid stroke="hsl(220, 12%, 22%)" />
        <PolarAngleAxis dataKey="trait" tick={{ fill: "hsl(215, 12%, 52%)", fontSize: 11 }} />
        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: "hsl(215, 12%, 40%)", fontSize: 9 }} />
        {displayed.map((l, i) => (
          <Radar
            key={l.name}
            name={l.name}
            dataKey={l.name}
            stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={0.12}
            strokeWidth={2}
          />
        ))}
        <Legend wrapperStyle={{ fontSize: 11, color: "hsl(210, 20%, 72%)" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(220, 15%, 11%)",
            border: "1px solid hsl(220, 12%, 22%)",
            borderRadius: "8px",
            fontSize: 12,
          }}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  );
};

export default RadarChartComponent;
