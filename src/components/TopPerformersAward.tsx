import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Calendar, Download, User, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { anonymizeDoctorName } from '@/utils/pdpaUtils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Doctor {
  id: string;
  name: string;
  department: string;
}

interface PerformanceData {
  doctor_id: string;
  month: string;
  year: number;
  rlu_score: number;
  cost_savings: number;
  test_reduction: number;
  lp_ratio: number;
  duplicate_order_rate: number;
  cpg_mismatch_percentage: number;
}

interface TopPerformer {
  doctor: Doctor;
  rluScore: number;
  cpgMismatch: number;
  duplicateOrder: number;
  rank: number;
}

export const TopPerformersAward = () => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const isJudge = hasRole('judge');

  const months = [
    { value: 'January', label: 'January' },
    { value: 'February', label: 'February' },
    { value: 'March', label: 'March' },
    { value: 'April', label: 'April' },
    { value: 'May', label: 'May' },
    { value: 'June', label: 'June' },
    { value: 'July', label: 'July' },
    { value: 'August', label: 'August' },
    { value: 'September', label: 'September' },
    { value: 'October', label: 'October' },
    { value: 'November', label: 'November' },
    { value: 'December', label: 'December' },
  ];

  const years = ['2024', '2025'];

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      loadTopPerformers();
    }
  }, [selectedMonth, selectedYear]);

  const loadTopPerformers = async () => {
    const savedSheetId = localStorage.getItem('googleSheetId');
    if (!savedSheetId) return;

    setLoading(true);
    try {
      // Use Google Sheets data only
      const { googleSheetsService } = await import('@/services/googleSheetsService');
      const doctors = await googleSheetsService.getDoctors();
      const performanceData = await googleSheetsService.getMonthlyData();

      // Filter performance data for selected month/year
      const filteredPerformanceData = performanceData.filter(
        data => data.month === selectedMonth && data.year === parseInt(selectedYear)
      );

      // Map data to TopPerformer format
      const doctorPerformances = filteredPerformanceData.map((data: any) => {
        const doctor = doctors?.find(d => d.id === data.doctor_id);
        if (!doctor) return null;

        return {
          doctor,
          rluScore: data.rlu_score || 0,
          cpgMismatch: data.cpg_mismatch_percentage || 0,
          duplicateOrder: data.duplicate_order_rate || 0,
          rank: 0 // Will be set after sorting
        };
      }).filter(Boolean) as TopPerformer[];

      // Sort by RLU score and assign ranks
      const rankedPerformers = doctorPerformances
        .sort((a, b) => b.rluScore - a.rluScore)
        .slice(0, 3) // Top 3 only
        .map((performer, index) => ({
          ...performer,
          rank: index + 1
        }));

      setTopPerformers(rankedPerformers);
    } catch (error) {
      console.error('Error loading top performers:', error);
      toast({
        title: "Error",
        description: "Failed to load top performers data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-8 w-8 text-yellow-500" />;
      case 2:
        return <Medal className="h-8 w-8 text-gray-400" />;
      case 3:
        return <Award className="h-8 w-8 text-amber-600" />;
      default:
        return <Award className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-amber-400 to-amber-600';
      default:
        return 'from-muted to-muted-foreground';
    }
  };

  // Check if connected
  const isConnected = !!localStorage.getItem('googleSheetId');

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Trophy className="h-16 w-16 text-warning mx-auto" />
            <h2 className="text-2xl font-semibold">ไม่พบการเชื่อมต่อ Google Sheet</h2>
            <p className="text-muted-foreground">
              กรุณาไปที่หน้า Data Input เพื่อเชื่อมต่อ Google Sheet ID ก่อนดูรายงานผู้ปฏิบัติงานดีเด่น
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const generateAwardPDF = async () => {
    if (topPerformers.length === 0) {
      toast({
        title: "No Data",
        description: "Please select a month and year to generate the award report",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const element = document.getElementById('award-report');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Top-Performers-Award-${selectedMonth}-${selectedYear}.pdf`);
      
      toast({
        title: "Success",
        description: "Award report generated successfully!",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Select Month</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Select Year</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={generateAwardPDF}
            disabled={!selectedMonth || !selectedYear || topPerformers.length === 0 || generating}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {generating ? 'Generating...' : 'Generate Award Report'}
          </Button>
        </div>
      </Card>

      {/* Award Report */}
      <div id="award-report" className="bg-white p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex justify-center items-center gap-3">
            <Trophy className="h-12 w-12 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gray-800">Excellence Award</h1>
            <Trophy className="h-12 w-12 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mt-4">
            Rational Laboratory Use Performance Recognition
          </h2>
          <div className="flex items-center justify-center gap-2 text-lg text-gray-600">
            <Calendar className="h-5 w-5" />
            <span>{selectedMonth} {selectedYear}</span>
          </div>
        </div>

        {/* Top Performers */}
        {topPerformers.length > 0 ? (
          <div className="space-y-6">
            {topPerformers.map((performer) => (
              <Card 
                key={performer.doctor.id} 
                className={`border-2 bg-gradient-to-r ${getRankColor(performer.rank)} p-6 text-white shadow-xl`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      {getRankIcon(performer.rank)}
                      <Badge className="mt-2 bg-white text-gray-800">
                        #{performer.rank}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">
                        {isJudge ? anonymizeDoctorName(performer.doctor.name) : performer.doctor.name}
                      </h3>
                      <p className="text-lg opacity-90">{performer.doctor.department}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">RLU Score: {performer.rluScore.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm opacity-90">CPG Mismatch (%)</p>
                        <p className="text-lg font-semibold">{performer.cpgMismatch.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-90">Duplicate Order (%)</p>
                        <p className="text-lg font-semibold">{performer.duplicateOrder.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-600">
              {selectedMonth && selectedYear 
                ? loading 
                  ? 'Loading top performers...' 
                  : 'No performance data available for the selected period'
                : 'Please select a month and year to view top performers'
              }
            </p>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center space-y-4 border-t pt-8">
          <p className="text-gray-600">
            Congratulations to our outstanding performers for their dedication to rational laboratory use!
          </p>
          <p className="text-sm text-gray-500">
            Generated on {new Date().toLocaleDateString()} by RLU 360 Analytics System
          </p>
        </div>
      </div>
    </div>
  );
};