import type { BulkPairing } from "@/lib/types";

interface Props {
  leaders: string[];
  pairings: BulkPairing[];
}

const CompatibilityHeatmap = ({ leaders, pairings }: Props) => {
  const getScore = (a: string, b: string): number | null => {
    if (a === b) return null;
    const p = pairings.find(
      (p) => (p.leaderA === a && p.leaderB === b) || (p.leaderA === b && p.leaderB === a)
    );
    return p?.compatibility_score ?? null;
  };

  const cellColor = (score: number | null) => {
    if (score === null) return "bg-secondary/30";
    if (score >= 70) return "bg-emerald-500/30 text-emerald-300";
    if (score >= 50) return "bg-amber-500/25 text-amber-300";
    return "bg-destructive/25 text-red-300";
  };

  if (leaders.length > 12) {
    const displayed = leaders.slice(0, 12);
    return <HeatmapGrid leaders={displayed} getScore={getScore} cellColor={cellColor} />;
  }

  return <HeatmapGrid leaders={leaders} getScore={getScore} cellColor={cellColor} />;
};

const HeatmapGrid = ({
  leaders,
  getScore,
  cellColor,
}: {
  leaders: string[];
  getScore: (a: string, b: string) => number | null;
  cellColor: (s: number | null) => string;
}) => (
  <div className="overflow-x-auto">
    <div className="inline-grid" style={{ gridTemplateColumns: `120px repeat(${leaders.length}, 52px)` }}>
      {/* Header row */}
      <div />
      {leaders.map((l) => (
        <div key={l} className="text-[9px] text-muted-foreground font-medium text-center py-1 truncate px-1">
          {l.split(" ")[0]}
        </div>
      ))}
      {/* Data rows */}
      {leaders.map((rowLeader) => (
        <>
          <div key={`label-${rowLeader}`} className="text-xs text-muted-foreground font-medium flex items-center truncate pr-2">
            {rowLeader}
          </div>
          {leaders.map((colLeader) => {
            const score = getScore(rowLeader, colLeader);
            return (
              <div
                key={`${rowLeader}-${colLeader}`}
                className={`h-10 flex items-center justify-center text-xs font-bold rounded-sm m-0.5 transition-all duration-200 hover:scale-110 ${cellColor(score)}`}
              >
                {score !== null ? score : "—"}
              </div>
            );
          })}
        </>
      ))}
    </div>
  </div>
);

export default CompatibilityHeatmap;
