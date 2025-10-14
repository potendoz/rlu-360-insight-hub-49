import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KPIChart } from '@/components/charts/KPIChart';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { PDFExport } from '@/components/PDFExport';
import { anonymizeDoctorName } from '@/utils/pdpaUtils';
import { TrendingUp, User, BarChart3, TrendingDown, DollarSign, TestTube, Users, AlertTriangle, Search, Calendar } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  department: string;
}

interface MismatchData {
  id: string;
  doctor_id: string;
  month: string;  // Changed from number to string
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

export const PerformanceReport = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [mismatchData, setMismatchData] = useState<MismatchData[]>([]);
  const [analysisData, setAnalysisData] = useState<MismatchAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const isJudge = hasRole('judge');

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    const filtered = doctors.filter(doctor =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDoctors(filtered);
  }, [doctors, searchTerm]);

  useEffect(() => {
    if (selectedDoctor && selectedDoctor !== 'all') {
      loadMismatchData(selectedDoctor);
    } else {
      loadAllMismatchData();
    }
  }, [selectedDoctor]);

  const loadDoctors = async () => {
    const savedSheetId = localStorage.getItem('googleSheetId');
    if (!savedSheetId) return;

    try {
      const { googleSheetsService } = await import('@/services/googleSheetsService');
      const data = await googleSheetsService.getDoctors();
      setDoctors(data || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load doctors",
        variant: "destructive",
      });
    }
  };

  const loadMismatchData = async (doctorId: string) => {
    setLoading(true);
    try {
      const { googleSheetsService } = await import('@/services/googleSheetsService');
      const mismatchDataAll = await googleSheetsService.getMismatchData();
      const analysisDataAll = await googleSheetsService.getMismatchAnalysis();

      const filteredMismatch = mismatchDataAll.filter(d => d.doctor_id === doctorId);
      const filteredAnalysis = analysisDataAll.filter(d => d.doctor_id === doctorId);

      setMismatchData(filteredMismatch || []);
      setAnalysisData(filteredAnalysis || []);
    } catch (error) {
      console.error('Error loading mismatch data:', error);
      toast({
        title: "Error",
        description: "Failed to load mismatch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllMismatchData = async () => {
    setLoading(true);
    try {
      const { googleSheetsService } = await import('@/services/googleSheetsService');
      const mismatchDataAll = await googleSheetsService.getMismatchData();
      const analysisDataAll = await googleSheetsService.getMismatchAnalysis();

      setMismatchData(mismatchDataAll || []);
      setAnalysisData(analysisDataAll || []);
    } catch (error) {
      console.error('Error loading mismatch data:', error);
      toast({
        title: "Error",
        description: "Failed to load mismatch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatMismatchChartData = (dataKey: keyof MismatchData, isTotal = false) => {
    const data = selectedDoctor && selectedDoctor !== 'all'
      ? mismatchData.filter(item => item.doctor_id === selectedDoctor)
      : mismatchData;
    
    // Create a map to group data by month-year
    const dataMap = new Map();
    
    data.forEach(item => {
      // month field is already text (e.g., "October", "November", "December")
      const key = `${item.month} ${item.year}`;
      
      if (!dataMap.has(key)) {
        dataMap.set(key, { month: item.month, year: item.year, values: [] });
      }
      dataMap.get(key).values.push(Number(item[dataKey]) || 0);
    });
    
    // Convert to array and calculate averages
    const chartData = Array.from(dataMap.values()).map(entry => ({
      month: `${entry.month} ${entry.year}`,
      value: entry.values.reduce((sum, val) => sum + val, 0) / entry.values.length
    }));
    
    // Sort chronologically using month order
    const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    return chartData.sort((a, b) => {
      const aMonth = a.month.split(' ')[0];
      const aYear = parseInt(a.month.split(' ')[1]);
      const bMonth = b.month.split(' ')[0];
      const bYear = parseInt(b.month.split(' ')[1]);
      
      if (aYear !== bYear) {
        return aYear - bYear;
      }
      
      return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth);
    });
  };

  const selectedDoctorInfo = doctors.find(d => d.id === selectedDoctor && selectedDoctor !== 'all');

  // Calculate analytics
  const calculateAnalytics = () => {
    const data = selectedDoctor && selectedDoctor !== 'all'
      ? mismatchData.filter(item => item.doctor_id === selectedDoctor)
      : mismatchData;
      
    if (data.length === 0) return null;

    const latestData = data[data.length - 1];
    const previousData = data.length > 1 ? data[data.length - 2] : null;
    
    const avgTotalMismatch = data.reduce((sum, item) => sum + (item.total_mismatch || 0), 0) / data.length;
    const totalMismatches = data.reduce((sum, item) => sum + (item.total_mismatch || 0), 0);
    const avgFbsMismatch = data.reduce((sum, item) => sum + (item.fbs_mismatch || 0), 0) / data.length;
    const avgHba1cMismatch = data.reduce((sum, item) => sum + (item.hba1c_mismatch || 0), 0) / data.length;

    const totalMismatchTrend = previousData ? latestData.total_mismatch - previousData.total_mismatch : 0;
    const fbsTrend = previousData ? latestData.fbs_mismatch - previousData.fbs_mismatch : 0;

    return {
      avgTotalMismatch,
      totalMismatches,
      avgFbsMismatch,
      avgHba1cMismatch,
      totalMismatchTrend,
      fbsTrend,
      latestData,
      dataPoints: data.length
    };
  };

  const analytics = calculateAnalytics();

  // Get overview stats
  const overviewStats = {
    totalDoctors: doctors.length,
    // Find doctor with lowest average total mismatch
    topDoctor: (() => {
      if (!mismatchData.length || !doctors.length) return 'N/A';
      const doctorStats = mismatchData.reduce((acc, item) => {
        if (!acc[item.doctor_id]) {
          acc[item.doctor_id] = { totalMismatch: 0, count: 0 };
        }
        acc[item.doctor_id].totalMismatch += item.total_mismatch || 0;
        acc[item.doctor_id].count += 1;
        return acc;
      }, {} as Record<string, { totalMismatch: number; count: number }>);
      
      const doctorAvgMismatches = Object.entries(doctorStats)
        .map(([doctorId, stats]) => ({
          doctorId,
          avgMismatch: stats.totalMismatch / stats.count
        }))
        .sort((a, b) => a.avgMismatch - b.avgMismatch);
      
      const lowestAvgMismatchDoctorId = doctorAvgMismatches[0]?.doctorId;
      const topDoctorName = doctors.find(d => d.id === lowestAvgMismatchDoctorId)?.name || 'N/A';
      return isJudge ? anonymizeDoctorName(topDoctorName) : topDoctorName;
    })(),
    // Find test with lowest mismatch
    lowRiskTest: (() => {
      if (!mismatchData.length) return 'N/A';
      const testMismatches = {
        FBS: mismatchData.reduce((sum, item) => sum + (item.fbs_mismatch || 0), 0),
        'HbA1c': mismatchData.reduce((sum, item) => sum + (item.hba1c_mismatch || 0), 0),
        'Lipid Profile': mismatchData.reduce((sum, item) => sum + (item.lipid_profile_mismatch || 0), 0),
        LFT: mismatchData.reduce((sum, item) => sum + (item.lft_mismatch || 0), 0),
        FT3: mismatchData.reduce((sum, item) => sum + (item.ft3_mismatch || 0), 0),
        FT4: mismatchData.reduce((sum, item) => sum + (item.ft4_mismatch || 0), 0),
        APTT: mismatchData.reduce((sum, item) => sum + (item.aptt_mismatch || 0), 0),
      };
      
      return Object.entries(testMismatches)
        .sort(([,a], [,b]) => a - b)[0]?.[0] || 'N/A';
    })(),
    // Calculate high risk test based on actual data
    highRiskTest: (() => {
      if (!mismatchData.length) return 'N/A';
      const testMismatches = {
        FBS: mismatchData.reduce((sum, item) => sum + (item.fbs_mismatch || 0), 0),
        'HbA1c': mismatchData.reduce((sum, item) => sum + (item.hba1c_mismatch || 0), 0),
        'Lipid Profile': mismatchData.reduce((sum, item) => sum + (item.lipid_profile_mismatch || 0), 0),
        LFT: mismatchData.reduce((sum, item) => sum + (item.lft_mismatch || 0), 0),
        FT3: mismatchData.reduce((sum, item) => sum + (item.ft3_mismatch || 0), 0),
        FT4: mismatchData.reduce((sum, item) => sum + (item.ft4_mismatch || 0), 0),
        APTT: mismatchData.reduce((sum, item) => sum + (item.aptt_mismatch || 0), 0),
      };
      
      return Object.entries(testMismatches)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
    })()
  };

  // Check if connected
  const isConnected = !!localStorage.getItem('googleSheetId');

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-primary to-primary/70 rounded-xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Performance
                </h1>
                <p className="text-muted-foreground text-lg">
                  Comprehensive mismatch analysis and trends by physician
                </p>
              </div>
            </div>
          </div>
          <Card className="p-12">
            <div className="text-center space-y-4">
              <BarChart3 className="h-16 w-16 text-warning mx-auto" />
              <h2 className="text-2xl font-semibold">ไม่พบการเชื่อมต่อ Google Sheet</h2>
              <p className="text-muted-foreground">
                กรุณาไปที่หน้า Data Input เพื่อเชื่อมต่อ Google Sheet ID ก่อนดูรายงานผลการปฏิบัติงาน
              </p>
              <Button onClick={() => window.location.href = '/data-input'}>
                ไปที่หน้า Data Input
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto" id="performance-report">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-primary to-primary/70 rounded-xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Performance
                </h1>
                <p className="text-muted-foreground text-lg">
                  Comprehensive mismatch analysis and trends by physician
                </p>
              </div>
            </div>
            {mismatchData.length > 0 && (
              <div className="flex gap-2">
                <PDFExport 
                  title={`Mismatch Performance Report${selectedDoctorInfo ? ` - ${isJudge ? anonymizeDoctorName(selectedDoctorInfo.name) : selectedDoctorInfo.name}` : ''}`}
                  targetElementId="performance-report"
                />
              </div>
            )}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Overview Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Doctors</p>
                    <p className="text-2xl font-bold text-primary">{overviewStats.totalDoctors}</p>
                    <p className="text-xs text-muted-foreground">Active physicians</p>
                  </div>
                  <Users className="h-8 w-8 text-primary/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500/5 to-green-500/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Top Doctor</p>
                    <p className="text-2xl font-bold text-green-600">{overviewStats.topDoctor}</p>
                    <p className="text-xs text-muted-foreground">Lowest mismatch</p>
                  </div>
                  <User className="h-8 w-8 text-green-500/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/5 to-blue-500/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Low Risk Test</p>
                    <p className="text-2xl font-bold text-blue-600">{overviewStats.lowRiskTest}</p>
                    <p className="text-xs text-muted-foreground">Fewest mismatches</p>
                  </div>
                  <TestTube className="h-8 w-8 text-blue-500/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500/5 to-amber-500/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">High Risk Test</p>
                    <p className="text-2xl font-bold text-amber-600">{overviewStats.highRiskTest}</p>
                    <p className="text-xs text-muted-foreground">Most mismatches</p>
                  </div>
                  <TestTube className="h-8 w-8 text-amber-500/60" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-card to-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Search className="h-5 w-5 text-primary" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger className="flex-1 max-w-md">
                  <SelectValue placeholder="Select a specific physician (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {filteredDoctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {isJudge ? anonymizeDoctorName(doctor.name) : doctor.name} - {doctor.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
              
            {selectedDoctorInfo && (
              <div className="mt-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-foreground text-lg">{isJudge ? anonymizeDoctorName(selectedDoctorInfo.name) : selectedDoctorInfo.name}</h3>
                <p className="text-muted-foreground">Department: {selectedDoctorInfo.department}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mismatch Analysis Summary */}
        {analytics && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              {selectedDoctor && selectedDoctor !== 'all' ? 'Individual' : 'Aggregate'} Mismatch Analysis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500/5 to-red-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Total Mismatch</p>
                      <p className="text-2xl font-bold text-red-600">{analytics.avgTotalMismatch.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">
                        {analytics.totalMismatchTrend > 0 ? '↗' : analytics.totalMismatchTrend < 0 ? '↘' : '→'} 
                        {analytics.totalMismatchTrend > 0 ? '+' : ''}{analytics.totalMismatchTrend.toFixed(1)} from last month
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500/5 to-amber-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Mismatches</p>
                      <p className="text-2xl font-bold text-amber-600">{analytics.totalMismatches.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Cumulative count</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-amber-500/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/5 to-blue-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg FBS Mismatch</p>
                      <p className="text-2xl font-bold text-blue-600">{analytics.avgFbsMismatch.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">
                        {analytics.fbsTrend > 0 ? '↗' : analytics.fbsTrend < 0 ? '↘' : '→'} 
                        {analytics.fbsTrend > 0 ? '+' : ''}{analytics.fbsTrend.toFixed(1)} trend
                      </p>
                    </div>
                    <TestTube className="h-8 w-8 text-blue-500/60" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500/5 to-purple-500/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg HbA1c Mismatch</p>
                      <p className="text-2xl font-bold text-purple-600">{analytics.avgHba1cMismatch.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">{analytics.dataPoints} months data</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-purple-500/60" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Insights */}
            <Card className="mb-8 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Mismatch Analysis Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Graph Analysis Results</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${analytics.totalMismatchTrend < 0 ? 'bg-green-500' : analytics.totalMismatchTrend > 0 ? 'bg-red-500' : 'bg-gray-500'}`} />
                        Total mismatch trend: {analytics.totalMismatchTrend < 0 ? 'decreasing' : analytics.totalMismatchTrend > 0 ? 'increasing' : 'stable'} 
                        ({analytics.totalMismatchTrend > 0 ? '+' : ''}{analytics.totalMismatchTrend.toFixed(1)}% vs previous period)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${analytics.avgFbsMismatch < 5 ? 'bg-green-500' : analytics.avgFbsMismatch < 10 ? 'bg-amber-500' : 'bg-red-500'}`} />
                        FBS analysis: {analytics.avgFbsMismatch.toFixed(1)}% average mismatch across all months
                      </li>
                      <li className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${analytics.avgHba1cMismatch < 3 ? 'bg-green-500' : analytics.avgHba1cMismatch < 7 ? 'bg-amber-500' : 'bg-red-500'}`} />
                        HbA1c analysis: {analytics.avgHba1cMismatch.toFixed(1)}% average mismatch rate
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                        Highest risk test: {overviewStats.highRiskTest} (most mismatches)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1" />
                        Best performing test: {overviewStats.lowRiskTest} (fewest mismatches)
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                        Data coverage: {analytics.dataPoints} months analyzed
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Data-Driven Recommendations</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {analytics.avgTotalMismatch > 10 && (
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                          Critical: {analytics.avgTotalMismatch.toFixed(1)}% average exceeds 10% threshold - immediate intervention needed
                        </li>
                      )}
                      {analytics.avgFbsMismatch > 8 && (
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                          FBS protocols need review - {analytics.avgFbsMismatch.toFixed(1)}% mismatch rate
                        </li>
                      )}
                      {overviewStats.highRiskTest !== 'N/A' && (
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                          Priority focus: {overviewStats.highRiskTest} testing shows highest mismatch rates
                        </li>
                      )}
                      {analytics.totalMismatchTrend > 0 && (
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                          Upward trend detected - implement corrective measures
                        </li>
                      )}
                      {analytics.totalMismatchTrend < 0 && (
                        <li className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                          Positive improvement trend - continue current strategies
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                        Monitor {overviewStats.lowRiskTest} to maintain low mismatch performance
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Monthly Mismatch Analysis Comparison */}
        {mismatchData.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Monthly Mismatch Analysis Comparison
            </h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading mismatch data...</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
                <KPIChart
                  title="Total Mismatch Trend"
                  data={formatMismatchChartData('total_mismatch')}
                  color="hsl(var(--destructive))"
                  formatValue={(v) => v.toFixed(2)}
                />
                <KPIChart
                  title="FBS Mismatch Trend"
                  data={formatMismatchChartData('fbs_mismatch')}
                  color="hsl(var(--warning))"
                  formatValue={(v) => v.toFixed(2)}
                />
                <KPIChart
                  title="HbA1c Mismatch Trend"
                  data={formatMismatchChartData('hba1c_mismatch')}
                  color="hsl(var(--primary))"
                  formatValue={(v) => v.toFixed(2)}
                />
                <KPIChart
                  title="Lipid Profile Mismatch Trend"
                  data={formatMismatchChartData('lipid_profile_mismatch')}
                  color="hsl(var(--success))"
                  formatValue={(v) => v.toFixed(2)}
                />
                <KPIChart
                  title="LFT Mismatch Trend"
                  data={formatMismatchChartData('lft_mismatch')}
                  color="hsl(var(--secondary))"
                  formatValue={(v) => v.toFixed(2)}
                />
                <KPIChart
                  title="FT3 Mismatch Trend"
                  data={formatMismatchChartData('ft3_mismatch')}
                  color="hsl(var(--accent))"
                  formatValue={(v) => v.toFixed(2)}
                />
                <KPIChart
                  title="FT4 Mismatch Trend"
                  data={formatMismatchChartData('ft4_mismatch')}
                  color="hsl(262 83% 58%)"
                  formatValue={(v) => v.toFixed(2)}
                />
                <KPIChart
                  title="APTT Mismatch Trend"
                  data={formatMismatchChartData('aptt_mismatch')}
                  color="hsl(25 95% 53%)"
                  formatValue={(v) => v.toFixed(2)}
                />
              </div>
            )}
          </div>
        )}

        {/* Doctor List */}
        {!selectedDoctor && filteredDoctors.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Doctor Mismatch Analysis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doctor) => {
                const doctorMismatches = mismatchData.filter(item => item.doctor_id === doctor.id);
                const totalMismatches = doctorMismatches.reduce((sum, item) => sum + (item.total_mismatch || 0), 0);
                const avgMismatch = doctorMismatches.length > 0 ? totalMismatches / doctorMismatches.length : 0;
                
                // Sort to get the actual latest month chronologically
                const sortedMismatches = doctorMismatches.sort((a, b) => {
                  const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                                     'July', 'August', 'September', 'October', 'November', 'December'];
                  if (a.year !== b.year) {
                    return a.year - b.year;
                  }
                  return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
                });
                const latestMismatch = sortedMismatches[sortedMismatches.length - 1];

                // Find the test with highest mismatch for this doctor
                const getHighRiskTest = () => {
                  if (doctorMismatches.length === 0) return { name: 'N/A', value: 0 };
                  
                  const avgMismatches = {
                    'FBS': doctorMismatches.reduce((sum, item) => sum + (item.fbs_mismatch || 0), 0) / doctorMismatches.length,
                    'HbA1c': doctorMismatches.reduce((sum, item) => sum + (item.hba1c_mismatch || 0), 0) / doctorMismatches.length,
                    'LFT': doctorMismatches.reduce((sum, item) => sum + (item.lft_mismatch || 0), 0) / doctorMismatches.length,
                    'FT3': doctorMismatches.reduce((sum, item) => sum + (item.ft3_mismatch || 0), 0) / doctorMismatches.length,
                    'FT4': doctorMismatches.reduce((sum, item) => sum + (item.ft4_mismatch || 0), 0) / doctorMismatches.length,
                    'APTT': doctorMismatches.reduce((sum, item) => sum + (item.aptt_mismatch || 0), 0) / doctorMismatches.length,
                    'Lipid Profile': doctorMismatches.reduce((sum, item) => sum + (item.lipid_profile_mismatch || 0), 0) / doctorMismatches.length,
                  };
                  
                  const highestTest = Object.entries(avgMismatches).reduce((max, [test, value]) => 
                    value > max.value ? { name: test, value } : max, 
                    { name: 'N/A', value: 0 }
                  );
                  
                  return highestTest;
                };

                const highRiskTest = getHighRiskTest();

                return (
                  <Card key={doctor.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                        onClick={() => setSelectedDoctor(doctor.id)}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">{isJudge ? anonymizeDoctorName(doctor.name) : doctor.name}</h3>
                          <p className="text-muted-foreground text-sm">{doctor.department}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${avgMismatch > 10 ? 'bg-red-500/10' : avgMismatch >= 5 ? 'bg-amber-500/10' : 'bg-green-500/10'}`}>
                          <AlertTriangle className={`h-6 w-6 ${avgMismatch > 10 ? 'text-red-500' : avgMismatch >= 5 ? 'text-amber-500' : 'text-green-500'}`} />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">High Risk Test</span>
                          <span className="font-semibold text-foreground">{highRiskTest.name} ({highRiskTest.value.toFixed(1)})</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Avg Mismatch</span>
                          <span className="font-semibold text-foreground">{avgMismatch.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Latest Month</span>
                          <span className="font-semibold text-foreground">
                            {latestMismatch ? `${latestMismatch.month}/${latestMismatch.year}` : 'No data'}
                          </span>
                        </div>
                        <div className="pt-2">
                          <div className={`w-full h-2 rounded-full ${avgMismatch > 10 ? 'bg-red-500/20' : avgMismatch >= 5 ? 'bg-amber-500/20' : 'bg-green-500/20'}`}>
                            <div 
                              className={`h-2 rounded-full ${avgMismatch > 10 ? 'bg-red-500' : avgMismatch >= 5 ? 'bg-amber-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(100, (avgMismatch / 15) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {mismatchData.length === 0 && !loading && (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Mismatch Data</h3>
            <p className="text-muted-foreground">No mismatch analysis data available in the system.</p>
          </div>
        )}
      </div>
    </div>
  );
};