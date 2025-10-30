import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PDFExport } from "@/components/PDFExport";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, FileText, DollarSign, TrendingUp, TrendingDown, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line, Area, AreaChart } from 'recharts';
import { toast } from "sonner";
import { googleSheetsService } from "@/services/googleSheetsService";

interface FinancialImpact {
  department: string;
  currentCost: number;
  potentialSavings: number;
  projectedCost: number;
  savingsPercentage: number;
  rluScore: number;
}

interface MonthlyFinancialTrend {
  month: string;
  actualCost: number;
  targetCost: number;
  savings: number;
}

export const FinancialImpactAnalysisReport = () => {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [financialImpact, setFinancialImpact] = useState<FinancialImpact[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyFinancialTrend[]>([]);
  const [loading, setLoading] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [doctors, monthlyData] = await Promise.all([
        googleSheetsService.getDoctors(),
        googleSheetsService.getMonthlyData()
      ]);

      // Filter data for selected year
      const yearData = monthlyData.filter(item => item.year === selectedYear);

      // Calculate department financial impact
      const departmentMap = new Map<string, any>();
      
      yearData.forEach(item => {
        const doctor = doctors.find(d => d.id === item.doctor_id);
        if (!doctor) return;

        if (!departmentMap.has(doctor.department)) {
          departmentMap.set(doctor.department, {
            department: doctor.department,
            currentCost: 0,
            rluScores: [],
            cpgMismatches: [],
            duplicateRates: []
          });
        }

        const deptData = departmentMap.get(doctor.department);
        deptData.currentCost += item.estimated_cost || 0;
        deptData.rluScores.push(item.rlu_score || 0);
        deptData.cpgMismatches.push(item.cpg_mismatch_percentage || 0);
        deptData.duplicateRates.push(item.duplicate_order_rate || 0);
      });

      // Calculate potential savings based on improvement opportunities
      const impacts: FinancialImpact[] = Array.from(departmentMap.values()).map(dept => {
        const avgRluScore = dept.rluScores.reduce((a: number, b: number) => a + b, 0) / dept.rluScores.length;
        const avgCpgMismatch = dept.cpgMismatches.reduce((a: number, b: number) => a + b, 0) / dept.cpgMismatches.length;
        const avgDuplicateRate = dept.duplicateRates.reduce((a: number, b: number) => a + b, 0) / dept.duplicateRates.length;
        
        // Calculate potential savings
        // Savings from reducing CPG mismatch (each 1% reduction = 0.5% cost savings)
        const cpgSavings = (avgCpgMismatch * 0.5) / 100;
        // Savings from reducing duplicate orders (each 1% reduction = 1% cost savings)
        const duplicateSavings = (avgDuplicateRate * 1) / 100;
        // Total potential savings percentage
        const totalSavingsPercentage = (cpgSavings + duplicateSavings) * 100;
        const potentialSavings = dept.currentCost * (cpgSavings + duplicateSavings);
        const projectedCost = dept.currentCost - potentialSavings;

        return {
          department: dept.department,
          currentCost: dept.currentCost,
          potentialSavings,
          projectedCost,
          savingsPercentage: totalSavingsPercentage,
          rluScore: avgRluScore
        };
      }).sort((a, b) => b.potentialSavings - a.potentialSavings);

      setFinancialImpact(impacts);

      // Calculate monthly financial trend
      const monthlyFinancial = months.map(month => {
        const monthData = yearData.filter(item => item.month === month);
        const actualCost = monthData.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
        
        // Calculate target cost (20% reduction from actual)
        const targetCost = actualCost * 0.8;
        const savings = actualCost - targetCost;

        return {
          month: month.substring(0, 3),
          actualCost,
          targetCost,
          savings
        };
      }).filter(item => item.actualCost > 0);

      setMonthlyTrend(monthlyFinancial);

    } catch (error) {
      console.error('Error fetching financial impact data:', error);
      toast.error('Failed to fetch financial impact analysis data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const totalCurrentCost = financialImpact.reduce((sum, item) => sum + item.currentCost, 0);
  const totalPotentialSavings = financialImpact.reduce((sum, item) => sum + item.potentialSavings, 0);
  const totalProjectedCost = financialImpact.reduce((sum, item) => sum + item.projectedCost, 0);
  const avgSavingsPercentage = financialImpact.length > 0
    ? financialImpact.reduce((sum, item) => sum + item.savingsPercentage, 0) / financialImpact.length
    : 0;

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
      {/* Controls */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Financial Impact Analysis Report</h2>
            <p className="text-muted-foreground">Comprehensive financial impact and savings opportunities</p>
          </div>
          <div className="flex items-center gap-4">
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
            <PDFExport title={`Financial Impact Analysis - ${selectedYear}`} targetElementId="financial-impact-report" />
          </div>
        </div>
      </Card>

      {/* Report Content */}
      <div id="financial-impact-report" className="bg-white p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 border-b pb-6">
          <h1 className="text-3xl font-bold text-gray-800">Financial Impact Analysis Report</h1>
          <h2 className="text-xl text-gray-600">Year {selectedYear}</h2>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <CalendarDays className="h-4 w-4" />
            <span>Generated on {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* 1. Financial Overview */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            1. Financial Impact Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">฿{(totalCurrentCost / 1000000).toFixed(2)}M</p>
              <p className="text-sm text-gray-600">Current Annual Cost</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <TrendingDown className="h-6 w-6 text-green-500" />
                <p className="text-2xl font-bold text-green-600">฿{(totalPotentialSavings / 1000000).toFixed(2)}M</p>
              </div>
              <p className="text-sm text-gray-600">Potential Savings</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">฿{(totalProjectedCost / 1000000).toFixed(2)}M</p>
              <p className="text-sm text-gray-600">Projected Cost</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{avgSavingsPercentage.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Avg Savings Rate</p>
            </Card>
          </div>
        </div>

        {/* 2. Monthly Cost vs Target */}
        {monthlyTrend.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Target className="h-5 w-5" />
              2. Actual vs Target Cost Analysis
            </h3>
            <Card className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={monthlyTrend}>
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
                    <Legend />
                    <Bar dataKey="actualCost" fill="#ef4444" name="Actual Cost (฿)" />
                    <Line type="monotone" dataKey="targetCost" stroke="#10b981" strokeWidth={3} name="Target Cost (฿)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4 text-gray-700">Potential Monthly Savings</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend}>
                    <defs>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
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
                    <Area type="monotone" dataKey="savings" stroke="#10b981" fillOpacity={1} fill="url(#colorSavings)" name="Savings (฿)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

        {/* 3. Department Financial Impact */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            3. Department-Level Financial Impact
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Current Cost (฿)</TableHead>
                  <TableHead>Potential Savings (฿)</TableHead>
                  <TableHead>Projected Cost (฿)</TableHead>
                  <TableHead>Savings %</TableHead>
                  <TableHead>RLU Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financialImpact.map((dept, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{dept.department}</TableCell>
                    <TableCell>฿{dept.currentCost.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-4 w-4 text-green-500" />
                        <span className="font-semibold text-green-600">
                          ฿{dept.potentialSavings.toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>฿{dept.projectedCost.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={dept.savingsPercentage > 10 ? "default" : "secondary"}>
                        {dept.savingsPercentage.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={dept.rluScore >= 80 ? "text-green-600 font-semibold" : dept.rluScore >= 60 ? "text-yellow-600" : "text-red-600"}>
                        {dept.rluScore.toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 4. Strategic Recommendations */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">4. Strategic Financial Recommendations</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">1</div>
              <p className="text-gray-700">
                Prioritize high-savings departments for immediate RLU improvement initiatives
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">2</div>
              <p className="text-gray-700">
                Implement cost-tracking dashboards for real-time financial monitoring
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">3</div>
              <p className="text-gray-700">
                Establish department-specific cost reduction targets aligned with RLU scores
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">4</div>
              <p className="text-gray-700">
                Consider performance-based incentives tied to cost savings achievements
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">5</div>
              <p className="text-gray-700">
                Conduct quarterly financial impact reviews to track savings progress
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-6 text-center text-sm text-gray-500">
          <p>RLU 360 Transformation Model - Rational Laboratory Use Analytics Platform</p>
          <p>Financial Impact Analysis Report generated on {new Date().toLocaleDateString()} for Year {selectedYear}</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading financial impact data...</p>
        </div>
      )}
    </div>
  );
};
