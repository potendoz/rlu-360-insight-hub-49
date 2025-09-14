import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { googleSheetsService } from "@/services/googleSheetsService";
import { 
  Plus, 
  Database, 
  UserPlus, 
  BarChart3, 
  MessageSquare, 
  FileText, 
  TestTube,
  Building2,
  Stethoscope,
  Trash2,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  AlertTriangle,
  TrendingUp,
  Link2,
  Settings
} from "lucide-react";

// Schema definitions for each data type
const doctorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  department: z.string().min(1, "Department is required"),
  specialty: z.string().min(1, "Specialty is required"),
  avatar_url: z.string().optional(),
});

const monthlyDataSchema = z.object({
  doctor_id: z.string().min(1, "Doctor is required"),
  month: z.string().min(1, "Month is required"),
  year: z.number().min(2020).max(2030),
  total_patient: z.number().min(0),
  total_lab: z.number().min(0),
  lp_ratio: z.number().min(0),
  rlu_score: z.number().min(0),
  cpg_mismatch_percentage: z.number().min(0).max(100),
  duplicate_order_rate: z.number().min(0).max(100),
  estimated_cost: z.number().min(0),
  cp_ratio: z.number().min(0),
});

const mismatchDataSchema = z.object({
  doctor_id: z.string().min(1, "Doctor is required"),
  month: z.string().min(1, "Month is required"),
  year: z.number().min(2020).max(2030),
  original_cpt: z.string().min(1, "Original CPT is required"),
  suggested_cpt: z.string().min(1, "Suggested CPT is required"),
  patient_id: z.string().min(1, "Patient ID is required"),
  status: z.string().default("pending"),
});

const mismatchAnalysisSchema = z.object({
  doctor_id: z.string().min(1, "Doctor is required"),
  month: z.string().min(1, "Month is required"),
  year: z.number().min(2020).max(2030),
  fbs_top_mismatch: z.string().optional(),
  fbs_count: z.number().min(0).default(0),
  fbs_breakdown: z.string().optional(),
  hba1c_top_mismatch: z.string().optional(),
  hba1c_count: z.number().min(0).default(0),
  hba1c_breakdown: z.string().optional(),
  ft3_top_mismatch: z.string().optional(),
  ft3_count: z.number().min(0).default(0),
  ft3_breakdown: z.string().optional(),
  ft4_top_mismatch: z.string().optional(),
  ft4_count: z.number().min(0).default(0),
  ft4_breakdown: z.string().optional(),
  aptt_top_mismatch: z.string().optional(),
  aptt_count: z.number().min(0).default(0),
  aptt_breakdown: z.string().optional(),
  lft_top_mismatch: z.string().optional(),
  lft_count: z.number().min(0).default(0),
  lft_breakdown: z.string().optional(),
  lipid_profile_top_mismatch: z.string().optional(),
  lipid_profile_count: z.number().min(0).default(0),
  lipid_profile_breakdown: z.string().optional(),
});

