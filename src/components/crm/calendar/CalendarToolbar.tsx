"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import clsx from "clsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

/** Props do Toolbar do react-big-calendar */
interface CalendarToolbarProps {
  label: React.ReactNode;
  localizer: { messages: Record<string, string> };
  onNavigate: (action: "PREV" | "NEXT" | "TODAY" | Date) => void;
  onView: (view: string) => void;
  view: string;
  views: string[];
  date: Date;
}

/**
 * Toolbar customizada para o calendário, com botão de seleção de mês/ano
 * entre Anterior e Próximo.
 */
export function CalendarToolbar({
  label,
  localizer,
  onNavigate,
  onView,
  view,
  views,
  date,
}: CalendarToolbarProps) {
  const [open, setOpen] = useState(false);
  const { messages } = localizer;

  const handleNavigate = (action: "PREV" | "NEXT" | "TODAY" | Date) => {
    onNavigate(action);
  };

  const handleMonthSelect = (newDate: Date) => {
    onNavigate(newDate);
    setOpen(false);
  };

  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button
          type="button"
          onClick={() => handleNavigate("TODAY")}
          className="rbc-button"
        >
          {messages.today}
        </button>
        <button
          type="button"
          onClick={() => handleNavigate("PREV")}
          className="rbc-button"
        >
          {messages.previous}
        </button>

        {/* Botão para abrir seletor de mês/ano */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              className={cn(
                "rbc-button"

              )}
              
            >
              <CalendarIcon className="h-4 w-4 shrink-0" />
              
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" >
            <Calendar
              mode="single"
              defaultMonth={date}
              selected={date}
              onSelect={(selectedDate) => {
                if (selectedDate) handleMonthSelect(selectedDate);
              }}
              onMonthChange={handleMonthSelect}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <button
          type="button"
          onClick={() => handleNavigate("NEXT")}
          className="rbc-button"
        >
          {messages.next}
        </button>
      </span>

      <span className="rbc-toolbar-label">{label}</span>

      {views.length > 1 && (
        <span className="rbc-btn-group">
          {views.map((name) => (
            <button
              type="button"
              key={name}
              className={clsx("rbc-button", { "rbc-active": view === name })}
              onClick={() => onView(name)}
            >
              {messages[name]}
            </button>
          ))}
        </span>
      )}
    </div>
  );
}
