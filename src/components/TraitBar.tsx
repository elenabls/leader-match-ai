interface Props {
  label: string;
  value: number;
  max?: number;
}

const TraitBar = ({ label, value, max = 10 }: Props) => {
  const pct = Math.round((value / max) * 100);
  const barColor =
    pct >= 70 ? "from-primary to-primary/70" : pct >= 40 ? "from-amber-500 to-amber-500/70" : "from-destructive to-destructive/70";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground tabular-nums">{value}/{max}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary">
        <div
          className={`h-1.5 rounded-full bg-gradient-to-r ${barColor} transition-all duration-1000 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default TraitBar;
