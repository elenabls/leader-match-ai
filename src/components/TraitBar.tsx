interface Props {
  label: string;
  value: number;
  max?: number;
}

const TraitBar = ({ label, value, max = 10 }: Props) => {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}/{max}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary">
        <div
          className="h-2 rounded-full bg-primary transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default TraitBar;
