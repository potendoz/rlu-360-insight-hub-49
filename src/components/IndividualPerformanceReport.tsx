import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PDFExport } from "./PDFExport";
import { User, BarChart3, TrendingUp, AlertTriangle, CheckCircle, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from "@/hooks/useAuth";
import { anonymizeDoctorName } from "@/utils/pdpaUtils";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department: string;
}

interface MonthlyData {
  month: string;
  year: number;
  total_patient: number;
  total_lab: number;
  rlu_score: number;
  lp_ratio: number;
  cp_ratio: number;
  cpg_mismatch_percentage: number;
  duplicate_order_rate: number;
}

interface MismatchData {
  month: string;
  year: number;
  total_mismatch: number;
  fbs_mismatch: number;
  hba1c_mismatch: number;
  lipid_profile_mismatch: number;
  lft_mismatch: number;
  ft3_mismatch: number;
  ft4_mismatch: number;
  aptt_mismatch: number;
}

interface MismatchAnalysis {
  month: string;
  year: number;
  fbs_count: number;
  hba1c_count: number;
  lipid_profile_count: number;
  lft_count: number;
  ft3_count: number;
  ft4_count: number;
  aptt_count: number;
  fbs_top_mismatch: string;
  hba1c_top_mismatch: string;
  lipid_profile_top_mismatch: string;
  lft_top_mismatch: string;
  ft3_top_mismatch: string;
  ft4_top_mismatch: string;
  aptt_top_mismatch: string;
  fbs_breakdown: string;
  hba1c_breakdown: string;
  lipid_profile_breakdown: string;
  lft_breakdown: string;
  ft3_breakdown: string;
  ft4_breakdown: string;
  aptt_breakdown: string;
}

