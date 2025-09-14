import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { googleSheetsService } from "@/services/googleSheetsService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Users, 
  TestTube, 
  Clock, 
  AlertTriangle,
  Activity,
  Download,
  Calendar,
  Presentation,
  Target,
  DollarSign,
  TrendingDown,
  FileText
} from "lucide-react";
import { KPICard } from "@/components/KPICard";
import { DoctorCard } from "@/components/DoctorCard";
import { AIInsights } from "@/components/AIInsights";
import { PDFExport } from "@/components/PDFExport";
import { KPIChart } from "@/components/charts/KPIChart";
import { DepartmentChart } from "@/components/charts/DepartmentChart";
import { AdvancedAI } from "@/components/AdvancedAI";

import { PresentationMode } from "@/components/PresentationMode";
import { useI18n } from "@/hooks/useI18n";
import { useAuth } from "@/hooks/useAuth";
import { anonymizeDoctorData } from "@/utils/pdpaUtils";

// Initial KPI data - will be updated with real data
const initialKpiData = [
  {
    title: "L/P Ratio",
    value: "0.0",
    previousValue: "0.0",
    icon: TestTube,
    trend: "neutral" as const,
    description: "Loading...",
    color: "primary" as const,
    currentMonthAvg: 0,
    previousMonthAvg: 0,
    overallAvg: 0,
    difference: 0
  },
  {
    title: "CPG MisMatch(%)",
    value: "0.0%",
    previousValue: "0.0%",
    icon: AlertTriangle,
    trend: "neutral" as const,
    description: "Loading...",
    color: "warning" as const,
    currentMonthAvg: 0,
    previousMonthAvg: 0,
    overallAvg: 0,
    difference: 0
  },
  {
    title: "Duplicate Order(%)",
    value: "0.0%",
    previousValue: "0.0%",
    icon: TrendingDown,
    trend: "neutral" as const,
    description: "Loading...",
    color: "destructive" as const,
    currentMonthAvg: 0,
    previousMonthAvg: 0,
    overallAvg: 0,
    difference: 0
  },
  {
    title: "Active Physicians",
    value: "0",
    previousValue: "0",
    icon: Users,
    trend: "neutral" as const,
    description: "Loading...",
    color: "primary" as const,
    currentMonthAvg: 0,
    previousMonthAvg: 0,
    overallAvg: 0,
    difference: 0
  }
];

// Mock data will be replaced with real data from database

// Chart data - will be updated with real data
const initialChartData = {
  rluScore: [],
  lpRatio: [],
  cpgMismatch: [],
  duplicateOrder: [],
  cpRatio: [],
  activePhysicians: []
};

