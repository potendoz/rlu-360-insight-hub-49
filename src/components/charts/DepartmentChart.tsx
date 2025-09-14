import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from "@/components/ui/card";

interface DepartmentChartProps {
  data: Array<{
    department: string;
    savings: number;
    reduction: number;
  }>;
}

export const DepartmentChart = ({ data }: DepartmentChartProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Department Performance</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="department" 
              className="text-xs text-muted-foreground"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis className="text-xs text-muted-foreground" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }}
            />
            <Bar 
              dataKey="savings" 
              fill="hsl(var(--primary))" 
              name="Cost Savings (฿K)"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="reduction" 
              fill="hsl(var(--success))" 
              name="Test Reduction (%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};