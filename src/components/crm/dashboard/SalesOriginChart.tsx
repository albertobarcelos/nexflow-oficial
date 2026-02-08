import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SalesOrigin } from "@/hooks/useSalesOriginData";

interface SalesOriginChartProps {
  data: SalesOrigin[];
  isLoading?: boolean;
}

export function SalesOriginChart({ data, isLoading }: SalesOriginChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Origem das Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 flex items-center justify-center">
            <p className="text-sm text-gray-500">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.percentage, 0);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900  mb-2">
          Origem das Vendas
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center relative">
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="percentage"
                label={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${value}%`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-gray-800 ">Total</span>
          <span className="text-sm text-gray-500">{total}%</span>
        </div>
      </CardContent>
      
      {/* Legend */}
      <div className="px-6 pb-6 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600 ">{item.source}</span>
            </div>
            <span className="font-medium text-gray-900 ">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

