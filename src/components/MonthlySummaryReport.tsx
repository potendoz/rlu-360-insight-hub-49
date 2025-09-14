import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFExport } from "@/components/PDFExport";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { anonymizeDoctorName } from "@/utils/pdpaUtils";

interface DoctorData {
  id: string;
  name: string;
  specialty: string;
  department: string;
  patients_count: number;
  total_lab: number;
  lp_ratio: number;
  cpg_mismatch_percentage: number;
  duplicate_order_rate: number;
  rlu_score: number;
}

interface OverviewData {
  avgLpRatio: number;
  avgCpgMismatch: number;
  totalPatients: number;
  totalLabs: number;
}

export const MonthlySummaryReport = () => {
  const { hasRole } = useAuth();
  const isJudge = hasRole('judge');
  const [selectedMonth, setSelectedMonth] = useState("December");
  const [selectedYear, setSelectedYear] = useState(2024);
  const [doctorsData, setDoctorsData] = useState<DoctorData[]>([]);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch doctor monthly data with doctor details
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('doctor_monthly_data')
        .select(`
          *,
          doctors(name, specialty, department)
        `)
        .eq('month', selectedMonth)
        .eq('year', selectedYear);

      if (monthlyError) throw monthlyError;

      // Transform data
      const transformedData: DoctorData[] = monthlyData?.map(item => ({
        id: item.doctor_id,
        name: item.doctors?.name || 'Unknown',
        specialty: item.doctors?.specialty || 'Unknown',
        department: item.doctors?.department || 'Unknown',
        patients_count: item.patients_count || item.total_patient || 0,
        total_lab: item.total_lab || 0,
        lp_ratio: item.lp_ratio || 0,
        cpg_mismatch_percentage: item.cpg_mismatch_percentage || 0,
        duplicate_order_rate: item.duplicate_order_rate || 0,
        rlu_score: item.rlu_score || 0
      })) || [];

      setDoctorsData(transformedData);

      // Calculate overview data
      if (transformedData.length > 0) {
        const overview: OverviewData = {
          avgLpRatio: transformedData.reduce((sum, doc) => sum + doc.lp_ratio, 0) / transformedData.length,
          avgCpgMismatch: transformedData.reduce((sum, doc) => sum + doc.cpg_mismatch_percentage, 0) / transformedData.length,
          totalPatients: transformedData.reduce((sum, doc) => sum + doc.patients_count, 0),
          totalLabs: transformedData.reduce((sum, doc) => sum + doc.total_lab, 0)
        };
        setOverviewData(overview);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch monthly summary data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const getPerformanceAnalysis = (doctor: DoctorData) => {
    const insights = [];
    
    // RLU Score analysis with new criteria
    if (doctor.rlu_score > 90) {
      insights.push("Outstanding RLU performance - exemplary clinical decision-making and optimal resource utilization");
    } else if (doctor.rlu_score >= 75) {
      insights.push("Good RLU compliance with moderate efficiency - focus on reducing unnecessary testing");
    } else {
      insights.push("Requires immediate intervention for RLU improvement - implement structured training and monitoring");
    }

    // L/P Ratio analysis with performance-based recommendations
    if (doctor.rlu_score > 90) {
      if (doctor.lp_ratio <= 3) {
        insights.push("Maintain excellent lab ordering precision and continue mentoring other physicians");
      } else {
        insights.push("Review current excellent practices but optimize lab ordering frequency");
      }
    } else if (doctor.rlu_score >= 75) {
      if (doctor.lp_ratio <= 4) {
        insights.push("Good lab efficiency - focus on CPG adherence to reach excellence");
      } else {
        insights.push("Moderate performance - reduce lab orders per patient and improve guideline compliance");
      }
    } else {
      if (doctor.cpg_mismatch_percentage > 20) {
        insights.push("Critical need for CPG training and clinical decision support system implementation");
      } else {
        insights.push("Priority on reducing duplicate orders and implementing lab utilization protocols");
      }
    }

    return insights.slice(0, 2).join(". ");
  };

  const getRecommendations = () => {
    if (!doctorsData.length) return [];

    const recommendations = [];
    const avgRluScore = doctorsData.reduce((sum, doc) => sum + doc.rlu_score, 0) / doctorsData.length;
    const avgCpgMismatch = doctorsData.reduce((sum, doc) => sum + doc.cpg_mismatch_percentage, 0) / doctorsData.length;
    const avgDuplicateRate = doctorsData.reduce((sum, doc) => sum + doc.duplicate_order_rate, 0) / doctorsData.length;

    if (avgRluScore < 70) {
      recommendations.push("Implement targeted RLU training programs for underperforming physicians");
    }

    if (avgCpgMismatch > 15) {
      recommendations.push("Enhance clinical decision support systems to improve guideline adherence");
    }

    if (avgDuplicateRate > 5) {
      recommendations.push("Deploy duplicate order detection systems to reduce unnecessary testing");
    }

    recommendations.push("Establish regular peer review sessions for laboratory utilization patterns");
    recommendations.push("Consider implementing physician-specific feedback dashboards for continuous monitoring");

    return recommendations;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Monthly Summary Report</h2>
            <p className="text-muted-foreground">Comprehensive organizational RLU performance analysis</p>
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
            <PDFExport title={`Monthly Summary Report - ${selectedMonth} ${selectedYear}`} targetElementId="monthly-summary-report" />
          </div>
        </div>
      </Card>

      {/* Report Content */}
      <div id="monthly-summary-report" className="bg-white p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 border-b pb-6">
          <h1 className="text-3xl font-bold text-gray-800">Monthly Summary Report</h1>
          <h2 className="text-xl text-gray-600">{selectedMonth} {selectedYear}</h2>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <CalendarDays className="h-4 w-4" />
            <span>Generated on {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* 1. Organizational Overview */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            1. Organizational RLU Performance Overview
          </h3>
          {overviewData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{overviewData.avgLpRatio.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Average L/P Ratio</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{overviewData.avgCpgMismatch.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Average CPG Mismatch</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{overviewData.totalPatients.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Patients</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{overviewData.totalLabs.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Lab Tests</p>
              </Card>
            </div>
          )}
        </div>

        {/* 2. Individual Physician Analysis */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">2. Individual Physician Performance Analysis</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Physician Name</TableHead>
                  <TableHead>Patients</TableHead>
                  <TableHead>Lab Tests</TableHead>
                  <TableHead>L/P Ratio</TableHead>
                  <TableHead>CPG Mismatch (%)</TableHead>
                  <TableHead>Duplicate Orders (%)</TableHead>
                  <TableHead>RLU Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctorsData.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{isJudge ? anonymizeDoctorName(doctor.name) : doctor.name}</p>
                        <p className="text-sm text-gray-500">{doctor.specialty}</p>
                      </div>
                    </TableCell>
                    <TableCell>{doctor.patients_count}</TableCell>
                    <TableCell>{doctor.total_lab}</TableCell>
                    <TableCell>{doctor.lp_ratio.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={doctor.cpg_mismatch_percentage > 20 ? "destructive" : doctor.cpg_mismatch_percentage > 10 ? "secondary" : "default"}>
                        {doctor.cpg_mismatch_percentage.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>{doctor.duplicate_order_rate.toFixed(1)}%</TableCell>
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

        {/* 3. Performance Analysis by Physician */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">3. Performance Analysis & Improvement Areas</h3>
          <div className="grid gap-4">
            {doctorsData.map((doctor) => (
              <Card key={doctor.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-800">{isJudge ? anonymizeDoctorName(doctor.name) : doctor.name}</h4>
                    <p className="text-sm text-gray-600">{doctor.department} - {doctor.specialty}</p>
                  </div>
                  <Badge 
                    variant={doctor.rlu_score > 90 ? "default" : doctor.rlu_score >= 75 ? "secondary" : "destructive"}
                    className={doctor.rlu_score > 90 ? "bg-green-100 text-green-800" : doctor.rlu_score >= 75 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}
                  >
                    {doctor.rlu_score > 90 ? "Excellent" : doctor.rlu_score >= 75 ? "Good" : "Need Improvement"}: {doctor.rlu_score.toFixed(2)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mt-2">{getPerformanceAnalysis(doctor)}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* 4. Development Recommendations */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">4. Development Recommendations</h3>
          <div className="space-y-3">
            {getRecommendations().map((recommendation, index) => (
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
          <p>RLU 360 Transformation Model - Rational Laboratory Use Analytics Platform</p>
          <p>Report generated on {new Date().toLocaleDateString()} for {selectedMonth} {selectedYear}</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading report data...</p>
        </div>
      )}
    </div>
  );
};