import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChartDataPoint {
  label: string;
  opportunitiesCreated: number;
  cardsCompleted: number;
}

interface OpportunityFlowChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

export function OpportunityFlowChart({ data, isLoading }: OpportunityFlowChartProps) {
  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Fluxo de Oportunidades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 flex items-center justify-center">
            <p className="text-sm text-gray-500">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Fluxo de Oportunidades
            </CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Desempenho de criação vs conclusão
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis 
                dataKey="label" 
                stroke="#6b7280"
                className="text-xs"
                tick={{ fill: '#6b7280', fontSize: 11 }}
              />
              <YAxis 
                stroke="#6b7280"
                className="text-xs"
                tick={{ fill: '#6b7280', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                }}
                className="dark:bg-gray-800 dark:border-gray-700"
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="opportunitiesCreated"
                name="Oportunidades Criadas"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#ffffff', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="cardsCompleted"
                name="Cards Completos"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

