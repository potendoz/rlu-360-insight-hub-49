import { useState, useEffect } from "react";
import { Search, MoreVertical, User, TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { PDFExport } from "@/components/PDFExport";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { anonymizeDoctorData, anonymizeChartData } from "@/utils/pdpaUtils";

interface MismatchData {
  id: string;
  doctor_id: string;
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
  id: string;
  doctor_id: string;
  month: string;
  year: number;
  fbs_count: number;
  hba1c_count: number;
  lipid_profile_count: number;
  lft_count: number;
  ft3_count: number;
  ft4_count: number;
  aptt_count: number;
}

interface Doctor {
  id: string;
  name: string;
  department: string;
  specialty: string;
  avatar_url?: string;
}

export const Analytics = () => {
  const { hasRole } = useAuth();
  const isJudge = hasRole('judge');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("January");
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  
  const [mismatchData, setMismatchData] = useState<MismatchData[]>([]);
  const [mismatchAnalysis, setMismatchAnalysis] = useState<MismatchAnalysis[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedDoctor, selectedMonth, selectedYear]);

  const fetchData = async () => {
    const savedSheetId = localStorage.getItem('googleSheetId');
    if (!savedSheetId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Use Google Sheets data
      const { googleSheetsService } = await import('@/services/googleSheetsService');
      const doctorsData = await googleSheetsService.getDoctors();
      const mismatchDataAll = await googleSheetsService.getMismatchData();
      const analysisDataAll = await googleSheetsService.getMismatchAnalysis();
      
      // Filter mismatch data
      let filteredMismatchData = mismatchDataAll;
      if (selectedDoctor !== "all") {
        filteredMismatchData = filteredMismatchData.filter(d => d.doctor_id === selectedDoctor);
      }
      if (selectedMonth !== "January") {
        filteredMismatchData = filteredMismatchData.filter(d => d.month === selectedMonth);
      }
      filteredMismatchData = filteredMismatchData.filter(d => d.year === parseInt(selectedYear));

      // Filter analysis data
      let filteredAnalysisData = analysisDataAll;
      if (selectedDoctor !== "all") {
        filteredAnalysisData = filteredAnalysisData.filter(d => d.doctor_id === selectedDoctor);
      }
      if (selectedMonth !== "January") {
        filteredAnalysisData = filteredAnalysisData.filter(d => d.month === selectedMonth);
      }
      filteredAnalysisData = filteredAnalysisData.filter(d => d.year === parseInt(selectedYear));

      setDoctors(doctorsData || []);
      setMismatchData(filteredMismatchData || []);
      setMismatchAnalysis(filteredAnalysisData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate performance metrics from real data
  const calculateMetrics = () => {
    if (mismatchData.length === 0) return null;

    const totalMismatch = mismatchData.reduce((sum, item) => sum + (item.total_mismatch || 0), 0) / mismatchData.length;
    const fbsMismatch = mismatchData.reduce((sum, item) => sum + (item.fbs_mismatch || 0), 0) / mismatchData.length;
    const hba1cMismatch = mismatchData.reduce((sum, item) => sum + (item.hba1c_mismatch || 0), 0) / mismatchData.length;
    const lftMismatch = mismatchData.reduce((sum, item) => sum + (item.lft_mismatch || 0), 0) / mismatchData.length;

    return {
      totalMismatch: totalMismatch.toFixed(1),
      fbsMismatch: fbsMismatch.toFixed(1),
      hba1cMismatch: hba1cMismatch.toFixed(1),
      lftMismatch: lftMismatch.toFixed(1)
    };
  };

  // Prepare chart data
  const prepareTrendData = () => {
    const monthlyData = mismatchData.reduce((acc, item) => {
      const key = `${item.month}-${item.year}`;
      if (!acc[key]) {
        acc[key] = {
          month: item.month,
          totalMismatch: 0,
          count: 0
        };
      }
      acc[key].totalMismatch += item.total_mismatch || 0;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(monthlyData).map((item: any) => ({
      month: item.month,
      value: item.totalMismatch / item.count
    }));
  };

  // Prepare department data
  const prepareDepartmentData = () => {
    const deptData = mismatchData.reduce((acc, item) => {
      const doctor = doctors.find(d => d.id === item.doctor_id);
      const department = doctor?.department || 'Unknown';
      
      if (!acc[department]) {
        acc[department] = {
          department,
          mismatch: 0,
          count: 0
        };
      }
      acc[department].mismatch += item.total_mismatch || 0;
      acc[department].count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(deptData).map((item: any) => ({
      department: item.department,
      savings: parseFloat((100 - (item.mismatch / item.count)).toFixed(1)),
      reduction: parseFloat((item.mismatch / item.count).toFixed(1))
    }));
  };

  const metrics = calculateMetrics();
  const trendData = prepareTrendData();
  const departmentData = prepareDepartmentData();

  // Filter function similar to Doctors page
  const filteredDoctorsData = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDoctor = selectedDoctor === "all" || doctor.id === selectedDoctor;
    return matchesSearch && matchesDoctor;
  });

  // Get doctors with mismatch data for selected month/year
  const doctorsWithMismatchData = filteredDoctorsData
    .map(doctor => {
      const doctorMismatchData = mismatchData.find(data => 
        data.doctor_id === doctor.id && 
        data.month === selectedMonth && 
        data.year === parseInt(selectedYear)
      );
      const doctorAnalysisData = mismatchAnalysis.find(analysis => 
        analysis.doctor_id === doctor.id && 
        analysis.month === selectedMonth && 
        analysis.year === parseInt(selectedYear)
      );
      return {
        ...doctor,
        mismatchData: doctorMismatchData,
        analysisData: doctorAnalysisData
      };
    })
    .filter(doctor => doctor.mismatchData !== undefined);

  // Calculate stats for overview
  const totalDoctors = doctorsWithMismatchData.length;
  const averageMismatch = totalDoctors > 0 
    ? doctorsWithMismatchData.reduce((sum, doctor) => sum + (doctor.mismatchData!.total_mismatch || 0), 0) / totalDoctors 
    : 0;
  const topDoctor = doctorsWithMismatchData.length > 0 
    ? doctorsWithMismatchData.reduce((prev, current) => 
        (current.mismatchData!.total_mismatch || 0) < (prev.mismatchData!.total_mismatch || 0) ? current : prev
      )
    : null;

  // Prepare chart data for mismatch comparison
  const chartData = anonymizeChartData(
    doctorsWithMismatchData.map(doctor => ({
      name: doctor.name.split(' ')[1] || doctor.name,
      totalMismatch: doctor.mismatchData!.total_mismatch || 0,
      fbsMismatch: doctor.mismatchData!.fbs_mismatch || 0,
      hba1cMismatch: doctor.mismatchData!.hba1c_mismatch || 0,
      lftMismatch: doctor.mismatchData!.lft_mismatch || 0,
      lipidMismatch: doctor.mismatchData!.lipid_profile_mismatch || 0,
    })),
    isJudge
  );

  const months = ["January", "February", "March", "April", "May", "June", 
                  "July", "August", "September", "October", "November", "December"];
  const years = ["2023", "2024", "2025"];

  // Check if connected
  const isConnected = !!localStorage.getItem('googleSheetId');

  if (!isConnected) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics - Mismatch Data</h1>
            <p className="text-muted-foreground">Real-time insights into CPG mismatch and analysis</p>
          </div>
        </div>
        <Card className="p-12">
          <div className="text-center space-y-4">
            <BarChart3 className="h-16 w-16 text-warning mx-auto" />
            <h2 className="text-2xl font-semibold">ไม่พบการเชื่อมต่อ Google Sheet</h2>
            <p className="text-muted-foreground">
              กรุณาไปที่หน้า Data Input เพื่อเชื่อมต่อ Google Sheet ID ก่อนดูข้อมูล Analytics
            </p>
            <Button onClick={() => window.location.href = '/data-input'}>
              ไปที่หน้า Data Input
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">Loading analytics data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" id="analytics-report-content" data-pdf-content>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics - Mismatch Data</h1>
          <p className="text-muted-foreground">Real-time insights into CPG mismatch and analysis</p>
        </div>
        <PDFExport 
          title={`Analytics Report - ${selectedMonth} ${selectedYear}`}
          targetElementId="analytics-report-content"
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search doctors by name or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Doctor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doctors</SelectItem>
              {doctors.map(doctor => (
                <SelectItem key={doctor.id} value={doctor.id}>{anonymizeDoctorData(doctor, isJudge).name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Doctors</p>
              <p className="text-2xl font-bold">{totalDoctors}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Mismatch</p>
              <p className="text-2xl font-bold">{averageMismatch.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Top Doctor</p>
              <p className="text-lg font-bold">
                {topDoctor ? (
                  <>
                    {anonymizeDoctorData(topDoctor, isJudge).name}<br />
                    <span className="text-sm text-success">{topDoctor.mismatchData!.total_mismatch?.toFixed(1) || 0}% mismatch</span>
                  </>
                ) : 'No data'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <BarChart3 className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Period</p>
              <p className="text-lg font-bold">{selectedMonth} {selectedYear}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Mismatch Comparison Chart */}
      {doctorsWithMismatchData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Mismatch Analysis Comparison - {selectedMonth} {selectedYear}
          </h3>
          <Tabs defaultValue="total" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="total">Total Mismatch</TabsTrigger>
              <TabsTrigger value="fbs">FBS Mismatch</TabsTrigger>
              <TabsTrigger value="hba1c">HbA1c Mismatch</TabsTrigger>
              <TabsTrigger value="lft">LFT Mismatch</TabsTrigger>
              <TabsTrigger value="lipid">Lipid Mismatch</TabsTrigger>
            </TabsList>
            <TabsContent value="total" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, "Total Mismatch"]} />
                  <Bar dataKey="totalMismatch" fill="hsl(var(--destructive))" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="fbs" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, "FBS Mismatch"]} />
                  <Bar dataKey="fbsMismatch" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="hba1c" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, "HbA1c Mismatch"]} />
                  <Bar dataKey="hba1cMismatch" fill="hsl(var(--warning))" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="lft" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, "LFT Mismatch"]} />
                  <Bar dataKey="lftMismatch" fill="hsl(var(--success))" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="lipid" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, "Lipid Mismatch"]} />
                  <Bar dataKey="lipidMismatch" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Doctors List with Mismatch Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctorsWithMismatchData.map((doctor) => {
          const mismatchData = doctor.mismatchData!;
          const analysisData = doctor.analysisData;
          
          return (
            <Card key={doctor.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={doctor.avatar_url} alt={doctor.name} />
                    <AvatarFallback>{doctor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{anonymizeDoctorData(doctor, isJudge).name}</h3>
                    <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                    <p className="text-xs text-muted-foreground">{doctor.department}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem disabled>
                      No actions available
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Mismatch</span>
                  <span className="font-semibold text-destructive">{mismatchData.total_mismatch?.toFixed(1) || 0}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">FBS Mismatch</span>
                  <span className="font-semibold text-primary">{mismatchData.fbs_mismatch?.toFixed(1) || 0}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">HbA1c Mismatch</span>
                  <span className="font-semibold text-warning">{mismatchData.hba1c_mismatch?.toFixed(1) || 0}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">LFT Mismatch</span>
                  <span className="font-semibold text-success">{mismatchData.lft_mismatch?.toFixed(1) || 0}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Lipid Mismatch</span>
                  <span className="font-semibold text-chart-2">{mismatchData.lipid_profile_mismatch?.toFixed(1) || 0}%</span>
                </div>

                {analysisData && (
                  <>
                    <div className="pt-2 border-t">
                      <h4 className="text-sm font-semibold text-foreground mb-2">Test Counts</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span>FBS:</span>
                          <span className="font-semibold">{analysisData.fbs_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>HbA1c:</span>
                          <span className="font-semibold">{analysisData.hba1c_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>LFT:</span>
                          <span className="font-semibold">{analysisData.lft_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lipid:</span>
                          <span className="font-semibold">{analysisData.lipid_profile_count}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {doctorsWithMismatchData.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No mismatch data found for {selectedMonth} {selectedYear}.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Please select a different month/year or check if data exists for this period.
          </p>
        </Card>
      )}
    </div>
  );
};