export const Dashboard = () => {
  const { hasRole } = useAuth();
  const isJudge = hasRole('judge');
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAllDoctors, setShowAllDoctors] = useState(false);
  const [kpiData, setKpiData] = useState(initialKpiData);
  const [chartData, setChartData] = useState(initialChartData);
  const [loading, setLoading] = useState(true);
  
  // States for Top Performing Physicians
  const [selectedMonth, setSelectedMonth] = useState("December");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [topDoctors, setTopDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  
  const { t } = useI18n();
  const { toast } = useToast();

  // Fetch top performing doctors based on selected month and year
  const fetchTopDoctors = async () => {
    try {
      setDoctorsLoading(true);
      
      // Use Google Sheets data
      const monthlyData = await googleSheetsService.getMonthlyData();
      const doctorsData = await googleSheetsService.getDoctors();
      
      // Filter and join data
      const doctorData = monthlyData
        .filter(data => data.month === selectedMonth && data.year === parseInt(selectedYear))
        .map(data => {
          const doctor = doctorsData.find(d => d.id === data.doctor_id);
          return {
            ...data,
            doctors: doctor || { name: 'Unknown', department: 'Unknown', specialty: 'Unknown' }
          };
        })
        .sort((a, b) => (b.rlu_score || 0) - (a.rlu_score || 0))
        .slice(0, 3);

      if (doctorData && doctorData.length > 0) {
        const formattedDoctors = doctorData.map((doc, index) => ({
          id: doc.doctor_id,
          name: doc.doctors.name,
          department: doc.doctors.department,
          score: doc.rlu_score || 0,
          cpgMismatch: doc.cpg_mismatch_percentage || 0,
          duplicateOrder: doc.duplicate_order_rate || 0,
          cpRatio: doc.cp_ratio || 0,
          specialization: doc.doctors.specialty,
          lastReview: `${Math.floor(Math.random() * 7)} days ago`
        }));
        
        setTopDoctors(formattedDoctors);
      } else {
        setTopDoctors([]);
      }
    } catch (error) {
      console.error('Error in fetchTopDoctors:', error);
      setTopDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  };

  // Fetch real data from Google Sheets
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Check if Google Sheets is configured
        if (!googleSheetsService.isConfigured()) {
          console.warn('Google Sheets not configured');
          setLoading(false);
          return;
        }
        
        // Use Google Sheets data
        console.log('Fetching monthly data from Google Sheets...');
        const monthlyData = await googleSheetsService.getMonthlyData();
        console.log('Fetched monthly data:', monthlyData);

        if (monthlyData && monthlyData.length > 0) {
          // Sort data by year and month for proper chronological order
          const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const sortedData = monthlyData.sort((a, b) => {
            const aIndex = monthOrder.indexOf(a.month) + (a.year * 12);
            const bIndex = monthOrder.indexOf(b.month) + (b.year * 12);
            return aIndex - bIndex;
          });

          // Group by month-year and calculate monthly averages
          const monthlyAverages = {};
          sortedData.forEach(record => {
            const monthKey = `${record.month}-${record.year}`;
            if (!monthlyAverages[monthKey]) {
              monthlyAverages[monthKey] = {
                month: record.month,
                year: record.year,
                lpRatio: [],
                cpgMismatch: [],
                duplicateOrder: [],
                cpRatio: []
              };
            }
            monthlyAverages[monthKey].lpRatio.push(record.lp_ratio || 0);
            monthlyAverages[monthKey].cpgMismatch.push(record.cpg_mismatch_percentage || 0);
            monthlyAverages[monthKey].duplicateOrder.push(record.duplicate_order_rate || 0);
            monthlyAverages[monthKey].cpRatio.push(record.cp_ratio || 0);
          });

          // Calculate final monthly averages
          const monthlyAvgData = Object.values(monthlyAverages).map((monthData: any) => ({
            month: monthData.month,
            year: monthData.year,
            monthKey: `${monthData.month}-${monthData.year}`,
            avgLpRatio: monthData.lpRatio.reduce((a, b) => a + b, 0) / monthData.lpRatio.length,
            avgCpgMismatch: monthData.cpgMismatch.reduce((a, b) => a + b, 0) / monthData.cpgMismatch.length,
            avgDuplicateOrder: monthData.duplicateOrder.reduce((a, b) => a + b, 0) / monthData.duplicateOrder.length,
            avgCpRatio: monthData.cpRatio.reduce((a, b) => a + b, 0) / monthData.cpRatio.length
          })).sort((a, b) => {
            const aIndex = monthOrder.indexOf(a.month) + (a.year * 12);
            const bIndex = monthOrder.indexOf(b.month) + (b.year * 12);
            return aIndex - bIndex;
          });

          // Get last 6 months of averages
          const last6MonthsAvg = monthlyAvgData.slice(-6);
          
          // Calculate overall averages from monthly averages
          const overallAvgLpRatio = monthlyAvgData.reduce((sum, d) => sum + d.avgLpRatio, 0) / monthlyAvgData.length;
          const overallAvgCpgMismatch = monthlyAvgData.reduce((sum, d) => sum + d.avgCpgMismatch, 0) / monthlyAvgData.length;
          const overallAvgDuplicateOrder = monthlyAvgData.reduce((sum, d) => sum + d.avgDuplicateOrder, 0) / monthlyAvgData.length;

          // Get current month (latest) and previous month data
          const latestMonthData = last6MonthsAvg[last6MonthsAvg.length - 1];
          const previousMonthData = last6MonthsAvg[last6MonthsAvg.length - 2];

          const currentLpRatio = latestMonthData?.avgLpRatio || 0;
          const prevLpRatio = previousMonthData?.avgLpRatio || 0;

          const currentCpgMismatch = latestMonthData?.avgCpgMismatch || 0;
          const prevCpgMismatch = previousMonthData?.avgCpgMismatch || 0;

          const currentDuplicateOrder = latestMonthData?.avgDuplicateOrder || 0;
          const prevDuplicateOrder = previousMonthData?.avgDuplicateOrder || 0;

          // Calculate trends and differences
          const lpTrend: "up" | "down" | "neutral" = currentLpRatio > prevLpRatio ? "up" : currentLpRatio < prevLpRatio ? "down" : "neutral";
          const cpgTrend: "up" | "down" | "neutral" = currentCpgMismatch < prevCpgMismatch ? "down" : currentCpgMismatch > prevCpgMismatch ? "up" : "neutral";
          const duplicateTrend: "up" | "down" | "neutral" = currentDuplicateOrder < prevDuplicateOrder ? "down" : currentDuplicateOrder > prevDuplicateOrder ? "up" : "neutral";
          
          // Get unique doctors count
          const totalDoctors = new Set(monthlyData.map(d => d.doctor_id)).size;
          
          // Update KPI data with detailed monthly comparisons
          setKpiData([
            {
              title: "L/P Ratio",
              value: currentLpRatio.toFixed(2),
              previousValue: prevLpRatio.toFixed(2),
              icon: TestTube,
              trend: lpTrend as any,
              description: `ข้อมูล ${latestMonthData?.month} ${latestMonthData?.year}`,
              color: "primary" as const,
              currentMonthAvg: currentLpRatio,
              previousMonthAvg: prevLpRatio,
              overallAvg: overallAvgLpRatio,
              difference: currentLpRatio - prevLpRatio
            },
            {
              title: "CPG MisMatch(%)",
              value: `${currentCpgMismatch.toFixed(1)}%`,
              previousValue: `${prevCpgMismatch.toFixed(1)}%`,
              icon: AlertTriangle,
              trend: cpgTrend as any,
              description: `ข้อมูล ${latestMonthData?.month} ${latestMonthData?.year}`,
              color: "warning" as const,
              currentMonthAvg: currentCpgMismatch,
              previousMonthAvg: prevCpgMismatch,
              overallAvg: overallAvgCpgMismatch,
              difference: currentCpgMismatch - prevCpgMismatch
            },
            {
              title: "Duplicate Order(%)",
              value: `${currentDuplicateOrder.toFixed(1)}%`,
              previousValue: `${prevDuplicateOrder.toFixed(1)}%`,
              icon: TrendingDown,
              trend: duplicateTrend as any,
              description: `ข้อมูล ${latestMonthData?.month} ${latestMonthData?.year}`,
              color: "destructive" as const,
              currentMonthAvg: currentDuplicateOrder,
              previousMonthAvg: prevDuplicateOrder,
              overallAvg: overallAvgDuplicateOrder,
              difference: currentDuplicateOrder - prevDuplicateOrder
            },
            {
              title: "Active Physicians",
              value: totalDoctors.toString(),
              previousValue: totalDoctors.toString(),
              icon: Users,
              trend: "neutral" as const,
              description: `ข้อมูล ${latestMonthData?.month} ${latestMonthData?.year}`,
              color: "primary" as const,
              currentMonthAvg: totalDoctors,
              previousMonthAvg: totalDoctors,
              overallAvg: totalDoctors,
              difference: 0
            }
          ]);

          // Prepare chart data for last 6 months using monthly averages
          const monthlyStats = last6MonthsAvg.reduce((acc, monthData) => {
            const monthKey = `${monthData.month} ${monthData.year}`;
            acc[monthKey] = {
              month: monthData.month,
              year: monthData.year,
              monthKey,
              avgLpRatio: monthData.avgLpRatio,
              avgCpgMismatch: monthData.avgCpgMismatch,
              avgDuplicateOrder: monthData.avgDuplicateOrder,
              avgCpRatio: monthData.avgCpRatio,
              physicians: new Set()
            };
            
            return acc;
          }, {});

          // Get unique physicians count for each month from original data
          const physiciansPerMonth = {};
          last6MonthsAvg.forEach(monthData => {
            const monthKey = `${monthData.month} ${monthData.year}`;
            const monthRecords = sortedData.filter(d => `${d.month} ${d.year}` === monthKey);
            physiciansPerMonth[monthKey] = new Set(monthRecords.map(d => d.doctor_id)).size;
          });

          // Calculate RLU scores for each month from actual data
          const rluScoresPerMonth = {};
          last6MonthsAvg.forEach(monthData => {
            const monthKey = `${monthData.month} ${monthData.year}`;
            const monthRecords = sortedData.filter(d => `${d.month} ${d.year}` === monthKey);
            const avgRluScore = monthRecords.length > 0 
              ? monthRecords.reduce((sum, d) => sum + (d.rlu_score || 0), 0) / monthRecords.length 
              : 0;
            rluScoresPerMonth[monthKey] = avgRluScore;
          });

          // Create chart data points from monthly averages
          const chartDataPoints = Object.values(monthlyStats)
            .map((monthData: any) => ({
              month: monthData.month,
              year: monthData.year,
              monthKey: monthData.monthKey,
              rluScore: rluScoresPerMonth[monthData.monthKey] || 0,
              lpRatio: monthData.avgLpRatio,
              cpgMismatch: monthData.avgCpgMismatch,
              duplicateOrder: monthData.avgDuplicateOrder,
              cpRatio: monthData.avgCpRatio,
              activePhysicians: physiciansPerMonth[monthData.monthKey] || 9
            }))
            .sort((a, b) => {
              const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
              const aIndex = monthOrder.indexOf(a.month) + (a.year * 12);
              const bIndex = monthOrder.indexOf(b.month) + (b.year * 12);
              return aIndex - bIndex;
            });

          setChartData({
            rluScore: chartDataPoints.map(d => ({ month: `${d.month} ${d.year}`, value: d.rluScore })),
            lpRatio: chartDataPoints.map(d => ({ month: `${d.month} ${d.year}`, value: d.lpRatio })),
            cpgMismatch: chartDataPoints.map(d => ({ month: `${d.month} ${d.year}`, value: d.cpgMismatch })),
            duplicateOrder: chartDataPoints.map(d => ({ month: `${d.month} ${d.year}`, value: d.duplicateOrder })),
            cpRatio: chartDataPoints.map(d => ({ month: `${d.month} ${d.year}`, value: d.cpRatio })),
            activePhysicians: chartDataPoints.map(d => ({ month: `${d.month} ${d.year}`, value: d.activePhysicians }))
          });
        } else {
          console.warn('No monthly data found in Google Sheets');
          // Show toast notification to user
          toast({
            title: "ไม่พบข้อมูล",
            description: "ไม่พบข้อมูลในแท็บ 'doctor_monthly_data' ใน Google Sheets กรุณาตรวจสอบว่ามีข้อมูลในแท็บนี้แล้ว",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  // Fetch top doctors when month or year changes
  useEffect(() => {
    fetchTopDoctors();
  }, [selectedMonth, selectedYear]);

  const handleViewDoctorDetails = async (doctorId: string) => {
    try {
      const monthlyData = await googleSheetsService.getMonthlyData();
      const doctorsData = await googleSheetsService.getDoctors();
      
      // Find doctor monthly data
      const doctorMonthlyData = monthlyData.find(data => 
        data.doctor_id === doctorId && 
        data.month === selectedMonth && 
        data.year === parseInt(selectedYear)
      );
      
      // Find doctor basic info
      const doctorInfo = doctorsData.find(d => d.id === doctorId);

      if (doctorMonthlyData && doctorInfo) {
        const doctorDetails = {
          id: doctorId,
          name: doctorInfo.name,
          department: doctorInfo.department,
          specialization: doctorInfo.specialty,
          avatar: doctorInfo.avatar_url,
          score: doctorMonthlyData.rlu_score || 0,
          cpgMismatch: doctorMonthlyData.cpg_mismatch_percentage || 0,
          duplicateOrder: doctorMonthlyData.duplicate_order_rate || 0,
          cpRatio: doctorMonthlyData.cp_ratio || 0,
          lpRatio: doctorMonthlyData.lp_ratio || 0,
          totalPatients: doctorMonthlyData.total_patient || 0,
          totalLab: doctorMonthlyData.total_lab || 0,
          totalTests: doctorMonthlyData.total_tests || 0,
          duplicateTests: doctorMonthlyData.duplicate_tests || 0,
          estimatedCost: doctorMonthlyData.estimated_cost || 0,
          costSavings: doctorMonthlyData.cost_savings || 0,
          testReduction: doctorMonthlyData.test_reduction || 0,
          patientsCount: doctorMonthlyData.patients_count || 0,
          lastReview: `${selectedMonth} ${selectedYear}`
        };
        
        setSelectedDoctor(doctorDetails);
      } else {
        toast({
          title: "Error",
          description: "Could not find doctor data for selected period.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error in handleViewDoctorDetails:', error);
      toast({
        title: "Error",
        description: "Failed to load doctor details. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleViewAnalytics = () => {
    setShowAnalytics(true);
  };

  const handleViewAllDoctors = () => {
    setShowAllDoctors(true);
  };

  const handleGenerateInsights = () => {
    toast({
      title: "AI Insights Generated",
      description: "Latest AI analysis completed. New recommendations available in the insights panel.",
    });
  };

  const handleExportReport = () => {
    toast({
      title: "Report Exported",
      description: "Dashboard report has been exported successfully as PDF.",
    });
  };

  const handleReviewFeedback = () => {
    toast({
      title: "Physician Feedback",
      description: "Opening physician feedback review panel...",
    });
  };

  return (
    <div className="space-y-6" data-pdf-content>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPresentationMode(true)}
            className="flex items-center gap-2"
          >
            <Presentation className="h-4 w-4" />
            {t('dashboard.presentation')}
          </Button>
          <PDFExport title="RLU 360 Dashboard Report" />
          <Button className="btn-hero" onClick={handleViewAnalytics}>
            <Target className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <div key={kpi.title} style={{ animationDelay: `${index * 0.1}s` }}>
            <KPICard {...kpi} />
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        <KPIChart 
          title="RLU Score Trend" 
          data={chartData.rluScore}
          color="hsl(var(--primary))"
          formatValue={(v) => v.toFixed(1)}
        />
        <KPIChart 
          title="L/P Ratio Trend" 
          data={chartData.lpRatio}
          color="hsl(var(--success))"
          formatValue={(v) => v.toFixed(2)}
        />
        <KPIChart 
          title="CPG MisMatch(%) Trend" 
          data={chartData.cpgMismatch}
          color="hsl(var(--warning))"
          formatValue={(v) => `${v.toFixed(1)}%`}
        />
        <KPIChart 
          title="Duplicate Order(%) Trend" 
          data={chartData.duplicateOrder}
          color="hsl(var(--destructive))"
          formatValue={(v) => `${v.toFixed(1)}%`}
        />
        <KPIChart 
          title="C/P Ratio Trend" 
          data={chartData.cpRatio}
          color="hsl(var(--info))"
          formatValue={(v) => v.toFixed(2)}
        />
        <KPIChart 
          title="Active Physicians Trend" 
          data={chartData.activePhysicians}
          color="hsl(var(--primary))"
          formatValue={(v) => v.toString()}
        />
      </div>

      {/* Dashboard Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Performing Doctors */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Top Performing Physicians
              </h2>
              <Button variant="ghost" size="sm" onClick={handleViewAllDoctors}>
                View All
              </Button>
            </div>
            
            {/* Month and Year Selectors */}
            <div className="flex gap-4 mb-6">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Month:</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="January">January</SelectItem>
                    <SelectItem value="February">February</SelectItem>
                    <SelectItem value="March">March</SelectItem>
                    <SelectItem value="April">April</SelectItem>
                    <SelectItem value="May">May</SelectItem>
                    <SelectItem value="June">June</SelectItem>
                    <SelectItem value="July">July</SelectItem>
                    <SelectItem value="August">August</SelectItem>
                    <SelectItem value="September">September</SelectItem>
                    <SelectItem value="October">October</SelectItem>
                    <SelectItem value="November">November</SelectItem>
                    <SelectItem value="December">December</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Year:</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Doctors List */}
            <div className="space-y-4">
              {doctorsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading doctors...</div>
                </div>
              ) : topDoctors.length > 0 ? (
                topDoctors.map((doctor, index) => (
                  <div
                    key={doctor.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${(index + 4) * 0.1}s` }}
                  >
                    <DoctorCard
                      doctor={doctor}
                      onViewDetails={handleViewDoctorDetails}
                    />
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">No doctors found for selected period</div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* AI Insights & Quick Actions */}
        <div className="space-y-6">
          {/* AI Insights */}
          <div className="animate-fade-in" style={{ animationDelay: "0.7s" }}>
            <AIInsights chartData={chartData} topDoctors={topDoctors} />
          </div>

        </div>
      </div>

      {/* Advanced AI Features */}
      <AdvancedAI />

      {/* Presentation Mode */}
      <PresentationMode 
        isOpen={isPresentationMode} 
        onClose={() => setIsPresentationMode(false)} 
      />

      {/* Doctor Details Modal */}
      <Dialog open={!!selectedDoctor} onOpenChange={() => setSelectedDoctor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดแพทย์</DialogTitle>
          </DialogHeader>
          {selectedDoctor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">ชื่อ: {anonymizeDoctorData(selectedDoctor, isJudge).name}</p>
                  <p>แผนก: {selectedDoctor.department}</p>
                  <p>ความเชี่ยวชาญ: {selectedDoctor.specialization}</p>
                </div>
                <div>
                  <p>RLU Score: {selectedDoctor.score?.toFixed(2)}/100</p>
                  <p>CPG Mismatch: {selectedDoctor.cpgMismatch?.toFixed(1)}%</p>
                  <p>Duplicate Order: {selectedDoctor.duplicateOrder?.toFixed(1)}%</p>
                  <p>C/P Ratio: {selectedDoctor.cpRatio?.toFixed(2)}</p>
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">รายละเอียดประสิทธิภาพ</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p>• L/P Ratio: {selectedDoctor.lpRatio?.toFixed(2)}</p>
                    <p>• Total Patients: {selectedDoctor.totalPatients}</p>
                    <p>• Total Lab Tests: {selectedDoctor.totalLab}</p>
                    <p>• Total Tests: {selectedDoctor.totalTests}</p>
                  </div>
                  <div>
                    <p>• Duplicate Tests: {selectedDoctor.duplicateTests}</p>
                    <p>• Test Reduction: {selectedDoctor.testReduction?.toFixed(1)}%</p>
                    <p>• Cost Savings: ฿{selectedDoctor.costSavings?.toLocaleString()}</p>
                    <p>• Estimated Cost: ฿{selectedDoctor.estimatedCost?.toLocaleString()}</p>
                  </div>
                </div>
                <p className="mt-2">• การตรวจสอบครั้งล่าสุด: {selectedDoctor.lastReview}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Analytics Modal */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดการวิเคราะห์</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-2">ข้อมูลประจำเดือน</h4>
                <p>• จำนวนการสั่งแลปทั้งหมด: 2,847 ครั้ง</p>
                <p>• การสั่งซ้ำ: 8.7% (ลดลง 2.5%)</p>
                <p>• ความไม่สอดคล้องกับ CPG: 12.3%</p>
                <p>• ประหยัดค่าใช้จ่าย: ฿2.4M</p>
              </Card>
              <Card className="p-4">
                <h4 className="font-semibold mb-2">เปรียบเทียบแผนก</h4>
                <p>• Cardiology: ประหยัด 45K, ลด 25%</p>
                <p>• Internal Med: ประหยัด 52K, ลด 28%</p>
                <p>• Emergency: ประหยัด 29K, ลด 18%</p>
                <p>• Endocrinology: ประหยัด 38K, ลด 32%</p>
              </Card>
            </div>
            <Card className="p-4">
              <h4 className="font-semibold mb-2">แนวโน้มย้อนหลัง 5 เดือน</h4>
              <p>• มกราคม: 15.8% mismatch</p>
              <p>• กุมภาพันธ์: 14.2% mismatch (ปรับปรุง 1.6%)</p>
              <p>• มีนาคม: 13.1% mismatch (ปรับปรุง 1.1%)</p>
              <p>• เมษายน: 12.8% mismatch (ปรับปรุง 0.3%)</p>
              <p>• พฤษภาคม: 12.3% mismatch (ปรับปรุง 0.5%)</p>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Doctors Modal */}
      <Dialog open={showAllDoctors} onOpenChange={setShowAllDoctors}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>แพทย์ทั้งหมดในระบบ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {topDoctors.map((doctor) => (
              <Card key={doctor.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{anonymizeDoctorData(doctor, isJudge).name}</h4>
                    <p className="text-sm text-muted-foreground">{doctor.department} - {doctor.specialization}</p>
                    <p className="text-sm">คะแนน: {doctor.score}/100 | ปรับปรุง: +{doctor.improvement}%</p>
                  </div>
                  <Badge variant={doctor.score >= 90 ? "default" : doctor.score >= 80 ? "secondary" : "outline"}>
                    {doctor.score >= 90 ? "ดีเยี่ยม" : doctor.score >= 80 ? "ดี" : "ต้องปรับปรุง"}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};