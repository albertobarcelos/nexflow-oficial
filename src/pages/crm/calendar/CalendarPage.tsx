"use client";

import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Calendar as CalendarIcon, Workflow, ListTodo } from "lucide-react";
import { useClientAccessGuard } from "@/hooks/useClientAccessGuard";
import { useCalendarActivities } from "@/hooks/useCalendarActivities";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarEventModal } from "@/components/crm/calendar/CalendarEventModal";
import { CalendarToolbar } from "@/components/crm/calendar/CalendarToolbar";
import type { CalendarEvent } from "@/hooks/useCalendarActivities";
import { cn } from "@/lib/utils";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const messages = {
  allDay: "Dia inteiro",
  previous: "Anterior",
  next: "Próximo",
  today: "Hoje",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "Nenhuma atividade neste período.",
  showMore: (total: number) => `+${total} mais`,
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const { hasAccess, accessError } = useClientAccessGuard();
  const [filterUserId, setFilterUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showProcesses, setShowProcesses] = useState(true);
  const [showActivities, setShowActivities] = useState(true);

  const { data: users = [] } = useUsers();
  const { data: events = [], isLoading } = useCalendarActivities({
    filterUserId,
    searchQuery: searchQuery.trim() || undefined,
    showProcesses,
    showActivities,
  });

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleCloseEventModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const handleViewCard = useCallback(
    (event: CalendarEvent) => {
      const { resource } = event;
      const state: {
        openCardId: string;
        openProcessId?: string;
        openSection?: "activities";
        openActivityId?: string;
      } = { openCardId: resource.cardId };

      if (resource.eventType === "process") {
        state.openProcessId = resource.cardStepActionId;
      } else {
        state.openSection = "activities";
        state.openActivityId = resource.cardActivityId;
      }

      navigate(`/crm/flows/${resource.flowId}/board`, { state });
      setSelectedEvent(null);
    },
    [navigate]
  );

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-destructive">
          <p className="font-medium">Sem acesso ao calendário</p>
          <p className="text-sm text-muted-foreground mt-1">
            {accessError ?? "Cliente não definido"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-background">
      {/* Header com título e filtros */}
      <header className="flex-shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">
              Calendário
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro por usuário */}
            <Select
              value={filterUserId ?? "all"}
              onValueChange={(v) => setFilterUserId(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos os usuários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {users
                  .filter((u) => u.is_active)
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} {u.surname}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Pesquisa */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar atividades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px] sm:w-[240px]"
              />
            </div>

            {/* Flags: Ver processos ou Ver atividades */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                <Checkbox
                  checked={showProcesses}
                  onCheckedChange={(v) => setShowProcesses(v === true)}
                />
                <Workflow className="h-4 w-4 text-muted-foreground" />
                Ver processos
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                <Checkbox
                  checked={showActivities}
                  onCheckedChange={(v) => setShowActivities(v === true)}
                />
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                Ver atividades
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* Calendário */}
      <main className="flex-1 min-h-0 p-6 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-lg border border-border bg-card",
            "rbc-calendar"
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Carregando atividades...
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              titleAccessor="title"
              resourceAccessor="resource"
              onSelectEvent={handleSelectEvent}
              messages={messages}
              culture="pt-BR"
              views={["month", "week", "day", "agenda"]}
              defaultView="month"
              popup
              style={{ height: "100%" }}
              components={{ toolbar: CalendarToolbar }}
              eventPropGetter={(event) => {
                const r = event.resource as { eventType?: string };
                return {
                  style: {
                    backgroundColor:
                      r.eventType === "activity"
                        ? "hsl(var(--secondary))"
                        : "hsl(var(--primary))",
                  },
                };
              }}
            />
          )}
        </div>
      </main>

      <CalendarEventModal
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={handleCloseEventModal}
        onViewCard={handleViewCard}
        onComplete={handleCloseEventModal}
      />
    </div>
  );
}
