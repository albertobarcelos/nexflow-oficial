// AIDEV-NOTE: Card de anexo da empresa

import { Button } from "@/components/ui/button";
import { Download, Eye, Trash2 } from "lucide-react";
import { formatFileSize } from "../../utils";
import { Attachment } from "../../types";

interface AttachmentCardProps {
  attachment: Attachment;
  onView: (attachment: Attachment) => void;
  onDownload: (attachment: Attachment) => void;
  onDelete: (attachment: Attachment) => void;
}

/**
 * Componente que exibe um anexo da empresa
 */
const AttachmentCard = ({
  attachment,
  onView,
  onDownload,
  onDelete,
}: AttachmentCardProps) => {
  const getFileIcon = () => {
    const fileType = attachment.type.split("/")[1];
    
    switch (fileType) {
      case "pdf":
        return (
          <svg
            className="h-8 w-8 text-red-500"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 22h14a2 2 0 0 0 2-2V7l-5-5H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M11.5 16.5h.01" />
            <path d="M7.5 16.5h.01" />
            <path d="M15.5 16.5h.01" />
          </svg>
        );
      case "doc":
      case "docx":
        return (
          <svg
            className="h-8 w-8 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 22h14a2 2 0 0 0 2-2V7l-5-5H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M10 9H8" />
            <path d="M16 9h-4" />
            <path d="M16 13H8" />
            <path d="M10 17H8" />
          </svg>
        );
      case "xls":
      case "xlsx":
        return (
          <svg
            className="h-8 w-8 text-green-500"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 22h14a2 2 0 0 0 2-2V7l-5-5H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M8 13h2" />
            <path d="M14 13h2" />
            <path d="M8 17h2" />
            <path d="M14 17h2" />
          </svg>
        );
      default:
        return (
          <svg
            className="h-8 w-8 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 22h14a2 2 0 0 0 2-2V7l-5-5H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          </svg>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        {getFileIcon()}
        <div>
          <h3 className="font-medium text-sm">{attachment.name}</h3>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>{formatFileSize(attachment.size)}</span>
            <span>•</span>
            <span>Enviado em {formatDate(attachment.created_at)}</span>
            <span>•</span>
            <span>Por {attachment.uploaded_by}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onView(attachment)}
          title="Visualizar"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDownload(attachment)}
          title="Baixar"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(attachment)}
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AttachmentCard;