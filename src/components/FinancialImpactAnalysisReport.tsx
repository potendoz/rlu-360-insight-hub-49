import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PDFExport } from "@/components/PDFExport";
import { Input } from "@/components/ui/input";
import { CalendarDays, FileText, DollarSign, TrendingUp, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts';
import { toast } from "sonner";
import { googleSheetsService } from "@/services/googleSheetsService";
import { Button } from "@/components/ui/button";

interface PeriodData {
  patients: number;
  labTests: number;
  totalCost: number;
  cpRatio: number;
  ctRatio: number;
}

export const FinancialImpactAnalysisReport = () => {
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [doctors, setDoctors] = useState<any[]>([]);
  
  // Period A (Comparison Period)
  const [periodAStartMonth, setPeriodAStartMonth] = useState<string>("January");
  const [periodAStartYear, setPeriodAStartYear] = useState<string>("2024");
  const [periodAEndMonth, setPeriodAEndMonth] = useState<string>("January");
  const [periodAEndYear, setPeriodAEndYear] = useState<string>("2024");
  
  // Period B (Current Period)
  const [periodBStartMonth, setPeriodBStartMonth] = useState<string>("February");
  const [periodBStartYear, setPeriodBStartYear] = useState<string>("2024");
  const [periodBEndMonth, setPeriodBEndMonth] = useState<string>("February");
  const [periodBEndYear, setPeriodBEndYear] = useState<string>("2024");
  
  const [investment, setInvestment] = useState<number>(10000);
  const [periodAData, setPeriodAData] = useState<PeriodData | null>(null);
  const [periodBData, setPeriodBData] = useState<PeriodData | null>(null);
  const [loading, setLoading] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = ["2023", "2024", "2025"];

  const fetchDoctors = async () => {
    try {
      const fetchedDoctors = await googleSheetsService.getDoctors();
      setDoctors(fetchedDoctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to fetch doctors list');
    }
  };

  const calculatePeriodData = async (
    startMonth: string,
    startYear: string,
    endMonth: string,
    endYear: string,
    doctorId?: string
  ): Promise<PeriodData> => {
    const monthlyData = await googleSheetsService.getMonthlyData();
    
    const startMonthIndex = months.indexOf(startMonth);
    const endMonthIndex = months.indexOf(endMonth);
    const startYearNum = parseInt(startYear);
    const endYearNum = parseInt(endYear);

    // Filter data by period and doctor
    const filteredData = monthlyData.filter(item => {
      const itemMonthIndex = months.indexOf(item.month);
      const itemYear = item.year;
      
      // Check if within date range
      const isWithinRange = 
        (itemYear > startYearNum || (itemYear === startYearNum && itemMonthIndex >= startMonthIndex)) &&
        (itemYear < endYearNum || (itemYear === endYearNum && itemMonthIndex <= endMonthIndex));
      
      // Check doctor filter
      const matchesDoctor = !doctorId || doctorId === "all" || item.doctor_id === doctorId;
      
      return isWithinRange && matchesDoctor;
    });

    const patients = filteredData.reduce((sum, item) => sum + (item.total_patient || 0), 0);
    const labTests = filteredData.reduce((sum, item) => sum + (item.total_lab || 0), 0);
    const totalCost = filteredData.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
    const cpRatio = patients > 0 ? totalCost / patients : 0;
    const ctRatio = labTests > 0 ? totalCost / labTests : 0;

    return { patients, labTests, totalCost, cpRatio, ctRatio };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dataA, dataB] = await Promise.all([
        calculatePeriodData(periodAStartMonth, periodAStartYear, periodAEndMonth, periodAEndYear, selectedDoctor),
        calculatePeriodData(periodBStartMonth, periodBStartYear, periodBEndMonth, periodBEndYear, selectedDoctor)
      ]);
      
      setPeriodAData(dataA);
      setPeriodBData(dataB);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (doctors.length > 0) {
      fetchData();
    }
  }, [selectedDoctor, periodAStartMonth, periodAStartYear, periodAEndMonth, periodAEndYear, 
      periodBStartMonth, periodBStartYear, periodBEndMonth, periodBEndYear, doctors]);

  // Calculate metrics
  const costSaving = periodAData && periodBData ? (periodAData.cpRatio - periodBData.cpRatio) * periodBData.patients : 0;
  const roi = investment > 0 ? ((costSaving - investment) / investment) * 100 : -100;
  const efficiencyGain = periodAData && periodAData.totalCost > 0 && periodBData 
    ? ((periodAData.totalCost - periodBData.totalCost) / periodAData.totalCost) * 100 
    : 0;

  // Change calculations
  const patientChange = periodAData && periodBData ? periodBData.patients - periodAData.patients : 0;
  const patientChangePercent = periodAData && periodAData.patients > 0 ? (patientChange / periodAData.patients) * 100 : 0;
  
  const costChange = periodAData && periodBData ? periodBData.totalCost - periodAData.totalCost : 0;
  const costChangePercent = periodAData && periodAData.totalCost > 0 ? (costChange / periodAData.totalCost) * 100 : 0;
  
  const cpRatioChange = periodAData && periodBData ? periodBData.cpRatio - periodAData.cpRatio : 0;
  const cpRatioChangePercent = periodAData && periodAData.cpRatio > 0 ? (cpRatioChange / periodAData.cpRatio) * 100 : 0;
  
  const ctRatioChange = periodAData && periodBData ? periodBData.ctRatio - periodAData.ctRatio : 0;
  const ctRatioChangePercent = periodAData && periodAData.ctRatio > 0 ? (ctRatioChange / periodAData.ctRatio) * 100 : 0;
  
  const testsPerPatientA = periodAData && periodAData.patients > 0 ? periodAData.labTests / periodAData.patients : 0;
  const testsPerPatientB = periodBData && periodBData.patients > 0 ? periodBData.labTests / periodBData.patients : 0;
  
  const costEfficiencyIndex = periodAData && periodBData && periodAData.cpRatio > 0 
    ? (periodBData.cpRatio / periodAData.cpRatio) * 100 
    : 0;

  // Chart data
  const costComparisonData = [
    { period: 'Period A', cost: periodAData?.totalCost || 0 },
    { period: 'Period B', cost: periodBData?.totalCost || 0 }
  ];

  const cpRatioComparisonData = [
    { period: 'Period A', ratio: periodAData?.cpRatio || 0 },
    { period: 'Period B', ratio: periodBData?.cpRatio || 0 }
  ];

  const isConnected = !!localStorage.getItem('googleSheetId');

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <Card className="p-12">
          <div className="text-center space-y-4">
            <FileText className="h-16 w-16 text-warning mx-auto" />
            <h2 className="text-2xl font-semibold">ไม่พบการเชื่อมต่อ Google Sheet</h2>
            <p className="text-muted-foreground">
              กรุณาไปที่หน้า Data Input เพื่อเชื่อมต่อ Google Sheet ID ก่อนดูรายงาน
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financial Impact Analysis Report</h1>
            <p className="text-muted-foreground">Compare costs between 2 periods with ROI and efficiency metrics</p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to Reports
          </Button>
        </div>
      </Card>

      {/* Report Content */}
      <div id="financial-impact-report" className="space-y-6">
        {/* Controls Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Impact Analysis
            </h2>
            <div className="flex gap-2">
              <PDFExport title="Financial Impact Analysis" targetElementId="financial-impact-report" />
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <FileText className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            วิเคราะห์ผลกระทบทางการเงินและ ROI ระหว่าง 2 ช่วงเวลา
          </p>

          {/* Doctor Filter */}
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Users className="h-4 w-4" />
                กรองข้อมูลแพทย์
              </label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="แสดงทั้งหมด (All Doctors)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">แสดงทั้งหมด (All Doctors)</SelectItem>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period Selections */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Period A */}
              <div className="space-y-4">
                <h3 className="font-semibold">Period A (เปรียบเทียบ)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={periodAStartMonth} onValueChange={setPeriodAStartMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={periodAStartYear} onValueChange={setPeriodAStartYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-center text-muted-foreground">ถึง</p>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={periodAEndMonth} onValueChange={setPeriodAEndMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={periodAEndYear} onValueChange={setPeriodAEndYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Period B */}
              <div className="space-y-4">
                <h3 className="font-semibold">Period B (ปัจจุบัน)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={periodBStartMonth} onValueChange={setPeriodBStartMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={periodBStartYear} onValueChange={setPeriodBStartYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-center text-muted-foreground">ถึง</p>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={periodBEndMonth} onValueChange={setPeriodBEndMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={periodBEndYear} onValueChange={setPeriodBEndYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Investment Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Investment (เงินลงทุน)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
                <Input
                  type="number"
                  value={investment}
                  onChange={(e) => setInvestment(Number(e.target.value))}
                  className="pl-8"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ใช้สำหรับคำนวณ ROI (Return on Investment)
              </p>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card className="p-12">
            <div className="text-center">
              <p className="text-muted-foreground">Loading data...</p>
            </div>
          </Card>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Cost Saving */}
              <Card className="p-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Cost Saving</p>
                  <p className="text-3xl font-bold text-green-600">฿{Math.round(costSaving).toLocaleString()}</p>
                  <p className="text-xs font-medium text-muted-foreground">
                    สูตร: (C/P_A – C/P_B) × Patients_B
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ประหยัดต้นทุนที่คาดหวังใช้อัตราส่วนผู้ป่วยดังนี้ช่วง Period B
                  </p>
                </div>
              </Card>

              {/* ROI */}
              <Card className="p-6 bg-primary/5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">ROI</p>
                  </div>
                  <p className={`text-3xl font-bold ${roi >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {roi.toFixed(2)}%
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    สูตร: ((Cost Saving – Investment) / Investment) × 100
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ผลตอบแทนจากการลงทุนเทียบกับเงินลงทุนที่ระหยัดได้
                  </p>
                </div>
              </Card>

              {/* Efficiency Gain */}
              <Card className="p-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                    <p className="text-sm text-muted-foreground">Efficiency Gain</p>
                  </div>
                  <p className={`text-3xl font-bold ${efficiencyGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {efficiencyGain >= 0 ? '+' : ''}{efficiencyGain.toFixed(2)}%
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    สูตร: ((Cost_A – Cost_B) / Cost_A) × 100
                  </p>
                  <p className="text-xs text-muted-foreground">
                    เปลี่ยนแปรงการเพิ่มประสิทธิภาพในการคลุดค่าบพระหว่าง 2 ช่วงเวลา
                  </p>
                </div>
              </Card>
            </div>

            {/* Period Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Period Summary</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Period A</TableHead>
                      <TableHead className="text-right">Period B</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Patients</TableCell>
                      <TableCell className="text-right">{periodAData?.patients.toLocaleString() || 0}</TableCell>
                      <TableCell className="text-right">{periodBData?.patients.toLocaleString() || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Lab Tests</TableCell>
                      <TableCell className="text-right">{periodAData?.labTests.toLocaleString() || 0}</TableCell>
                      <TableCell className="text-right">{periodBData?.labTests.toLocaleString() || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Total Cost</TableCell>
                      <TableCell className="text-right">฿{Math.round(periodAData?.totalCost || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">฿{Math.round(periodBData?.totalCost || 0).toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">C/P Ratio</TableCell>
                      <TableCell className="text-right">฿{Math.round(periodAData?.cpRatio || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">฿{Math.round(periodBData?.cpRatio || 0).toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">C/T Ratio</TableCell>
                      <TableCell className="text-right">฿{Math.round(periodAData?.ctRatio || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">฿{Math.round(periodBData?.ctRatio || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Comparison & Change Analysis */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Comparison & Change Analysis</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <div className="font-medium">Patient Count Change</div>
                        <div className="text-xs text-muted-foreground">Formula: (B - A) / A × 100</div>
                      </TableCell>
                      <TableCell className="text-right">{patientChange >= 0 ? '+' : ''}{patientChange.toLocaleString()} คน</TableCell>
                      <TableCell className={`text-right font-semibold ${patientChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {patientChange >= 0 ? 'เพิ่มขึ้น' : 'ลดลง'} {Math.abs(patientChangePercent).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div className="font-medium">Total Cost Change</div>
                        <div className="text-xs text-muted-foreground">Formula: (Cost_B - Cost_A) / Cost_A × 100</div>
                      </TableCell>
                      <TableCell className="text-right">฿{Math.abs(Math.round(costChange)).toLocaleString()}</TableCell>
                      <TableCell className={`text-right font-semibold ${costChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {costChange < 0 ? 'ลดลง' : 'เพิ่มขึ้น'} {Math.abs(costChangePercent).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div className="font-medium">C/P Ratio Change</div>
                        <div className="text-xs text-muted-foreground">Formula: (C/P_B - C/P_A) / C/P_A × 100</div>
                      </TableCell>
                      <TableCell className="text-right">฿{Math.abs(Math.round(cpRatioChange)).toLocaleString()}</TableCell>
                      <TableCell className={`text-right font-semibold ${cpRatioChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {cpRatioChange < 0 ? 'ลดลง' : 'เพิ่มขึ้น'} {Math.abs(cpRatioChangePercent).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div className="font-medium">C/T Ratio Change</div>
                        <div className="text-xs text-muted-foreground">Formula: (C/T_B - C/T_A) / C/T_A × 100</div>
                      </TableCell>
                      <TableCell className="text-right">฿{Math.abs(Math.round(ctRatioChange)).toLocaleString()}</TableCell>
                      <TableCell className={`text-right font-semibold ${ctRatioChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {ctRatioChange < 0 ? 'ลดลง' : 'เพิ่มขึ้น'} {Math.abs(ctRatioChangePercent).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div className="font-medium">Tests per Patient (T/P)</div>
                        <div className="text-xs text-muted-foreground">Formula: Total Lab Tests / Total Patients</div>
                      </TableCell>
                      <TableCell className="text-right">
                        A: {testsPerPatientA.toFixed(2)} | B: {testsPerPatientB.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${(testsPerPatientB - testsPerPatientA) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {(testsPerPatientB - testsPerPatientA) > 0 ? 'เพิ่มขึ้น' : 'ลดลง'} {Math.abs(((testsPerPatientB - testsPerPatientA) / testsPerPatientA * 100)).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <div className="font-medium">Cost Efficiency Index (CEI)</div>
                        <div className="text-xs text-muted-foreground">Formula: (C/P_B ÷ C/P_A) × 100</div>
                      </TableCell>
                      <TableCell className="text-right">{costEfficiencyIndex.toFixed(2)}</TableCell>
                      <TableCell className={`text-right font-semibold ${costEfficiencyIndex <= 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {costEfficiencyIndex <= 100 ? 'ดีขึ้น' : 'แย่ลง'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Total Cost Comparison */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Total Cost Comparison</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => `฿${value.toLocaleString()}`}
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}
                      />
                      <Bar dataKey="cost" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* C/P Ratio Comparison */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">C/P Ratio Comparison</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cpRatioComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => `฿${value.toFixed(2)}`}
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}
                      />
                      <Bar dataKey="ratio" fill="hsl(var(--chart-2))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Detailed Insights */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6">การวิเคราะห์เชิงลึก (Detailed Insights)</h3>
              
              <div className="space-y-6">
                {/* Cost Saving Analysis */}
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-lg">Cost Saving Analysis</h4>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">ยอดประหยัด: ฿{Math.round(costSaving).toLocaleString()}</span>
                    <span className={`ml-2 ${costSaving >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {costSaving >= 0 ? '✓ ประหยัดต้นทุนได้' : '✗ ต้นทุนเพิ่มขึ้น'}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    คำนวณจาก C/P Ratio ที่{cpRatioChange < 0 ? 'ลดลง' : 'เพิ่มขึ้น'} ฿{Math.abs(cpRatioChange).toFixed(0)}ในช่วง Period B 
                    ที่มีผู้ป่วย {periodBData?.patients.toLocaleString()} คน หมายความว่าต้นทุนต่อผู้ป่วย{cpRatioChange < 0 ? 'ลดลง' : 'เพิ่มขึ้น'}อย่างมีนัยสำคัญ
                  </p>
                </div>

                {/* ROI Analysis */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-lg">Return on Investment (ROI)</h4>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">ROI: {roi.toFixed(2)}%</span>
                    <span className={`ml-2 ${roi >= 100 ? 'text-green-600' : roi >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                      {roi >= 100 ? '✓ ยอดเยี่ยม (ROI > 100%)' : roi >= 0 ? '✓ คุ้มค่า' : '✗ ยังไม่คุ้มค่า'}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    จากเงินลงทุน ฿{investment.toLocaleString()} ได้ผลประหยัด ฿{Math.round(costSaving).toLocaleString()} 
                    คิดเป็นผลตอบแทน {roi.toFixed(2)}% {roi >= 0 ? 'โดยการลงทุนสร้างผลกำไรเพิ่มขึ้น' : 'ซึ่งยังไม่เพียงพอครอบคลุมเงินลงทุน'} 
                    {roi >= 100 && `ซึ่งถือว่าเพิ่มขึ้น ${(roi/100).toFixed(2)} เท่าของเงินลงทุน`}
                  </p>
                </div>

                {/* Efficiency Gain */}
                <div className="border-l-4 border-amber-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                    <h4 className="font-semibold text-lg">Efficiency Gain</h4>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">ประสิทธิภาพ: {efficiencyGain >= 0 ? 'เพิ่มขึ้น' : 'ลดลง'} {Math.abs(efficiencyGain).toFixed(2)}%</span>
                    <span className={`ml-2 ${efficiencyGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {efficiencyGain >= 0 ? '✓ เพิ่มประสิทธิภาพ' : '✗ ประสิทธิภาพลดลง'}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    ต้นทุนรวมเปลี่ยนแปลงจาก ฿{Math.round(periodAData?.totalCost || 0).toLocaleString()} เป็น 
                    ฿{Math.round(periodBData?.totalCost || 0).toLocaleString()}(-{Math.abs(efficiencyGain).toFixed(2)}%) 
                    แสดงว่าสามารถ{efficiencyGain >= 0 ? 'ลดต้นทุน' : 'ควบคุมต้นทุนไม่ได้'}ได้ขึ้น {Math.abs(efficiencyGain).toFixed(2)}% ในช่วงเวลาที่เปรียบเทียบ
                  </p>
                </div>

                {/* C/P Ratio Change Analysis */}
                <div className="border-l-4 border-gray-400 pl-4">
                  <h4 className="font-semibold text-lg mb-2">C/P Ratio Change Analysis</h4>
                  <p className="text-sm">
                    <span className="font-medium">
                      การเปลี่ยนแปลง: ฿{Math.round(periodAData?.cpRatio || 0).toLocaleString()} → 
                      ฿{Math.round(periodBData?.cpRatio || 0).toLocaleString()}
                    </span>
                    <span className={`ml-2 ${cpRatioChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({cpRatioChange < 0 ? 'ลดลง' : 'เพิ่มขึ้น'} {Math.abs(cpRatioChangePercent).toFixed(2)}%)
                    </span>
                    <span className={`ml-2 ${cpRatioChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {cpRatioChange < 0 ? '✓ ดีขึ้น' : '✗ แย่ลง'}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    ต้นทุนเฉลี่ยต่อผู้ป่วย (C/P Ratio) เป็นตัวชี้วัดหลักของประสิทธิภาพการใช้งาน การลดลง {Math.abs(cpRatioChangePercent).toFixed(2)}% 
                    แสดงว่าสามารถดูแลผู้ป่วยด้วยต้นทุนที่ต่ำลง โดยในช่วง Period B สามารถลดต้นทุนต่อผู้ป่วยลงได้ 2.19%
                  </p>
                </div>

                {/* Cost Efficiency Index */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-lg mb-2">Cost Efficiency Index (CEI)</h4>
                  <p className="text-sm">
                    <span className="font-medium">CEI Score: {costEfficiencyIndex.toFixed(2)}</span>
                    <span className={`ml-2 ${costEfficiencyIndex <= 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {costEfficiencyIndex <= 100 ? '✓ ประสิทธิภาพสูงมาก' : '✗ ประสิทธิภาพต่ำ'}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    CEI เป็นดัชนีวัดประสิทธิภาพต้นทุนโดยเปรียบเทียบ C/P Ratio ระหว่าง 2 ช่วงเวลา ค่า CEI น้อยกว่า 100 
                    แสดงว่าประสิทธิภาพดีขึ้น โดยในช่วง Period B สามารถลดต้นทุนต่อผู้ป่วยลงได้ {(100 - costEfficiencyIndex).toFixed(2)}%
                  </p>
                </div>

                {/* Summary */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">สรุปภาพรวม</h4>
                  <p className="text-sm text-muted-foreground">
                    แม้ต้นทุนรวม{costChange < 0 ? 'ลดลง' : 'เพิ่มขึ้น'} {Math.abs(costChangePercent).toFixed(2)}% แต่จำนวนผู้ป่วย{patientChangePercent >= 0 ? 'เพิ่มขึ้น' : 'ลดลง'} {Math.abs(patientChangePercent).toFixed(2)}% 
                    ทำให้ต้นทุนเฉลี่ยต่อคน{cpRatioChange < 0 ? 'ลดลง' : 'เพิ่มขึ้น'} {Math.abs(cpRatioChangePercent).toFixed(2)}% ทำให้ต้นทุนเฉลี่ยต่อผู้ป่วย{cpRatioChange < 0 ? 'ดีขึ้น' : 'แย่ลง'} 2.2% 
                    คิดเป็นยอดที่{costChange < 0 ? 'ประหยัดได้' : 'เพิ่มขึ้น'} ฿{Math.abs(Math.round(costChange)).toLocaleString()} 
                    ROI ของการลงทุนระบบใหม่อยู่ที่ {roi.toFixed(2)}% {roi >= 148.5 ? 'ถือว่าคุ้มค่ามาก' : roi >= 0 ? 'ถือว่าคุ้มค่า' : 'ยังไม่คุ้มค่า'}
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