// Combined form schema for comprehensive data entry
const combinedDataSchema = z.object({
  // Doctor Information
  doctor: doctorSchema,
  // Monthly Data
  monthlyData: monthlyDataSchema.omit({ doctor_id: true }),
  // Mismatch Data
  mismatchData: mismatchDataSchema.omit({ doctor_id: true }),
  // Mismatch Analysis
  mismatchAnalysis: mismatchAnalysisSchema.omit({ doctor_id: true }),
});

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const DataInput = () => {
  const [activeTab, setActiveTab] = useState("add-data");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [existingData, setExistingData] = useState<any>({
    doctors: [],
    monthly: [],
    mismatch: [],
    analysis: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [sheetId, setSheetId] = useState("1tDAAMnE7P3QBcf15pbinGqEIX5HuOzlyD-w0-KVoc2A");
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // Form instances
  const doctorForm = useForm({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      department: "",
      specialty: "",
      avatar_url: "",
    },
  });

  const monthlyDataForm = useForm({
    resolver: zodResolver(monthlyDataSchema),
    defaultValues: {
      doctor_id: "",
      month: "",
      year: new Date().getFullYear(),
      total_patient: 0,
      total_lab: 0,
      lp_ratio: 0,
      rlu_score: 0,
      cpg_mismatch_percentage: 0,
      duplicate_order_rate: 0,
      estimated_cost: 0,
      cp_ratio: 0,
    },
  });

  const mismatchDataForm = useForm({
    resolver: zodResolver(mismatchDataSchema),
    defaultValues: {
      doctor_id: "",
      month: "",
      year: new Date().getFullYear(),
      original_cpt: "",
      suggested_cpt: "",
      patient_id: "",
      status: "pending",
    },
  });

  const mismatchAnalysisForm = useForm({
    resolver: zodResolver(mismatchAnalysisSchema),
    defaultValues: {
      doctor_id: "",
      month: "",
      year: new Date().getFullYear(),
      fbs_top_mismatch: "",
      fbs_count: 0,
      fbs_breakdown: "",
      hba1c_top_mismatch: "",
      hba1c_count: 0,
      hba1c_breakdown: "",
      ft3_top_mismatch: "",
      ft3_count: 0,
      ft3_breakdown: "",
      ft4_top_mismatch: "",
      ft4_count: 0,
      ft4_breakdown: "",
      aptt_top_mismatch: "",
      aptt_count: 0,
      aptt_breakdown: "",
      lft_top_mismatch: "",
      lft_count: 0,
      lft_breakdown: "",
      lipid_profile_top_mismatch: "",
      lipid_profile_count: 0,
      lipid_profile_breakdown: "",
    },
  });

  // Combined form for comprehensive data entry
  const combinedForm = useForm({
    resolver: zodResolver(combinedDataSchema),
    defaultValues: {
      doctor: {
        name: "",
        department: "",
        specialty: "",
        avatar_url: "",
      },
      monthlyData: {
        month: "",
        year: new Date().getFullYear(),
        total_patient: 0,
        total_lab: 0,
        lp_ratio: 0,
        rlu_score: 0,
        cpg_mismatch_percentage: 0,
        duplicate_order_rate: 0,
        estimated_cost: 0,
        cp_ratio: 0,
      },
      mismatchData: {
        month: "",
        year: new Date().getFullYear(),
        original_cpt: "",
        suggested_cpt: "",
        patient_id: "",
        status: "pending",
      },
      mismatchAnalysis: {
        month: "",
        year: new Date().getFullYear(),
        fbs_top_mismatch: "",
        fbs_count: 0,
        fbs_breakdown: "",
        hba1c_top_mismatch: "",
        hba1c_count: 0,
        hba1c_breakdown: "",
        ft3_top_mismatch: "",
        ft3_count: 0,
        ft3_breakdown: "",
        ft4_top_mismatch: "",
        ft4_count: 0,
        ft4_breakdown: "",
        aptt_top_mismatch: "",
        aptt_count: 0,
        aptt_breakdown: "",
        lft_top_mismatch: "",
        lft_count: 0,
        lft_breakdown: "",
        lipid_profile_top_mismatch: "",
        lipid_profile_count: 0,
        lipid_profile_breakdown: "",
      },
    },
  });

  // Load all data from Google Sheets only
  const loadExistingData = async () => {
    setRefreshing(true);
    try {
      console.log("Loading data from Google Sheets...");
      
      if (!googleSheetsService.isConfigured()) {
        console.log("Google Sheets not configured");
        setRefreshing(false);
        return;
      }

      const [doctors, monthly, mismatch, analysis] = await Promise.all([
        googleSheetsService.getDoctors(),
        googleSheetsService.getMonthlyData(),
        googleSheetsService.getMismatchData(),
        googleSheetsService.getMismatchAnalysis()
      ]);

      const data = {
        doctors: doctors || [],
        monthly: monthly || [],
        mismatch: mismatch || [],
        analysis: analysis || []
      };

      console.log("Loaded data from Google Sheets:", data);
      setExistingData(data);
      setDoctors(data.doctors);
    } catch (error) {
      console.error("Error loading data from Google Sheets:", error);
      toast({
        title: "Error",
        description: "Failed to load data from Google Sheets: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const deleteRecord = async (table: string, id: string) => {
    toast({
      title: "Not Available",
      description: "Delete function is not available for Google Sheets integration. Please edit the sheet directly.",
      variant: "destructive",
    });
  };

  const editRecord = (record: any, table: string) => {
    setEditingRecord({ ...record, table });
    
    switch (table) {
      case "doctors":
        doctorForm.reset(record);
        break;
      case "doctor_monthly_data":
        monthlyDataForm.reset(record);
        break;
      case "mismatch_data":
        mismatchDataForm.reset(record);
        break;
      case "mismatch_analysis":
        mismatchAnalysisForm.reset(record);
        break;
    }
  };

  useEffect(() => {
    loadExistingData();
  }, []);

  // Submit handlers - Google Sheets read-only
  const onSubmitDoctor = async (data: any) => {
    toast({
      title: "Read-Only Mode",
      description: "This app is now in read-only mode for Google Sheets. Please edit the Google Sheet directly to add or modify data.",
      variant: "destructive",
    });
  };

  const onSubmitMonthlyData = async (data: any) => {
    toast({
      title: "Read-Only Mode",
      description: "This app is now in read-only mode for Google Sheets. Please edit the Google Sheet directly to add or modify data.",
      variant: "destructive",
    });
  };

  const onSubmitMismatchData = async (data: any) => {
    toast({
      title: "Read-Only Mode",
      description: "This app is now in read-only mode for Google Sheets. Please edit the Google Sheet directly to add or modify data.",
      variant: "destructive",
    });
  };

  const onSubmitMismatchAnalysis = async (data: any) => {
    toast({
      title: "Read-Only Mode",
      description: "This app is now in read-only mode for Google Sheets. Please edit the Google Sheet directly to add or modify data.",
      variant: "destructive",
    });
  };

  // Combined form submit handler
  const onSubmitCombinedData = async (data: any) => {
    console.log("Combined Form Data:", data);
    
    // Generate CSV-ready format for easy copying to Google Sheets
    const csvData = generateCSVData(data);
    
    // Copy to clipboard for easy pasting
    try {
      await navigator.clipboard.writeText(csvData);
      toast({
        title: "Success!",
        description: "Data has been formatted and copied to clipboard. You can now paste it directly into your Google Sheet.",
      });
    } catch (error) {
      toast({
        title: "Form Data Ready",
        description: "Data has been formatted. Please manually copy the data shown below to your Google Sheet.",
      });
    }
    
    // Show formatted data for manual copying if clipboard fails
    console.log("CSV Data for Google Sheets:", csvData);
  };

  // Generate CSV-compatible data for Google Sheets
  const generateCSVData = (data: any) => {
    const { doctor, monthlyData, mismatchData, mismatchAnalysis } = data;
    
    const sections = [];
    
    // Doctor data
    sections.push("=== Doctor Information ===");
    sections.push(`Name,Department,Specialty,Avatar URL`);
    sections.push(`"${doctor.name}","${doctor.department}","${doctor.specialty}","${doctor.avatar_url || ''}"`);
    sections.push("");
    
    // Monthly data
    sections.push("=== Monthly Performance Data ===");
    sections.push(`Month,Year,Total Patients,Total Lab Orders,LP Ratio,RLU Score,CPG Mismatch %,Duplicate Order Rate %,Estimated Cost,CP Ratio`);
    sections.push(`"${monthlyData.month}",${monthlyData.year},${monthlyData.total_patient},${monthlyData.total_lab},${monthlyData.lp_ratio},${monthlyData.rlu_score},${monthlyData.cpg_mismatch_percentage},${monthlyData.duplicate_order_rate},${monthlyData.estimated_cost},${monthlyData.cp_ratio}`);
    sections.push("");
    
    // Mismatch data
    sections.push("=== Mismatch Data ===");
    sections.push(`Month,Year,Original CPT,Suggested CPT,Patient ID,Status`);
    sections.push(`"${mismatchData.month}",${mismatchData.year},"${mismatchData.original_cpt}","${mismatchData.suggested_cpt}","${mismatchData.patient_id}","${mismatchData.status}"`);
    sections.push("");
    
    // Analysis data
    sections.push("=== Mismatch Analysis ===");
    sections.push(`Month,Year,FBS Top Mismatch,FBS Count,FBS Breakdown,HbA1c Top Mismatch,HbA1c Count,HbA1c Breakdown,FT3 Top Mismatch,FT3 Count,FT3 Breakdown,FT4 Top Mismatch,FT4 Count,FT4 Breakdown,APTT Top Mismatch,APTT Count,APTT Breakdown,LFT Top Mismatch,LFT Count,LFT Breakdown,Lipid Profile Top Mismatch,Lipid Profile Count,Lipid Profile Breakdown`);
    sections.push(`"${mismatchAnalysis.month}",${mismatchAnalysis.year},"${mismatchAnalysis.fbs_top_mismatch || ''}",${mismatchAnalysis.fbs_count},"${mismatchAnalysis.fbs_breakdown || ''}","${mismatchAnalysis.hba1c_top_mismatch || ''}",${mismatchAnalysis.hba1c_count},"${mismatchAnalysis.hba1c_breakdown || ''}","${mismatchAnalysis.ft3_top_mismatch || ''}",${mismatchAnalysis.ft3_count},"${mismatchAnalysis.ft3_breakdown || ''}","${mismatchAnalysis.ft4_top_mismatch || ''}",${mismatchAnalysis.ft4_count},"${mismatchAnalysis.ft4_breakdown || ''}","${mismatchAnalysis.aptt_top_mismatch || ''}",${mismatchAnalysis.aptt_count},"${mismatchAnalysis.aptt_breakdown || ''}","${mismatchAnalysis.lft_top_mismatch || ''}",${mismatchAnalysis.lft_count},"${mismatchAnalysis.lft_breakdown || ''}","${mismatchAnalysis.lipid_profile_top_mismatch || ''}",${mismatchAnalysis.lipid_profile_count},"${mismatchAnalysis.lipid_profile_breakdown || ''}"`);
    
    return sections.join("\n");
  };

  // Google Sheets connection
  const connectToGoogleSheets = async () => {
    if (!sheetId) {
      toast({
        title: "Error",
        description: "Please enter a valid Google Sheet ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      googleSheetsService.setCredentials(sheetId);
      setIsConnected(true);
      
      await loadExistingData();
      
      toast({
        title: "Success",
        description: "Connected to Google Sheets successfully!",
      });
    } catch (error) {
      console.error("Error connecting to Google Sheets:", error);
      toast({
        title: "Error",
        description: "Failed to connect to Google Sheets: " + (error as Error).message,
        variant: "destructive",
      });
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Load sheet ID from localStorage on component mount
  useEffect(() => {
    const storedSheetId = localStorage.getItem("googleSheetId");
    
    if (storedSheetId) {
      setSheetId(storedSheetId);
      setIsConnected(true);
      loadExistingData();
    }
  }, []);

  const quickActions = [
    { id: "doctors", label: "Doctors", icon: Stethoscope, color: "bg-blue-500" },
    { id: "monthly", label: "Monthly Data", icon: BarChart3, color: "bg-green-500" },
    { id: "mismatch", label: "Mismatch Data", icon: AlertTriangle, color: "bg-orange-500" },
    { id: "analysis", label: "Analysis", icon: FileText, color: "bg-purple-500" },
  ];

  const getDataCount = (type: string) => {
    return existingData[type]?.length || 0;
  };

  const renderDataTable = (data: any[], type: string, title: string) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No {title.toLowerCase()} data found
        </div>
      );
    }

    const columns = Object.keys(data[0] || {});
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className="capitalize">
                  {column.replace(/_/g, " ")}
                </TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column}>
                    {typeof row[column] === 'string' && row[column].length > 50
                      ? `${row[column].substring(0, 50)}...`
                      : row[column]?.toString() || "-"
                    }
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editRecord(row, type)}
                      disabled
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Management</h1>
          <p className="text-muted-foreground">
            View and analyze healthcare data from Google Sheets (Read-Only Mode)
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Card 
            key={action.id} 
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab(action.id)}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${action.color} text-white`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{action.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {getDataCount(action.id)} records
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Data Overview */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Data Overview</h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={loadExistingData}
              disabled={refreshing || !isConnected}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <Stethoscope className="h-8 w-8 text-blue-500" />
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{getDataCount('doctors')}</p>
                <p className="text-sm text-blue-500">Doctors</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <BarChart3 className="h-8 w-8 text-green-500" />
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{getDataCount('monthly')}</p>
                <p className="text-sm text-green-500">Monthly Records</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">{getDataCount('mismatch')}</p>
                <p className="text-sm text-orange-500">Mismatches</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <FileText className="h-8 w-8 text-purple-500" />
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">{getDataCount('analysis')}</p>
                <p className="text-sm text-purple-500">Analyses</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="add-data">
            <Plus className="h-4 w-4 mr-2" />
            Add Data
          </TabsTrigger>
          <TabsTrigger value="doctors">
            <Stethoscope className="h-4 w-4 mr-2" />
            Doctors
          </TabsTrigger>
          <TabsTrigger value="monthly">
            <BarChart3 className="h-4 w-4 mr-2" />
            Monthly
          </TabsTrigger>
          <TabsTrigger value="mismatch">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Mismatch
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <FileText className="h-4 w-4 mr-2" />
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Link2 className="h-5 w-5 mr-2" />
              Google Sheets Connection
            </h3>
            
            {!isConnected ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="sheetId" className="text-sm font-medium">
                      Google Sheet ID
                    </Label>
                    <Input
                      id="sheetId"
                      placeholder="Enter Google Sheet ID"
                      value={sheetId}
                      onChange={(e) => setSheetId(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      You can find the Sheet ID in the URL of your Google Sheet between /d/ and /edit
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Setup Instructions:</h4>
                  <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                    <li>Create a Google Sheet with the required tabs: doctors, doctor_monthly_data, mismatch_data, mismatch_analysis</li>
                    <li>Make sure the sheet is publicly accessible (Anyone with the link can view)</li>
                    <li>Copy the Sheet ID from the URL and paste it above</li>
                    <li>Add the required column headers in each sheet</li>
                  </ol>
                </div>

                <Button 
                  onClick={connectToGoogleSheets}
                  disabled={isLoading || !sheetId}
                  className="w-full"
                >
                  {isLoading ? "Connecting..." : "Connect to Google Sheets"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-green-800 font-medium">Connected to Google Sheets</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">Sheet ID: {sheetId}</p>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Read-Only Mode</h4>
                  <p className="text-sm text-blue-700">
                    This application is now operating in read-only mode. To add or modify data, 
                    please edit the Google Sheet directly. Changes will be reflected here when you refresh.
                  </p>
                </div>

                <Button 
                  onClick={() => {
                    setIsConnected(false);
                    localStorage.removeItem("googleSheetId");
                    setExistingData({ doctors: [], monthly: [], mismatch: [], analysis: [] });
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Disconnect
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="add-data" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  เพิ่มข้อมูลครบถ้วน
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  กรอกข้อมูลครบถ้วนในฟอร์มเดียว สำหรับคัดลอกไปยัง Google Sheets
                </p>
              </div>
            </div>

            <Form {...combinedForm}>
              <form onSubmit={combinedForm.handleSubmit(onSubmitCombinedData)} className="space-y-8">
                
                {/* Doctor Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <Stethoscope className="h-5 w-5 text-blue-500" />
                    <h4 className="text-lg font-semibold text-blue-700">ข้อมูลแพทย์</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={combinedForm.control}
                      name="doctor.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ชื่อแพทย์</FormLabel>
                          <FormControl>
                            <Input placeholder="กรอกชื่อแพทย์" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={combinedForm.control}
                      name="doctor.department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>แผนก</FormLabel>
                          <FormControl>
                            <Input placeholder="เช่น Cardiology, Internal Medicine" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={combinedForm.control}
                      name="doctor.specialty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ความเชี่ยวชาญ</FormLabel>
                          <FormControl>
                            <Input placeholder="ความเชี่ยวชาญเฉพาะทาง" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={combinedForm.control}
                      name="doctor.avatar_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>รูปโปรไฟล์ (URL)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/photo.jpg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Monthly Data Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    <h4 className="text-lg font-semibold text-green-700">ข้อมูลผลงานรายเดือน</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={combinedForm.control}
                      name="monthlyData.month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>เดือน</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกเดือน" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {months.map((month) => (
                                <SelectItem key={month} value={month}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={combinedForm.control}
                      name="monthlyData.year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ปี</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="2024" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={combinedForm.control}
                      name="monthlyData.total_patient"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>จำนวนผู้ป่วย</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={combinedForm.control}
                      name="monthlyData.total_lab"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>จำนวนการสั่งแลป</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={combinedForm.control}
                      name="monthlyData.lp_ratio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>LP Ratio</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={combinedForm.control}
                      name="monthlyData.rlu_score"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RLU Score</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={combinedForm.control}
                      name="monthlyData.cpg_mismatch_percentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPG Mismatch (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={combinedForm.control}
                      name="monthlyData.duplicate_order_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duplicate Order Rate (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={combinedForm.control}
                      name="monthlyData.estimated_cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ต้นทุนโดยประมาณ (บาท)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Mismatch Data Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <h4 className="text-lg font-semibold text-orange-700">ข้อมูล CPT Mismatch</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={combinedForm.control}
                      name="mismatchData.month"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>เดือน</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกเดือน" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {months.map((month) => (
                                <SelectItem key={month} value={month}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={combinedForm.control}
                      name="mismatchData.year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ปี</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="2024" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={combinedForm.control}
                      name="mismatchData.patient_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient ID</FormLabel>
                          <FormControl>
                            <Input placeholder="รหัสผู้ป่วย" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={combinedForm.control}
                      name="mismatchData.original_cpt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPT เดิม</FormLabel>
                          <FormControl>
                            <Input placeholder="รหัส CPT เดิม" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={combinedForm.control}
                      name="mismatchData.suggested_cpt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPT ที่แนะนำ</FormLabel>
                          <FormControl>
                            <Input placeholder="รหัส CPT ที่แนะนำ" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={combinedForm.control}
                      name="mismatchData.status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>สถานะ</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกสถานะ" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">รอดำเนินการ</SelectItem>
                              <SelectItem value="approved">อนุมัติ</SelectItem>
                              <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Analysis Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <FileText className="h-5 w-5 text-purple-500" />
                    <h4 className="text-lg font-semibold text-purple-700">การวิเคราะห์ Mismatch</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* FBS Section */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-sm text-muted-foreground">FBS (Fasting Blood Sugar)</h5>
                      <div className="space-y-3">
                        <FormField
                          control={combinedForm.control}
                          name="mismatchAnalysis.fbs_top_mismatch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Top Mismatch</FormLabel>
                              <FormControl>
                                <Input placeholder="FBS top mismatch" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={combinedForm.control}
                          name="mismatchAnalysis.fbs_count"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>จำนวน</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={combinedForm.control}
                          name="mismatchAnalysis.fbs_breakdown"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>รายละเอียด</FormLabel>
                              <FormControl>
                                <Textarea placeholder="รายละเอียด FBS breakdown" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* HbA1c Section */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-sm text-muted-foreground">HbA1c</h5>
                      <div className="space-y-3">
                        <FormField
                          control={combinedForm.control}
                          name="mismatchAnalysis.hba1c_top_mismatch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Top Mismatch</FormLabel>
                              <FormControl>
                                <Input placeholder="HbA1c top mismatch" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={combinedForm.control}
                          name="mismatchAnalysis.hba1c_count"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>จำนวน</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={combinedForm.control}
                          name="mismatchAnalysis.hba1c_breakdown"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>รายละเอียด</FormLabel>
                              <FormControl>
                                <Textarea placeholder="รายละเอียด HbA1c breakdown" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Add similar sections for FT3, FT4, APTT, LFT, Lipid Profile */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-sm text-muted-foreground">FT3 (Free T3)</h5>
                      <div className="space-y-3">
                        <FormField
                          control={combinedForm.control}
                          name="mismatchAnalysis.ft3_top_mismatch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Top Mismatch</FormLabel>
                              <FormControl>
                                <Input placeholder="FT3 top mismatch" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={combinedForm.control}
                          name="mismatchAnalysis.ft3_count"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>จำนวน</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="font-medium text-sm text-muted-foreground">FT4 (Free T4)</h5>
                      <div className="space-y-3">
                        <FormField
                          control={combinedForm.control}
                          name="mismatchAnalysis.ft4_top_mismatch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Top Mismatch</FormLabel>
                              <FormControl>
                                <Input placeholder="FT4 top mismatch" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={combinedForm.control}
                          name="mismatchAnalysis.ft4_count"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>จำนวน</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="0" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button type="submit" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    สร้างข้อมูลสำหรับ Google Sheets
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    ข้อมูลจะถูกจัดรูปแบบและคัดลอกไปยัง clipboard สำหรับวางลงใน Google Sheets
                  </p>
                </div>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="doctors" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Doctors Data</h3>
            {renderDataTable(existingData.doctors, "doctors", "Doctors")}
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Performance Data</h3>
            {renderDataTable(existingData.monthly, "doctor_monthly_data", "Monthly Data")}
          </Card>
        </TabsContent>

        <TabsContent value="mismatch" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">CPT Mismatch Data</h3>
            {renderDataTable(existingData.mismatch, "mismatch_data", "Mismatch Data")}
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Mismatch Analysis</h3>
            {renderDataTable(existingData.analysis, "mismatch_analysis", "Analysis Data")}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataInput;