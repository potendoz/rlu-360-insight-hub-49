import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PDFExport } from "@/components/PDFExport";
import { DollarSign, TrendingUp, TrendingDown, CalendarDays, FileText, Target, BarChart3 } from "lucide-react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { anonymizeDoctorName } from "@/utils/pdpaUtils";
import { googleSheetsService } from "@/services/googleSheetsService";

interface DoctorCostData {
  id: string;
  name: string;
  specialty: string;
  department: string;
  total_patient: number;
  total_lab: number;
  lp_ratio: number;
  estimated_cost: number;
  cp_ratio: number;
  rlu_score: number;
  cpg_mismatch_percentage: number;
  duplicate_order_rate: number;
  month: string;
  year: number;
}

interface CostOverviewData {
  totalCost: number;
  avgCpRatio: number;
  avgLpRatio: number;
  totalPatients: number;
  totalLabs: number;
  avgRluScore: number;
  costPerPatient: number;
  costPerTest: number;
}

interface MonthlyCostTrend {
  month: string;
  totalCost: number;
  avgCpRatio: number;
  patientCount: number;
}

export const CostAnalysisReport = () => {
  const { hasRole } = useAuth();
  const isJudge = hasRole('judge');
  const [selectedMonth, setSelectedMonth] = useState("December");
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [doctorsData, setDoctorsData] = useState<DoctorCostData[]>([]);
  const [overviewData, setOverviewData] = useState<CostOverviewData | null>(null);
  const [monthlyCostTrend, setMonthlyCostTrend] = useState<MonthlyCostTrend[]>([]);
  const [loading, setLoading] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch doctors and monthly data from Google Sheets
      const [doctors, monthlyData] = await Promise.all([
        googleSheetsService.getDoctors(),
        googleSheetsService.getMonthlyData()
      ]);

      // Filter by selected month and year
      const filteredMonthlyData = monthlyData.filter(
        item => item.month === selectedMonth && item.year === selectedYear
      );

      // Transform data for cost analysis
      const transformedData: DoctorCostData[] = filteredMonthlyData.map(item => {
        const doctor = doctors.find(d => d.id === item.doctor_id);
        return {
          id: item.doctor_id,
          name: doctor?.name || 'Unknown',
          specialty: doctor?.specialty || 'Unknown',
          department: doctor?.department || 'Unknown',
          total_patient: item.total_patient || 0,
          total_lab: item.total_lab || 0,
          lp_ratio: item.lp_ratio || 0,
          estimated_cost: item.estimated_cost || 0,
          cp_ratio: item.cp_ratio || 0,
          rlu_score: item.rlu_score || 0,
          cpg_mismatch_percentage: item.cpg_mismatch_percentage || 0,
          duplicate_order_rate: item.duplicate_order_rate || 0,
          month: item.month,
          year: item.year
        };
      });

      setDoctorsData(transformedData);

      // Calculate cost overview data
      if (transformedData.length > 0) {
        const overview: CostOverviewData = {
          totalCost: transformedData.reduce((sum, doc) => sum + doc.estimated_cost, 0),
          avgCpRatio: transformedData.reduce((sum, doc) => sum + doc.cp_ratio, 0) / transformedData.length,
          avgLpRatio: transformedData.reduce((sum, doc) => sum + doc.lp_ratio, 0) / transformedData.length,
          totalPatients: transformedData.reduce((sum, doc) => sum + doc.total_patient, 0),
          totalLabs: transformedData.reduce((sum, doc) => sum + doc.total_lab, 0),
          avgRluScore: transformedData.reduce((sum, doc) => sum + doc.rlu_score, 0) / transformedData.length,
          costPerPatient: 0,
          costPerTest: 0
        };
        
        overview.costPerPatient = overview.totalPatients > 0 ? overview.totalCost / overview.totalPatients : 0;
        overview.costPerTest = overview.totalLabs > 0 ? overview.totalCost / overview.totalLabs : 0;
        
        setOverviewData(overview);
      }

      // Calculate monthly cost trend for the year
      const yearlyData = monthlyData.filter(item => item.year === selectedYear);
      
      if (yearlyData.length > 0) {
        const monthOrder = months;
        const costTrend = monthOrder.map(month => {
          const monthData = yearlyData.filter(item => item.month === month);
          const totalCost = monthData.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
          const avgCpRatio = monthData.length > 0 
            ? monthData.reduce((sum, item) => sum + (item.cp_ratio || 0), 0) / monthData.length 
            : 0;
          const patientCount = monthData.reduce((sum, item) => sum + (item.total_patient || 0), 0);
          
          return {
            month: month.substring(0, 3),
            totalCost,
            avgCpRatio,
            patientCount
          };
        }).filter(item => item.totalCost > 0);

        setMonthlyCostTrend(costTrend);
      }

    } catch (error) {
      console.error('Error fetching cost data:', error);
      toast.error('Failed to fetch cost analysis data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const filteredDoctors = selectedDoctor === "all" 
    ? doctorsData 
    : doctorsData.filter(doc => doc.id === selectedDoctor);

  const getCostAnalysis = (doctor: DoctorCostData) => {
    const insights = [];
    
    // Cost efficiency analysis
    if (doctor.cp_ratio < 300) {
      insights.push("Excellent cost efficiency - maintaining optimal cost per patient ratio with effective resource utilization");
    } else if (doctor.cp_ratio < 500) {
      insights.push("Good cost management - consider reducing lab orders per patient to optimize cost efficiency");
    } else {
      insights.push("High cost per patient - requires immediate intervention to reduce unnecessary testing and improve cost effectiveness");
    }

    // Laboratory utilization analysis
    if (doctor.lp_ratio <= 3) {
      insights.push("Optimal lab ordering efficiency - maintain current practice and consider peer mentoring opportunities");
    } else if (doctor.lp_ratio <= 4.5) {
      insights.push("Moderate lab utilization - focus on reducing redundant tests while maintaining quality care");
    } else {
      insights.push("Excessive lab ordering - implement clinical decision support and establish lab ordering protocols");
    }

    return insights.slice(0, 2).join(". ");
  };

  const getCostRecommendations = () => {
    if (!doctorsData.length) return [];

    const recommendations = [];
    const avgCostPerPatient = overviewData?.costPerPatient || 0;
    const avgCpRatio = overviewData?.avgCpRatio || 0;
    const highCostDoctors = doctorsData.filter(doc => doc.cp_ratio > avgCpRatio * 1.2).length;

    if (avgCostPerPatient > 400) {
      recommendations.push("Implement hospital-wide cost reduction initiatives targeting high-cost laboratory utilization");
    }

    if (avgCpRatio > 500) {
      recommendations.push("Deploy clinical decision support systems to optimize laboratory test ordering patterns");
    }

    if (highCostDoctors > doctorsData.length * 0.3) {
      recommendations.push("Establish physician-specific cost targets and provide regular cost utilization feedback");
    }

    recommendations.push("Implement lab test bundling strategies to reduce overall testing costs while maintaining quality");
    recommendations.push("Consider establishing a laboratory stewardship program with cost-effectiveness monitoring");

    return recommendations;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Cost Analysis Report</h2>
            <p className="text-muted-foreground">Comprehensive laboratory cost utilization analysis</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Doctor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Doctors</SelectItem>
                {doctorsData.map(doctor => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {isJudge ? anonymizeDoctorName(doctor.name) : doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PDFExport title={`Cost Analysis Report - ${selectedMonth} ${selectedYear}`} targetElementId="cost-analysis-report" />
          </div>
        </div>
      </Card>

      {/* Report Content */}
      <div id="cost-analysis-report" className="bg-white p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 border-b pb-6">
          <h1 className="text-3xl font-bold text-gray-800">Cost Analysis Report</h1>
          <h2 className="text-xl text-gray-600">{selectedMonth} {selectedYear}</h2>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <CalendarDays className="h-4 w-4" />
            <span>Generated on {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* 1. Cost Overview */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            1. Laboratory Cost Utilization Overview
          </h3>
          {overviewData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">฿{(overviewData.totalCost / 1000).toFixed(0)}K</p>
                <p className="text-sm text-gray-600">Total Cost</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">฿{overviewData.avgCpRatio.toFixed(0)}</p>
                <p className="text-sm text-gray-600">Avg Cost/Patient</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">฿{overviewData.costPerTest.toFixed(0)}</p>
                <p className="text-sm text-gray-600">Cost per Test</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{overviewData.avgLpRatio.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Avg L/P Ratio</p>
              </Card>
            </div>
          )}
        </div>

        {/* 2. Individual Physician Cost Analysis */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">2. Individual Physician Cost Performance</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Physician Name</TableHead>
                  <TableHead>Patients</TableHead>
                  <TableHead>Lab Tests</TableHead>
                  <TableHead>Total Cost (฿)</TableHead>
                  <TableHead>Cost/Patient (฿)</TableHead>
                  <TableHead>L/P Ratio</TableHead>
                  <TableHead>RLU Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{isJudge ? anonymizeDoctorName(doctor.name) : doctor.name}</p>
                        <p className="text-sm text-gray-500">{doctor.specialty}</p>
                      </div>
                    </TableCell>
                    <TableCell>{doctor.total_patient}</TableCell>
                    <TableCell>{doctor.total_lab}</TableCell>
                    <TableCell className="font-semibold">฿{doctor.estimated_cost.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={doctor.cp_ratio > 500 ? "destructive" : doctor.cp_ratio > 400 ? "secondary" : "default"}>
                        ฿{doctor.cp_ratio.toFixed(0)}
                      </Badge>
                    </TableCell>
                    <TableCell>{doctor.lp_ratio.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {doctor.rlu_score >= 80 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={doctor.rlu_score >= 80 ? "text-green-600 font-semibold" : doctor.rlu_score >= 60 ? "text-yellow-600" : "text-red-600"}>
                          {doctor.rlu_score.toFixed(2)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 3. Monthly Cost Trend Analysis */}
        {monthlyCostTrend.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">3. Monthly Cost Trend Analysis</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4 text-gray-700">Total Cost Trend</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={monthlyCostTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" className="text-xs text-gray-600" />
                      <YAxis className="text-xs text-gray-600" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          color: '#1f2937'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalCost" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        name="Total Cost (฿)"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4 text-gray-700">Cost Per Patient Trend</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={monthlyCostTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="month" className="text-xs text-gray-600" />
                      <YAxis className="text-xs text-gray-600" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          color: '#1f2937'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgCpRatio" 
                        stroke="#ef4444" 
                        strokeWidth={3}
                        name="Cost/Patient (฿)"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* 4. Cost Analysis by Physician */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">4. Cost Efficiency Analysis & Optimization Areas</h3>
          <div className="grid gap-4">
            {filteredDoctors.map((doctor) => (
              <Card key={doctor.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-800">{isJudge ? anonymizeDoctorName(doctor.name) : doctor.name}</h4>
                    <p className="text-sm text-gray-600">{doctor.department} - {doctor.specialty}</p>
                    <p className="text-sm text-gray-500">Total Cost: ฿{doctor.estimated_cost.toLocaleString()} | Cost/Patient: ฿{doctor.cp_ratio.toFixed(0)}</p>
                  </div>
                  <Badge 
                    variant={doctor.cp_ratio < 300 ? "default" : doctor.cp_ratio < 500 ? "secondary" : "destructive"}
                    className={doctor.cp_ratio < 300 ? "bg-green-100 text-green-800" : doctor.cp_ratio < 500 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}
                  >
                    {doctor.cp_ratio < 300 ? "Excellent" : doctor.cp_ratio < 500 ? "Good" : "High Cost"}: ฿{doctor.cp_ratio.toFixed(0)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mt-2">{getCostAnalysis(doctor)}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* 5. Cost Optimization Recommendations */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">5. Cost Optimization Recommendations</h3>
          <div className="space-y-3">
            {getCostRecommendations().map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                  {index + 1}
                </div>
                <p className="text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-6 text-center text-sm text-gray-500">
          <p>RLU 360 Transformation Model - Laboratory Cost Analysis Platform</p>
          <p>Report generated on {new Date().toLocaleDateString()} for {selectedMonth} {selectedYear}</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading cost analysis data...</p>
        </div>
      )}
    </div>
  );
};