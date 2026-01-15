import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowRight,
  Edit,
  Clock,
  CheckCircle2,
  Snowflake,
  FileCheck,
  Workflow,
  User,
  Tag,
  ListChecks,
  DollarSign,
  GitBranch,
  Users,
  Paperclip,
  MessageSquare,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import type { CardTimelineEvent } from "@/hooks/useCardTimeline";
import { useStageFields } from "@/hooks/useStageFields";

interface HistoryEventDetailsPopoverProps {
  event: CardTimelineEvent;
  cardId?: string | null;
}

const getEventIcon = (eventType: CardTimelineEvent["event_type"]) => {
  switch (eventType) {
    case "stage_change":
      return ArrowRight;
    case "field_update":
      return Edit;
    case "activity":
      return Clock;
    case "status_change":
      return CheckCircle2;
    case "freeze":
    case "unfreeze":
      return Snowflake;
    case "checklist_completed":
    case "checklist_change":
      return FileCheck;
    case "process_status_change":
    case "process_completed":
      return Workflow;
    case "title_change":
      return Tag;
    case "assignee_change":
      return User;
    case "product_value_change":
      return DollarSign;
    case "parent_change":
      return GitBranch;
    case "agents_change":
      return Users;
    case "attachment_uploaded":
      return Paperclip;
    case "message_created":
      return MessageSquare;
    default:
      return Clock;
  }
};

const getEventTitle = (eventType: CardTimelineEvent["event_type"]): string => {
  switch (eventType) {
    case "stage_change":
      return "Mudança de Etapa";
    case "field_update":
      return "Campo Atualizado";
    case "activity":
      return "Atividade";
    case "status_change":
      return "Status Alterado";
    case "freeze":
      return "Card Congelado";
    case "unfreeze":
      return "Card Descongelado";
    case "checklist_completed":
      return "Checklist Concluído";
    case "checklist_change":
      return "Checklist Atualizado";
    case "process_status_change":
      return "Status do Processo Alterado";
    case "process_completed":
      return "Processo Concluído";
    case "title_change":
      return "Título Alterado";
    case "assignee_change":
      return "Responsável Alterado";
    case "product_value_change":
      return "Produto/Valor Alterado";
    case "parent_change":
      return "Card Pai Alterado";
    case "agents_change":
      return "Agents Alterados";
    case "attachment_uploaded":
      return "Arquivo Anexado";
    case "message_created":
      return "Comentário Criado";
    default:
      return "Evento";
  }
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return value.toLocaleString("pt-BR");
  }
  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "Nenhum";
    return value.join(", ");
  }
  if (typeof value === "object") {
    // Se for um objeto com propriedades específicas, formatar melhor
    const obj = value as Record<string, unknown>;
    if (obj.title) return String(obj.title);
    if (obj.name) return String(obj.name);
    if (obj.label) return String(obj.label);
    // Caso contrário, retornar JSON formatado
    return JSON.stringify(obj, null, 2);
  }
  return String(value);
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatEventDetails = (event: CardTimelineEvent) => {
  const { event_type, previous_value, new_value } = event;

  switch (event_type) {
    case "title_change":
      return {
        before: previous_value?.title ? String(previous_value.title) : "—",
        after: new_value?.title ? String(new_value.title) : "—",
      };

    case "assignee_change":
      return {
        before: previous_value?.assignee_name
          ? String(previous_value.assignee_name)
          : previous_value?.assignee_type === "unassigned"
          ? "Não atribuído"
          : "—",
        after: new_value?.assignee_name
          ? String(new_value.assignee_name)
          : new_value?.assignee_type === "unassigned"
          ? "Não atribuído"
          : "—",
        beforeType: previous_value?.assignee_type
          ? String(previous_value.assignee_type)
          : null,
        afterType: new_value?.assignee_type ? String(new_value.assignee_type) : null,
      };

    case "checklist_change":
      return {
        before: previous_value?.checklist_progress
          ? "Itens do checklist anteriores"
          : "Nenhum item",
        after: new_value?.checklist_progress
          ? "Itens do checklist atualizados"
          : "Nenhum item",
        showJson: true,
      };

    case "product_value_change":
      const beforeParts: string[] = [];
      const afterParts: string[] = [];

      if (previous_value?.product) {
        beforeParts.push(`Produto: ${formatValue(previous_value.product)}`);
      }
      if (previous_value?.value !== undefined && previous_value?.value !== null) {
        beforeParts.push(`Valor: R$ ${formatValue(previous_value.value)}`);
      }

      if (new_value?.product) {
        afterParts.push(`Produto: ${formatValue(new_value.product)}`);
      }
      if (new_value?.value !== undefined && new_value?.value !== null) {
        afterParts.push(`Valor: R$ ${formatValue(new_value.value)}`);
      }

      return {
        before: beforeParts.length > 0 ? beforeParts.join("\n") : "—",
        after: afterParts.length > 0 ? afterParts.join("\n") : "—",
      };

    case "parent_change":
      return {
        before: previous_value?.parent_title
          ? String(previous_value.parent_title)
          : previous_value?.parent_card_id
          ? "Card pai (sem título)"
          : "Nenhum",
        after: new_value?.parent_title
          ? String(new_value.parent_title)
          : new_value?.parent_card_id
          ? "Card pai (sem título)"
          : "Nenhum",
      };

    case "agents_change":
      const beforeAgents = previous_value?.agents
        ? Array.isArray(previous_value.agents)
          ? previous_value.agents
          : []
        : [];
      const afterAgents = new_value?.agents
        ? Array.isArray(new_value.agents)
          ? new_value.agents
          : []
        : [];

      return {
        before: beforeAgents.length > 0 ? beforeAgents.join(", ") : "Nenhum agent",
        after: afterAgents.length > 0 ? afterAgents.join(", ") : "Nenhum agent",
      };

    case "field_update":
      return {
        before: previous_value?.value ? formatValue(previous_value.value) : "—",
        after: new_value?.value ? formatValue(new_value.value) : "—",
      };

    case "status_change":
      return {
        before: previous_value?.status ? String(previous_value.status) : "—",
        after: new_value?.status ? String(new_value.status) : "—",
      };

    case "attachment_uploaded":
      // Para anexos, não há before/after, apenas informações do arquivo
      return {
        before: "—",
        after: "—",
        showAttachmentInfo: true,
      };

    case "message_created":
      // Para mensagens, não há before/after, apenas informações da mensagem
      return {
        before: "—",
        after: "—",
        showMessageInfo: true,
      };

    default:
      return {
        before: previous_value ? formatValue(previous_value) : "—",
        after: new_value ? formatValue(new_value) : "—",
      };
  }
};

