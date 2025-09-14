import { useState, useEffect } from "react";
import { Search, Plus, MoreVertical, Award, TrendingUp, User, Calendar, BarChart3, X, Edit, Trash2 } from "lucide-react";
import { PDFExport } from "@/components/PDFExport";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { anonymizeDoctorData, anonymizeChartData } from "@/utils/pdpaUtils";

// Doctor interface for type safety
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  monthlyData: MonthlyData[];
}

interface MonthlyData {
  id?: string;
  doctor_id?: string;
  month: string;
  year: number;
  total_patient?: number;
  total_lab?: number;
  lp_ratio?: number;
  rlu_score?: number;
  cpg_mismatch_percentage?: number;
  duplicate_order_rate?: number;
  estimated_cost?: number;
  cost_savings?: number;
  cp_ratio?: number;
  test_reduction?: number;
  patients_count?: number;
  total_tests?: number;
  duplicate_tests?: number;
  cpg_mismatch?: number;
}


const getStatusColor = (status: string) => {
  switch (status) {
    case "excellent":
      return "bg-success text-success-foreground";
    case "good":
      return "bg-primary text-primary-foreground";
    case "needs_improvement":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "excellent":
      return "Excellent";
    case "good":
      return "Good";
    case "needs_improvement":
      return "Needs Improvement";
    default:
      return "Unknown";
  }
};

const getScoreBadgeVariant = (score: number) => {
  if (score >= 90) return "default";
  if (score >= 80) return "secondary";
  return "destructive";
};

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-success";
  if (score >= 80) return "text-warning";
  return "text-destructive";
};

