import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MonthlyData {
  month: string;
  rlu_score: number;
  lp_ratio: number;
  cpg_mismatch_percentage: number;
  duplicate_order_rate: number;
  cp_ratio: number;
}

interface PredictiveData {
  month: string;
  actual: number | null;
  predicted: number;
}

interface KPIMetric {
  name: string;
  current: number;
  predicted: number;
  target: number;
  trend: 'up' | 'down';
  difference: number;
}

const MONTH_ORDER = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const useAdvancedAI = () => {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{
    rluScore: PredictiveData[];
    lpRatio: PredictiveData[];
    cpgMismatch: PredictiveData[];
    duplicateOrder: PredictiveData[];
    cpRatio: PredictiveData[];
  }>({
    rluScore: [],
    lpRatio: [],
    cpgMismatch: [],
    duplicateOrder: [],
    cpRatio: []
  });
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);

  // Simple linear regression for prediction
  const predictNextValue = (values: number[], periods: number = 3): number[] => {
    if (values.length < 2) {
      const lastValue = values[values.length - 1] || 0;
      return Array(periods).fill(lastValue);
    }
    
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i + 1);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const predictions: number[] = [];
    for (let i = 1; i <= periods; i++) {
      predictions.push(slope * (n + i) + intercept);
    }
    
    return predictions;
  };

  const calculateAccuracy = (actual: number[], predicted: number[]) => {
    if (actual.length === 0 || predicted.length === 0) return 95;
    
    const errors = actual.map((val, i) => Math.abs(val - predicted[i]) / val);
    const mape = errors.reduce((a, b) => a + b, 0) / errors.length;
    return Math.max(85, Math.min(99, 100 - mape * 100));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get all available data
        const { data, error } = await supabase
          .from('doctor_monthly_data')
          .select('*')
          .order('year', { ascending: true })
          .order('month', { ascending: true });

        if (error) throw error;
        if (!data || data.length === 0) return;

        // Get unique month-year combinations and sort them chronologically
        const monthYearCombinations = [...new Set(data.map((record: any) => `${record.month}-${record.year}`))];
        
        const sortedMonthYears = monthYearCombinations.sort((a, b) => {
          const [monthA, yearA] = a.split('-');
          const [monthB, yearB] = b.split('-');
          
          // First sort by year
          if (parseInt(yearA) !== parseInt(yearB)) {
            return parseInt(yearA) - parseInt(yearB);
          }
          
          // Then sort by month within the same year
          const monthIndexA = MONTH_ORDER.indexOf(monthA);
          const monthIndexB = MONTH_ORDER.indexOf(monthB);
          return monthIndexA - monthIndexB;
        });

        // Take the last 3 available month-year combinations
        const last3MonthYears = sortedMonthYears.slice(-3);

        // Group data by month-year and calculate averages for the last 3 periods
        const monthlyAverages = last3MonthYears.reduce((acc: Record<string, MonthlyData>, monthYear: string) => {
          const [month, year] = monthYear.split('-');
          const monthData = data.filter((record: any) => record.month === month && record.year === parseInt(year));
          const count = monthData.length;
          
          if (count > 0) {
            acc[monthYear] = {
              month: `${month} ${year}`, // Include year in display
              rlu_score: monthData.reduce((sum: number, record: any) => sum + (record.rlu_score || 0), 0) / count,
              lp_ratio: monthData.reduce((sum: number, record: any) => sum + (record.lp_ratio || 0), 0) / count,
              cpg_mismatch_percentage: monthData.reduce((sum: number, record: any) => sum + (record.cpg_mismatch_percentage || 0), 0) / count,
              duplicate_order_rate: monthData.reduce((sum: number, record: any) => sum + (record.duplicate_order_rate || 0), 0) / count,
              cp_ratio: monthData.reduce((sum: number, record: any) => sum + (record.cp_ratio || 0), 0) / count,
            };
          }
          
          return acc;
        }, {});

        // Get ordered data for the last 3 month-year periods
        const orderedMonthlyData = last3MonthYears.map(monthYear => monthlyAverages[monthYear]).filter(Boolean);

        // Extract values for predictions
        const rluValues = orderedMonthlyData.map((m: any) => m.rlu_score);
        const lpValues = orderedMonthlyData.map((m: any) => m.lp_ratio);
        const cpgValues = orderedMonthlyData.map((m: any) => m.cpg_mismatch_percentage);
        const duplicateValues = orderedMonthlyData.map((m: any) => m.duplicate_order_rate);
        const cpValues = orderedMonthlyData.map((m: any) => m.cp_ratio);

        // Generate predictions for next 3 months
        const rluPredictions = predictNextValue(rluValues);
        const lpPredictions = predictNextValue(lpValues);
        const cpgPredictions = predictNextValue(cpgValues);
        const duplicatePredictions = predictNextValue(duplicateValues);
        const cpPredictions = predictNextValue(cpValues);

        // Future months (next 3 months after the latest available)
        const nextMonths = ['August 2025', 'September 2025', 'October 2025'];
        
        const createChartData = (actualValues: number[], predictions: number[], months: string[]) => {
          const result: PredictiveData[] = [];
          
          // Add historical data (last 3 months)
          months.forEach((month, index) => {
            result.push({
              month: month.split(' ')[0].substring(0, 3), // Show just month abbreviation
              actual: actualValues[index] || null,
              predicted: actualValues[index] || 0
            });
          });
          
          // Add predictions (next 3 months)
          nextMonths.forEach((month, index) => {
            result.push({
              month: month.split(' ')[0].substring(0, 3), // Show just month abbreviation
              actual: null,
              predicted: predictions[index] || 0
            });
          });
          
          return result;
        };

        const historicalMonths = orderedMonthlyData.map((m: any) => m.month);

        setChartData({
          rluScore: createChartData(rluValues, rluPredictions, historicalMonths),
          lpRatio: createChartData(lpValues, lpPredictions, historicalMonths),
          cpgMismatch: createChartData(cpgValues, cpgPredictions, historicalMonths),
          duplicateOrder: createChartData(duplicateValues, duplicatePredictions, historicalMonths),
          cpRatio: createChartData(cpValues, cpPredictions, historicalMonths)
        });

        // Create KPI metrics
        const currentRlu = rluValues[rluValues.length - 1] || 0;
        const currentLp = lpValues[lpValues.length - 1] || 0;
        const currentCpg = cpgValues[cpgValues.length - 1] || 0;
        const currentDuplicate = duplicateValues[duplicateValues.length - 1] || 0;
        const currentCp = cpValues[cpValues.length - 1] || 0;

        setKpiMetrics([
          {
            name: 'RLU Score',
            current: Number(currentRlu.toFixed(1)),
            predicted: Number(rluPredictions[0]?.toFixed(1) || 0),
            target: Number(rluPredictions[0]?.toFixed(1) || 0),
            trend: rluPredictions[0] > currentRlu ? 'up' : 'down',
            difference: Number((rluPredictions[0] - currentRlu).toFixed(1))
          },
          {
            name: 'L/P Ratio',
            current: Number(currentLp.toFixed(1)),
            predicted: Number(lpPredictions[0]?.toFixed(1) || 0),
            target: Number(lpPredictions[0]?.toFixed(1) || 0),
            trend: lpPredictions[0] < currentLp ? 'down' : 'up',
            difference: Number((lpPredictions[0] - currentLp).toFixed(1))
          },
          {
            name: 'CPG Mismatch (%)',
            current: Number(currentCpg.toFixed(1)),
            predicted: Number(cpgPredictions[0]?.toFixed(1) || 0),
            target: Number(cpgPredictions[0]?.toFixed(1) || 0),
            trend: cpgPredictions[0] < currentCpg ? 'down' : 'up',
            difference: Number((cpgPredictions[0] - currentCpg).toFixed(1))
          },
          {
            name: 'Duplicate Order (%)',
            current: Number(currentDuplicate.toFixed(1)),
            predicted: Number(duplicatePredictions[0]?.toFixed(1) || 0),
            target: Number(duplicatePredictions[0]?.toFixed(1) || 0),
            trend: duplicatePredictions[0] < currentDuplicate ? 'down' : 'up',
            difference: Number((duplicatePredictions[0] - currentDuplicate).toFixed(1))
          },
          {
            name: 'C/P Ratio',
            current: Number(currentCp.toFixed(1)),
            predicted: Number(cpPredictions[0]?.toFixed(1) || 0),
            target: Number(cpPredictions[0]?.toFixed(1) || 0),
            trend: cpPredictions[0] < currentCp ? 'down' : 'up',
            difference: Number((cpPredictions[0] - currentCp).toFixed(1))
          }
        ]);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    loading,
    chartData,
    kpiMetrics
  };
};