import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  description?: string;
  color?: "primary" | "success" | "warning" | "destructive";
  currentMonthAvg?: number;
  previousMonthAvg?: number;
  overallAvg?: number;
  difference?: number;
}

export const KPICard = ({
  title,
  value,
  previousValue,
  icon: Icon,
  trend = "neutral",
  description,
  color = "primary",
  currentMonthAvg,
  previousMonthAvg,
  overallAvg,
  difference
}: KPICardProps) => {
  const getTrendIcon = () => {
    if (trend === "up") return "↗";
    if (trend === "down") return "↘";
    return "→";
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-success";
    if (trend === "down") return "text-destructive";
    return "text-muted-foreground";
  };

  const getIconColor = () => {
    switch (color) {
      case "success": return "text-success";
      case "warning": return "text-warning";
      case "destructive": return "text-destructive";
      default: return "text-primary";
    }
  };

  return (
    <Card className="kpi-card group hover:scale-105 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <div className="flex items-end space-x-2">
            <span className="kpi-value">{value}</span>
            {difference !== undefined && (
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {getTrendIcon()} {Math.abs(difference).toFixed(2)}
              </span>
            )}
          </div>
          
          {/* KPI Details */}
          {(currentMonthAvg !== undefined || previousMonthAvg !== undefined || overallAvg !== undefined) && (
            <div className="mt-3 space-y-1">
              {currentMonthAvg !== undefined && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Current Month:</span>
                  <span className="font-medium">{currentMonthAvg.toFixed(2)}</span>
                </div>
              )}
              {previousMonthAvg !== undefined && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Previous Month:</span>
                  <span className="font-medium">{previousMonthAvg.toFixed(2)}</span>
                </div>
              )}
              {overallAvg !== undefined && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Overall Average:</span>
                  <span className="font-medium">{overallAvg.toFixed(2)}</span>
                </div>
              )}
              {difference !== undefined && (
                <div className="flex justify-between text-xs pt-1 border-t border-muted/30">
                  <span className="text-muted-foreground">Difference:</span>
                  <span className={`font-medium ${getTrendColor()}`}>
                    {difference > 0 ? '+' : ''}{difference.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {description && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-muted/50 ${getIconColor()} group-hover:scale-110 transition-smooth`}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );
};