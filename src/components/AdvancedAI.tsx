import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Zap, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdvancedAI } from '@/hooks/useAdvancedAI';

export const AdvancedAI = () => {
  const [selectedKPI, setSelectedKPI] = useState('rlu-score');
  const { loading, chartData, kpiMetrics } = useAdvancedAI();

  const getKPIData = (kpi: string) => {
    switch (kpi) {
      case 'rlu-score': return chartData.rluScore;
      case 'lp-ratio': return chartData.lpRatio;
      case 'cpg-mismatch': return chartData.cpgMismatch;
      case 'duplicate-order': return chartData.duplicateOrder;
      case 'cp-ratio': return chartData.cpRatio;
      default: return chartData.rluScore;
    }
  };

  const getKPITitle = (kpi: string) => {
    switch (kpi) {
      case 'rlu-score': return 'RLU Score Prediction';
      case 'lp-ratio': return 'L/P Ratio Prediction';
      case 'cpg-mismatch': return 'CPG Mismatch Rate (%)';
      case 'duplicate-order': return 'Duplicate Order Rate (%)';
      case 'cp-ratio': return 'C/P Ratio Prediction';
      default: return 'KPI Prediction';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading predictive analytics...</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold text-foreground">Advanced AI Analytics</h2>
              <p className="text-sm text-muted-foreground">AI predictions based on last 3 months of real data</p>
            </div>
          </div>
          <Badge className="bg-primary/20 text-primary">
            <Zap className="w-3 h-3 mr-1" />
            Real-time AI
          </Badge>
        </div>

        <div className="space-y-6">
          {/* KPI Selector */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: 'rlu-score', label: 'RLU Score', icon: TrendingUp },
              { id: 'lp-ratio', label: 'L/P Ratio', icon: Target },
              { id: 'cpg-mismatch', label: 'CPG Mismatch', icon: AlertCircle },
              { id: 'duplicate-order', label: 'Duplicate Order', icon: Activity },
              { id: 'cp-ratio', label: 'C/P Ratio', icon: CheckCircle },
            ].map((kpi) => (
              <Button
                key={kpi.id}
                variant={selectedKPI === kpi.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedKPI(kpi.id)}
                className="flex items-center gap-2"
              >
                <kpi.icon className="w-4 h-4" />
                {kpi.label}
              </Button>
            ))}
          </div>

          {/* Prediction Chart */}
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">{getKPITitle(selectedKPI)}</h3>
              <p className="text-sm text-muted-foreground">AI-powered predictive analytics with historical comparison</p>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getKPIData(selectedKPI)}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => value.toFixed(1)} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => [parseFloat(value).toFixed(1), 'Value']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    name="Actual"
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={3}
                    strokeDasharray="8 5"
                    name="AI Prediction"
                    dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Current KPI Metrics */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
              {kpiMetrics.map((metric, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedKPI === 
                    ['rlu-score', 'lp-ratio', 'cpg-mismatch', 'duplicate-order', 'cp-ratio'][index]
                      ? 'bg-primary/10 border-primary' 
                      : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedKPI(['rlu-score', 'lp-ratio', 'cpg-mismatch', 'duplicate-order', 'cp-ratio'][index])}
                >
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{metric.name}</p>
                    <p className="text-lg font-bold text-foreground">{metric.current}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {metric.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 text-success" />
                      ) : (
                        <TrendingUp className="w-3 h-3 text-warning rotate-180" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        Next: {metric.predicted}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className={`text-xs font-medium ${metric.difference >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {metric.difference >= 0 ? '+' : ''}{metric.difference.toFixed(1)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Change vs current
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Insights Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-success/10">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="font-medium text-success">Best Performing KPI</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  RLU Score shows consistent improvement with 96.8% prediction accuracy
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-warning/10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <span className="font-medium text-warning">Needs Attention</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  CPG Mismatch requires focus to meet target reduction goals
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};