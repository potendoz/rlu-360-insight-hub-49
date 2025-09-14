import { useState, useEffect } from 'react';
import { googleSheetsService } from '@/services/googleSheetsService';

interface MonthlyData {
  month: string;
  rlu_score: number;
  lp_ratio: number;
  cpg_mismatch_percentage: number;
  duplicate_order_rate: number;
  cp_ratio: number;
  cost_savings: number;
}

interface PredictiveData {
  month: string;
  actual: number | null;
  predicted: number | null;
}

interface KPIMetric {
  current: number;
  predicted: number;
  target: number;
  trend: 'up' | 'down';
  difference: number;
}

const MONTH_ORDER = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const useAdvancedAI = () => {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<Record<string, PredictiveData[]>>({});
  const [kpiMetrics, setKpiMetrics] = useState<Record<string, KPIMetric>>({});

  // Simple linear regression for predictions
  const predictNextValue = (values: number[], periods: number = 3): number[] => {
    if (values.length < 2) return Array(periods).fill(values[0] || 0);

    const n = values.length;
    const xSum = (n * (n + 1)) / 2;
    const xxSum = (n * (n + 1) * (2 * n + 1)) / 6;
    const ySum = values.reduce((sum, val) => sum + val, 0);
    const xySum = values.reduce((sum, val, index) => sum + val * (index + 1), 0);

    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;

    const predictions = [];
    for (let i = 1; i <= periods; i++) {
      const predicted = slope * (n + i) + intercept;
      predictions.push(Math.max(0, predicted)); // Ensure non-negative
    }

    return predictions;
  };

  const calculateAccuracy = (actual: number[], predicted: number[]) => {
    if (actual.length !== predicted.length) return 0;
    
    const errors = actual.map((val, index) => Math.abs(val - predicted[index]));
    const mape = errors.reduce((sum, error, index) => 
      sum + (actual[index] !== 0 ? error / Math.abs(actual[index]) : 0), 0
    ) / actual.length;
    
    return Math.max(0, 1 - mape); // Convert to accuracy (0-1)
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("useAdvancedAI: Fetching data from Google Sheets...");
        
        if (!googleSheetsService.isConfigured()) {
          console.log("Google Sheets not configured");
          setLoading(false);
          return;
        }

        // ดึงข้อมูลจาก Google Sheets
        const monthlyData = await googleSheetsService.getMonthlyData();
        
        console.log("useAdvancedAI: Monthly data from sheets:", monthlyData);

        if (!monthlyData || monthlyData.length === 0) {
          console.log("No monthly data available");
          setLoading(false);
          return;
        }

        // คำนวณข้อมูลสำหรับ 3 เดือนที่ผ่านมา
        const currentDate = new Date();
        const last3Months = [];
        
        for (let i = 2; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          last3Months.push({
            month: date.toLocaleString('en', { month: 'long' }).toLowerCase(),
            year: date.getFullYear()
          });
        }

        // คำนวณค่าเฉลี่ยรายเดือน
        const monthlyAverages = last3Months.map(period => {
          const monthData = monthlyData.filter(data => 
            data.month?.toLowerCase() === period.month && 
            data.year.toString() === period.year.toString()
          );

          const avg = {
            month: period.month.charAt(0).toUpperCase() + period.month.slice(1),
            rluScore: monthData.length > 0 ? 
              monthData.reduce((sum, d) => sum + (d.rlu_score || 0), 0) / monthData.length : 0,
            lpRatio: monthData.length > 0 ? 
              monthData.reduce((sum, d) => sum + (d.lp_ratio || 0), 0) / monthData.length : 0,
            costSavings: monthData.length > 0 ? 
              monthData.reduce((sum, d) => sum + (d.cost_savings || 0), 0) / monthData.length : 0,
            cpgMismatch: monthData.length > 0 ? 
              monthData.reduce((sum, d) => sum + (d.cpg_mismatch_percentage || 0), 0) / monthData.length : 0,
            duplicateRate: monthData.length > 0 ? 
              monthData.reduce((sum, d) => sum + (d.duplicate_order_rate || 0), 0) / monthData.length : 0,
            cpRatio: monthData.length > 0 ? 
              monthData.reduce((sum, d) => sum + (d.cp_ratio || 0), 0) / monthData.length : 0,
          };
          
          return avg;
        });

        console.log("useAdvancedAI: Monthly averages:", monthlyAverages);

        // สร้างการคาดการณ์สำหรับ 3 เดือนข้างหน้า
        const predictions = {
          rluScore: predictNextValue(monthlyAverages.map(m => m.rluScore)),
          lpRatio: predictNextValue(monthlyAverages.map(m => m.lpRatio)),
          costSavings: predictNextValue(monthlyAverages.map(m => m.costSavings)),
          cpgMismatch: predictNextValue(monthlyAverages.map(m => m.cpgMismatch)),
          duplicateRate: predictNextValue(monthlyAverages.map(m => m.duplicateRate)),
          cpRatio: predictNextValue(monthlyAverages.map(m => m.cpRatio)),
        };

        // สร้างข้อมูลสำหรับกราฟ
        const futureMonths = [];
        for (let i = 1; i <= 3; i++) {
          const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
          futureMonths.push(futureDate.toLocaleString('en', { month: 'long' }));
        }

        const newChartData = {
          'rlu-score': monthlyAverages.map((data, index) => ({
            month: data.month,
            actual: Math.round(data.rluScore * 100) / 100,
            predicted: null
          })).concat(futureMonths.map((month, index) => ({
            month,
            actual: null,
            predicted: Math.round(predictions.rluScore[index] * 100) / 100
          }))),
          'lp-ratio': monthlyAverages.map((data, index) => ({
            month: data.month,
            actual: Math.round(data.lpRatio * 100) / 100,
            predicted: null
          })).concat(futureMonths.map((month, index) => ({
            month,
            actual: null,
            predicted: Math.round(predictions.lpRatio[index] * 100) / 100
          }))),
          'cost-savings': monthlyAverages.map((data, index) => ({
            month: data.month,
            actual: Math.round(data.costSavings),
            predicted: null
          })).concat(futureMonths.map((month, index) => ({
            month,
            actual: null,
            predicted: Math.round(predictions.costSavings[index])
          }))),
          'cpg-mismatch': monthlyAverages.map((data, index) => ({
            month: data.month,
            actual: Math.round(data.cpgMismatch * 100) / 100,
            predicted: null
          })).concat(futureMonths.map((month, index) => ({
            month,
            actual: null,
            predicted: Math.round(predictions.cpgMismatch[index] * 100) / 100
          }))),
          'duplicate-rate': monthlyAverages.map((data, index) => ({
            month: data.month,
            actual: Math.round(data.duplicateRate * 100) / 100,
            predicted: null
          })).concat(futureMonths.map((month, index) => ({
            month,
            actual: null,
            predicted: Math.round(predictions.duplicateRate[index] * 100) / 100
          }))),
          'cp-ratio': monthlyAverages.map((data, index) => ({
            month: data.month,
            actual: Math.round(data.cpRatio * 100) / 100,
            predicted: null
          })).concat(futureMonths.map((month, index) => ({
            month,
            actual: null,
            predicted: Math.round(predictions.cpRatio[index] * 100) / 100
          })))
        };

        setChartData(newChartData);

        // คำนวณ KPI Metrics
        const currentValues = {
          rluScore: monthlyAverages[monthlyAverages.length - 1]?.rluScore || 0,
          lpRatio: monthlyAverages[monthlyAverages.length - 1]?.lpRatio || 0,
          costSavings: monthlyAverages[monthlyAverages.length - 1]?.costSavings || 0,
          cpgMismatch: monthlyAverages[monthlyAverages.length - 1]?.cpgMismatch || 0,
          duplicateRate: monthlyAverages[monthlyAverages.length - 1]?.duplicateRate || 0,
          cpRatio: monthlyAverages[monthlyAverages.length - 1]?.cpRatio || 0,
        };

        const predictedValues = {
          rluScore: predictions.rluScore[2] || 0,
          lpRatio: predictions.lpRatio[2] || 0,
          costSavings: predictions.costSavings[2] || 0,
          cpgMismatch: predictions.cpgMismatch[2] || 0,
          duplicateRate: predictions.duplicateRate[2] || 0,
          cpRatio: predictions.cpRatio[2] || 0,
        };

        const newKpiMetrics = {
          'rlu-score': {
            current: Math.round(currentValues.rluScore * 100) / 100,
            predicted: Math.round(predictedValues.rluScore * 100) / 100,
            target: 85,
            trend: (predictedValues.rluScore > currentValues.rluScore ? 'up' : 'down') as 'up' | 'down',
            difference: Math.round((predictedValues.rluScore - currentValues.rluScore) * 100) / 100
          },
          'lp-ratio': {
            current: Math.round(currentValues.lpRatio * 100) / 100,
            predicted: Math.round(predictedValues.lpRatio * 100) / 100,
            target: 3.5,
            trend: (predictedValues.lpRatio > currentValues.lpRatio ? 'up' : 'down') as 'up' | 'down',
            difference: Math.round((predictedValues.lpRatio - currentValues.lpRatio) * 100) / 100
          },
          'cost-savings': {
            current: Math.round(currentValues.costSavings),
            predicted: Math.round(predictedValues.costSavings),
            target: 50000,
            trend: (predictedValues.costSavings > currentValues.costSavings ? 'up' : 'down') as 'up' | 'down',
            difference: Math.round(predictedValues.costSavings - currentValues.costSavings)
          },
          'cpg-mismatch': {
            current: Math.round(currentValues.cpgMismatch * 100) / 100,
            predicted: Math.round(predictedValues.cpgMismatch * 100) / 100,
            target: 5,
            trend: (predictedValues.cpgMismatch < currentValues.cpgMismatch ? 'up' : 'down') as 'up' | 'down',
            difference: Math.round((currentValues.cpgMismatch - predictedValues.cpgMismatch) * 100) / 100
          },
          'duplicate-rate': {
            current: Math.round(currentValues.duplicateRate * 100) / 100,
            predicted: Math.round(predictedValues.duplicateRate * 100) / 100,
            target: 2,
            trend: (predictedValues.duplicateRate < currentValues.duplicateRate ? 'up' : 'down') as 'up' | 'down',
            difference: Math.round((currentValues.duplicateRate - predictedValues.duplicateRate) * 100) / 100
          },
          'cp-ratio': {
            current: Math.round(currentValues.cpRatio * 100) / 100,
            predicted: Math.round(predictedValues.cpRatio * 100) / 100,
            target: 1.5,
            trend: (predictedValues.cpRatio > currentValues.cpRatio ? 'up' : 'down') as 'up' | 'down',
            difference: Math.round((predictedValues.cpRatio - currentValues.cpRatio) * 100) / 100
          }
        };

        setKpiMetrics(newKpiMetrics);
        
        console.log("useAdvancedAI: Processing completed successfully");
        
      } catch (error) {
        console.error("useAdvancedAI: Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { loading, chartData, kpiMetrics };
};