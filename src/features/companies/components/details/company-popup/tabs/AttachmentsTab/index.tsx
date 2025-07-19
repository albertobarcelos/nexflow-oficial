// AIDEV-NOTE: Componente principal da aba Anexos

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useCompanyAttachments } from "../../hooks/index";
import { TabProps, Attachment } from "../../types";
import AttachmentCard from "./AttachmentCard";
import AttachmentUploader from "./AttachmentUploader";
import { toast } from "sonner";

/**
 * Componente que exibe a aba de Anexos da empresa
 */
const AttachmentsTab = ({ company }: TabProps) => {
  const { data: attachments = [], isLoading, refetch } = useCompanyAttachments(company?.id);
  const [isUploading, setIsUploading] = useState(false);

  if (!company) return null;

  const handleViewAttachment = (attachment: Attachment) => {
    // Em produção, implementar visualização do anexo
    toast.info(`Visualizando ${attachment.name}`);
  };

  const handleDownloadAttachment = (attachment: Attachment) => {
    // Em produção, implementar download do anexo
    toast.info(`Baixando ${attachment.name}`);
  };

  const handleDeleteAttachment = (attachment: Attachment) => {
    // Em produção, implementar exclusão do anexo
    toast.info(`Excluindo ${attachment.name}`);
    // Simular atualização da lista após exclusão
    setTimeout(() => refetch(), 500);
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Anexos</h3>
          <p className="text-xs text-muted-foreground">
            {attachments.length} {attachments.length === 1 ? "arquivo" : "arquivos"}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsUploading(!isUploading)}
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Adicionar Anexo
        </Button>
      </div>

      {isUploading && (
        <div className="py-2">
          <AttachmentUploader
            companyId={company.id}
            onUploadComplete={() => {
              setIsUploading(false);
              refetch();
            }}
          />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : attachments.length > 0 ? (
        <div className="space-y-3">
          {attachments.map((attachment) => (
            <AttachmentCard
              key={attachment.id}
              attachment={attachment}
              onView={handleViewAttachment}
              onDownload={handleDownloadAttachment}
              onDelete={handleDeleteAttachment}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-4">
          Nenhum anexo disponível para esta empresa
        </p>
      )}
    </div>
  );
};

export default AttachmentsTab;