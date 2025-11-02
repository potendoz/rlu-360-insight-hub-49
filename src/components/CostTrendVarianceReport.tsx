import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PDFExport } from "@/components/PDFExport";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarDays, FileText, TrendingUp, TrendingDown, Activity, Target, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { googleSheetsService } from "@/services/googleSheetsService";

interface MonthlyMetrics {
  month: string;
  monthIndex: number;
  year: number;
  totalCost: number;
  volume: number;
  unitCost: number;
  momPercent: number | null;
  momValue: number | null;
  yoyPercent: number | null;
  yoyValue: number | null;
  threeMonthMA: number | null;
  costIndex: number;
  varianceVsTarget: number;
}

export const CostTrendVarianceReport = () => {
  const [startYear, setStartYear] = useState(2024);
  const [startMonth, setStartMonth] = useState("January");
  const [endYear, setEndYear] = useState(2024);
  const [endMonth, setEndMonth] = useState("December");
  const [targetUnitCost, setTargetUnitCost] = useState(350);
  const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetrics[]>([]);
  const [loading, setLoading] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const monthMap: { [key: string]: number } = {
    "January": 0, "February": 1, "March": 2, "April": 3,
    "May": 4, "June": 5, "July": 6, "August": 7,
    "September": 8, "October": 9, "November": 10, "December": 11
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const allMonthlyData = await googleSheetsService.getMonthlyData();

      // Create date range
      const startMonthIndex = monthMap[startMonth];
      const endMonthIndex = monthMap[endMonth];
      
      // Get all data and process it month by month
      const allMonthsData: MonthlyMetrics[] = [];
      
      // Collect all months in range
      for (let year = startYear; year <= endYear; year++) {
        const yearStartMonth = year === startYear ? startMonthIndex : 0;
        const yearEndMonth = year === endYear ? endMonthIndex : 11;
        
        for (let monthIdx = yearStartMonth; monthIdx <= yearEndMonth; monthIdx++) {
          const monthName = months[monthIdx];
          const monthData = allMonthlyData.filter(
            item => item.year === year && item.month === monthName
          );
          
          const totalCost = monthData.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
          const volume = monthData.reduce((sum, item) => sum + (item.total_patient || 0), 0);
          const unitCost = volume > 0 ? totalCost / volume : 0;
          
          allMonthsData.push({
            month: monthName,
            monthIndex: monthIdx,
            year,
            totalCost,
            volume,
            unitCost,
            momPercent: null,
            momValue: null,
            yoyPercent: null,
            yoyValue: null,
            threeMonthMA: null,
            costIndex: 0,
            varianceVsTarget: unitCost - targetUnitCost
          });
        }
      }

      // Calculate MoM (Month-over-Month)
      for (let i = 1; i < allMonthsData.length; i++) {
        const current = allMonthsData[i];
        const previous = allMonthsData[i - 1];
        
        if (previous.unitCost > 0) {
          current.momValue = current.unitCost - previous.unitCost;
          current.momPercent = (current.momValue / previous.unitCost) * 100;
        }
      }

      // Calculate YoY (Year-over-Year) - compare with same month from previous year
      allMonthlyData.forEach(currentYearData => {
        const currentIdx = allMonthsData.findIndex(
          m => m.year === currentYearData.year && m.month === currentYearData.month
        );
        
        if (currentIdx >= 0) {
          const previousYearIdx = allMonthsData.findIndex(
            m => m.year === currentYearData.year - 1 && m.month === currentYearData.month
          );
          
          if (previousYearIdx >= 0) {
            const current = allMonthsData[currentIdx];
            const previousYear = allMonthsData[previousYearIdx];
            
            if (previousYear.unitCost > 0) {
              current.yoyValue = current.unitCost - previousYear.unitCost;
              current.yoyPercent = (current.yoyValue / previousYear.unitCost) * 100;
            }
          }
        }
      });

      // Calculate 3-Month Moving Average
      for (let i = 0; i < allMonthsData.length; i++) {
        if (i >= 2) {
          const sum = allMonthsData[i].unitCost + 
                     allMonthsData[i - 1].unitCost + 
                     allMonthsData[i - 2].unitCost;
          allMonthsData[i].threeMonthMA = sum / 3;
        }
      }

      // Calculate Cost Index (Base 100 = first month)
      if (allMonthsData.length > 0) {
        const baseUnitCost = allMonthsData[0].unitCost;
        if (baseUnitCost > 0) {
          allMonthsData.forEach(metric => {
            metric.costIndex = (metric.unitCost / baseUnitCost) * 100;
          });
        }
      }

      setMonthlyMetrics(allMonthsData);

    } catch (error) {
      console.error('Error fetching cost trend data:', error);
      toast.error('Failed to fetch cost trend variance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startYear, startMonth, endYear, endMonth, targetUnitCost]);

  // Calculate key indicators
  const avgUnitCost = monthlyMetrics.length > 0
    ? monthlyMetrics.reduce((sum, m) => sum + m.unitCost, 0) / monthlyMetrics.length
    : 0;

  const avgMomChange = monthlyMetrics.filter(m => m.momPercent !== null).length > 0
    ? monthlyMetrics.filter(m => m.momPercent !== null).reduce((sum, m) => sum + (m.momPercent || 0), 0) / monthlyMetrics.filter(m => m.momPercent !== null).length
    : 0;

  const avgYoyChange = monthlyMetrics.filter(m => m.yoyPercent !== null).length > 0
    ? monthlyMetrics.filter(m => m.yoyPercent !== null).reduce((sum, m) => sum + (m.yoyPercent || 0), 0) / monthlyMetrics.filter(m => m.yoyPercent !== null).length
    : 0;

  // Prepare chart data
  const chartData = monthlyMetrics.map(m => ({
    month: `${m.month.substring(0, 3)} ${m.year}`,
    unitCost: parseFloat(m.unitCost.toFixed(2)),
    threeMonthMA: m.threeMonthMA ? parseFloat(m.threeMonthMA.toFixed(2)) : null,
    target: targetUnitCost
  }));

  const varianceChartData = monthlyMetrics.map(m => ({
    month: `${m.month.substring(0, 3)} ${m.year}`,
    variance: parseFloat(m.varianceVsTarget.toFixed(2))
  }));

  const costIndexData = monthlyMetrics.map(m => ({
    month: `${m.month.substring(0, 3)} ${m.year}`,
    index: parseFloat(m.costIndex.toFixed(2))
  }));

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
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Cost Trend & Variance Analysis</h2>
              <p className="text-muted-foreground">Financial metrics and variance tracking</p>
            </div>
            <PDFExport title="Cost Trend & Variance Report" targetElementId="cost-variance-report" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label>ปีเริ่มต้น</Label>
              <Select value={startYear.toString()} onValueChange={(value) => setStartYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>เดือนเริ่มต้น</Label>
              <Select value={startMonth} onValueChange={setStartMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>ปีสิ้นสุด</Label>
              <Select value={endYear.toString()} onValueChange={(value) => setEndYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>เดือนสิ้นสุด</Label>
              <Select value={endMonth} onValueChange={setEndMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Target Unit Cost (฿)
              </Label>
              <Input 
                type="number" 
                value={targetUnitCost} 
                onChange={(e) => setTargetUnitCost(parseFloat(e.target.value) || 350)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Report Content */}
      <div id="cost-variance-report" className="bg-white p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 border-b pb-6">
          <h1 className="text-3xl font-bold text-gray-800">Cost Trend & Variance Analysis Report</h1>
          <h2 className="text-xl text-gray-600">{startMonth} {startYear} - {endMonth} {endYear}</h2>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <CalendarDays className="h-4 w-4" />
            <span>Generated on {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* 1. Key Financial Indicators */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Key Financial Indicators
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">฿{avgUnitCost.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Avg Unit Cost</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                {avgMomChange >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-red-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-green-500" />
                )}
                <p className={`text-3xl font-bold ${avgMomChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {avgMomChange.toFixed(2)}%
                </p>
              </div>
              <p className="text-sm text-gray-600">Avg MoM Change</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                {avgYoyChange >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-red-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-green-500" />
                )}
                <p className={`text-3xl font-bold ${avgYoyChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {avgYoyChange.toFixed(2)}%
                </p>
              </div>
              <p className="text-sm text-gray-600">Avg YoY Change</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">฿{targetUnitCost}</p>
              <p className="text-sm text-gray-600">Target Unit Cost</p>
            </Card>
          </div>
        </div>

        {/* 2. Unit Cost Trend & 3-Month Moving Average */}
        {chartData.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Unit Cost Trend & 3-Month Moving Average
            </h3>
            <Card className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" className="text-xs text-gray-600" />
                    <YAxis className="text-xs text-gray-600" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="unitCost" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="Unit Cost (฿)"
                      dot={{ fill: '#3b82f6', r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="threeMonthMA" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="3M Moving Avg"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Target"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <h4 className="text-lg font-semibold mb-3 text-blue-900 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                การวิเคราะห์: Unit Cost Trend & 3-Month Moving Average
              </h4>
              <div className="space-y-2 text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <p>
                    <strong>แนวโน้มต้นทุนต่อหน่วย:</strong> ต้นทุนเฉลี่ยต่อผู้ป่วยที่ ฿{avgUnitCost.toFixed(2)} โดยมีช่วงต้นทุนต่ำสุดที่ ฿
                    {Math.min(...monthlyMetrics.map(m => m.unitCost)).toFixed(2)} และสูงสุดที่ ฿
                    {Math.max(...monthlyMetrics.map(m => m.unitCost)).toFixed(2)} (ส่วนต่าง ฿
                    {(Math.max(...monthlyMetrics.map(m => m.unitCost)) - Math.min(...monthlyMetrics.map(m => m.unitCost))).toFixed(2)})
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <p>
                    <strong>ค่าเฉลี่ยเคลื่อนที่ 3 เดือน (3M MA):</strong> ช่วยกรองความผันผวนระยะสั้นและแสดงแนวโน้มที่ใช้เพิ่งจริง ค่า 3M MA เฉลี่ออยู่ที่ ฿
                    {(monthlyMetrics.filter(m => m.threeMonthMA !== null).reduce((sum, m) => sum + (m.threeMonthMA || 0), 0) / 
                      monthlyMetrics.filter(m => m.threeMonthMA !== null).length).toFixed(2)} 
                    {' '}ให้สำหรับระบบการเปลี่ยนแปลงที่ตรงการปลี่ยนเเปลงที่มีนัดคง
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <p>
                    <strong>เปรียบเทียบกับเป้าหมาย (Target ฿{targetUnitCost}):</strong> ต้นทุนเกินเป้าหมาย ฿
                    {(avgUnitCost - targetUnitCost).toFixed(2)} ({((avgUnitCost - targetUnitCost) / targetUnitCost * 100).toFixed(2)}%) 
                    - ควรทบทวนกระบวนการและหามาตรการลดต้นทุน
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <p>
                    <strong>แนวโน้มล่าสุด:</strong> ต้นทุนมีความเสถียร (เปลี่ยนเเปลง {avgMomChange.toFixed(2)}%) 
                    - ควรรักษาระดับการควบคุมต้นทุนในปัจจุบัน
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 3. Variance vs Target Analysis */}
        {varianceChartData.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Variance vs Target Analysis
            </h3>
            <Card className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={varianceChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" className="text-xs text-gray-600" />
                    <YAxis className="text-xs text-gray-600" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="variance" fill="#8b5cf6" name="Variance (฿)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6 bg-purple-50 border-purple-200">
              <h4 className="text-lg font-semibold mb-3 text-purple-900 flex items-center gap-2">
                <Target className="h-5 w-5" />
                การวิเคราะห์: Variance vs Target Analysis
              </h4>
              <div className="space-y-2 text-gray-700">
                {monthlyMetrics.map((metric, idx) => {
                  const isHigh = metric.varianceVsTarget > 0;
                  const severity = Math.abs(metric.varianceVsTarget / targetUnitCost * 100);
                  
                  if (idx < 3 || idx === monthlyMetrics.length - 1 || severity > 50) {
                    return (
                      <div key={idx} className="flex items-start gap-2">
                        <span className={`font-bold ${isHigh ? 'text-red-600' : 'text-green-600'}`}>•</span>
                        <p>
                          <strong>{metric.month} {metric.year}:</strong>{' '}
                          <span className={isHigh ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                            {isHigh ? `+฿${metric.varianceVsTarget.toFixed(2)}` : `฿${metric.varianceVsTarget.toFixed(2)}`}
                            {' '}({(metric.varianceVsTarget / targetUnitCost * 100).toFixed(2)}% {isHigh ? 'เกินเป้า' : 'ต่ำกว่าเป้า'})
                          </span>
                          {' '}- {isHigh ? 'ควรตรวจสอบสาเหตุและปัจจุบันที่ทำให้ต้นทุนสูง' : 'น่าแนวทางการบริหารต้นทุนในเดือนนี้ใช้เป็นแบบอย่าง'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }).filter(Boolean)}
                
                <div className="flex items-start gap-2 mt-4 pt-4 border-t border-purple-200">
                  <span className="text-purple-600 font-bold">•</span>
                  <p>
                    <strong>ความแตกต่างเฉลี่ยจากเป้าหมาย:</strong> 
                    {' '}
                    <span className={avgUnitCost > targetUnitCost ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                      {avgUnitCost > targetUnitCost ? '+' : ''}฿{(avgUnitCost - targetUnitCost).toFixed(2)}
                      {' '}({((avgUnitCost - targetUnitCost) / targetUnitCost * 100).toFixed(2)}%)
                    </span>
                    {' '}- ควรทบทวนกระบวนการใหม่เพื่อปรับปรุง
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}


        {/* 4. Cost Index (Base 100) */}
        {costIndexData.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Cost Index (Base 100)</h3>
            <Card className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={costIndexData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" className="text-xs text-gray-600" />
                    <YAxis className="text-xs text-gray-600" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="index" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      name="Cost Index"
                      dot={{ fill: '#f59e0b', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6 bg-amber-50 border-amber-200">
              <h4 className="text-lg font-semibold mb-3 text-amber-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                การวิเคราะห์: Cost Index (Base 100)
              </h4>
              <div className="space-y-2 text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <p>
                    <strong>ความหมายของ Cost Index:</strong> ใช้เดือนแรกเป็นฐาน (100) เพื่อเปรียบเทียบการเปลี่ยนแปลงของต้นทุนรวมในแต่ละเดือน 
                    ค่าที่มากกว่า 100 แสดงว่าต้นทุนเพิ่มขึ้นจากเดือนแรก ส่วนค่าที่น้อยกว่า 100 แสดงว่าลดลง
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className={`font-bold ${monthlyMetrics[monthlyMetrics.length - 1]?.costIndex < 100 ? 'text-green-600' : 'text-red-600'}`}>•</span>
                  <p>
                    <strong>ดัชนีปัจจุบัน:</strong> {monthlyMetrics[monthlyMetrics.length - 1]?.costIndex.toFixed(2)} 
                    {' '}(ลดลง {(100 - monthlyMetrics[monthlyMetrics.length - 1]?.costIndex).toFixed(2)}% จากเดือนแรก) 
                    - การบริหารต้นทุนมีประสิทธิภาพ
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className={`font-bold ${monthlyMetrics[0]?.costIndex === Math.max(...monthlyMetrics.map(m => m.costIndex)) ? 'text-red-600' : 'text-green-600'}`}>•</span>
                  <p>
                    <strong>ดัชนีสูงสุด:</strong>{' '}
                    {(() => {
                      const maxIndex = Math.max(...monthlyMetrics.map(m => m.costIndex));
                      const maxMonth = monthlyMetrics.find(m => m.costIndex === maxIndex);
                      return `${maxMonth?.month} (Index: ${maxIndex.toFixed(2)}, +${(maxIndex - 100).toFixed(2)}% จากฐาน)`;
                    })()}
                    {' '}- เดือนที่มีต้นทุนรวมสูงที่สุด
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <p>
                    <strong>ดัชนีต่ำสุด:</strong>{' '}
                    {(() => {
                      const minIndex = Math.min(...monthlyMetrics.map(m => m.costIndex));
                      const minMonth = monthlyMetrics.find(m => m.costIndex === minIndex);
                      return `${minMonth?.month} (Index: ${minIndex.toFixed(2)}, ${(minIndex - 100).toFixed(2)}% ${minIndex < 100 ? 'ต่ำกว่า' : 'สูงกว่า'}ฐาน)`;
                    })()}
                    {' '}- เดือนที่มีประสิทธิภาพต้นทุนดีที่สุด
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <p>
                    <strong>ความผันผวนของดัชนี:</strong> สูง (ช่วง {(Math.max(...monthlyMetrics.map(m => m.costIndex)) - Math.min(...monthlyMetrics.map(m => m.costIndex))).toFixed(2)} จุด) 
                    - ต้นทุนมีความผันผวนมาก ควรหาสาเหตุและวางแผนความคุม
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 5. Detailed Monthly Metrics */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">Detailed Monthly Metrics</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Month</TableHead>
                  <TableHead className="text-right font-semibold">Total Cost</TableHead>
                  <TableHead className="text-right font-semibold">Volume</TableHead>
                  <TableHead className="text-right font-semibold">Unit Cost</TableHead>
                  <TableHead className="text-right font-semibold">MoM %</TableHead>
                  <TableHead className="text-right font-semibold">MoM ฿</TableHead>
                  <TableHead className="text-right font-semibold">YoY %</TableHead>
                  <TableHead className="text-right font-semibold">YoY ฿</TableHead>
                  <TableHead className="text-right font-semibold">3M MA</TableHead>
                  <TableHead className="text-right font-semibold">Cost Index</TableHead>
                  <TableHead className="text-center font-semibold">Var vs Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyMetrics.map((metric, idx) => {
                  const isAboveTarget = metric.varianceVsTarget > 0;
                  const varianceSeverity = Math.abs(metric.varianceVsTarget / targetUnitCost * 100);
                  
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{metric.month}</TableCell>
                      <TableCell className="text-right">฿{metric.totalCost.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{metric.volume.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">฿{metric.unitCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {metric.momPercent !== null ? (
                          <div className="flex items-center justify-end gap-1">
                            {metric.momPercent < 0 ? (
                              <TrendingDown className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingUp className="h-4 w-4 text-red-600" />
                            )}
                            <span className={metric.momPercent < 0 ? 'text-green-600' : 'text-red-600'}>
                              {metric.momPercent.toFixed(2)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {metric.momValue !== null ? (
                          <span className={metric.momValue < 0 ? 'text-green-600' : 'text-red-600'}>
                            {metric.momValue < 0 ? '↓' : '↑'} ฿{Math.abs(metric.momValue).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {metric.yoyPercent !== null ? (
                          <div className="flex items-center justify-end gap-1">
                            {metric.yoyPercent < 0 ? (
                              <TrendingDown className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingUp className="h-4 w-4 text-red-600" />
                            )}
                            <span className={metric.yoyPercent < 0 ? 'text-green-600' : 'text-red-600'}>
                              {metric.yoyPercent.toFixed(2)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {metric.yoyValue !== null ? (
                          <span className={metric.yoyValue < 0 ? 'text-green-600' : 'text-red-600'}>
                            {metric.yoyValue < 0 ? '↓' : '↑'} ฿{Math.abs(metric.yoyValue).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {metric.threeMonthMA !== null ? (
                          <span>฿{metric.threeMonthMA.toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{metric.costIndex.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={isAboveTarget ? 'destructive' : varianceSeverity < 10 ? 'default' : 'default'}
                          className={
                            isAboveTarget 
                              ? 'bg-red-500 hover:bg-red-600' 
                              : varianceSeverity < 10 
                                ? 'bg-blue-500 hover:bg-blue-600'
                                : 'bg-green-500 hover:bg-green-600'
                          }
                        >
                          {isAboveTarget ? 'High ' : ''}
                          {isAboveTarget ? '+' : ''}
                          {metric.varianceVsTarget.toFixed(2)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 6. Key Insights & Recommendations */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">Key Insights & Recommendations</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">•</div>
              <p className="text-gray-700">
                <strong>Average Unit Cost:</strong> ฿{avgUnitCost.toFixed(2)} per patient 
                (฿{(avgUnitCost - targetUnitCost).toFixed(2)} {avgUnitCost > targetUnitCost ? 'above' : 'below'} target 
                - {avgUnitCost > targetUnitCost ? 'requires cost optimization' : 'performing well'})
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">•</div>
              <p className="text-gray-700">
                <strong>MoM Trend:</strong> Average {avgMomChange.toFixed(2)}% monthly change 
                - {Math.abs(avgMomChange) > 20 ? 'significant volatility detected, review monthly patterns' : 'stable trend, continue monitoring'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">•</div>
              <p className="text-gray-700">
                <strong>YoY Performance:</strong> Average {avgYoyChange.toFixed(2)}% year-over-year change 
                - {avgYoyChange < 0 ? 'successful cost reduction achieved' : 'cost increase requires attention'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">•</div>
              <p className="text-gray-700">
                <strong>3-Month Moving Average:</strong> Helps identify underlying trends by smoothing short-term fluctuations 
                - monitor for sustained cost increases or decreases
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-6 text-center text-sm text-gray-500">
          <p>RLU 360 Transformation Model - Rational Laboratory Use Analytics Platform</p>
          <p>Cost Trend & Variance Report generated on {new Date().toLocaleDateString()} for {startMonth} {startYear} - {endMonth} {endYear}</p>
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