export const Doctors = () => {
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const isJudge = hasRole('judge');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("January");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [doctorsData, setDoctorsData] = useState<Doctor[]>([]);
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [isEditDoctorOpen, setIsEditDoctorOpen] = useState(false);
  const [isAddDataOpen, setIsAddDataOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  
  // New doctor form
  const [newDoctor, setNewDoctor] = useState({
    name: "",
    specialty: "",
    department: "",
  });
  
  // Monthly data form
  const [monthlyData, setMonthlyData] = useState({
    month: "",
    year: "",
    totalPatient: "",
    totalLab: "",
    lpRatio: "",
    rluScore: "",
    cpgMismatchPercentage: "",
    duplicateOrderRate: "",
    estimatedCost: "",
    costSavings: "",
    cpRatio: "",
  });

  // Load doctors and their monthly data from Google Sheets or Supabase
  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      
      // Check if Google Sheets is configured
      const savedSheetId = localStorage.getItem('googleSheetId');
      let doctors, monthlyData;
      
      if (savedSheetId) {
        // Use Google Sheets data
        const { googleSheetsService } = await import('@/services/googleSheetsService');
        doctors = await googleSheetsService.getDoctors();
        monthlyData = await googleSheetsService.getMonthlyData();
      } else {
        // Fallback to Supabase
        const { data: doctorsData, error: doctorsError } = await supabase
          .from('doctors')
          .select('*')
          .order('name');

        if (doctorsError) throw doctorsError;

        const { data: monthlyDataResult, error: monthlyError } = await supabase
          .from('doctor_monthly_data')
          .select('*')
          .order('month');

        if (monthlyError) throw monthlyError;
        
        doctors = doctorsData;
        monthlyData = monthlyDataResult;
      }

      // Combine doctors with their monthly data
      const doctorsWithData = doctors.map(doctor => ({
        ...doctor,
        monthlyData: monthlyData
          .filter(data => data.doctor_id === doctor.id)
          .map(data => ({
            month: data.month,
            year: data.year,
            total_patient: data.total_patient || 0,
            total_lab: data.total_lab || 0,
            lp_ratio: data.lp_ratio || 0,
            rlu_score: data.rlu_score || 0,
            cpg_mismatch_percentage: data.cpg_mismatch_percentage || 0,
            duplicate_order_rate: data.duplicate_order_rate || 0,
            estimated_cost: data.estimated_cost || 0,
            cost_savings: data.cost_savings || 0,
            cp_ratio: data.cp_ratio || 0,
            test_reduction: data.test_reduction || 0,
            patients_count: data.patients_count || 0,
            total_tests: data.total_tests || 0,
            duplicate_tests: data.duplicate_tests || 0,
            cpg_mismatch: data.cpg_mismatch || 0,
          }))
      }));

      setDoctorsData(doctorsWithData);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load doctors data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate current performance based on selected month and year
  const getDoctorCurrentData = (doctor: Doctor) => {
    return doctor.monthlyData.find(data => 
      data.month === selectedMonth && data.year === parseInt(selectedYear)
    );
  };

  const getStatus = (score: number) => {
    if (score >= 90) return "excellent";
    if (score >= 75) return "good";
    return "needs_improvement";
  };

  const filteredDoctors = doctorsData.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || doctor.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = [...new Set(doctorsData.map(d => d.department))];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = ["2024", "2025"];

  // Add new doctor
  const handleAddDoctor = async () => {
    if (newDoctor.name && newDoctor.specialty && newDoctor.department) {
      try {
        const { data, error } = await supabase
          .from('doctors')
          .insert([newDoctor])
          .select()
          .single();

        if (error) throw error;

        // Add to local state with empty monthly data
        setDoctorsData(prev => [...prev, { ...data, monthlyData: [] }]);
        setNewDoctor({ name: "", specialty: "", department: "" });
        setIsAddDoctorOpen(false);
        
        toast({
          title: "Success",
          description: "Doctor added successfully",
        });
      } catch (error) {
        console.error('Error adding doctor:', error);
        toast({
          title: "Error",
          description: "Failed to add doctor",
          variant: "destructive",
        });
      }
    }
  };

  // Edit doctor
  const handleEditDoctor = async () => {
    if (editingDoctor && editingDoctor.name && editingDoctor.specialty && editingDoctor.department) {
      try {
        const { error } = await supabase
          .from('doctors')
          .update({
            name: editingDoctor.name,
            specialty: editingDoctor.specialty,
            department: editingDoctor.department,
          })
          .eq('id', editingDoctor.id);

        if (error) throw error;

        // Update local state
        setDoctorsData(prev => prev.map(doctor => 
          doctor.id === editingDoctor.id 
            ? { ...doctor, ...editingDoctor }
            : doctor
        ));
        
        setIsEditDoctorOpen(false);
        setEditingDoctor(null);
        
        toast({
          title: "Success",
          description: "Doctor updated successfully",
        });
      } catch (error) {
        console.error('Error updating doctor:', error);
        toast({
          title: "Error",
          description: "Failed to update doctor",
          variant: "destructive",
        });
      }
    }
  };

  // Delete doctor
  const handleDeleteDoctor = async (doctorId: string) => {
    try {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', doctorId);

      if (error) throw error;

      // Remove from local state
      setDoctorsData(prev => prev.filter(doctor => doctor.id !== doctorId));
      
      toast({
        title: "Success",
        description: "Doctor deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting doctor:', error);
      toast({
        title: "Error",
        description: "Failed to delete doctor",
        variant: "destructive",
      });
    }
  };

  // Add monthly data
  const handleAddMonthlyData = async () => {
    if (selectedDoctorId && monthlyData.month && monthlyData.year) {
      try {
        const newData = {
          doctor_id: selectedDoctorId,
          month: monthlyData.month,
          year: parseInt(monthlyData.year),
          total_patient: parseInt(monthlyData.totalPatient) || 0,
          total_lab: parseInt(monthlyData.totalLab) || 0,
          lp_ratio: parseFloat(monthlyData.lpRatio) || 0,
          rlu_score: parseFloat(monthlyData.rluScore) || 0,
          cpg_mismatch_percentage: parseFloat(monthlyData.cpgMismatchPercentage) || 0,
          duplicate_order_rate: parseFloat(monthlyData.duplicateOrderRate) || 0,
          estimated_cost: parseFloat(monthlyData.estimatedCost) || 0,
          cost_savings: parseFloat(monthlyData.costSavings) || 0,
          cp_ratio: parseFloat(monthlyData.cpRatio) || 0,
        };

        const { error } = await supabase
          .from('doctor_monthly_data')
          .upsert(newData, {
            onConflict: 'doctor_id,month,year'
          });

        if (error) throw error;

        // Update local state
        setDoctorsData(prev => prev.map(doctor => {
          if (doctor.id === selectedDoctorId) {
            const updatedMonthlyData = [...doctor.monthlyData];
            const existingIndex = updatedMonthlyData.findIndex(data => data.month === monthlyData.month);
            
            const formattedData = {
              month: newData.month,
              year: newData.year,
              total_patient: newData.total_patient,
              total_lab: newData.total_lab,
              lp_ratio: newData.lp_ratio,
              rlu_score: newData.rlu_score,
              cpg_mismatch_percentage: newData.cpg_mismatch_percentage,
              duplicate_order_rate: newData.duplicate_order_rate,
              estimated_cost: newData.estimated_cost,
              cost_savings: newData.cost_savings,
              cp_ratio: newData.cp_ratio,
            };
            
            if (existingIndex >= 0) {
              updatedMonthlyData[existingIndex] = formattedData;
            } else {
              updatedMonthlyData.push(formattedData);
            }
            
            return { ...doctor, monthlyData: updatedMonthlyData.sort((a, b) => a.month.localeCompare(b.month)) };
          }
          return doctor;
        }));
        
        setMonthlyData({
          month: "",
          year: "",
          totalPatient: "",
          totalLab: "",
          lpRatio: "",
          rluScore: "",
          cpgMismatchPercentage: "",
          duplicateOrderRate: "",
          estimatedCost: "",
          costSavings: "",
          cpRatio: "",
        });
        setIsAddDataOpen(false);
        
        toast({
          title: "Success",
          description: "Performance data added successfully",
        });
      } catch (error) {
        console.error('Error adding monthly data:', error);
        toast({
          title: "Error",
          description: "Failed to add performance data",
          variant: "destructive",
        });
      }
    }
  };

  // Filter doctors that have data for selected month and year
  const filteredDoctorsWithCurrentData = filteredDoctors
    .map(doctor => ({
      ...doctor,
      currentData: getDoctorCurrentData(doctor)
    }))
    .filter(doctor => doctor.currentData !== undefined);

  const totalDoctors = filteredDoctorsWithCurrentData.length;
  const topPerformers = filteredDoctorsWithCurrentData.filter(doctor => 
    (doctor.currentData!.rlu_score || 0) >= 90
  ).length;
  const averageRLU = totalDoctors > 0 
    ? filteredDoctorsWithCurrentData.reduce((sum, doctor) => sum + (doctor.currentData!.rlu_score || 0), 0) / totalDoctors 
    : 0;
  const totalEstimatedCost = filteredDoctorsWithCurrentData.reduce((sum, doctor) => 
    sum + (doctor.currentData!.estimated_cost || 0), 0
  );

  // Prepare chart data for comparison with 5 metrics - only for doctors with data
  const chartData = anonymizeChartData(
    filteredDoctorsWithCurrentData.map(doctor => {
      return {
        name: doctor.name.split(' ')[1] || doctor.name,
        rluScore: doctor.currentData!.rlu_score || 0,
        lpRatio: doctor.currentData!.lp_ratio || 0,
        cpRatio: doctor.currentData!.cp_ratio || 0,
        cpgMismatch: doctor.currentData!.cpg_mismatch_percentage || 0,
        duplicateOrderRate: doctor.currentData!.duplicate_order_rate || 0,
      };
    }),
    isJudge
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">Loading doctors data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" id="doctor-report-content" data-pdf-content>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Doctor Management</h1>
          <p className="text-muted-foreground">Monitor and analyze doctor performance in RLU implementation</p>
        </div>
        <PDFExport 
          title={`Doctor Performance Report - ${selectedMonth} ${selectedYear}`}
          targetElementId="doctor-report-content"
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
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
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
            <div className="p-2 bg-success/10 rounded-lg">
              <Award className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Top Performers</p>
              <p className="text-2xl font-bold">{topPerformers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg RLU Score</p>
              <p className="text-2xl font-bold">{Math.round(averageRLU)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Estimated Cost</p>
              <p className="text-2xl font-bold">฿{(totalEstimatedCost / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Comparison Chart */}
      {filteredDoctorsWithCurrentData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Doctor Performance Comparison - {selectedMonth} {selectedYear}
          </h3>
          <Tabs defaultValue="rlu" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="rlu">RLU Score</TabsTrigger>
              <TabsTrigger value="lpRatio">L/P Ratio</TabsTrigger>
              <TabsTrigger value="cpRatio">C/P Ratio</TabsTrigger>
              <TabsTrigger value="cpgMismatch">CPG Mismatch (%)</TabsTrigger>
              <TabsTrigger value="duplicateOrder">Duplicate Order (%)</TabsTrigger>
            </TabsList>
            <TabsContent value="rlu" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, "RLU Score"]} />
                  <Bar dataKey="rluScore" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="lpRatio" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, "L/P Ratio"]} />
                  <Bar dataKey="lpRatio" fill="hsl(var(--success))" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="cpRatio" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, "C/P Ratio"]} />
                  <Bar dataKey="cpRatio" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="cpgMismatch" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, "CPG Mismatch"]} />
                  <Bar dataKey="cpgMismatch" fill="hsl(var(--warning))" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="duplicateOrder" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, "Duplicate Order Rate"]} />
                  <Bar dataKey="duplicateOrderRate" fill="hsl(var(--destructive))" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Doctors List - Only show doctors with data for selected month/year */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDoctorsWithCurrentData.map((doctor) => {
          const currentData = doctor.currentData!;
          const status = getStatus(currentData.rlu_score || 0);
          
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
                <div className="flex items-center gap-2">
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
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Patient</span>
                  <span className="font-semibold text-foreground">{currentData.total_patient || 0}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Lab</span>
                  <span className="font-semibold text-foreground">{currentData.total_lab || 0}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">L/P Ratio</span>
                  <span className="font-semibold text-primary">{currentData.lp_ratio || 0}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">RLU Score</span>
                  <span className="font-semibold text-foreground">{currentData.rlu_score || 0}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">CPG Mismatch (%)</span>
                  <span className="font-semibold text-warning">{currentData.cpg_mismatch_percentage || 0}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Duplicate Order Rate (%)</span>
                  <span className="font-semibold text-destructive">{currentData.duplicate_order_rate || 0}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Estimated Cost</span>
                  <span className="font-semibold text-foreground">฿{((currentData.estimated_cost || 0) / 1000).toFixed(0)}K</span>
                </div>


                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">C/P Ratio</span>
                  <span className="font-semibold text-primary">{currentData.cp_ratio || 0}</span>
                </div>

                <div className="pt-2 border-t">
                  <Badge className={getStatusColor(status)}>
                    {getStatusText(status)}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredDoctorsWithCurrentData.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No doctors found with data for {selectedMonth} {selectedYear}.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Please select a different month/year or add performance data for existing doctors.
          </p>
        </Card>
      )}
    </div>
  );
};