export function HistoryEventDetailsPopover({ event, cardId }: HistoryEventDetailsPopoverProps) {
  const Icon = getEventIcon(event.event_type);
  const title = getEventTitle(event.event_type);
  const details = formatEventDetails(event);

  // Buscar campos dinamicamente se for stage_change e não houver snapshot
  const hasFieldsFilled = event.details && 
    typeof event.details.fields_filled === 'object' && 
    event.details.fields_filled !== null &&
    Array.isArray(event.details.fields_filled) &&
    event.details.fields_filled.length > 0;

  const shouldFetchFields = event.event_type === "stage_change" && 
    event.from_step_id && 
    !hasFieldsFilled &&
    cardId;

  const { data: dynamicFields, isLoading: isLoadingFields } = useStageFields(
    shouldFetchFields ? cardId : null,
    shouldFetchFields ? event.from_step_id : null,
    event.created_at
  );

  // Usar campos do snapshot ou campos dinâmicos
  const fieldsToDisplay = hasFieldsFilled 
    ? (event.details.fields_filled as Array<{
        field_id?: string;
        field_key?: string;
        field_label?: string;
        value?: unknown;
        filled_at?: string;
      }>)
    : (dynamicFields || []).map(field => ({
        field_id: field.field_id || undefined,
        field_key: field.field_key,
        field_label: field.field_label,
        value: field.value,
        filled_at: field.filled_at,
      }));

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </p>
        </div>
      </div>

      {/* Detalhes da mudança */}
      {(details.before !== "—" || details.after !== "—") && (
        <div className="space-y-3">
          {/* Antes */}
          {details.before !== "—" && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">ANTES</span>
              </div>
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
                <pre className="text-xs text-foreground whitespace-pre-wrap break-words font-sans">
                  {details.before}
                </pre>
              </div>
            </div>
          )}

          {/* Seta */}
          <div className="flex justify-center">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Depois */}
          {details.after !== "—" && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">DEPOIS</span>
              </div>
              <div className="rounded-md border border-green-500/20 bg-green-500/5 p-3">
                <pre className="text-xs text-foreground whitespace-pre-wrap break-words font-sans">
                  {details.after}
                </pre>
              </div>
            </div>
          )}

          {/* Informações adicionais para assignee_change */}
          {event.event_type === "assignee_change" && details.beforeType && details.afterType && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div>
                Tipo anterior:{" "}
                <span className="font-medium">
                  {details.beforeType === "user"
                    ? "Usuário"
                    : details.beforeType === "team"
                    ? "Time"
                    : "Não atribuído"}
                </span>
              </div>
              <div>
                Tipo novo:{" "}
                <span className="font-medium">
                  {details.afterType === "user"
                    ? "Usuário"
                    : details.afterType === "team"
                    ? "Time"
                    : "Não atribuído"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Informações adicionais para stage_change */}
      {event.event_type === "stage_change" && event.from_step && event.to_step && (
        <div className="space-y-3 rounded-md border bg-muted/50 p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">De:</span>
              <span className="font-medium">{event.from_step.title}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Para:</span>
              <span className="font-medium">{event.to_step.title}</span>
            </div>
            {event.duration_seconds && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Tempo na etapa anterior:</span>
                <span className="font-medium">
                  {event.duration_seconds < 60
                    ? `${event.duration_seconds}s`
                    : event.duration_seconds < 3600
                    ? `${Math.floor(event.duration_seconds / 60)}min`
                    : `${Math.floor(event.duration_seconds / 3600)}h`}
                </span>
              </div>
            )}
          </div>

          {/* Campos preenchidos na etapa anterior */}
          {(fieldsToDisplay.length > 0 || isLoadingFields) && (
            <div className="pt-2 border-t border-border">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Campos preenchidos na etapa anterior:
              </div>
              {isLoadingFields ? (
                <div className="text-xs text-muted-foreground">Carregando campos...</div>
              ) : (
                <div className="space-y-2">
                  {fieldsToDisplay.map((field, index) => (
                    <div key={index} className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {field.field_label || field.field_key || 'Campo'}
                        </span>
                        {field.filled_at && (
                          <span className="text-muted-foreground text-[10px]">
                            {format(new Date(field.filled_at), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground pl-2 border-l-2 border-muted">
                        {field.value !== null && field.value !== undefined
                          ? formatValue(field.value)
                          : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Informações adicionais para field_update */}
      {event.event_type === "field_update" && event.field && (
        <div className="rounded-md border bg-muted/50 p-3">
          <div className="text-xs space-y-2">
            <div>
              <span className="text-muted-foreground">Campo:</span>{" "}
              <span className="font-medium">{event.field.label}</span>
            </div>
            {event.step && (
              <div>
                <span className="text-muted-foreground">Etapa:</span>{" "}
                <span className="font-medium">{event.step.title}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Informações adicionais para activity */}
      {event.event_type === "activity" && event.activity && (
        <div className="space-y-2 rounded-md border bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Atividade:</span>
            <span className="font-medium">{event.activity.title}</span>
          </div>
          {event.activity.activity_action && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Ação:</span>
              <span className="font-medium">
                {event.activity.activity_action === 'created' && 'Criada'}
                {event.activity.activity_action === 'completed' && 'Concluída'}
                {event.activity.activity_action === 'updated' && 'Atualizada'}
              </span>
            </div>
          )}
          {event.activity.completed && event.activity.completed_at && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Concluída em:</span>
              <span className="font-medium">
                {format(new Date(event.activity.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </span>
            </div>
          )}
          {event.activity.start_at && event.activity.end_at && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Período:</span>
              <span className="font-medium">
                {format(new Date(event.activity.start_at), "dd/MM/yyyy HH:mm", { locale: ptBR })} - {format(new Date(event.activity.end_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Informações adicionais para attachment_uploaded */}
      {event.event_type === "attachment_uploaded" && event.details && (
        <div className="space-y-2 rounded-md border bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Arquivo:</span>
            <span className="font-medium">
              {event.details.file_name ? String(event.details.file_name) : "—"}
            </span>
          </div>
          {event.details.file_size && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Tamanho:</span>
              <span className="font-medium">
                {formatFileSize(Number(event.details.file_size))}
              </span>
            </div>
          )}
          {event.details.file_type && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Tipo:</span>
              <span className="font-medium">{String(event.details.file_type)}</span>
            </div>
          )}
        </div>
      )}

      {/* Informações adicionais para message_created */}
      {event.event_type === "message_created" && event.details && (
        <div className="space-y-2 rounded-md border bg-muted/50 p-3">
          {event.details.content_preview && (
            <div className="text-xs">
              <span className="text-muted-foreground">Mensagem:</span>
              <p className="font-medium mt-1 break-words">
                {String(event.details.content_preview)}
              </p>
            </div>
          )}
          {event.details.message_type && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Tipo:</span>
              <span className="font-medium">
                {event.details.message_type === "text"
                  ? "Texto"
                  : event.details.message_type === "audio"
                  ? "Áudio"
                  : event.details.message_type === "video"
                  ? "Vídeo"
                  : event.details.message_type === "file"
                  ? "Arquivo"
                  : String(event.details.message_type)}
              </span>
            </div>
          )}
          {event.details.has_file && event.details.file_name && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Arquivo anexado:</span>
              <span className="font-medium">{String(event.details.file_name)}</span>
            </div>
          )}
          {event.details.has_mentions && event.details.mentions_count && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Menções:</span>
              <span className="font-medium">
                {Number(event.details.mentions_count)} usuário(s)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Rodapé com usuário */}
      {event.user && (
        <div className="flex items-center gap-2 pt-3 border-t">
          <UserAvatar
            user={{
              name: event.user.name || event.user.email,
              surname: event.user.surname || undefined,
              avatar_url: event.user.avatar_url,
            }}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {event.user.name || event.user.email}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Realizou esta alteração
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