export const IndividualPerformanceReport = () => {
  const { hasRole } = useAuth();
  const isJudge = hasRole('judge');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [currentData, setCurrentData] = useState<MonthlyData | null>(null);
  const [previousData, setPreviousData] = useState<MonthlyData | null>(null);
  const [historicalData, setHistoricalData] = useState<MonthlyData[]>([]);
  const [averageData, setAverageData] = useState<MonthlyData[]>([]);
  const [mismatchData, setMismatchData] = useState<MismatchData | null>(null);
  const [mismatchAnalysis, setMismatchAnalysis] = useState<MismatchAnalysis | null>(null);
  const [historicalMismatch, setHistoricalMismatch] = useState<MismatchData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLabAnalysis, setShowLabAnalysis] = useState(false);
  const [showPerformanceAnalysis, setShowPerformanceAnalysis] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = ["2026", "2025", "2024"];

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedMonth && selectedYear) {
      fetchReportData();
    }
  }, [selectedDoctor, selectedMonth, selectedYear]);

  const fetchDoctors = async () => {
    const savedSheetId = localStorage.getItem('googleSheetId');
    if (!savedSheetId) return;

    const { googleSheetsService } = await import('@/services/googleSheetsService');
    const data = await googleSheetsService.getDoctors();
    
    if (data) {
      setDoctors(data);
    }
  };

  const getPreviousMonth = (month: string, year: number) => {
    const monthIndex = months.indexOf(month);
    if (monthIndex === 0) {
      return { month: 'December', year: year - 1 };
    }
    return { month: months[monthIndex - 1], year };
  };

  const fetchReportData = async () => {
    if (!selectedDoctor || !selectedMonth || !selectedYear) return;
    
    setLoading(true);
    
    try {
      // Load Google Sheets Service
      const { googleSheetsService } = await import('@/services/googleSheetsService');
      
      // Fetch all monthly data from Google Sheets
      const allMonthlyData = await googleSheetsService.getMonthlyData();
      console.log('All monthly data:', allMonthlyData);
      
      // Fetch current month data
      const currentMonthData = allMonthlyData.find(
        (d: any) => d.doctor_id === selectedDoctor && 
                   d.month === selectedMonth && 
                   d.year === parseInt(selectedYear)
      );
      
      console.log('Current month data:', currentMonthData);
      setCurrentData(currentMonthData || null);

      // Fetch previous month data for comparison
      const { month: prevMonth, year: prevYear } = getPreviousMonth(selectedMonth, parseInt(selectedYear));
      const previousMonthData = allMonthlyData.find(
        (d: any) => d.doctor_id === selectedDoctor && 
                   d.month === prevMonth && 
                   d.year === prevYear
      );

      setPreviousData(previousMonthData || null);

      // Fetch historical data for this doctor
      const historical = allMonthlyData.filter(
        (d: any) => d.doctor_id === selectedDoctor && d.year === parseInt(selectedYear)
      );
      
      setHistoricalData(historical);

      // Calculate averages by month from all doctors
      const monthlyAverages = months.map(month => {
        const monthData = allMonthlyData.filter(
          (d: any) => d.month === month && d.year === parseInt(selectedYear)
        );
        
        if (monthData.length === 0) return null;

        return {
          month,
          year: parseInt(selectedYear),
          total_patient: Math.round(monthData.reduce((sum: number, d: any) => sum + (d.total_patient || 0), 0) / monthData.length),
          total_lab: Math.round(monthData.reduce((sum: number, d: any) => sum + (d.total_lab || 0), 0) / monthData.length),
          rlu_score: Math.round((monthData.reduce((sum: number, d: any) => sum + (d.rlu_score || 0), 0) / monthData.length) * 100) / 100,
          lp_ratio: Math.round((monthData.reduce((sum: number, d: any) => sum + (d.lp_ratio || 0), 0) / monthData.length) * 100) / 100,
          cp_ratio: Math.round((monthData.reduce((sum: number, d: any) => sum + (d.cp_ratio || 0), 0) / monthData.length) * 100) / 100,
          cpg_mismatch_percentage: Math.round((monthData.reduce((sum: number, d: any) => sum + (d.cpg_mismatch_percentage || 0), 0) / monthData.length) * 100) / 100,
          duplicate_order_rate: Math.round((monthData.reduce((sum: number, d: any) => sum + (d.duplicate_order_rate || 0), 0) / monthData.length) * 100) / 100,
        };
      }).filter(Boolean) as MonthlyData[];

      setAverageData(monthlyAverages);

      // Fetch all mismatch data from Google Sheets
      const allMismatchData = await googleSheetsService.getMismatchData();
      console.log('All mismatch data:', allMismatchData);
      
      // Find mismatch data for current doctor and month
      const mismatch = allMismatchData.find(
        (d: any) => d.doctor_id === selectedDoctor && 
                   d.month === selectedMonth && 
                   d.year === parseInt(selectedYear)
      );

      setMismatchData(mismatch || null);

      // Fetch all mismatch analysis from Google Sheets
      const allMismatchAnalysis = await googleSheetsService.getMismatchAnalysis();
      console.log('All mismatch analysis:', allMismatchAnalysis);
      
      // Find mismatch analysis for current doctor and month
      const analysis = allMismatchAnalysis.find(
        (d: any) => d.doctor_id === selectedDoctor && 
                   d.month === selectedMonth && 
                   d.year === parseInt(selectedYear)
      );

      setMismatchAnalysis(analysis || null);

      // Fetch historical mismatch data for this doctor
      const histMismatch = allMismatchData.filter(
        (d: any) => d.doctor_id === selectedDoctor && d.year === parseInt(selectedYear)
      );

      setHistoricalMismatch(histMismatch);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (value: number, type: 'score' | 'ratio' | 'percentage') => {
    if (type === 'score') {
      if (value > 90) return 'text-green-600 bg-green-50';
      if (value >= 75) return 'text-yellow-600 bg-yellow-50';
      return 'text-red-600 bg-red-50';
    }
    if (type === 'percentage') {
      if (value < 10) return 'text-green-600 bg-green-50';
      if (value < 20) return 'text-yellow-600 bg-yellow-50';
      return 'text-red-600 bg-red-50';
    }
    // For ratios (lower is better)
    if (value < 3) return 'text-green-600 bg-green-50';
    if (value < 5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPerformanceStatus = (value: number, type: 'score' | 'ratio' | 'percentage') => {
    if (type === 'score') {
      if (value > 90) return 'Excellent';
      if (value >= 75) return 'Good';
      return 'Need Improvement';
    }
    if (type === 'percentage') {
      if (value < 10) return 'Excellent';
      if (value < 20) return 'Good';
      return 'Need Improvement';
    }
    if (value < 3) return 'Excellent';
    if (value < 5) return 'Good';
    return 'Need Improvement';
  };

  const getComparisonIcon = (current: number, previous: number | null) => {
    if (!previous) return null;
    const diff = current - previous;
    if (Math.abs(diff) < 0.01) return '→';
    return diff > 0 ? '↗' : '↘';
  };

  const getComparisonColor = (current: number, previous: number | null, isPositiveBetter: boolean = true) => {
    if (!previous) return 'text-muted-foreground';
    const diff = current - previous;
    if (Math.abs(diff) < 0.01) return 'text-muted-foreground';
    
    const isImprovement = isPositiveBetter ? diff > 0 : diff < 0;
    return isImprovement ? 'text-green-600' : 'text-red-600';
  };

  const getComparisonText = (current: number, previous: number | null, unit: string = '') => {
    if (!previous) return 'No previous data';
    const diff = current - previous;
    if (Math.abs(diff) < 0.01) return 'Same as previous month';
    
    const change = Math.abs(diff);
    const direction = diff > 0 ? 'increase' : 'decrease';
    return `${change.toFixed(2)}${unit} ${direction} from previous month`;
  };

  const getStrengthsAndImprovements = () => {
    if (!currentData) return { strengths: [], improvements: [] };

    const strengths = [];
    const improvements = [];

    // RLU Score
    if (currentData.rlu_score > 90) {
      strengths.push("Outstanding RLU compliance demonstrates excellent clinical decision-making");
    } else if (currentData.rlu_score < 75) {
      improvements.push("RLU score requires significant improvement through focused training");
    }

    // L/P Ratio
    if (currentData.lp_ratio < 3) {
      strengths.push("Optimal lab-to-patient ratio shows efficient resource utilization");
    } else if (currentData.lp_ratio > 5) {
      improvements.push("High lab-to-patient ratio needs reduction through better test selection");
    }

    // CPG Mismatch
    if (currentData.cpg_mismatch_percentage < 10) {
      strengths.push("Excellent adherence to clinical practice guidelines");
    } else if (currentData.cpg_mismatch_percentage > 20) {
      improvements.push("High CPG mismatch rate requires structured guideline training");
    }

    // Duplicate Orders
    if (currentData.duplicate_order_rate < 5) {
      strengths.push("Low duplicate order rate indicates good order management");
    } else if (currentData.duplicate_order_rate > 15) {
      improvements.push("Elevated duplicate orders need systematic review and prevention");
    }

    return { strengths, improvements };
  };

  const getDevelopmentRecommendations = () => {
    if (!currentData) return [];

    const recommendations = [];

    if (currentData.rlu_score < 75) {
      recommendations.push("Implement structured RLU training program with monthly assessments");
      recommendations.push("Establish clinical decision support system integration");
    }

    if (currentData.cpg_mismatch_percentage > 20) {
      recommendations.push("Mandatory CPG refresher training with competency validation");
      recommendations.push("Deploy real-time guideline alerts in EMR system");
    }

    if (currentData.lp_ratio > 5) {
      recommendations.push("Implement lab utilization review committee oversight");
      recommendations.push("Provide personalized feedback on ordering patterns");
    }

    if (currentData.duplicate_order_rate > 15) {
      recommendations.push("Install duplicate order detection and prevention system");
      recommendations.push("Conduct workflow analysis to identify ordering process gaps");
    }

    if (recommendations.length === 0) {
      recommendations.push("Continue maintaining excellent performance standards");
      recommendations.push("Consider mentoring role for junior colleagues");
      recommendations.push("Participate in best practice sharing initiatives");
    }

    return recommendations;
  };

  const prepareChartData = () => {
    if (!historicalData.length || !averageData.length) return [];

    // Create array of all months with year, sorted chronologically
    const allAvailableData = [];
    
    // Get all unique month-year combinations from historical data
    const uniqueMonthYears = new Set();
    historicalData.forEach(data => {
      uniqueMonthYears.add(`${data.month}-${data.year}`);
    });
    
    averageData.forEach(data => {
      uniqueMonthYears.add(`${data.month}-${data.year}`);
    });

    // Convert to array and sort chronologically
    const sortedMonthYears = Array.from(uniqueMonthYears)
      .map((monthYear: string) => {
        const [month, year] = monthYear.split('-');
        return { month, year: parseInt(year) };
      })
      .sort((a, b) => {
        const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const aIndex = monthOrder.indexOf(a.month) + (a.year * 12);
        const bIndex = monthOrder.indexOf(b.month) + (b.year * 12);
        return aIndex - bIndex;
      });

    // Find the index of selected month-year
    const selectedMonthYear = `${selectedMonth}-${selectedYear}`;
    const selectedIndex = sortedMonthYears.findIndex(
      item => `${item.month}-${item.year}` === selectedMonthYear
    );

    // Get last 6 months ending with selected month-year
    const endIndex = selectedIndex >= 0 ? selectedIndex : sortedMonthYears.length - 1;
    const startIndex = Math.max(0, endIndex - 5);
    const last6MonthsData = sortedMonthYears.slice(startIndex, endIndex + 1);

    return last6MonthsData.map(({ month, year }) => {
      const doctorData = historicalData.find(d => d.month === month && d.year === year);
      const avgData = averageData.find(d => d.month === month && d.year === year);

      return {
        month: `${month.slice(0, 3)} ${year}`,
        doctor_rlu: doctorData?.rlu_score || 0,
        average_rlu: avgData?.rlu_score || 0,
        doctor_lp: doctorData?.lp_ratio || 0,
        average_lp: avgData?.lp_ratio || 0,
        doctor_cp: doctorData?.cp_ratio || 0,
        average_cp: avgData?.cp_ratio || 0,
        doctor_cpg: doctorData?.cpg_mismatch_percentage || 0,
        average_cpg: avgData?.cpg_mismatch_percentage || 0,
        doctor_dup: doctorData?.duplicate_order_rate || 0,
        average_dup: avgData?.duplicate_order_rate || 0,
        doctor_patients: doctorData?.total_patient || 0,
        average_patients: avgData?.total_patient || 0,
      };
    });
  };

  const selectedDoctorName = doctors.find(d => d.id === selectedDoctor)?.name || "";

  if (!selectedDoctor || !selectedMonth || !selectedYear) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-6 h-6" />
            Individual Performance Report
          </CardTitle>
          <CardDescription>
            Generate detailed individual physician performance analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Doctor</label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {isJudge ? anonymizeDoctorName(doctor.name) : doctor.name} - {doctor.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Select Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Select Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="text-center">Loading report data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!currentData) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            No data available for the selected period
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = prepareChartData();
  const { strengths, improvements } = getStrengthsAndImprovements();
  const recommendations = getDevelopmentRecommendations();

  return (
    <div className="w-full space-y-6" data-pdf-content>
      {/* PAGE 1 - HEADER & OVERVIEW */}
      <div className="pdf-page-break space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <User className="w-7 h-7" />
                  Individual Performance Report
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  {selectedDoctorName} - {selectedMonth} {selectedYear}
                </CardDescription>
                <div className="mt-4 text-sm text-muted-foreground">
                  Report Generated: {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} | Page 1 of 3
                </div>
              </div>
              <PDFExport title={`Individual Performance Report - ${selectedDoctorName}`} />
            </div>
          </CardHeader>
        </Card>

         {/* 1. Lab Usage Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Lab Usage Overview - {selectedMonth} {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">{currentData.total_patient || 0}</div>
                <div className="text-sm text-blue-700 mb-2">Total Patients</div>
                <div className={`text-xs flex items-center justify-center gap-1 ${getComparisonColor(currentData.total_patient, previousData?.total_patient)}`}>
                  <span>{getComparisonIcon(currentData.total_patient, previousData?.total_patient)}</span>
                  <span>{getComparisonText(currentData.total_patient, previousData?.total_patient)}</span>
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">{currentData.total_lab || 0}</div>
                <div className="text-sm text-purple-700 mb-2">Total Lab Tests</div>
                <div className={`text-xs flex items-center justify-center gap-1 ${getComparisonColor(currentData.total_lab, previousData?.total_lab)}`}>
                  <span>{getComparisonIcon(currentData.total_lab, previousData?.total_lab)}</span>
                  <span>{getComparisonText(currentData.total_lab, previousData?.total_lab)}</span>
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">{currentData.rlu_score?.toFixed(2) || '0.00'}</div>
                <div className="text-sm text-green-700 mb-2">RLU Score</div>
                <div className={`text-xs flex items-center justify-center gap-1 ${getComparisonColor(currentData.rlu_score, previousData?.rlu_score)}`}>
                  <span>{getComparisonIcon(currentData.rlu_score, previousData?.rlu_score)}</span>
                  <span>{getComparisonText(currentData.rlu_score, previousData?.rlu_score)}</span>
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border">
                <div className="text-2xl font-bold text-orange-600">{currentData.lp_ratio?.toFixed(2) || '0.00'}</div>
                <div className="text-sm text-orange-700 mb-2">L/P Ratio</div>
                <div className={`text-xs flex items-center justify-center gap-1 ${getComparisonColor(currentData.lp_ratio, previousData?.lp_ratio, false)}`}>
                  <span>{getComparisonIcon(currentData.lp_ratio, previousData?.lp_ratio)}</span>
                  <span>{getComparisonText(currentData.lp_ratio, previousData?.lp_ratio)}</span>
                </div>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg border">
                <div className="text-2xl font-bold text-indigo-600">{currentData.cp_ratio?.toFixed(2) || '0.00'}</div>
                <div className="text-sm text-indigo-700 mb-2">C/P Ratio</div>
                <div className={`text-xs flex items-center justify-center gap-1 ${getComparisonColor(currentData.cp_ratio, previousData?.cp_ratio, false)}`}>
                  <span>{getComparisonIcon(currentData.cp_ratio, previousData?.cp_ratio)}</span>
                  <span>{getComparisonText(currentData.cp_ratio, previousData?.cp_ratio, ' THB')}</span>
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border">
                <div className="text-2xl font-bold text-red-600">{currentData.cpg_mismatch_percentage?.toFixed(1) || '0.0'}%</div>
                <div className="text-sm text-red-700 mb-2">CPG Mismatch</div>
                <div className={`text-xs flex items-center justify-center gap-1 ${getComparisonColor(currentData.cpg_mismatch_percentage, previousData?.cpg_mismatch_percentage, false)}`}>
                  <span>{getComparisonIcon(currentData.cpg_mismatch_percentage, previousData?.cpg_mismatch_percentage)}</span>
                  <span>{getComparisonText(currentData.cpg_mismatch_percentage, previousData?.cpg_mismatch_percentage, '%')}</span>
                </div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border">
                <div className="text-2xl font-bold text-yellow-600">{currentData.duplicate_order_rate?.toFixed(1) || '0.0'}%</div>
                <div className="text-sm text-yellow-700 mb-2">Duplicate Orders</div>
                <div className={`text-xs flex items-center justify-center gap-1 ${getComparisonColor(currentData.duplicate_order_rate, previousData?.duplicate_order_rate, false)}`}>
                  <span>{getComparisonIcon(currentData.duplicate_order_rate, previousData?.duplicate_order_rate)}</span>
                  <span>{getComparisonText(currentData.duplicate_order_rate, previousData?.duplicate_order_rate, '%')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary & Lab Usage Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Performance Summary & Lab Usage Analysis
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowLabAnalysis(!showLabAnalysis)}
                className="flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                AI Insight
              </Button>
            </div>
          </CardHeader>
          {showLabAnalysis && (
            <CardContent className="space-y-6">
              {/* Detailed Lab Usage Analysis */}
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-3">Lab Usage Analysis</h4>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Patient Volume:</strong> {currentData.total_patient} patients treated in {selectedMonth}</p>
                    {previousData && (
                      <p className="text-muted-foreground">
                        {getComparisonText(currentData.total_patient, previousData.total_patient)} 
                        ({previousData.total_patient} in previous month)
                      </p>
                    )}
                  </div>
                  <div>
                    <p><strong>Lab Testing Volume:</strong> {currentData.total_lab} total tests ordered</p>
                    {previousData && (
                      <p className="text-muted-foreground">
                        {getComparisonText(currentData.total_lab, previousData.total_lab)}
                        ({previousData.total_lab} in previous month)
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p><strong>Lab Efficiency (L/P Ratio):</strong> {currentData.lp_ratio} tests per patient</p>
                    {previousData && (
                      <p className="text-muted-foreground">
                        {getComparisonText(currentData.lp_ratio, previousData.lp_ratio)}
                        ({previousData.lp_ratio} in previous month)
                      </p>
                    )}
                    <p className="text-xs mt-1">
                      {currentData.lp_ratio < 3 ? "Excellent efficiency - optimal test utilization" :
                       currentData.lp_ratio < 5 ? "Good efficiency - moderate test utilization" :
                       "Room for improvement - high test utilization per patient"}
                    </p>
                  </div>
                  <div>
                    <p><strong>Cost Efficiency (C/P Ratio):</strong> ฿{currentData.cp_ratio} per patient</p>
                    {previousData && (
                      <p className="text-muted-foreground">
                        {getComparisonText(currentData.cp_ratio, previousData.cp_ratio, ' THB')}
                        (฿{previousData.cp_ratio} in previous month)
                      </p>
                    )}
                    <p className="text-xs mt-1">
                      {currentData.cp_ratio < 300 ? "Excellent cost control" :
                       currentData.cp_ratio < 500 ? "Good cost management" :
                       "High cost per patient - review test selection"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-600 mb-3">Key Strengths</h4>
                <ul className="space-y-2">
                  {strengths.slice(0, 3).map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                  {strengths.length === 0 && (
                    <li className="text-sm text-muted-foreground">Analysis shows consistent performance standards</li>
                  )}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-orange-600 mb-3">Priority Improvements</h4>
                <ul className="space-y-2">
                  {improvements.slice(0, 3).map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{improvement}</span>
                    </li>
                  ))}
                  {improvements.length === 0 && (
                    <li className="text-sm text-muted-foreground">No critical areas identified for immediate improvement</li>
                  )}
                </ul>
              </div>
            </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* PAGE 2 - PERFORMANCE TRENDS */}
      <div className="pdf-page-break space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              6-Month Performance Trends vs Average
            </CardTitle>
            <CardDescription>Page 2 of 3 - Historical Performance Analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Charts content here... keep existing code */}
              {/* RLU Score Chart */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <h3 className="text-lg font-semibold mb-4 text-foreground">RLU Score Comparison</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs text-muted-foreground"
                      />
                      <YAxis 
                        className="text-xs text-muted-foreground"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="doctor_rlu" 
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: "#3b82f6", strokeWidth: 2, fill: '#ffffff' }}
                        name={selectedDoctorName}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="average_rlu" 
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Department Average"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* L/P Ratio Chart */}
              <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
                <h3 className="text-lg font-semibold mb-4 text-foreground">L/P Ratio Trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs text-muted-foreground"
                      />
                      <YAxis 
                        className="text-xs text-muted-foreground"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="doctor_lp" 
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: "#10b981", strokeWidth: 2, fill: '#ffffff' }}
                        name={selectedDoctorName}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="average_lp" 
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Average"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* C/P Ratio Chart */}
              <Card className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
                <h3 className="text-lg font-semibold mb-4 text-foreground">C/P Ratio Trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs text-muted-foreground"
                      />
                      <YAxis 
                        className="text-xs text-muted-foreground"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="doctor_cp" 
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: "#8b5cf6", strokeWidth: 2, fill: '#ffffff' }}
                        name={selectedDoctorName}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="average_cp" 
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Average"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* CPG Mismatch Chart */}
              <Card className="p-6 bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20">
                <h3 className="text-lg font-semibold mb-4 text-foreground">CPG Mismatch Trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs text-muted-foreground"
                      />
                      <YAxis 
                        className="text-xs text-muted-foreground"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="doctor_cpg" 
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ fill: "#ef4444", strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: "#ef4444", strokeWidth: 2, fill: '#ffffff' }}
                        name={selectedDoctorName}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="average_cpg" 
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Average"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Duplicate Orders Chart */}
              <Card className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Duplicate Orders Trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs text-muted-foreground"
                      />
                      <YAxis 
                        className="text-xs text-muted-foreground"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="doctor_dup" 
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ fill: "#f59e0b", strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: "#f59e0b", strokeWidth: 2, fill: '#ffffff' }}
                        name={selectedDoctorName}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="average_dup" 
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Average"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Total Patients Chart */}
              <Card className="p-6 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Total Patients Trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs text-muted-foreground"
                      />
                      <YAxis 
                        className="text-xs text-muted-foreground"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="doctor_patients" 
                        stroke="#06b6d4"
                        strokeWidth={3}
                        dot={{ fill: "#06b6d4", strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 7, stroke: "#06b6d4", strokeWidth: 2, fill: '#ffffff' }}
                        name={selectedDoctorName}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="average_patients" 
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Average"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PAGE 3 - MISMATCH ANALYSIS & RECOMMENDATIONS */}
      <div className="pdf-page-break space-y-6">
        {/* Mismatch Analysis Overview */}
        {mismatchData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Mismatch Analysis - {selectedMonth} {selectedYear}
              </CardTitle>
              <CardDescription>Page 3 of 3 - Detailed Analysis & Recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Mismatch', value: mismatchData.total_mismatch, key: 'total' },
                  { label: 'FBS Mismatch', value: mismatchData.fbs_mismatch, key: 'fbs' },
                  { label: 'HbA1c Mismatch', value: mismatchData.hba1c_mismatch, key: 'hba1c' },
                  { label: 'Lipid Profile', value: mismatchData.lipid_profile_mismatch, key: 'lipid' },
                  { label: 'LFT Mismatch', value: mismatchData.lft_mismatch, key: 'lft' },
                  { label: 'FT3 Mismatch', value: mismatchData.ft3_mismatch, key: 'ft3' },
                  { label: 'FT4 Mismatch', value: mismatchData.ft4_mismatch, key: 'ft4' },
                  { label: 'APTT Mismatch', value: mismatchData.aptt_mismatch, key: 'aptt' }
                ].map((item) => (
                  <div key={item.key} className="text-center p-4 border rounded-lg">
                    <div className="text-xl font-bold">{item.value || 0}</div>
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                    <Badge 
                      className={`mt-2 ${
                        (item.value || 0) < 5 ? 'bg-green-100 text-green-800' :
                        (item.value || 0) < 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {(item.value || 0) < 5 ? 'Good' : (item.value || 0) < 10 ? 'Fair' : 'Poor'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* 4. Detailed Mismatch Analysis Insights */}
        {mismatchAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Detailed Mismatch Analysis Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { 
                    type: 'FBS', 
                    count: mismatchAnalysis.fbs_count, 
                    topMismatch: mismatchAnalysis.fbs_top_mismatch,
                    breakdown: mismatchAnalysis.fbs_breakdown
                  },
                  { 
                    type: 'HbA1c', 
                    count: mismatchAnalysis.hba1c_count, 
                    topMismatch: mismatchAnalysis.hba1c_top_mismatch,
                    breakdown: mismatchAnalysis.hba1c_breakdown
                  },
                  { 
                    type: 'Lipid Profile', 
                    count: mismatchAnalysis.lipid_profile_count, 
                    topMismatch: mismatchAnalysis.lipid_profile_top_mismatch,
                    breakdown: mismatchAnalysis.lipid_profile_breakdown
                  },
                  { 
                    type: 'LFT', 
                    count: mismatchAnalysis.lft_count, 
                    topMismatch: mismatchAnalysis.lft_top_mismatch,
                    breakdown: mismatchAnalysis.lft_breakdown
                  },
                  { 
                    type: 'FT3', 
                    count: mismatchAnalysis.ft3_count, 
                    topMismatch: mismatchAnalysis.ft3_top_mismatch,
                    breakdown: mismatchAnalysis.ft3_breakdown
                  },
                  { 
                    type: 'FT4', 
                    count: mismatchAnalysis.ft4_count, 
                    topMismatch: mismatchAnalysis.ft4_top_mismatch,
                    breakdown: mismatchAnalysis.ft4_breakdown
                  },
                  { 
                    type: 'APTT', 
                    count: mismatchAnalysis.aptt_count, 
                    topMismatch: mismatchAnalysis.aptt_top_mismatch,
                    breakdown: mismatchAnalysis.aptt_breakdown
                  }
                ].map((item) => (
                  <div key={item.type} className="border rounded-lg p-4 bg-card">
                    <h4 className="font-semibold text-lg mb-3 text-primary">{item.type} Mismatch Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Count</div>
                        <div className="text-xl font-bold text-foreground">{item.count || 0}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Top Mismatch</div>
                        <div className="text-sm text-foreground bg-muted/50 p-2 rounded">{item.topMismatch || 'N/A'}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Breakdown</div>
                        <div className="text-sm text-foreground bg-muted/50 p-2 rounded">{item.breakdown || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 5. Performance Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Performance Analysis
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowPerformanceAnalysis(!showPerformanceAnalysis)}
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                AI Insight
              </Button>
            </div>
          </CardHeader>
          {showPerformanceAnalysis && (
            <CardContent className="space-y-6">
            {/* Lab Usage Overview Analysis */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Lab Usage Overview Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-primary">Patient Volume Assessment</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Total patients treated: {currentData.total_patient}</p>
                    <p>• {getComparisonText(currentData.total_patient, previousData?.total_patient || 0)} 
                       <span className={getComparisonColor(currentData.total_patient, previousData?.total_patient, true)}>
                         {getComparisonIcon(currentData.total_patient, previousData?.total_patient)} 
                       </span>
                    </p>
                    {currentData.total_patient > (previousData?.total_patient || 0) && (
                      <p className="text-green-600">✓ Increased patient volume indicates growing practice</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-primary">Laboratory Utilization</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Total lab tests ordered: {currentData.total_lab}</p>
                    <p>• L/P Ratio: {currentData.lp_ratio} 
                       <span className={getComparisonColor(currentData.lp_ratio, previousData?.lp_ratio, false)}>
                         {getComparisonIcon(currentData.lp_ratio, previousData?.lp_ratio)} 
                       </span>
                    </p>
                    {currentData.lp_ratio < 3 && (
                      <p className="text-green-600">✓ Excellent lab utilization efficiency</p>
                    )}
                    {currentData.lp_ratio > 5 && (
                      <p className="text-amber-600">⚠ High lab-to-patient ratio needs review</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-primary">Quality Metrics</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• RLU Score: {currentData.rlu_score}% 
                       <span className={getComparisonColor(currentData.rlu_score, previousData?.rlu_score, true)}>
                         {getComparisonIcon(currentData.rlu_score, previousData?.rlu_score)} 
                       </span>
                    </p>
                    <p>• CPG Mismatch: {currentData.cpg_mismatch_percentage}% 
                       <span className={getComparisonColor(currentData.cpg_mismatch_percentage, previousData?.cpg_mismatch_percentage, false)}>
                         {getComparisonIcon(currentData.cpg_mismatch_percentage, previousData?.cpg_mismatch_percentage)} 
                       </span>
                    </p>
                    {currentData.rlu_score > 90 && (
                      <p className="text-green-600">✓ Outstanding compliance with guidelines</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-primary">Efficiency Indicators</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• C/P Ratio: {currentData.cp_ratio} 
                       <span className={getComparisonColor(currentData.cp_ratio, previousData?.cp_ratio, false)}>
                         {getComparisonIcon(currentData.cp_ratio, previousData?.cp_ratio)} 
                       </span>
                    </p>
                    <p>• Duplicate Orders: {currentData.duplicate_order_rate}% 
                       <span className={getComparisonColor(currentData.duplicate_order_rate, previousData?.duplicate_order_rate, false)}>
                         {getComparisonIcon(currentData.duplicate_order_rate, previousData?.duplicate_order_rate)} 
                       </span>
                    </p>
                    {currentData.duplicate_order_rate < 5 && (
                      <p className="text-green-600">✓ Excellent order management</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mismatch Analysis Insights */}
            {mismatchData && mismatchAnalysis && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Mismatch Analysis Performance</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-primary">Overall Mismatch Assessment</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• Total mismatch incidents: {mismatchData.total_mismatch}</p>
                      <p>• Mismatch rate: {((mismatchData.total_mismatch / currentData.total_lab) * 100).toFixed(2)}%</p>
                      {mismatchData.total_mismatch < currentData.total_lab * 0.05 && (
                        <p className="text-green-600">✓ Excellent mismatch control (&lt; 5%)</p>
                      )}
                      {mismatchData.total_mismatch > currentData.total_lab * 0.15 && (
                        <p className="text-red-600">⚠ High mismatch rate requires immediate attention</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-primary">Critical Test Areas</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• FBS mismatches: {mismatchData.fbs_mismatch} (Count: {mismatchAnalysis.fbs_count})</p>
                      <p>• HbA1c mismatches: {mismatchData.hba1c_mismatch} (Count: {mismatchAnalysis.hba1c_count})</p>
                      <p>• Lipid Profile mismatches: {mismatchData.lipid_profile_mismatch} (Count: {mismatchAnalysis.lipid_profile_count})</p>
                      <p>• LFT mismatches: {mismatchData.lft_mismatch} (Count: {mismatchAnalysis.lft_count})</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-primary">Thyroid Function Assessment</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• FT3 mismatches: {mismatchData.ft3_mismatch} (Count: {mismatchAnalysis.ft3_count})</p>
                      <p>• FT4 mismatches: {mismatchData.ft4_mismatch} (Count: {mismatchAnalysis.ft4_count})</p>
                      {mismatchAnalysis.ft3_top_mismatch && (
                        <p>• Top FT3 issue: {mismatchAnalysis.ft3_top_mismatch}</p>
                      )}
                      {mismatchAnalysis.ft4_top_mismatch && (
                        <p>• Top FT4 issue: {mismatchAnalysis.ft4_top_mismatch}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-primary">Coagulation Studies</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• APTT mismatches: {mismatchData.aptt_mismatch} (Count: {mismatchAnalysis.aptt_count})</p>
                      {mismatchAnalysis.aptt_top_mismatch && (
                        <p>• Primary APTT issue: {mismatchAnalysis.aptt_top_mismatch}</p>
                      )}
                      {mismatchAnalysis.aptt_breakdown && (
                        <p>• APTT breakdown: {mismatchAnalysis.aptt_breakdown}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detailed Mismatch Insights */}
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h4 className="font-medium mb-3 text-amber-800">Critical Mismatch Patterns</h4>
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const insights = [];
                      
                      // Top mismatch issues
                      if (mismatchAnalysis.fbs_top_mismatch) {
                        insights.push(`🔍 FBS: ${mismatchAnalysis.fbs_top_mismatch} (${mismatchAnalysis.fbs_breakdown})`);
                      }
                      if (mismatchAnalysis.hba1c_top_mismatch) {
                        insights.push(`🔍 HbA1c: ${mismatchAnalysis.hba1c_top_mismatch} (${mismatchAnalysis.hba1c_breakdown})`);
                      }
                      if (mismatchAnalysis.lipid_profile_top_mismatch) {
                        insights.push(`🔍 Lipids: ${mismatchAnalysis.lipid_profile_top_mismatch} (${mismatchAnalysis.lipid_profile_breakdown})`);
                      }
                      if (mismatchAnalysis.lft_top_mismatch) {
                        insights.push(`🔍 LFT: ${mismatchAnalysis.lft_top_mismatch} (${mismatchAnalysis.lft_breakdown})`);
                      }
                      
                      // Priority recommendations based on highest mismatches
                      const mismatchPriority = [
                        { type: 'FBS', count: mismatchData.fbs_mismatch },
                        { type: 'HbA1c', count: mismatchData.hba1c_mismatch },
                        { type: 'Lipid Profile', count: mismatchData.lipid_profile_mismatch },
                        { type: 'LFT', count: mismatchData.lft_mismatch },
                        { type: 'FT3', count: mismatchData.ft3_mismatch },
                        { type: 'FT4', count: mismatchData.ft4_mismatch },
                        { type: 'APTT', count: mismatchData.aptt_mismatch }
                      ].sort((a, b) => b.count - a.count);
                      
                      if (mismatchPriority[0].count > 0) {
                        insights.push(`⚠️ Highest priority: ${mismatchPriority[0].type} testing requires immediate review`);
                      }
                      
                      return insights;
                    })().map((insight, index) => (
                      <p key={index} className="text-amber-700">{insight}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Key Performance Insights */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Key Performance Insights</h4>
              <div className="space-y-2 text-sm">
                {(() => {
                  const insights = [];
                  
                  // RLU Score insights
                  if (currentData.rlu_score > 90) {
                    insights.push("🏆 Exceptional RLU compliance demonstrates mastery of evidence-based medicine");
                  } else if (currentData.rlu_score < 75) {
                    insights.push("📚 RLU score improvement opportunity through targeted clinical training");
                  }
                  
                  // Lab efficiency insights
                  if (currentData.lp_ratio < 3) {
                    insights.push("⚡ Outstanding lab efficiency with optimal test-to-patient ratio");
                  } else if (currentData.lp_ratio > 5) {
                    insights.push("🔍 Lab utilization review recommended to optimize ordering patterns");
                  }
                  
                  // Mismatch insights
                  if (mismatchData) {
                    const mismatchRate = (mismatchData.total_mismatch / currentData.total_lab) * 100;
                    if (mismatchRate < 5) {
                      insights.push("✅ Excellent mismatch control demonstrates strong clinical accuracy");
                    } else if (mismatchRate > 15) {
                      insights.push("🚨 High mismatch rate indicates need for systematic review and training");
                    }
                  }
                  
                  // Trend analysis
                  if (previousData) {
                    const rluTrend = currentData.rlu_score - previousData.rlu_score;
                    if (rluTrend > 5) {
                      insights.push("📈 Significant RLU improvement shows positive learning trajectory");
                    } else if (rluTrend < -5) {
                      insights.push("📉 RLU decline requires immediate attention and support");
                    }
                  }
                  
                  return insights.length > 0 ? insights : ["📊 Performance metrics are within expected ranges"];
                })().map((insight, index) => (
                  <p key={index} className="text-muted-foreground">{insight}</p>
                ))}
              </div>
            </div>

            {/* Strengths and Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-600 mb-3">Strengths</h4>
                <ul className="space-y-2">
                  {(() => {
                    const baseStrengths = getStrengthsAndImprovements().strengths;
                    
                    // Add mismatch-based strengths
                    if (mismatchData) {
                      const mismatchRate = (mismatchData.total_mismatch / currentData.total_lab) * 100;
                      if (mismatchRate < 5) {
                        baseStrengths.push("Outstanding clinical accuracy with minimal test mismatches");
                      }
                      if (mismatchData.fbs_mismatch === 0) {
                        baseStrengths.push("Perfect FBS testing accuracy demonstrates excellent diabetes management");
                      }
                      if (mismatchData.hba1c_mismatch === 0) {
                        baseStrengths.push("Flawless HbA1c ordering shows superior glycemic monitoring skills");
                      }
                    }
                    
                    return baseStrengths;
                  })().map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                  {getStrengthsAndImprovements().strengths.length === 0 && !mismatchData && (
                    <li className="text-sm text-muted-foreground">Performance analysis in progress</li>
                  )}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-orange-600 mb-3">Areas for Improvement</h4>
                <ul className="space-y-2">
                  {(() => {
                    const baseImprovements = getStrengthsAndImprovements().improvements;
                    
                    // Add mismatch-based improvements
                    if (mismatchData) {
                      const mismatchRate = (mismatchData.total_mismatch / currentData.total_lab) * 100;
                      if (mismatchRate > 15) {
                        baseImprovements.push("High overall mismatch rate requires comprehensive clinical review");
                      }
                      if (mismatchData.fbs_mismatch > 5) {
                        baseImprovements.push("FBS testing accuracy needs improvement through diabetes care training");
                      }
                      if (mismatchData.lipid_profile_mismatch > 5) {
                        baseImprovements.push("Lipid profile ordering requires review of cardiovascular risk guidelines");
                      }
                      if (mismatchData.lft_mismatch > 3) {
                        baseImprovements.push("Liver function test utilization needs optimization");
                      }
                    }
                    
                    return baseImprovements;
                  })().map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{improvement}</span>
                    </li>
                  ))}
                  {getStrengthsAndImprovements().improvements.length === 0 && !mismatchData && (
                    <li className="text-sm text-muted-foreground">No significant areas for improvement identified</li>
                  )}
                </ul>
              </div>
            </div>
            </CardContent>
          )}
        </Card>

        {/* 6. Development Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Development Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(() => {
                const baseRecommendations = getDevelopmentRecommendations();
                
                // Add mismatch-specific recommendations
                if (mismatchData && mismatchAnalysis) {
                  const mismatchRate = (mismatchData.total_mismatch / currentData.total_lab) * 100;
                  if (mismatchRate > 10) {
                    baseRecommendations.push("Implement mismatch reduction program with case-by-case review");
                    baseRecommendations.push("Schedule monthly mismatch analysis sessions with clinical mentor");
                  }
                  
                  // Specific test recommendations
                  if (mismatchData.fbs_mismatch > 3) {
                    baseRecommendations.push("Complete diabetes care certification with focus on FBS interpretation");
                  }
                  if (mismatchData.hba1c_mismatch > 2) {
                    baseRecommendations.push("Enhance HbA1c utilization training through endocrinology consultation");
                  }
                  if (mismatchData.lipid_profile_mismatch > 3) {
                    baseRecommendations.push("Cardiology department collaboration for lipid management protocols");
                  }
                }
                
                return baseRecommendations;
              })().map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
