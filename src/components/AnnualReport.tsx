import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PDFExport } from "@/components/PDFExport";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, FileText, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { anonymizeDoctorName } from "@/utils/pdpaUtils";
import { googleSheetsService } from "@/services/googleSheetsService";

interface MonthlyData {
  month: string;
  avgRluScore: number;
  totalPatients: number;
  totalLabs: number;
  avgLpRatio: number;
  avgCpgMismatch: number;
  totalCost: number;
}

interface DoctorAnnualData {
  id: string;
  name: string;
  specialty: string;
  department: string;
  totalPatients: number;
  totalLabs: number;
  avgRluScore: number;
  avgLpRatio: number;
  avgCpgMismatch: number;
  totalCost: number;
}

export const AnnualReport = () => {
  const { hasRole } = useAuth();
  const isJudge = hasRole('judge');
  const [selectedYear, setSelectedYear] = useState(2024);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [doctorAnnualData, setDoctorAnnualData] = useState<DoctorAnnualData[]>([]);
  const [loading, setLoading] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const savedSheetId = localStorage.getItem('googleSheetId');
      if (!savedSheetId) {
        setLoading(false);
        return;
      }

      const [doctors, allMonthlyData] = await Promise.all([
        googleSheetsService.getDoctors(),
        googleSheetsService.getMonthlyData()
      ]);

      // Filter data for selected year
      const yearData = allMonthlyData.filter(item => item.year === selectedYear);

      // Calculate monthly aggregates
      const monthlyAggregates = months.map(month => {
        const monthData = yearData.filter(item => item.month === month);
        
        if (monthData.length === 0) {
          return {
            month: month.substring(0, 3),
            avgRluScore: 0,
            totalPatients: 0,
            totalLabs: 0,
            avgLpRatio: 0,
            avgCpgMismatch: 0,
            totalCost: 0
          };
        }

        return {
          month: month.substring(0, 3),
          avgRluScore: monthData.reduce((sum, item) => sum + (item.rlu_score || 0), 0) / monthData.length,
          totalPatients: monthData.reduce((sum, item) => sum + (item.total_patient || 0), 0),
          totalLabs: monthData.reduce((sum, item) => sum + (item.total_lab || 0), 0),
          avgLpRatio: monthData.reduce((sum, item) => sum + (item.lp_ratio || 0), 0) / monthData.length,
          avgCpgMismatch: monthData.reduce((sum, item) => sum + (item.cpg_mismatch_percentage || 0), 0) / monthData.length,
          totalCost: monthData.reduce((sum, item) => sum + (item.estimated_cost || 0), 0)
        };
      }).filter(item => item.totalPatients > 0);

      setMonthlyData(monthlyAggregates);

      // Calculate doctor annual aggregates
      const doctorMap = new Map<string, any>();
      
      yearData.forEach(item => {
        const doctor = doctors.find(d => d.id === item.doctor_id);
        if (!doctor) return;

        if (!doctorMap.has(item.doctor_id)) {
          doctorMap.set(item.doctor_id, {
            id: item.doctor_id,
            name: doctor.name,
            specialty: doctor.specialty,
            department: doctor.department,
            totalPatients: 0,
            totalLabs: 0,
            rluScores: [],
            lpRatios: [],
            cpgMismatches: [],
            totalCost: 0
          });
        }

        const docData = doctorMap.get(item.doctor_id);
        docData.totalPatients += item.total_patient || 0;
        docData.totalLabs += item.total_lab || 0;
        docData.rluScores.push(item.rlu_score || 0);
        docData.lpRatios.push(item.lp_ratio || 0);
        docData.cpgMismatches.push(item.cpg_mismatch_percentage || 0);
        docData.totalCost += item.estimated_cost || 0;
      });

      const doctorAnnual: DoctorAnnualData[] = Array.from(doctorMap.values()).map(doc => ({
        id: doc.id,
        name: doc.name,
        specialty: doc.specialty,
        department: doc.department,
        totalPatients: doc.totalPatients,
        totalLabs: doc.totalLabs,
        avgRluScore: doc.rluScores.reduce((a: number, b: number) => a + b, 0) / doc.rluScores.length,
        avgLpRatio: doc.lpRatios.reduce((a: number, b: number) => a + b, 0) / doc.lpRatios.length,
        avgCpgMismatch: doc.cpgMismatches.reduce((a: number, b: number) => a + b, 0) / doc.cpgMismatches.length,
        totalCost: doc.totalCost
      })).sort((a, b) => b.avgRluScore - a.avgRluScore);

      setDoctorAnnualData(doctorAnnual);

    } catch (error) {
      console.error('Error fetching annual data:', error);
      toast.error('Failed to fetch annual report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const totalStats = {
    totalPatients: monthlyData.reduce((sum, item) => sum + item.totalPatients, 0),
    totalLabs: monthlyData.reduce((sum, item) => sum + item.totalLabs, 0),
    totalCost: monthlyData.reduce((sum, item) => sum + item.totalCost, 0),
    avgRluScore: monthlyData.length > 0 
      ? monthlyData.reduce((sum, item) => sum + item.avgRluScore, 0) / monthlyData.length 
      : 0
  };

  const isConnected = !!localStorage.getItem('googleSheetId');

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <Card className="p-12">
          <div className="text-center space-y-4">
            <FileText className="h-16 w-16 text-warning mx-auto" />
            <h2 className="text-2xl font-semibold">ไม่พบการเชื่อมต่อ Google Sheet</h2>
            <p className="text-muted-foreground">
              กรุณาไปที่หน้า Data Input เพื่อเชื่อมต่อ Google Sheet ID ก่อนดูรายงานประจำปี
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
            <h2 className="text-xl font-semibold text-foreground">Annual Report</h2>
            <p className="text-muted-foreground">Comprehensive yearly RLU performance analysis</p>
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
            <PDFExport title={`Annual Report - ${selectedYear}`} targetElementId="annual-report" />
          </div>
        </div>
      </Card>

      {/* Report Content */}
      <div id="annual-report" className="bg-white p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 border-b pb-6">
          <h1 className="text-3xl font-bold text-gray-800">Annual RLU Performance Report</h1>
          <h2 className="text-xl text-gray-600">Year {selectedYear}</h2>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <CalendarDays className="h-4 w-4" />
            <span>Generated on {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* 1. Annual Overview */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            1. Annual Performance Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{totalStats.avgRluScore.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Average RLU Score</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{totalStats.totalPatients.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Patients</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{totalStats.totalLabs.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Lab Tests</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">฿{(totalStats.totalCost / 1000).toFixed(0)}K</p>
              <p className="text-sm text-gray-600">Total Cost</p>
            </Card>
          </div>
        </div>

        {/* 2. Monthly Trend Analysis */}
        {monthlyData.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              2. Monthly Performance Trends
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4 text-gray-700">RLU Score Trend</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
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
                      <Line type="monotone" dataKey="avgRluScore" stroke="#3b82f6" strokeWidth={3} name="RLU Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4 text-gray-700">Patient & Lab Volume</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
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
                      <Bar dataKey="totalPatients" fill="#10b981" name="Patients" />
                      <Bar dataKey="totalLabs" fill="#8b5cf6" name="Lab Tests" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* 3. Doctor Annual Performance */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">3. Doctor Annual Performance Summary</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Physician Name</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Total Patients</TableHead>
                  <TableHead>Total Labs</TableHead>
                  <TableHead>Avg RLU Score</TableHead>
                  <TableHead>Avg L/P Ratio</TableHead>
                  <TableHead>Total Cost (฿)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctorAnnualData.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{isJudge ? anonymizeDoctorName(doctor.name) : doctor.name}</p>
                        <p className="text-sm text-gray-500">{doctor.department}</p>
                      </div>
                    </TableCell>
                    <TableCell>{doctor.specialty}</TableCell>
                    <TableCell>{doctor.totalPatients.toLocaleString()}</TableCell>
                    <TableCell>{doctor.totalLabs.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {doctor.avgRluScore >= 80 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={doctor.avgRluScore >= 80 ? "text-green-600 font-semibold" : doctor.avgRluScore >= 60 ? "text-yellow-600" : "text-red-600"}>
                          {doctor.avgRluScore.toFixed(2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={doctor.avgLpRatio > 4 ? "destructive" : doctor.avgLpRatio > 3 ? "secondary" : "default"}>
                        {doctor.avgLpRatio.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">฿{doctor.totalCost.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-6 text-center text-sm text-gray-500">
          <p>RLU 360 Transformation Model - Rational Laboratory Use Analytics Platform</p>
          <p>Annual Report generated on {new Date().toLocaleDateString()} for Year {selectedYear}</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading annual report data...</p>
        </div>
      )}
    </div>
  );
};
