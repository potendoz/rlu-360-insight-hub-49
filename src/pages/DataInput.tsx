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
import { supabase } from "@/integrations/supabase/client";
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
  rlu_score: z.number().min(0).max(100),
  cpg_mismatch_percentage: z.number().min(0).max(100),
  duplicate_order_rate: z.number().min(0).max(100),
  estimated_cost: z.number().min(0),
  cp_ratio: z.number().min(0),
});

const mismatchDataSchema = z.object({
  doctor_id: z.string().min(1, "Doctor is required"),
  month: z.string().min(1, "Month is required"),
  year: z.number().min(2020).max(2030),
  total_mismatch: z.number().min(0).max(100),
  fbs_mismatch: z.number().min(0).max(100),
  hba1c_mismatch: z.number().min(0).max(100),
  ft3_mismatch: z.number().min(0).max(100),
  ft4_mismatch: z.number().min(0).max(100),
  aptt_mismatch: z.number().min(0).max(100),
  lft_mismatch: z.number().min(0).max(100),
  lipid_profile_mismatch: z.number().min(0).max(100),
});

const mismatchAnalysisSchema = z.object({
  doctor_id: z.string().min(1, "Doctor is required"),
  month: z.string().min(1, "Month is required"),
  year: z.number().min(2020).max(2030),
  fbs_top_mismatch: z.string().optional(),
  fbs_count: z.number().min(0),
  fbs_breakdown: z.string().optional(),
  hba1c_top_mismatch: z.string().optional(),
  hba1c_count: z.number().min(0),
  hba1c_breakdown: z.string().optional(),
  ft3_top_mismatch: z.string().optional(),
  ft3_count: z.number().min(0),
  ft3_breakdown: z.string().optional(),
  ft4_top_mismatch: z.string().optional(),
  ft4_count: z.number().min(0),
  ft4_breakdown: z.string().optional(),
  aptt_top_mismatch: z.string().optional(),
  aptt_count: z.number().min(0),
  aptt_breakdown: z.string().optional(),
  lft_top_mismatch: z.string().optional(),
  lft_count: z.number().min(0),
  lft_breakdown: z.string().optional(),
  lipid_profile_top_mismatch: z.string().optional(),
  lipid_profile_count: z.number().min(0),
  lipid_profile_breakdown: z.string().optional(),
});

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const DataInput = () => {
  const [activeTab, setActiveTab] = useState("settings");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [existingData, setExistingData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [sheetId, setSheetId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [sheetData, setSheetData] = useState<any>({});
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
      total_mismatch: 0,
      fbs_mismatch: 0,
      hba1c_mismatch: 0,
      ft3_mismatch: 0,
      ft4_mismatch: 0,
      aptt_mismatch: 0,
      lft_mismatch: 0,
      lipid_profile_mismatch: 0,
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

  // Load all data
  const loadDoctors = async () => {
    try {
      const { data, error } = await supabase.from("doctors").select("*");
      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error("Error loading doctors:", error);
    }
  };

  const loadExistingData = async () => {
    setRefreshing(true);
    try {
      console.log("Starting to load existing data...");
      
      const [doctorsRes, monthlyRes, mismatchRes, analysisRes] = await Promise.all([
        supabase.from("doctors").select("*").order("created_at", { ascending: false }),
        supabase.from("doctor_monthly_data").select("*").order("created_at", { ascending: false }),
        supabase.from("mismatch_data").select("*").order("created_at", { ascending: false }),
        supabase.from("mismatch_analysis").select("*").order("created_at", { ascending: false })
      ]);

      console.log("Raw monthly data response:", monthlyRes);
      console.log("Monthly data from DB:", monthlyRes.data);
      console.log("Monthly data error:", monthlyRes.error);
      console.log("Monthly data count:", monthlyRes.count);
      
      if (monthlyRes.error) {
        console.error("Monthly data error details:", monthlyRes.error);
      }
      if (mismatchRes.error) {
        console.error("Mismatch data error:", mismatchRes.error);
      }
      if (analysisRes.error) {
        console.error("Analysis data error:", analysisRes.error);
      }
      
      // Get doctor names separately for all data types
      const monthlyDataWithDoctors = await Promise.all(
        (monthlyRes.data || []).map(async (record) => {
          const { data: doctor } = await supabase
            .from("doctors")
            .select("name")
            .eq("id", record.doctor_id)
            .single();
          return {
            ...record,
            doctor_name: doctor?.name || "Unknown Doctor"
          };
        })
      );

      const mismatchDataWithDoctors = await Promise.all(
        (mismatchRes.data || []).map(async (record) => {
          const { data: doctor } = await supabase
            .from("doctors")
            .select("name")
            .eq("id", record.doctor_id)
            .single();
          return {
            ...record,
            doctor_name: doctor?.name || "Unknown Doctor"
          };
        })
      );

      const analysisDataWithDoctors = await Promise.all(
        (analysisRes.data || []).map(async (record) => {
          const { data: doctor } = await supabase
            .from("doctors")
            .select("name")
            .eq("id", record.doctor_id)
            .single();
          return {
            ...record,
            doctor_name: doctor?.name || "Unknown Doctor"
          };
        })
      );
      
      setExistingData({
        doctors: doctorsRes.data || [],
        monthly: monthlyDataWithDoctors || [],
        mismatch: mismatchDataWithDoctors || [],
        analysis: analysisDataWithDoctors || []
      });
      
      console.log("Updated existingData state with monthly:", monthlyDataWithDoctors);
      console.log("Updated existingData state with mismatch:", mismatchDataWithDoctors);
      console.log("Updated existingData state with analysis:", analysisDataWithDoctors);
    } catch (error) {
      console.error("Error loading existing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const deleteRecord = async (table: string, id: string) => {
    try {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Record deleted successfully!",
      });
      
      loadExistingData();
      loadDoctors();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      });
    }
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
    loadDoctors();
    loadExistingData();
  }, []);

  // Submit handlers
  const onSubmitDoctor = async (data: any) => {
    setIsLoading(true);
    try {
      if (isConnected) {
        // Add to Google Sheets
        const rowData = [data.name, data.department, data.specialty, data.avatar_url || ''];
        await addToGoogleSheets('Doctors', rowData);
        toast({ title: "Success", description: "Doctor added to Google Sheets successfully!" });
      } else {
        // Fallback to Supabase
        if (editingRecord && editingRecord.table === "doctors") {
          const { error } = await supabase.from("doctors").update(data).eq("id", editingRecord.id);
          if (error) throw error;
          toast({ title: "Success", description: "Doctor updated successfully!" });
        } else {
          const { error } = await supabase.from("doctors").insert([data]);
          if (error) throw error;
          toast({ title: "Success", description: "Doctor added successfully!" });
        }
        loadDoctors();
        loadExistingData();
      }
      
      doctorForm.reset();
      setEditingRecord(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save doctor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitMonthlyData = async (data: any) => {
    setIsLoading(true);
    try {
      if (isConnected) {
        // Add to Google Sheets
        const doctor = doctors.find(d => d.id === data.doctor_id);
        const rowData = [
          data.doctor_id,
          doctor?.name || '',
          data.month,
          data.year,
          data.total_patient,
          data.total_lab,
          data.lp_ratio,
          data.rlu_score,
          data.cpg_mismatch_percentage,
          data.duplicate_order_rate,
          data.estimated_cost,
          data.cp_ratio
        ];
        await addToGoogleSheets('MonthlyData', rowData);
        toast({ title: "Success", description: "Monthly data added to Google Sheets successfully!" });
      } else {
        // Fallback to Supabase
        if (editingRecord && editingRecord.table === "doctor_monthly_data") {
          const { error } = await supabase.from("doctor_monthly_data").update(data).eq("id", editingRecord.id);
          if (error) throw error;
          toast({ title: "Success", description: "Monthly data updated successfully!" });
        } else {
          const { error } = await supabase.from("doctor_monthly_data").insert([data]);
          if (error) throw error;
          toast({ title: "Success", description: "Monthly data added successfully!" });
        }
        loadExistingData();
      }
      
      monthlyDataForm.reset();
      setEditingRecord(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save monthly data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitMismatchData = async (data: any) => {
    setIsLoading(true);
    try {
      console.log("Submitting mismatch data:", data);
      if (editingRecord && editingRecord.table === "mismatch_data") {
        const { error } = await supabase.from("mismatch_data").update(data).eq("id", editingRecord.id);
        if (error) throw error;
        toast({ title: "Success", description: "Mismatch data updated successfully!" });
      } else {
        const { data: insertResult, error } = await supabase.from("mismatch_data").insert([data]);
        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
        console.log("Insert successful:", insertResult);
        toast({ title: "Success", description: "Mismatch data added successfully!" });
      }
      
      mismatchDataForm.reset();
      setEditingRecord(null);
      console.log("About to reload existing data...");
      await loadExistingData();
      console.log("Existing data reloaded");
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: "Failed to save mismatch data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitMismatchAnalysis = async (data: any) => {
    setIsLoading(true);
    console.log("Submitting mismatch analysis:", data);
    try {
      if (editingRecord && editingRecord.table === "mismatch_analysis") {
        console.log("Updating existing record:", editingRecord.id);
        const { error } = await supabase.from("mismatch_analysis").update(data).eq("id", editingRecord.id);
        if (error) {
          console.error("Update error:", error);
          throw error;
        }
        toast({ title: "Success", description: "Mismatch analysis updated successfully!" });
      } else {
        console.log("Inserting new record");
        const { error, data: insertResult } = await supabase.from("mismatch_analysis").insert([data]);
        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
        console.log("Insert successful:", insertResult);
        toast({ title: "Success", description: "Mismatch analysis added successfully!" });
      }
      
      mismatchAnalysisForm.reset();
      setEditingRecord(null);
      await loadExistingData();
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Error",
        description: "Failed to save mismatch analysis: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sheets API functions
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
      // Save sheet ID to localStorage
      localStorage.setItem("googleSheetId", sheetId);
      setIsConnected(true);
      
      // Load data from Google Sheets
      await loadFromGoogleSheets();
      
      toast({
        title: "Success",
        description: "Connected to Google Sheets successfully!",
      });
    } catch (error) {
      console.error("Error connecting to Google Sheets:", error);
      toast({
        title: "Error",
        description: "Failed to connect to Google Sheets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromGoogleSheets = async () => {
    try {
      const storedSheetId = localStorage.getItem("googleSheetId");
      if (!storedSheetId) return;

      // Load different sheets (tabs) from the Google Sheet
      const sheets = ['Doctors', 'MonthlyData', 'MismatchData', 'MismatchAnalysis'];
      const sheetDataPromises = sheets.map(async (sheetName) => {
        const response = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${storedSheetId}/values/${sheetName}?key=${process.env.GOOGLE_SHEETS_API_KEY || 'YOUR_API_KEY'}`
        );
        
        if (response.ok) {
          const data = await response.json();
          return { [sheetName]: data.values || [] };
        }
        return { [sheetName]: [] };
      });

      const results = await Promise.all(sheetDataPromises);
      const combinedData = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      
      setSheetData(combinedData);
      processGoogleSheetsData(combinedData);
    } catch (error) {
      console.error("Error loading from Google Sheets:", error);
    }
  };

  const processGoogleSheetsData = (data: any) => {
    try {
      // Process doctors data
      const doctorsData = data.Doctors?.slice(1) || []; // Skip header row
      const processedDoctors = doctorsData.map((row: any[], index: number) => ({
        id: `sheet_${index}`,
        name: row[0] || '',
        department: row[1] || '',
        specialty: row[2] || '',
        avatar_url: row[3] || ''
      }));

      // Process monthly data
      const monthlyData = data.MonthlyData?.slice(1) || [];
      const processedMonthly = monthlyData.map((row: any[], index: number) => ({
        id: `sheet_monthly_${index}`,
        doctor_id: row[0] || '',
        doctor_name: row[1] || '',
        month: row[2] || '',
        year: parseInt(row[3]) || new Date().getFullYear(),
        total_patient: parseInt(row[4]) || 0,
        total_lab: parseInt(row[5]) || 0,
        lp_ratio: parseFloat(row[6]) || 0,
        rlu_score: parseFloat(row[7]) || 0,
        cpg_mismatch_percentage: parseFloat(row[8]) || 0,
        duplicate_order_rate: parseFloat(row[9]) || 0,
        estimated_cost: parseFloat(row[10]) || 0,
        cp_ratio: parseFloat(row[11]) || 0
      }));

      setDoctors(processedDoctors);
      setExistingData({
        doctors: processedDoctors,
        monthly: processedMonthly,
        mismatch: [],
        analysis: []
      });
    } catch (error) {
      console.error("Error processing Google Sheets data:", error);
    }
  };

  const addToGoogleSheets = async (sheetName: string, rowData: any[]) => {
    try {
      const storedSheetId = localStorage.getItem("googleSheetId");
      if (!storedSheetId) return;

      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${storedSheetId}/values/${sheetName}:append?valueInputOption=RAW&key=${process.env.GOOGLE_SHEETS_API_KEY || 'YOUR_API_KEY'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [rowData]
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add data to Google Sheets');
      }

      await loadFromGoogleSheets(); // Refresh data
    } catch (error) {
      console.error("Error adding to Google Sheets:", error);
      throw error;
    }
  };

  // Load sheet ID from localStorage on component mount
  useEffect(() => {
    const storedSheetId = localStorage.getItem("googleSheetId");
    if (storedSheetId) {
      setSheetId(storedSheetId);
      setIsConnected(true);
      loadFromGoogleSheets();
    }
  }, []);

  const quickActions = [
    {
      title: "Google Sheets Settings",
      description: "Connect to your Google Sheet",
      icon: Settings,
      tab: "settings"
    },
    {
      title: "Add Doctor",
      description: "Add new physician to the system",
      icon: UserPlus,
      tab: "doctors"
    },
    {
      title: "Monthly Data",
      description: "Input monthly performance metrics",
      icon: BarChart3,
      tab: "monthly"
    },
    {
      title: "Mismatch Data",
      description: "Lab test mismatch percentages",
      icon: AlertTriangle,
      tab: "mismatch"
    },
    {
      title: "Mismatch Analysis",
      description: "Detailed breakdown analysis",
      icon: TrendingUp,
      tab: "analysis"
    }
  ];

  const getDataCount = (dataType: string) => {
    return existingData[dataType]?.length || 0;
  };

  const renderDataTable = (dataType: string, data: any[], tableName: string) => {
    if (!data || data.length === 0) {
      return (
        <Card className="p-8 text-center border-2 border-dashed border-muted-foreground/25">
          <Database className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No {dataType} data found.</p>
          <p className="text-sm text-muted-foreground/75 mt-1">
            Add some data using the form to see it here.
          </p>
        </Card>
      );
    }

    const getTableHeaders = () => {
      switch (dataType) {
        case "doctors":
          return ["Name", "Department", "Specialty", "Created", "Actions"];
        case "monthly":
          return ["Doctor", "Month/Year", "Total Patients", "RLU Score", "Cost", "Actions"];
        case "mismatch":
          return ["Doctor", "Month/Year", "Total Mismatch", "FBS", "HbA1C", "Actions"];
        case "analysis":
          return ["Doctor", "Month/Year", "FBS Analysis", "HbA1C Analysis", "Actions"];
        default:
          return ["ID", "Created", "Actions"];
      }
    };

    const renderTableRow = (item: any) => {
      switch (dataType) {
        case "doctors":
          return (
            <>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.department}</TableCell>
              <TableCell>{item.specialty}</TableCell>
              <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editRecord(item, "doctors")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteRecord("doctors", item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </>
          );
        case "monthly":
          return (
            <>
              <TableCell className="font-medium">
                {item.doctor_name || "Unknown Doctor"}
              </TableCell>
              <TableCell>{item.month} {item.year}</TableCell>
              <TableCell>{item.total_patient || 0}</TableCell>
              <TableCell>
                <Badge variant="secondary">{item.rlu_score}%</Badge>
              </TableCell>
              <TableCell>${item.estimated_cost?.toLocaleString() || 0}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editRecord(item, "doctor_monthly_data")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteRecord("doctor_monthly_data", item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </>
          );
        case "mismatch":
          return (
            <>
              <TableCell className="font-medium">
                {item.doctor_name || "Unknown Doctor"}
              </TableCell>
              <TableCell>{item.month} {item.year}</TableCell>
              <TableCell>
                <Badge variant="destructive">{item.total_mismatch}%</Badge>
              </TableCell>
              <TableCell>{item.fbs_mismatch}%</TableCell>
              <TableCell>{item.hba1c_mismatch}%</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editRecord(item, "mismatch_data")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteRecord("mismatch_data", item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </>
          );
        case "analysis":
          return (
            <>
              <TableCell className="font-medium">
                {item.doctor_name || "Unknown Doctor"}
              </TableCell>
              <TableCell>{item.month} {item.year}</TableCell>
              <TableCell className="max-w-xs truncate">
                {item.fbs_top_mismatch} ({item.fbs_count})
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {item.hba1c_top_mismatch} ({item.hba1c_count})
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => editRecord(item, "mismatch_analysis")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteRecord("mismatch_analysis", item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </>
          );
        default:
          return (
            <>
              <TableCell>{item.id}</TableCell>
              <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteRecord(tableName, item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </>
          );
      }
    };

    return (
      <Card className="overflow-hidden shadow-sm border border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              {getTableHeaders().map((header, index) => (
                <TableHead key={index} className="font-semibold text-foreground">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                {renderTableRow(item)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  };

  console.log("Current active tab:", activeTab);
  console.log("Existing data:", existingData);
  console.log("Doctors:", doctors);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Data Management Center
            </h1>
            <p className="text-lg text-muted-foreground">
              Comprehensive data input and management system for healthcare metrics
            </p>
          </div>
          <Button 
            onClick={loadExistingData} 
            disabled={refreshing}
            variant="outline"
            size="lg"
            className="shadow-sm"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Quick Actions */}
        <Card className="p-8 shadow-lg border-2 border-primary/10 bg-gradient-to-r from-card to-card/90">
          <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} 
                    className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-primary/20 bg-gradient-to-br from-card to-muted/10"
                    onClick={() => setActiveTab(action.tab)}>
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full group-hover:scale-110 transition-transform duration-300">
                    <action.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-foreground">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                    <Button size="sm" variant="outline" className="mt-3 w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Data
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Data Overview Statistics */}
        <Card className="p-8 shadow-lg bg-gradient-to-r from-card via-card to-muted/10">
          <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Data Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg">
              <p className="text-3xl font-bold text-primary">{getDataCount('doctors')}</p>
              <p className="text-sm font-medium text-muted-foreground">Doctors</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{getDataCount('monthly')}</p>
              <p className="text-sm font-medium text-muted-foreground">Monthly Records</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-500/5 to-orange-500/10 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">{getDataCount('mismatch')}</p>
              <p className="text-sm font-medium text-muted-foreground">Mismatch Records</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{getDataCount('analysis')}</p>
              <p className="text-sm font-medium text-muted-foreground">Analysis Records</p>
            </div>
          </div>
        </Card>

        {/* Data Input Forms and Management */}
        <div className="space-y-6">
          <Card className="p-6 shadow-lg">
            <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">Data Categories:</span>
              </div>
            </div>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-muted/30 h-12">
              <TabsTrigger value="settings" className="flex items-center gap-2 h-10">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="doctors" className="flex items-center gap-2 h-10">
                <UserPlus className="h-4 w-4" />
                Doctors
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center gap-2 h-10">
                <BarChart3 className="h-4 w-4" />
                Monthly
              </TabsTrigger>
              <TabsTrigger value="mismatch" className="flex items-center gap-2 h-10">
                <AlertTriangle className="h-4 w-4" />
                Mismatch
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2 h-10">
                <TrendingUp className="h-4 w-4" />
                Analysis
              </TabsTrigger>
            </TabsList>

          {/* Google Sheets Settings */}
          <TabsContent value="settings" className="space-y-8">
            <Card className="p-8 shadow-lg border-2 border-primary/10">
              <div className="flex items-center gap-3 mb-6">
                <Link2 className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Google Sheets Connection</h2>
              </div>
              
              {isConnected ? (
                <div className="space-y-6">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <Link2 className="h-5 w-5" />
                      <span className="font-medium">Connected to Google Sheets</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">Sheet ID: {sheetId}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Sheet Structure Required:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-primary mb-2">Doctors Sheet</h4>
                        <p className="text-sm text-muted-foreground">Columns: Name, Department, Specialty, Avatar URL</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-primary mb-2">MonthlyData Sheet</h4>
                        <p className="text-sm text-muted-foreground">Columns: Doctor ID, Doctor Name, Month, Year, Total Patient, Total Lab, LP Ratio, RLU Score, CPG Mismatch %, Duplicate Order Rate, Estimated Cost, CP Ratio</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-primary mb-2">MismatchData Sheet</h4>
                        <p className="text-sm text-muted-foreground">Columns: Doctor ID, Month, Year, Total Mismatch, FBS, HbA1c, FT3, FT4, APTT, LFT, Lipid Profile</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium text-primary mb-2">MismatchAnalysis Sheet</h4>
                        <p className="text-sm text-muted-foreground">Columns: Doctor ID, Month, Year, Analysis data...</p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => {
                      setIsConnected(false);
                      setSheetId("");
                      localStorage.removeItem("googleSheetId");
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="space-y-4">
                     <div>
                       <Label htmlFor="sheetId" className="text-sm font-medium">
                         Google Sheet ID
                       </Label>
                       <Input
                         id="sheetId"
                         placeholder="Enter your Google Sheet ID"
                         value={sheetId}
                         onChange={(e) => setSheetId(e.target.value)}
                         className="mt-2"
                       />
                       <p className="text-xs text-muted-foreground mt-1">
                         You can find the Sheet ID in the URL of your Google Sheet between /d/ and /edit
                       </p>
                     </div>
                     
                     <div>
                       <Label htmlFor="apiKey" className="text-sm font-medium">
                         Google Sheets API Key
                       </Label>
                       <Input
                         id="apiKey"
                         type="password"
                         placeholder="Enter your Google Sheets API Key"
                         className="mt-2"
                         onChange={(e) => {
                           if (e.target.value) {
                             localStorage.setItem('googleSheetsApiKey', e.target.value);
                           }
                         }}
                       />
                       <p className="text-xs text-muted-foreground mt-1">
                         Get your API key from Google Cloud Console with Sheets API enabled
                       </p>
                     </div>
                   </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Setup Instructions:</h4>
                    <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                      <li>Create a Google Sheet with the required tabs: Doctors, MonthlyData, MismatchData, MismatchAnalysis</li>
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
              )}
            </Card>

            {isConnected && (
              <Card className="p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Sheet Data Preview</h3>
                
                {/* Doctors Sheet Preview */}
                <div className="mb-6">
                  <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" />
                    Doctors ({sheetData.Doctors?.length - 1 || 0} records)
                  </h4>
                  {sheetData.Doctors && sheetData.Doctors.length > 1 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead>Name</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Specialty</TableHead>
                            <TableHead>Avatar URL</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sheetData.Doctors.slice(1, 6).map((row: any[], index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{row[0] || '-'}</TableCell>
                              <TableCell>{row[1] || '-'}</TableCell>
                              <TableCell>{row[2] || '-'}</TableCell>
                              <TableCell className="max-w-xs truncate">{row[3] || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {sheetData.Doctors.length > 6 && (
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                          Showing first 5 records. Total: {sheetData.Doctors.length - 1} records
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground p-4 text-center bg-muted/20 rounded-lg">
                      No doctors data found in the sheet
                    </p>
                  )}
                </div>

                {/* Monthly Data Sheet Preview */}
                <div className="mb-6">
                  <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    Monthly Data ({sheetData.MonthlyData?.length - 1 || 0} records)
                  </h4>
                  {sheetData.MonthlyData && sheetData.MonthlyData.length > 1 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead>Doctor ID</TableHead>
                            <TableHead>Doctor Name</TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Total Patients</TableHead>
                            <TableHead>RLU Score</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sheetData.MonthlyData.slice(1, 6).map((row: any[], index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{row[0] || '-'}</TableCell>
                              <TableCell>{row[1] || '-'}</TableCell>
                              <TableCell>{row[2] || '-'}</TableCell>
                              <TableCell>{row[3] || '-'}</TableCell>
                              <TableCell>{row[4] || '-'}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{row[7] || 0}%</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {sheetData.MonthlyData.length > 6 && (
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                          Showing first 5 records. Total: {sheetData.MonthlyData.length - 1} records
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground p-4 text-center bg-muted/20 rounded-lg">
                      No monthly data found in the sheet
                    </p>
                  )}
                </div>

                {/* Mismatch Data Sheet Preview */}
                <div className="mb-6">
                  <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    Mismatch Data ({sheetData.MismatchData?.length - 1 || 0} records)
                  </h4>
                  {sheetData.MismatchData && sheetData.MismatchData.length > 1 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead>Doctor ID</TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Total Mismatch</TableHead>
                            <TableHead>FBS Mismatch</TableHead>
                            <TableHead>HbA1C Mismatch</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sheetData.MismatchData.slice(1, 6).map((row: any[], index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{row[0] || '-'}</TableCell>
                              <TableCell>{row[1] || '-'}</TableCell>
                              <TableCell>{row[2] || '-'}</TableCell>
                              <TableCell>
                                <Badge variant="destructive">{row[3] || 0}%</Badge>
                              </TableCell>
                              <TableCell>{row[4] || 0}%</TableCell>
                              <TableCell>{row[5] || 0}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {sheetData.MismatchData.length > 6 && (
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                          Showing first 5 records. Total: {sheetData.MismatchData.length - 1} records
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground p-4 text-center bg-muted/20 rounded-lg">
                      No mismatch data found in the sheet
                    </p>
                  )}
                </div>

                {/* Mismatch Analysis Sheet Preview */}
                <div>
                  <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Mismatch Analysis ({sheetData.MismatchAnalysis?.length - 1 || 0} records)
                  </h4>
                  {sheetData.MismatchAnalysis && sheetData.MismatchAnalysis.length > 1 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead>Doctor ID</TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>FBS Top Mismatch</TableHead>
                            <TableHead>FBS Count</TableHead>
                            <TableHead>HbA1C Top Mismatch</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sheetData.MismatchAnalysis.slice(1, 6).map((row: any[], index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{row[0] || '-'}</TableCell>
                              <TableCell>{row[1] || '-'}</TableCell>
                              <TableCell>{row[2] || '-'}</TableCell>
                              <TableCell className="max-w-xs truncate">{row[3] || '-'}</TableCell>
                              <TableCell>{row[4] || 0}</TableCell>
                              <TableCell className="max-w-xs truncate">{row[6] || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {sheetData.MismatchAnalysis.length > 6 && (
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                          Showing first 5 records. Total: {sheetData.MismatchAnalysis.length - 1} records
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground p-4 text-center bg-muted/20 rounded-lg">
                      No analysis data found in the sheet
                    </p>
                  )}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Doctor Management */}
          <TabsContent value="doctors" className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Add/Edit Form */}
              <Card className="p-8 shadow-lg border-2 border-primary/10">
                <div className="flex items-center gap-3 mb-6">
                  <UserPlus className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">
                    {editingRecord?.table === "doctors" ? "Edit Doctor" : "Add New Doctor"}
                  </h2>
                </div>
                <Form {...doctorForm}>
                  <form onSubmit={doctorForm.handleSubmit(onSubmitDoctor)} className="space-y-6">
                    <FormField
                      control={doctorForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Doctor Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Dr. John Smith" {...field} className="h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={doctorForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Department</FormLabel>
                          <FormControl>
                            <Input placeholder="Cardiology" {...field} className="h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={doctorForm.control}
                      name="specialty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Specialty</FormLabel>
                          <FormControl>
                            <Input placeholder="Interventional Cardiology" {...field} className="h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={doctorForm.control}
                      name="avatar_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Avatar URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/avatar.jpg" {...field} className="h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-3">
                      <Button type="submit" disabled={isLoading} className="flex-1 h-12">
                        <Plus className="h-5 w-5 mr-2" />
                        {isLoading ? "Saving..." : editingRecord?.table === "doctors" ? "Update Doctor" : "Add Doctor"}
                      </Button>
                      {editingRecord?.table === "doctors" && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setEditingRecord(null);
                            doctorForm.reset();
                          }}
                          className="h-12"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </Card>

              {/* View Existing */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Existing Doctors ({getDataCount('doctors')})</h3>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </div>
                {renderDataTable('doctors', existingData.doctors || [], 'doctors')}
              </div>
            </div>
          </TabsContent>

          {/* Monthly Performance Data */}
          <TabsContent value="monthly" className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <Card className="p-8 shadow-lg border-2 border-blue-500/10">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold">
                    {editingRecord?.table === "doctor_monthly_data" ? "Edit Monthly Performance Data" : "Add Monthly Performance Data"}
                  </h2>
                </div>
                <Form {...monthlyDataForm}>
                  <form onSubmit={monthlyDataForm.handleSubmit(onSubmitMonthlyData)} className="space-y-6">
                    <FormField
                      control={monthlyDataForm.control}
                      name="doctor_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Doctor</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select doctor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {doctors.map((doctor) => (
                                <SelectItem key={doctor.id} value={doctor.id}>
                                  {doctor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={monthlyDataForm.control}
                        name="month"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Month</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select month" />
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
                        control={monthlyDataForm.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Year</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[2020, 2021, 2022, 2023, 2024, 2025].map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={monthlyDataForm.control}
                        name="total_patient"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Total Patient</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="150" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={monthlyDataForm.control}
                        name="total_lab"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Total Lab</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="300" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={monthlyDataForm.control}
                        name="lp_ratio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">L/P Ratio</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="2.0" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={monthlyDataForm.control}
                        name="rlu_score"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">RLU Score</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="85" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={monthlyDataForm.control}
                        name="cpg_mismatch_percentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">CPG Mismatch (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="15" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={monthlyDataForm.control}
                        name="duplicate_order_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Duplicate Order Rate (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="8" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={monthlyDataForm.control}
                        name="estimated_cost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Estimated Cost</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="25000" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={monthlyDataForm.control}
                        name="cp_ratio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">C/P Ratio</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="166.67" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" disabled={isLoading} className="flex-1 h-12">
                        <Plus className="h-5 w-5 mr-2" />
                        {isLoading ? "Saving..." : editingRecord?.table === "doctor_monthly_data" ? "Update Data" : "Add Monthly Data"}
                      </Button>
                      {editingRecord?.table === "doctor_monthly_data" && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setEditingRecord(null);
                            monthlyDataForm.reset();
                          }}
                          className="h-12"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </Card>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Existing Monthly Data ({getDataCount('monthly')})</h3>
                </div>
                {renderDataTable('monthly', existingData.monthly || [], 'doctor_monthly_data')}
              </div>
            </div>
          </TabsContent>

          {/* Mismatch Data */}
          <TabsContent value="mismatch" className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <Card className="p-8 shadow-lg border-2 border-orange-500/10">
                <div className="flex items-center gap-3 mb-6">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                  <h2 className="text-2xl font-bold">
                    {editingRecord?.table === "mismatch_data" ? "Edit Mismatch Data" : "Add Mismatch Data"}
                  </h2>
                </div>
                <Form {...mismatchDataForm}>
                  <form onSubmit={mismatchDataForm.handleSubmit(onSubmitMismatchData)} className="space-y-6">
                    <FormField
                      control={mismatchDataForm.control}
                      name="doctor_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Doctor</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select doctor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {doctors.map((doctor) => (
                                <SelectItem key={doctor.id} value={doctor.id}>
                                  {doctor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={mismatchDataForm.control}
                        name="month"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Month</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select month" />
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
                        control={mismatchDataForm.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Year</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[2020, 2021, 2022, 2023, 2024, 2025].map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={mismatchDataForm.control}
                      name="total_mismatch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Total Mismatch (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="15" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="h-12"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={mismatchDataForm.control}
                        name="fbs_mismatch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">FBS MisMatch (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="12" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={mismatchDataForm.control}
                        name="hba1c_mismatch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">HbA1C MisMatch (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="8" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={mismatchDataForm.control}
                        name="ft3_mismatch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">FT3 MisMatch (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="5" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={mismatchDataForm.control}
                        name="ft4_mismatch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">FT4 MisMatch (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="7" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={mismatchDataForm.control}
                        name="aptt_mismatch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">APTT MisMatch (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="3" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={mismatchDataForm.control}
                        name="lft_mismatch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">LFT MisMatch (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="6" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={mismatchDataForm.control}
                        name="lipid_profile_mismatch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Lipid Profile MisMatch (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="4" 
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="h-12"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" disabled={isLoading} className="flex-1 h-12">
                        <Plus className="h-5 w-5 mr-2" />
                        {isLoading ? "Saving..." : editingRecord?.table === "mismatch_data" ? "Update Data" : "Add Mismatch Data"}
                      </Button>
                      {editingRecord?.table === "mismatch_data" && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setEditingRecord(null);
                            mismatchDataForm.reset();
                          }}
                          className="h-12"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </Card>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Existing Mismatch Data ({getDataCount('mismatch')})</h3>
                </div>
                {renderDataTable('mismatch', existingData.mismatch || [], 'mismatch_data')}
              </div>
            </div>
          </TabsContent>

          {/* Mismatch Analysis */}
          <TabsContent value="analysis" className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <Card className="p-8 shadow-lg border-2 border-green-500/10">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                  <h2 className="text-2xl font-bold">
                    {editingRecord?.table === "mismatch_analysis" ? "Edit Mismatch Analysis Data" : "Add Mismatch Analysis Data"}
                  </h2>
                </div>
                <Form {...mismatchAnalysisForm}>
                  <form onSubmit={mismatchAnalysisForm.handleSubmit(onSubmitMismatchAnalysis)} className="space-y-6">
                    <FormField
                      control={mismatchAnalysisForm.control}
                      name="doctor_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Doctor</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select doctor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {doctors.map((doctor) => (
                                <SelectItem key={doctor.id} value={doctor.id}>
                                  {doctor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={mismatchAnalysisForm.control}
                        name="month"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Month</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select month" />
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
                        control={mismatchAnalysisForm.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-semibold">Year</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[2020, 2021, 2022, 2023, 2024, 2025].map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* FBS Analysis */}
                    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                      <h4 className="font-semibold">FBS Analysis</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={mismatchAnalysisForm.control}
                          name="fbs_top_mismatch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Top MisMatch</FormLabel>
                              <FormControl>
                                <Input placeholder="Glucose level discrepancy" {...field} className="h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={mismatchAnalysisForm.control}
                          name="fbs_count"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Count</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="25" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  className="h-10"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={mismatchAnalysisForm.control}
                        name="fbs_breakdown"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Breakdown</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Detailed breakdown of FBS mismatches..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* HbA1C Analysis */}
                    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                      <h4 className="font-semibold">HbA1C Analysis</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={mismatchAnalysisForm.control}
                          name="hba1c_top_mismatch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Top MisMatch</FormLabel>
                              <FormControl>
                                <Input placeholder="Glycated hemoglobin variance" {...field} className="h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={mismatchAnalysisForm.control}
                          name="hba1c_count"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Count</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="18" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  className="h-10"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={mismatchAnalysisForm.control}
                        name="hba1c_breakdown"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Breakdown</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Detailed breakdown of HbA1C mismatches..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* FT3 Analysis */}
                    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                      <h4 className="font-semibold">FT3 Analysis</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={mismatchAnalysisForm.control}
                          name="ft3_top_mismatch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Top MisMatch</FormLabel>
                              <FormControl>
                                <Input placeholder="Free T3 level variance" {...field} className="h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={mismatchAnalysisForm.control}
                          name="ft3_count"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Count</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="12" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  className="h-10"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={mismatchAnalysisForm.control}
                        name="ft3_breakdown"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Breakdown</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Detailed breakdown of FT3 mismatches..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* FT4 Analysis */}
                    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                      <h4 className="font-semibold">FT4 Analysis</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={mismatchAnalysisForm.control}
                          name="ft4_top_mismatch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Top MisMatch</FormLabel>
                              <FormControl>
                                <Input placeholder="Free T4 level variance" {...field} className="h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={mismatchAnalysisForm.control}
                          name="ft4_count"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Count</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="15" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  className="h-10"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={mismatchAnalysisForm.control}
                        name="ft4_breakdown"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Breakdown</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Detailed breakdown of FT4 mismatches..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* APTT Analysis */}
                    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                      <h4 className="font-semibold">APTT Analysis</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={mismatchAnalysisForm.control}
                          name="aptt_top_mismatch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Top MisMatch</FormLabel>
                              <FormControl>
                                <Input placeholder="APTT time variance" {...field} className="h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={mismatchAnalysisForm.control}
                          name="aptt_count"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Count</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="8" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  className="h-10"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={mismatchAnalysisForm.control}
                        name="aptt_breakdown"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Breakdown</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Detailed breakdown of APTT mismatches..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* LFT Analysis */}
                    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                      <h4 className="font-semibold">LFT Analysis</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={mismatchAnalysisForm.control}
                          name="lft_top_mismatch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Top MisMatch</FormLabel>
                              <FormControl>
                                <Input placeholder="Liver function test variance" {...field} className="h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={mismatchAnalysisForm.control}
                          name="lft_count"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Count</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="20" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  className="h-10"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={mismatchAnalysisForm.control}
                        name="lft_breakdown"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Breakdown</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Detailed breakdown of LFT mismatches..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Lipid Profile Analysis */}
                    <div className="space-y-4 p-4 bg-muted/20 rounded-lg">
                      <h4 className="font-semibold">Lipid Profile Analysis</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={mismatchAnalysisForm.control}
                          name="lipid_profile_top_mismatch"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Top MisMatch</FormLabel>
                              <FormControl>
                                <Input placeholder="Lipid profile variance" {...field} className="h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={mismatchAnalysisForm.control}
                          name="lipid_profile_count"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Count</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="30" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  className="h-10"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={mismatchAnalysisForm.control}
                        name="lipid_profile_breakdown"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Breakdown</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Detailed breakdown of Lipid Profile mismatches..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button type="submit" disabled={isLoading} className="flex-1 h-12">
                        <Plus className="h-5 w-5 mr-2" />
                        {isLoading ? "Saving..." : editingRecord?.table === "mismatch_analysis" ? "Update Analysis" : "Add Analysis Data"}
                      </Button>
                      {editingRecord?.table === "mismatch_analysis" && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setEditingRecord(null);
                            mismatchAnalysisForm.reset();
                          }}
                          className="h-12"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </Card>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Existing Analysis Data ({getDataCount('analysis')})</h3>
                </div>
                {renderDataTable('analysis', existingData.analysis || [], 'mismatch_analysis')}
              </div>
            </div>
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};