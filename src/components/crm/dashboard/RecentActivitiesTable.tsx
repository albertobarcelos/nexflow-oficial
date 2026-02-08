import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, ChevronLeft, ChevronRight } from "lucide-react";
import type {
  RecentActivity,
  RecentActivityType,
} from "@/hooks/useRecentActivities";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RecentActivitiesTableProps {
  activities: RecentActivity[];
  isLoading?: boolean;
}

function getTypeBadge(type: RecentActivityType) {
  switch (type) {
    case "card_created":
      return (
        <Badge className="bg-blue-100 text-blue-800  ">
          Card criado
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-800  ">
          Completo
        </Badge>
      );
    case "cancelled":
      return (
        <Badge className="bg-red-100 text-red-800  ">
          Cancelado
        </Badge>
      );
    case "in_progress":
      return (
        <Badge className="bg-purple-100 text-purple-800  ">
          Em progresso
        </Badge>
      );
    case "activity_created":
      return (
        <Badge className="bg-amber-100 text-amber-800  ">
          Atividade criada
        </Badge>
      );
    case "activity_completed":
      return (
        <Badge className="bg-green-100 text-green-800  ">
          Atividade concluída
        </Badge>
      );
    case "activity_updated":
      return (
        <Badge className="bg-slate-100 text-slate-800  ">
          Atividade atualizada
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-800  ">
          Em progresso
        </Badge>
      );
  }
}

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-purple-200 text-purple-700',
    'bg-blue-200 text-blue-700',
    'bg-green-200 text-green-700',
    'bg-red-200 text-red-700',
    'bg-yellow-200 text-yellow-700',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function RecentActivitiesTable({ activities, isLoading }: RecentActivitiesTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Últimas Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <p className="text-sm text-gray-500">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 ">
              Últimas Atividades
            </CardTitle>
            <p className="text-sm text-gray-500  mt-1">
              Detalhamento das movimentações recentes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Select defaultValue="all">
                <SelectTrigger className="pl-8 w-[180px]">
                  <SelectValue placeholder="Todos os Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="completed">Completo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-[#25335b] hover:bg-[#25335b]/90 text-white">
              Exportar CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 ">
                <TableHead className="px-6 py-4 text-xs uppercase font-semibold tracking-wider text-gray-500 ">
                  ID
                </TableHead>
                <TableHead className="px-6 py-4 text-xs uppercase font-semibold tracking-wider text-gray-500 ">
                  Nome do Card
                </TableHead>
                <TableHead className="px-6 py-4 text-xs uppercase font-semibold tracking-wider text-gray-500 ">
                  Responsável
                </TableHead>
                <TableHead className="px-6 py-4 text-xs uppercase font-semibold tracking-wider text-gray-500 ">
                  Data
                </TableHead>
                <TableHead className="px-6 py-4 text-xs uppercase font-semibold tracking-wider text-gray-500 ">
                  Valor
                </TableHead>
                <TableHead className="px-6 py-4 text-xs uppercase font-semibold tracking-wider text-gray-500 ">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Nenhuma atividade recente encontrada
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((activity) => (
                  <TableRow
                    key={activity.id}
                    className="hover:bg-gray-50 :bg-gray-800/30 transition-colors"
                  >
                    <TableCell className="px-6 py-4 font-medium text-gray-900 ">
                      #{activity.id.substring(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-700 ">
                      {activity.kind === "activity"
                        ? `${activity.activityTitle ?? "Atividade"} (${activity.cardName})`
                        : activity.cardName}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                            getAvatarColor(activity.responsible)
                          )}
                        >
                          {getInitials(activity.responsible)}
                        </div>
                        <span className="text-gray-700 ">
                          {activity.responsible}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-500 ">
                      {activity.date}
                    </TableCell>
                    <TableCell className="px-6 py-4 font-medium text-gray-900 ">
                      {activity.value
                        ? new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(activity.value)
                        : '-'}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {getTypeBadge(activity.type)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="bg-gray-50  px-6 py-4 border-t border-gray-200  flex items-center justify-between">
          <p className="text-sm text-gray-500 ">
            Mostrando 1 a {activities.length} de {activities.length} entradas
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

