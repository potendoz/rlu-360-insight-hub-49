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
import { DoctorCard } from "@/components/DoctorCard";
import { googleSheetsService } from "@/services/googleSheetsService";

export const Doctors = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [loading, setLoading] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      console.log("Fetching doctors from Google Sheets...");
      
      if (!googleSheetsService.isConfigured()) {
        console.log("Google Sheets not configured");
        setDoctors([]);
        setLoading(false);
        return;
      }

      // ดึงข้อมูลจาก Google Sheets
      const [doctorsData, monthlyData] = await Promise.all([
        googleSheetsService.getDoctors(),
        googleSheetsService.getMonthlyData()
      ]);

      console.log("Doctors from sheets:", doctorsData);
      console.log("Monthly data from sheets:", monthlyData);

      if (!doctorsData || doctorsData.length === 0) {
        console.log("No doctors data available");
        setDoctors([]);
        setLoading(false);
        return;
      }

      // รวมข้อมูลแพทย์กับข้อมูลประสิทธิภาพล่าสุด
      const doctorsWithPerformance = doctorsData.map(doctor => {
        // หาข้อมูลล่าสุดของแพทย์แต่ละคน
        const doctorMonthlyData = monthlyData.filter(data => data.doctor_id === doctor.id);
        const latestData = doctorMonthlyData.length > 0 ? 
          doctorMonthlyData.sort((a, b) => {
            const aDate = new Date(parseInt(a.year.toString()), new Date().getMonth());
            const bDate = new Date(parseInt(b.year.toString()), new Date().getMonth());
            return bDate.getTime() - aDate.getTime();
          })[0] : null;

        return {
          ...doctor,
          rlu_score: latestData?.rlu_score || 0,
          lp_ratio: latestData?.lp_ratio || 0,
          total_patient: latestData?.total_patient || 0,
          cpg_mismatch_percentage: latestData?.cpg_mismatch_percentage || 0,
          duplicate_order_rate: latestData?.duplicate_order_rate || 0,
          estimated_cost: latestData?.estimated_cost || 0,
          performance_data: latestData
        };
      });

      // เรียงลำดับตาม RLU Score
      const sortedDoctors = doctorsWithPerformance.sort((a, b) => b.rlu_score - a.rlu_score);

      console.log("Doctors with performance:", sortedDoctors);
      setDoctors(sortedDoctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Filter doctors based on search and filters
  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === "all" || doctor.department === selectedDepartment;
    const matchesSpecialty = selectedSpecialty === "all" || doctor.specialty === selectedSpecialty;
    
    return matchesSearch && matchesDepartment && matchesSpecialty;
  });

  // Get unique departments and specialties for filters
  const departments = [...new Set(doctors.map(d => d.department).filter(Boolean))];
  const specialties = [...new Set(doctors.map(d => d.specialty).filter(Boolean))];

  // Calculate statistics
  const totalDoctors = doctors.length;
  const avgRluScore = doctors.length > 0 ? 
    doctors.reduce((sum, d) => sum + (d.rlu_score || 0), 0) / doctors.length : 0;
  const topPerformers = doctors.filter(d => (d.rlu_score || 0) > 80).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Doctors Management</h1>
          <p className="text-muted-foreground">
            View and manage doctor profiles and performance metrics from Google Sheets
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={fetchDoctors} 
            disabled={loading} 
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <User className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{totalDoctors}</p>
              <p className="text-sm text-muted-foreground">Total Doctors</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{Math.round(avgRluScore * 100) / 100}</p>
              <p className="text-sm text-muted-foreground">Avg RLU Score</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Award className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{topPerformers}</p>
              <p className="text-sm text-muted-foreground">Top Performers</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{departments.length}</p>
              <p className="text-sm text-muted-foreground">Departments</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Doctors</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name, specialty, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="specialty">Specialty</Label>
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger>
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {specialties.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button 
              onClick={fetchDoctors} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? "Refreshing..." : "Refresh Data"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Doctors Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Doctors ({filteredDoctors.length})
          </h2>
          {googleSheetsService.isConfigured() && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Connected to Google Sheets
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading doctors data...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <Card className="p-8 text-center">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Doctors Found</h3>
            <p className="text-muted-foreground mb-4">
              {!googleSheetsService.isConfigured() 
                ? "Please configure Google Sheets connection in Data Input settings."
                : "No doctors match your current filters or no data available in Google Sheets."
              }
            </p>
            {!googleSheetsService.isConfigured() && (
              <Button onClick={() => window.location.href = '/data-input'}>
                Configure Google Sheets
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={{
                  id: doctor.id,
                  name: doctor.name || 'Unknown',
                  department: doctor.department || 'Unknown',
                  avatar: doctor.avatar_url || '',
                  score: doctor.rlu_score || 0,
                  cpgMismatch: doctor.cpg_mismatch_percentage || 0,
                  duplicateOrder: doctor.duplicate_order_rate || 0,
                  cpRatio: doctor.cp_ratio || 0,
                  specialization: doctor.specialty || 'Unknown',
                  lastReview: 'N/A'
                }}
                onViewDetails={(doctorId) => {
                  console.log('View details for doctor:', doctorId);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Information Card */}
      {googleSheetsService.isConfigured() && (
        <Card className="p-6 border-blue-200 bg-blue-50">
          <div className="flex items-start space-x-3">
            <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Google Sheets Integration</h4>
              <p className="text-blue-800 text-sm">
                This page displays real-time data from your connected Google Sheets. 
                To add or modify doctor information, please edit the Google Sheet directly. 
                Changes will be reflected here when you refresh the data.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Doctors;