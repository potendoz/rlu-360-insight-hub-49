import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFExport } from "@/components/PDFExport";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, FileText, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { toast } from "sonner";
import { googleSheetsService } from "@/services/googleSheetsService";

interface MonthlyVariance {
  month: string;
  totalCost: number;
  avgCost: number;
  variance: number;
  percentChange: number;
}

interface DepartmentCostVariance {
  department: string;
  totalCost: number;
  avgCostPerPatient: number;
  variance: number;
}

export const CostTrendVarianceReport = () => {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [monthlyVariance, setMonthlyVariance] = useState<MonthlyVariance[]>([]);
  const [departmentVariance, setDepartmentVariance] = useState<DepartmentCostVariance[]>([]);
  const [loading, setLoading] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [doctors, allMonthlyData] = await Promise.all([
        googleSheetsService.getDoctors(),
        googleSheetsService.getMonthlyData()
      ]);

      // Filter data for selected year
      const yearData = allMonthlyData.filter(item => item.year === selectedYear);

      // Calculate monthly variance
      const monthlyData = months.map((month, index) => {
        const monthData = yearData.filter(item => item.month === month);
        const totalCost = monthData.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
        const avgCost = monthData.length > 0 ? totalCost / monthData.length : 0;

        // Calculate variance compared to previous month
        let variance = 0;
        let percentChange = 0;
        
        if (index > 0) {
          const prevMonthData = yearData.filter(item => item.month === months[index - 1]);
          const prevTotalCost = prevMonthData.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
          variance = totalCost - prevTotalCost;
          percentChange = prevTotalCost > 0 ? (variance / prevTotalCost) * 100 : 0;
        }

        return {
          month: month.substring(0, 3),
          totalCost,
          avgCost,
          variance,
          percentChange
        };
      }).filter(item => item.totalCost > 0);

      setMonthlyVariance(monthlyData);

      // Calculate department cost variance
      const departmentMap = new Map<string, any>();
      
      yearData.forEach(item => {
        const doctor = doctors.find(d => d.id === item.doctor_id);
        if (!doctor) return;

        if (!departmentMap.has(doctor.department)) {
          departmentMap.set(doctor.department, {
            department: doctor.department,
            totalCost: 0,
            totalPatients: 0,
            costs: []
          });
        }

        const deptData = departmentMap.get(doctor.department);
        deptData.totalCost += item.estimated_cost || 0;
        deptData.totalPatients += item.total_patient || 0;
        deptData.costs.push(item.estimated_cost || 0);
      });

      const deptVariance: DepartmentCostVariance[] = Array.from(departmentMap.values()).map(dept => {
        const avgCost = dept.costs.reduce((a: number, b: number) => a + b, 0) / dept.costs.length;
        const variance = dept.costs.reduce((sum: number, cost: number) => sum + Math.pow(cost - avgCost, 2), 0) / dept.costs.length;
        
        return {
          department: dept.department,
          totalCost: dept.totalCost,
          avgCostPerPatient: dept.totalPatients > 0 ? dept.totalCost / dept.totalPatients : 0,
          variance: Math.sqrt(variance)
        };
      }).sort((a, b) => b.totalCost - a.totalCost);

      setDepartmentVariance(deptVariance);

    } catch (error) {
      console.error('Error fetching cost trend data:', error);
      toast.error('Failed to fetch cost trend variance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const totalVariance = monthlyVariance.length > 0 
    ? monthlyVariance.reduce((sum, item) => sum + Math.abs(item.variance), 0) / monthlyVariance.length 
    : 0;

  const avgPercentChange = monthlyVariance.length > 0
    ? monthlyVariance.reduce((sum, item) => sum + item.percentChange, 0) / monthlyVariance.length
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
            <h2 className="text-xl font-semibold text-foreground">Cost Trend & Variance Report</h2>
            <p className="text-muted-foreground">Detailed cost analysis with variance tracking</p>
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
            <PDFExport title={`Cost Trend & Variance Report - ${selectedYear}`} targetElementId="cost-variance-report" />
          </div>
        </div>
      </Card>

      {/* Report Content */}
      <div id="cost-variance-report" className="bg-white p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 border-b pb-6">
          <h1 className="text-3xl font-bold text-gray-800">Cost Trend & Variance Analysis Report</h1>
          <h2 className="text-xl text-gray-600">Year {selectedYear}</h2>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <CalendarDays className="h-4 w-4" />
            <span>Generated on {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* 1. Variance Overview */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            1. Cost Variance Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">฿{(totalVariance / 1000).toFixed(0)}K</p>
              <p className="text-sm text-gray-600">Avg Monthly Variance</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                {avgPercentChange >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-red-500" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-green-500" />
                )}
                <p className={`text-2xl font-bold ${avgPercentChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {avgPercentChange.toFixed(1)}%
                </p>
              </div>
              <p className="text-sm text-gray-600">Avg % Change</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{departmentVariance.length}</p>
              <p className="text-sm text-gray-600">Departments Analyzed</p>
            </Card>
          </div>
        </div>

        {/* 2. Monthly Cost Trend */}
        {monthlyVariance.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              2. Monthly Cost Trend Analysis
            </h3>
            <Card className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyVariance}>
                    <defs>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="totalCost" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorCost)"
                      name="Total Cost (฿)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4 text-gray-700">Month-to-Month Variance</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyVariance}>
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
                      dataKey="percentChange" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      name="% Change"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

        {/* 3. Department Cost Variance */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">3. Department Cost Variance Analysis</h3>
          <div className="grid gap-4">
            {departmentVariance.map((dept, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-800">{dept.department}</h4>
                  <Badge variant="outline">Rank #{index + 1}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Cost</p>
                    <p className="text-lg font-bold text-blue-600">฿{dept.totalCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Cost/Patient</p>
                    <p className="text-lg font-bold text-green-600">฿{dept.avgCostPerPatient.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Std Deviation</p>
                    <p className="text-lg font-bold text-purple-600">฿{dept.variance.toFixed(0)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* 4. Key Insights */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">4. Key Insights & Recommendations</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">1</div>
              <p className="text-gray-700">
                {avgPercentChange > 5 
                  ? "Cost trend shows significant increase - implement immediate cost control measures" 
                  : avgPercentChange < -5 
                    ? "Cost trend shows positive reduction - maintain current optimization strategies"
                    : "Cost trend is stable - continue monitoring and optimization efforts"}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">2</div>
              <p className="text-gray-700">High variance departments require targeted intervention and standardized protocols</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">3</div>
              <p className="text-gray-700">Establish quarterly cost variance review meetings with department heads</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-6 text-center text-sm text-gray-500">
          <p>RLU 360 Transformation Model - Rational Laboratory Use Analytics Platform</p>
          <p>Cost Trend & Variance Report generated on {new Date().toLocaleDateString()} for Year {selectedYear}</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading cost trend data...</p>
        </div>
      )}
    </div>
  );
};
