import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Insight {
  id: string;
  type: 'opportunity' | 'warning' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  department?: string;
}

interface ChartData {
  rluScore: Array<{ month: string; value: number; }>;
  lpRatio: Array<{ month: string; value: number; }>;
  cpgMismatch: Array<{ month: string; value: number; }>;
  duplicateOrder: Array<{ month: string; value: number; }>;
  cpRatio: Array<{ month: string; value: number; }>;
  activePhysicians: Array<{ month: string; value: number; }>;
}

interface TopDoctor {
  id: string;
  name: string;
  department: string;
  score: number;
  cpgMismatch: number;
  duplicateOrder: number;
  specialization: string;
}

interface AIInsightsProps {
  chartData?: ChartData;
  topDoctors?: TopDoctor[];
}

// Generate comprehensive trend analysis for all charts
const generateInsightsFromData = (chartData: ChartData, topDoctors: TopDoctor[]): Insight[] => {
  const insights: Insight[] = [];

  // Analyze RLU Score trend
  if (chartData.rluScore && chartData.rluScore.length >= 2) {
    const latest = chartData.rluScore[chartData.rluScore.length - 1]?.value || 0;
    const previous = chartData.rluScore[chartData.rluScore.length - 2]?.value || 0;
    const trend = latest - previous;
    const changePercent = previous !== 0 ? Math.abs((trend / previous) * 100) : 0;

    if (trend > 0) {
      insights.push({
        id: 'rlu-trend-positive',
        type: 'opportunity',
        title: 'RLU Score Showing Positive Momentum',
        description: `RLU Score increased by ${trend.toFixed(1)} points (${changePercent.toFixed(1)}%) from last month. This indicates improved laboratory utilization efficiency. Recommend implementing best practice sharing sessions, creating standardized protocols, and establishing peer mentoring programs to sustain this upward trajectory.`,
        impact: 'high'
      });
    } else if (trend < 0) {
      insights.push({
        id: 'rlu-trend-declining',
        type: 'warning',
        title: 'RLU Score Requires Strategic Focus',
        description: `RLU Score decreased by ${Math.abs(trend).toFixed(1)} points (${changePercent.toFixed(1)}%). Opportunity for improvement through targeted training programs, enhanced decision support tools, and real-time feedback mechanisms. Consider implementing quality improvement initiatives and regular performance reviews.`,
        impact: 'high'
      });
    } else {
      insights.push({
        id: 'rlu-trend-stable',
        type: 'recommendation',
        title: 'RLU Score Maintains Stability',
        description: `RLU Score remains stable at ${latest.toFixed(1)} points. This consistency provides a solid foundation for optimization. Recommend introducing continuous improvement cycles, advanced analytics, and proactive quality enhancement measures to drive breakthrough improvements.`,
        impact: 'medium'
      });
    }
  }

  // Analyze L/P Ratio trend
  if (chartData.lpRatio && chartData.lpRatio.length >= 2) {
    const latest = chartData.lpRatio[chartData.lpRatio.length - 1]?.value || 0;
    const previous = chartData.lpRatio[chartData.lpRatio.length - 2]?.value || 0;
    const trend = latest - previous;
    const changePercent = previous !== 0 ? Math.abs((trend / previous) * 100) : 0;

    if (trend > 0) {
      insights.push({
        id: 'lp-ratio-improving',
        type: 'opportunity',
        title: 'L/P Ratio Demonstrating Excellence',
        description: `L/P Ratio improved from ${previous.toFixed(2)} to ${latest.toFixed(2)} (${changePercent.toFixed(1)}% increase). This indicates superior cost-effectiveness and resource optimization. Recommend establishing this as a center of excellence model, documenting successful strategies, and scaling best practices across all departments for continued optimization.`,
        impact: 'high'
      });
    } else if (trend < 0) {
      insights.push({
        id: 'lp-ratio-declining',
        type: 'warning',
        title: 'L/P Ratio Enhancement Opportunity',
        description: `L/P Ratio decreased from ${previous.toFixed(2)} to ${latest.toFixed(2)} (${changePercent.toFixed(1)}% decline). Focus on implementing cost-effectiveness protocols, optimizing resource allocation, and enhancing workflow efficiency. Consider introducing automation tools, streamlined processes, and targeted training programs.`,
        impact: 'medium'
      });
    } else {
      insights.push({
        id: 'lp-ratio-stable',
        type: 'recommendation',
        title: 'L/P Ratio Steady Performance',
        description: `L/P Ratio maintains stable at ${latest.toFixed(2)}. Consistent performance creates foundation for strategic enhancement through advanced analytics, predictive modeling, and precision-driven optimizations to achieve breakthrough efficiency gains and continuous improvement.`,
        impact: 'medium'
      });
    }
  }

  // Analyze CPG Mismatch trend
  if (chartData.cpgMismatch && chartData.cpgMismatch.length >= 2) {
    const latest = chartData.cpgMismatch[chartData.cpgMismatch.length - 1]?.value || 0;
    const previous = chartData.cpgMismatch[chartData.cpgMismatch.length - 2]?.value || 0;
    const change = latest - previous;
    const changePercent = previous !== 0 ? Math.abs((change / previous) * 100) : 0;

    if (change < 0) {
      insights.push({
        id: 'cpg-improvement',
        type: 'opportunity',
        title: 'CPG Compliance Advancing Excellently',
        description: `CPG Mismatch reduced from ${previous.toFixed(1)}% to ${latest.toFixed(1)}% (${changePercent.toFixed(1)}% improvement). Outstanding progress in guideline adherence. Recommend creating digital decision support systems, implementing real-time alerts, and establishing compliance recognition programs to maintain this excellent momentum.`,
        impact: 'high'
      });
    } else if (change > 0) {
      insights.push({
        id: 'cpg-declining',
        type: 'warning',
        title: 'CPG Compliance Development Focus',
        description: `CPG Mismatch increased from ${previous.toFixed(1)}% to ${latest.toFixed(1)}% (${changePercent.toFixed(1)}% increase). Opportunity for enhanced guideline integration through comprehensive training modules, interactive learning platforms, and personalized coaching programs to strengthen clinical decision-making.`,
        impact: 'medium'
      });
    } else {
      insights.push({
        id: 'cpg-stable',
        type: 'recommendation',
        title: 'CPG Compliance Consistent Baseline',
        description: `CPG Mismatch remains stable at ${latest.toFixed(1)}%. Consistent performance enables strategic advancement through AI-powered decision support, evidence-based protocol optimization, and continuous medical education initiatives for breakthrough improvements.`,
        impact: 'medium'
      });
    }
  }

  // Enhanced Duplicate Order Analysis - Deep Insight
  if (chartData.duplicateOrder && chartData.duplicateOrder.length >= 2) {
    const latest = chartData.duplicateOrder[chartData.duplicateOrder.length - 1]?.value || 0;
    const previous = chartData.duplicateOrder[chartData.duplicateOrder.length - 2]?.value || 0;
    const change = latest - previous;
    const changePercent = previous !== 0 ? Math.abs((change / previous) * 100) : 0;

    // Calculate additional metrics for deeper analysis
    const historical = chartData.duplicateOrder.slice(-6); // Last 6 months
    const avgDuplicateRate = historical.reduce((sum, point) => sum + point.value, 0) / historical.length;
    const volatility = Math.sqrt(historical.reduce((sum, point) => sum + Math.pow(point.value - avgDuplicateRate, 2), 0) / historical.length);
    const trend6Month = historical.length >= 6 ? historical[historical.length - 1].value - historical[0].value : 0;

    if (change < 0) {
      insights.push({
        id: 'duplicate-improvement-enhanced',
        type: 'opportunity',
        title: '🎯 Duplicate Orders - ลดลงอย่างมีนัยสำคัญ',
        description: `การสั่งซ้ำลดลงจาก ${previous.toFixed(1)}% เหลือ ${latest.toFixed(1)}% (ลดลง ${changePercent.toFixed(1)}%). ประสิทธิภาพเพิ่มขึ้นอย่างต่อเนื่อง 6 เดือนที่ผ่านมา: ${trend6Month > 0 ? 'เพิ่มขึ้น' : 'ลดลง'} ${Math.abs(trend6Month).toFixed(1)}%. แนะนำ: ขยายระบบ AI-Powered Order Validation, สร้าง Real-time Alert System, และจัดทำ Best Practice Sharing Program เพื่อรักษาโมเมนตัมที่ดีนี้`,
        impact: 'high'
      });
    } else if (change > 0) {
      insights.push({
        id: 'duplicate-increasing-critical',
        type: 'warning',
        title: '⚠️ Duplicate Orders - เพิ่มขึ้นต้องเฝ้าระวัง',
        description: `การสั่งซ้ำเพิ่มขึ้นจาก ${previous.toFixed(1)}% เป็น ${latest.toFixed(1)}% (เพิ่มขึ้น ${changePercent.toFixed(1)}%). ความผันผวน 6 เดือน: ${volatility.toFixed(1)}%. เป้าหมายเร่งด่วน: ติดตั้ง Smart Order Verification System, จัดอบรม Intensive Workshop เรื่อง Efficient Ordering Protocols, และสร้าง Department-specific Action Plans เพื่อควบคุมการเพิ่มขึ้นนี้`,
        impact: 'high'
      });
    } else {
      insights.push({
        id: 'duplicate-stable-opportunity',
        type: 'recommendation',
        title: '📊 Duplicate Orders - โอกาสพัฒนาต่อยอด',
        description: `การสั่งซ้ำคงที่ที่ ${latest.toFixed(1)}% ซึ่งใกล้เคียงค่าเฉลี่ย 6 เดือน (${avgDuplicateRate.toFixed(1)}%). ความมั่นคงนี้เป็นฐานที่ดีสำหรับการพัฒนาระดับถัดไป: นำเข้า Machine Learning Prediction Models, สร้าง Zero-Duplicate Initiative, และพัฒนา Advanced Analytics Dashboard เพื่อบรรลุเป้าหมาย Excellence in Order Management`,
        impact: 'medium'
      });
    }

    // Add specific duplicate order insights based on top doctors data
    if (topDoctors && topDoctors.length > 0) {
      const bestPerformer = topDoctors.reduce((best, current) => 
        current.duplicateOrder < best.duplicateOrder ? current : best
      );
      const worstPerformer = topDoctors.reduce((worst, current) => 
        current.duplicateOrder > worst.duplicateOrder ? current : worst
      );
      
      if (bestPerformer.duplicateOrder !== worstPerformer.duplicateOrder) {
        insights.push({
          id: 'duplicate-performance-gap',
          type: 'recommendation',
          title: '🏆 Gap Analysis: Duplicate Orders Performance',
          description: `ผลการวิเคราะห์เชิงลึก: แพทย์ที่มีประสิทธิภาพสูงสุด (${bestPerformer.duplicateOrder.toFixed(1)}%) เทียบกับที่ต้องพัฒนา (${worstPerformer.duplicateOrder.toFixed(1)}%) แตกต่างกัน ${(worstPerformer.duplicateOrder - bestPerformer.duplicateOrder).toFixed(1)}%. แนะนำจัดทำ Peer Mentoring Program, Cross-department Learning Sessions, และ Personalized Improvement Plans เพื่อยกระดับประสิทธิภาพโดยรวม`,
          impact: 'medium',
          department: 'All Departments'
        });
      }
    }
  }

  // Analyze CP Ratio trend
  if (chartData.cpRatio && chartData.cpRatio.length >= 2) {
    const latest = chartData.cpRatio[chartData.cpRatio.length - 1]?.value || 0;
    const previous = chartData.cpRatio[chartData.cpRatio.length - 2]?.value || 0;
    const trend = latest - previous;
    const changePercent = previous !== 0 ? Math.abs((trend / previous) * 100) : 0;

    if (trend > 0) {
      insights.push({
        id: 'cp-ratio-improving',
        type: 'opportunity',
        title: 'CP Ratio Achieving Superior Performance',
        description: `CP Ratio improved by ${trend.toFixed(2)} points (${changePercent.toFixed(1)}% enhancement). Outstanding efficiency gains demonstrated. Recommend establishing this performance level as organizational standard, implementing continuous monitoring systems, and scaling successful methodologies.`,
        impact: 'high'
      });
    } else if (trend < 0) {
      insights.push({
        id: 'cp-ratio-declining',
        type: 'warning',
        title: 'CP Ratio Strategic Enhancement Zone',
        description: `CP Ratio decreased by ${Math.abs(trend).toFixed(2)} points. Valuable opportunity for process optimization through lean methodologies, technology integration, and comprehensive performance improvement initiatives.`,
        impact: 'medium'
      });
    } else {
      insights.push({
        id: 'cp-ratio-stable',
        type: 'recommendation',
        title: 'CP Ratio Consistent Foundation',
        description: `CP Ratio maintains ${latest.toFixed(2)}. Stable performance creates platform for advanced optimization through data-driven insights, process automation, and excellence-focused continuous improvement programs.`,
        impact: 'medium'
      });
    }
  }

  // Analyze Active Physicians trend
  if (chartData.activePhysicians && chartData.activePhysicians.length >= 2) {
    const latest = chartData.activePhysicians[chartData.activePhysicians.length - 1]?.value || 0;
    const previous = chartData.activePhysicians[chartData.activePhysicians.length - 2]?.value || 0;
    const change = latest - previous;
    const changePercent = previous !== 0 ? Math.abs((change / previous) * 100) : 0;

    if (change > 0) {
      insights.push({
        id: 'physicians-growing',
        type: 'opportunity',
        title: 'Active Physicians Expanding Positively',
        description: `Active Physicians increased by ${change} physicians (${changePercent.toFixed(1)}% growth). Excellent engagement expansion. Recommend implementing comprehensive onboarding programs, advanced training modules, and mentorship networks to maximize new physician integration and performance.`,
        impact: 'high'
      });
    } else if (change < 0) {
      insights.push({
        id: 'physicians-declining',
        type: 'warning',
        title: 'Active Physicians Retention Focus',
        description: `Active Physicians decreased by ${Math.abs(change)} physicians. Strategic opportunity for enhanced engagement through improved user experience, comprehensive support systems, and innovative retention programs to rebuild and strengthen physician participation.`,
        impact: 'medium'
      });
    } else {
      insights.push({
        id: 'physicians-stable',
        type: 'recommendation',
        title: 'Active Physicians Stable Engagement',
        description: `Active Physicians maintained at ${latest} physicians. Consistent engagement provides foundation for implementing advanced physician development programs, specialized training initiatives, and leadership cultivation to maximize professional growth and system utilization.`,
        impact: 'medium'
      });
    }
  }

  return insights.slice(0, 6); // Return max 6 insights to cover all charts
};

