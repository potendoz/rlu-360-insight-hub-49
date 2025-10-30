import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PDFExport } from "@/components/PDFExport";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, FileText, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { anonymizeDoctorName } from "@/utils/pdpaUtils";
import { googleSheetsService } from "@/services/googleSheetsService";

interface DoctorMismatchData {
  id: string;
  name: string;
  specialty: string;
  department: string;
  cpgMismatchPercentage: number;
  duplicateOrderRate: number;
  totalPatients: number;
  totalLabs: number;
  rluScore: number;
}

interface MismatchCategory {
  name: string;
  value: number;
  color: string;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6'];

export const MismatchAnalysisReport = () => {
  const { hasRole } = useAuth();
  const isJudge = hasRole('judge');
  const [selectedMonth, setSelectedMonth] = useState("December");
  const [selectedYear, setSelectedYear] = useState(2024);
  const [doctorsData, setDoctorsData] = useState<DoctorMismatchData[]>([]);
  const [mismatchCategories, setMismatchCategories] = useState<MismatchCategory[]>([]);
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

      // Filter by selected month and year
      const filteredData = monthlyData.filter(
        item => item.month === selectedMonth && item.year === selectedYear
      );

      // Transform data
      const transformedData: DoctorMismatchData[] = filteredData.map(item => {
        const doctor = doctors.find(d => d.id === item.doctor_id);
        return {
          id: item.doctor_id,
          name: doctor?.name || 'Unknown',
          specialty: doctor?.specialty || 'Unknown',
          department: doctor?.department || 'Unknown',
          cpgMismatchPercentage: item.cpg_mismatch_percentage || 0,
          duplicateOrderRate: item.duplicate_order_rate || 0,
          totalPatients: item.total_patient || 0,
          totalLabs: item.total_lab || 0,
          rluScore: item.rlu_score || 0
        };
      }).sort((a, b) => b.cpgMismatchPercentage - a.cpgMismatchPercentage);

      setDoctorsData(transformedData);

      // Categorize mismatches
      const categories: MismatchCategory[] = [
        {
          name: 'Critical (>30%)',
          value: transformedData.filter(d => d.cpgMismatchPercentage > 30).length,
          color: COLORS[0]
        },
        {
          name: 'High (20-30%)',
          value: transformedData.filter(d => d.cpgMismatchPercentage > 20 && d.cpgMismatchPercentage <= 30).length,
          color: COLORS[1]
        },
        {
          name: 'Moderate (10-20%)',
          value: transformedData.filter(d => d.cpgMismatchPercentage > 10 && d.cpgMismatchPercentage <= 20).length,
          color: COLORS[2]
        },
        {
          name: 'Low (5-10%)',
          value: transformedData.filter(d => d.cpgMismatchPercentage > 5 && d.cpgMismatchPercentage <= 10).length,
          color: COLORS[3]
        },
        {
          name: 'Excellent (<5%)',
          value: transformedData.filter(d => d.cpgMismatchPercentage <= 5).length,
          color: COLORS[4]
        }
      ];

      setMismatchCategories(categories);

    } catch (error) {
      console.error('Error fetching mismatch data:', error);
      toast.error('Failed to fetch mismatch analysis data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const avgCpgMismatch = doctorsData.length > 0
    ? doctorsData.reduce((sum, doc) => sum + doc.cpgMismatchPercentage, 0) / doctorsData.length
    : 0;

  const avgDuplicateRate = doctorsData.length > 0
    ? doctorsData.reduce((sum, doc) => sum + doc.duplicateOrderRate, 0) / doctorsData.length
    : 0;

  const getMismatchSeverity = (percentage: number) => {
    if (percentage > 30) return { label: 'Critical', variant: 'destructive' as const };
    if (percentage > 20) return { label: 'High', variant: 'destructive' as const };
    if (percentage > 10) return { label: 'Moderate', variant: 'secondary' as const };
    if (percentage > 5) return { label: 'Low', variant: 'secondary' as const };
    return { label: 'Excellent', variant: 'default' as const };
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
            <h2 className="text-xl font-semibold text-foreground">Mismatch Analysis Report</h2>
            <p className="text-muted-foreground">CPG compliance and duplicate order analysis</p>
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
            <PDFExport title={`Mismatch Analysis Report - ${selectedMonth} ${selectedYear}`} targetElementId="mismatch-report" />
          </div>
        </div>
      </Card>

      {/* Report Content */}
      <div id="mismatch-report" className="bg-white p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 border-b pb-6">
          <h1 className="text-3xl font-bold text-gray-800">Mismatch Analysis Report</h1>
          <h2 className="text-xl text-gray-600">{selectedMonth} {selectedYear}</h2>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <CalendarDays className="h-4 w-4" />
            <span>Generated on {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* 1. Mismatch Overview */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            1. Mismatch Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{avgCpgMismatch.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Avg CPG Mismatch</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{avgDuplicateRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Avg Duplicate Rate</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {doctorsData.filter(d => d.cpgMismatchPercentage <= 10).length}
              </p>
              <p className="text-sm text-gray-600">Compliant Doctors</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{doctorsData.length}</p>
              <p className="text-sm text-gray-600">Total Analyzed</p>
            </Card>
          </div>
        </div>

        {/* 2. Mismatch Distribution */}
        {mismatchCategories.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              2. Mismatch Distribution
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4 text-gray-700">Distribution by Severity</h4>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mismatchCategories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {mismatchCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4 text-gray-700">Top 10 Mismatch Rates</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={doctorsData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" className="text-xs text-gray-600" hide />
                      <YAxis className="text-xs text-gray-600" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          color: '#1f2937'
                        }}
                      />
                      <Bar dataKey="cpgMismatchPercentage" fill="#ef4444" name="CPG Mismatch %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* 3. Doctor Mismatch Details */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">3. Individual Doctor Mismatch Analysis</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Physician Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>CPG Mismatch (%)</TableHead>
                  <TableHead>Duplicate Orders (%)</TableHead>
                  <TableHead>RLU Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctorsData.map((doctor) => {
                  const severity = getMismatchSeverity(doctor.cpgMismatchPercentage);
                  return (
                    <TableRow key={doctor.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{isJudge ? anonymizeDoctorName(doctor.name) : doctor.name}</p>
                          <p className="text-sm text-gray-500">{doctor.specialty}</p>
                        </div>
                      </TableCell>
                      <TableCell>{doctor.department}</TableCell>
                      <TableCell>
                        <Badge variant={severity.variant}>
                          {doctor.cpgMismatchPercentage.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{doctor.duplicateOrderRate.toFixed(1)}%</TableCell>
                      <TableCell>
                        <span className={doctor.rluScore >= 80 ? "text-green-600 font-semibold" : doctor.rluScore >= 60 ? "text-yellow-600" : "text-red-600"}>
                          {doctor.rluScore.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {doctor.cpgMismatchPercentage <= 10 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">{severity.label}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 4. Recommendations */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">4. Improvement Recommendations</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">1</div>
              <p className="text-gray-700">
                Implement mandatory CPG training for doctors with mismatch rates above 20%
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">2</div>
              <p className="text-gray-700">
                Deploy clinical decision support systems with real-time CPG alerts
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">3</div>
              <p className="text-gray-700">
                Establish peer review sessions focusing on high-mismatch cases
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">4</div>
              <p className="text-gray-700">
                Implement duplicate order detection and prevention systems
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-6 text-center text-sm text-gray-500">
          <p>RLU 360 Transformation Model - Rational Laboratory Use Analytics Platform</p>
          <p>Mismatch Analysis Report generated on {new Date().toLocaleDateString()} for {selectedMonth} {selectedYear}</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading mismatch analysis data...</p>
        </div>
      )}
    </div>
  );
};
