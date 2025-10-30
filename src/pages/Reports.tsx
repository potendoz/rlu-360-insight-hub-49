import { useState } from "react";
import { Download, Calendar, Filter, FileText, BarChart3, PieChart, TrendingUp, DollarSign, Search, Calendar as CalendarIcon, BarChart2, AlertTriangle, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PDFExport } from "@/components/PDFExport";
import { TopPerformersAward } from "@/components/TopPerformersAward";
import { MonthlySummaryReport } from "@/components/MonthlySummaryReport";
import { IndividualPerformanceReport } from "@/components/IndividualPerformanceReport";
import { CostAnalysisReport } from "@/components/CostAnalysisReport";
import { RCAReport } from "@/components/RCAReport";
import { AnnualReport } from "@/components/AnnualReport";
import { CostTrendVarianceReport } from "@/components/CostTrendVarianceReport";
import { MismatchAnalysisReport } from "@/components/MismatchAnalysisReport";
import { FinancialImpactAnalysisReport } from "@/components/FinancialImpactAnalysisReport";

const reportsData = [
  {
    id: 1,
    title: "Monthly RLU Performance Report",
    description: "Comprehensive analysis of rational laboratory use implementation across all departments",
    type: "performance",
    period: "December 2024",
    generatedDate: "2024-12-15",
    size: "2.4 MB",
    pages: 45,
    status: "ready"
  },
  {
    id: 2,
    title: "Cost Savings Analysis",
    description: "Detailed breakdown of cost savings achieved through RLU implementation",
    type: "financial",
    period: "Q4 2024",
    generatedDate: "2024-12-10",
    size: "1.8 MB",
    pages: 32,
    status: "ready"
  },
  {
    id: 3,
    title: "Department Performance Comparison",
    description: "Comparative analysis of RLU adoption across different hospital departments",
    type: "department",
    period: "December 2024",
    generatedDate: "2024-12-12",
    size: "3.1 MB",
    pages: 38,
    status: "ready"
  },
  {
    id: 4,
    title: "Doctor Performance Rankings",
    description: "Individual doctor performance metrics and rankings based on RLU compliance",
    type: "doctor",
    period: "December 2024",
    generatedDate: "2024-12-14",
    size: "2.7 MB",
    pages: 41,
    status: "ready"
  },
  {
    id: 5,
    title: "Test Utilization Trends",
    description: "Analysis of laboratory test ordering patterns and optimization opportunities",
    type: "utilization",
    period: "November 2024",
    generatedDate: "2024-11-30",
    size: "2.2 MB",
    pages: 35,
    status: "ready"
  },
  {
    id: 6,
    title: "Quality Indicators Report",
    description: "Patient care quality metrics in relation to RLU implementation",
    type: "quality",
    period: "Q4 2024",
    generatedDate: "2024-12-08",
    size: "1.9 MB",
    pages: 28,
    status: "generating"
  }
];

const quickReports = [
  {
    title: "Monthly Summary",
    description: "Comprehensive monthly RLU analysis",
    icon: BarChart3,
    action: "Generate"
  },
  {
    title: "Top Performers",
    description: "Best performing doctors this month",
    icon: TrendingUp,
    action: "Generate"
  },
  {
    title: "Individual Performance Report",
    description: "Detailed individual physician analysis",
    icon: PieChart,
    action: "Generate"
  },
  {
    title: "Cost Analysis",
    description: "Detailed cost analysis with doctor rankings",
    icon: DollarSign,
    action: "Generate"
  },
  {
    title: "RCA Report",
    description: "Root cause analysis using 6M framework and 5 Whys",
    icon: Search,
    action: "Generate"
  },
  {
    title: "Annual Report",
    description: "Comprehensive yearly RLU performance analysis",
    icon: CalendarIcon,
    action: "Generate"
  },
  {
    title: "Cost Trend & Variance",
    description: "Detailed cost trend analysis with variance tracking",
    icon: BarChart2,
    action: "Generate"
  },
  {
    title: "Mismatch Analysis",
    description: "CPG compliance and duplicate order analysis",
    icon: AlertTriangle,
    action: "Generate"
  },
  {
    title: "Financial Impact Analysis",
    description: "Financial impact and savings opportunities",
    icon: Target,
    action: "Generate"
  }
];