export const AIInsights = ({ chartData, topDoctors }: AIInsightsProps) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Insights are only generated when button is clicked

  const generateNewInsights = async () => {
    setIsGenerating(true);
    toast.info("กำลังวิเคราะห์ข้อมูลล่าสุด...");
    
    // Simulate AI processing and regenerate insights
    setTimeout(() => {
      if (chartData && topDoctors) {
        const newInsights = generateInsightsFromData(chartData, topDoctors);
        
        // Add a dynamic insight based on current time
        const dynamicInsight: Insight = {
          id: Date.now().toString(),
          type: 'recommendation',
          title: 'ข้อเสนอแนะใหม่',
          description: 'จากการวิเคราะห์ล่าสุด แนะนำให้ติดตามผลการปรับปรุงอย่างต่อเนื่อง และจัดทำรายงานความก้าวหน้าเป็นรายเดือน',
          impact: 'medium'
        };
        
        setInsights([dynamicInsight, ...newInsights.slice(0, 3)]);
      }
      setIsGenerating(false);
      toast.success("สร้างข้อมูลเชิงลึกใหม่แล้ว!");
    }, 2000);
  };

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'recommendation':
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'opportunity':
        return 'text-success border-success/20 bg-success/10';
      case 'warning':
        return 'text-warning border-warning/20 bg-warning/10';
      case 'recommendation':
        return 'text-info border-info/20 bg-info/10';
    }
  };

  const getImpactColor = (impact: Insight['impact']) => {
    switch (impact) {
      case 'high':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'medium':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'low':
        return 'bg-muted/20 text-muted-foreground border-muted/30';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">AI Insights - การวิเคราะห์เชิงลึก</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={generateNewInsights}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Brain className="w-4 h-4 mr-2" />
          )}
          {isGenerating ? 'กำลังวิเคราะห์...' : 'สร้างข้อมูลเชิงลึก'}
        </Button>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div 
            key={insight.id}
            className={`p-4 rounded-lg border ${getInsightColor(insight.type)} animate-fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getInsightIcon(insight.type)}
                <h4 className="font-medium">{insight.title}</h4>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getImpactColor(insight.impact)}`}
                >
                  {insight.impact.toUpperCase()} IMPACT
                </Badge>
                {insight.department && (
                  <Badge variant="outline" className="text-xs">
                    {insight.department}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm opacity-90">{insight.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};