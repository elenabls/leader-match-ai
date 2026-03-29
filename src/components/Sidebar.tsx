import { Brain, FileSpreadsheet, Activity, BarChart3, Download, Users, ChevronLeft, ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "home", label: "Dashboard", icon: Home, desc: "Overview & quick actions" },
  { id: "analyze", label: "Analysis", icon: Brain, desc: "Individual pair evaluation" },
  { id: "bulk", label: "Bulk Analysis", icon: FileSpreadsheet, desc: "Multi-leader processing" },
  { id: "tracking", label: "Tracking", icon: Activity, desc: "Performance history" },
  { id: "analytics", label: "Analytics", icon: BarChart3, desc: "Insights & charts" },
  { id: "export", label: "Export", icon: Download, desc: "Download reports" },
];

const Sidebar = ({ activeTab, onTabChange }: Props) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen z-30 flex flex-col border-r border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-300",
      collapsed ? "w-16" : "w-56"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border/30">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 glow-primary">
          <Brain className="h-4 w-4 text-primary" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-foreground tracking-tight">LeaderMatch <span className="text-primary">AI</span></p>
            <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Decision Intelligence</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
              activeTab === item.id
                ? "bg-primary/10 text-primary glow-primary"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-4 w-4 shrink-0", activeTab === item.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
            {!collapsed && (
              <div className="text-left overflow-hidden">
                <p className="font-medium">{item.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-2 mb-4 flex items-center justify-center gap-2 rounded-lg border border-border/30 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-all"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <><ChevronLeft className="h-3.5 w-3.5" /><span>Collapse</span></>}
      </button>
    </aside>
  );
};

export default Sidebar;