const getReportTypeColor = (type: string) => {
  switch (type) {
    case "performance":
      return "bg-primary text-primary-foreground";
    case "financial":
      return "bg-success text-success-foreground";
    case "department":
      return "bg-secondary text-secondary-foreground";
    case "doctor":
      return "bg-accent text-accent-foreground";
    case "utilization":
      return "bg-muted text-muted-foreground";
    case "quality":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "ready":
      return "bg-success text-success-foreground";
    case "generating":
      return "bg-primary text-primary-foreground";
    case "error":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const Reports = () => {
  const [selectedType, setSelectedType] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [showTopPerformersAward, setShowTopPerformersAward] = useState(false);
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);
  const [showIndividualReport, setShowIndividualReport] = useState(false);
  const [showCostAnalysis, setShowCostAnalysis] = useState(false);
  const [showRCAReport, setShowRCAReport] = useState(false);
  const [showAnnualReport, setShowAnnualReport] = useState(false);
  const [showCostTrendVariance, setShowCostTrendVariance] = useState(false);
  const [showMismatchAnalysis, setShowMismatchAnalysis] = useState(false);
  const [showFinancialImpact, setShowFinancialImpact] = useState(false);

  // Check if connected
  const isConnected = !!localStorage.getItem('googleSheetId');

  const filteredReports = reportsData.filter(report => {
    const matchesType = selectedType === "all" || report.type === selectedType;
    const matchesPeriod = selectedPeriod === "all" || report.period.includes(selectedPeriod);
    return matchesType && matchesPeriod;
  });

  const reportTypes = [...new Set(reportsData.map(r => r.type))];

  if (showMonthlySummary) {
    return (
      <div className="p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Monthly Summary Report</h1>
            <p className="text-muted-foreground">Comprehensive organizational RLU performance analysis</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowMonthlySummary(false)}
          >
            Back to Reports
          </Button>
        </div>

        {/* Monthly Summary Report Component */}
        <MonthlySummaryReport />
      </div>
    );
  }

  if (showTopPerformersAward) {
    return (
      <div className="p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Top Performers Award Report</h1>
            <p className="text-muted-foreground">Generate award certificates for top performing physicians</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowTopPerformersAward(false)}
          >
            Back to Reports
          </Button>
        </div>

        {/* Top Performers Award Component */}
        <TopPerformersAward />
      </div>
    );
  }

  if (showIndividualReport) {
    return (
      <div className="p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Individual Performance Report</h1>
            <p className="text-muted-foreground">Detailed individual physician performance analysis</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowIndividualReport(false)}
          >
            Back to Reports
          </Button>
        </div>

        {/* Individual Performance Report Component */}
        <IndividualPerformanceReport />
      </div>
    );
  }

  if (showCostAnalysis) {
    return (
      <div className="p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cost Analysis Report</h1>
            <p className="text-muted-foreground">Comprehensive cost analysis with doctor rankings and performance metrics</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowCostAnalysis(false)}
          >
            Back to Reports
          </Button>
        </div>

        {/* Cost Analysis Report Component */}
        <CostAnalysisReport />
      </div>
    );
  }

  if (showRCAReport) {
    return (
      <div className="p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Root Cause Analysis Report</h1>
            <p className="text-muted-foreground">Comprehensive RCA using 6M framework and 5 Whys methodology</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowRCAReport(false)}
          >
            Back to Reports
          </Button>
        </div>

        {/* RCA Report Component */}
        <RCAReport />
      </div>
    );
  }

  if (showAnnualReport) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Annual Report</h1>
            <p className="text-muted-foreground">Comprehensive yearly RLU performance analysis</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowAnnualReport(false)}
          >
            Back to Reports
          </Button>
        </div>
        <AnnualReport />
      </div>
    );
  }

  if (showCostTrendVariance) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cost Trend & Variance Report</h1>
            <p className="text-muted-foreground">Detailed cost analysis with variance tracking</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowCostTrendVariance(false)}
          >
            Back to Reports
          </Button>
        </div>
        <CostTrendVarianceReport />
      </div>
    );
  }

  if (showMismatchAnalysis) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mismatch Analysis Report</h1>
            <p className="text-muted-foreground">CPG compliance and duplicate order analysis</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowMismatchAnalysis(false)}
          >
            Back to Reports
          </Button>
        </div>
        <MismatchAnalysisReport />
      </div>
    );
  }

  if (showFinancialImpact) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financial Impact Analysis Report</h1>
            <p className="text-muted-foreground">Financial impact and savings opportunities</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFinancialImpact(false)}
          >
            Back to Reports
          </Button>
        </div>
        <FinancialImpactAnalysisReport />
      </div>
    );
  }

  // Show connection warning if not connected
  if (!isConnected) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate and download comprehensive RLU performance reports</p>
          </div>
        </div>
        <Card className="p-12">
          <div className="text-center space-y-4">
            <FileText className="h-16 w-16 text-warning mx-auto" />
            <h2 className="text-2xl font-semibold">ไม่พบการเชื่อมต่อ Google Sheet</h2>
            <p className="text-muted-foreground">
              กรุณาไปที่หน้า Data Input เพื่อเชื่อมต่อ Google Sheet ID ก่อนดูรายงานต่างๆ
            </p>
            <Button onClick={() => window.location.href = '/data-input'}>
              ไปที่หน้า Data Input
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate and download comprehensive RLU performance reports</p>
        </div>
        <PDFExport />
      </div>

      {/* Quick Report Generation */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Quick Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickReports.map((report, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <report.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{report.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      if (report.title === "Monthly Summary") {
                        setShowMonthlySummary(true);
                      } else if (report.title === "Top Performers") {
                        setShowTopPerformersAward(true);
                      } else if (report.title === "Individual Performance Report") {
                        setShowIndividualReport(true);
                      } else if (report.title === "Cost Analysis") {
                        setShowCostAnalysis(true);
                      } else if (report.title === "RCA Report") {
                        setShowRCAReport(true);
                      } else if (report.title === "Annual Report") {
                        setShowAnnualReport(true);
                      } else if (report.title === "Cost Trend & Variance") {
                        setShowCostTrendVariance(true);
                      } else if (report.title === "Mismatch Analysis") {
                        setShowMismatchAnalysis(true);
                      } else if (report.title === "Financial Impact Analysis") {
                        setShowFinancialImpact(true);
                      }
                    }}
                  >
                    {report.action}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};
