import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCardAttachments, useUploadAttachment, useDeleteAttachment, useDownloadAttachment } from '@/hooks/useCardAttachments';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Upload, 
  File, 
  Trash2, 
  Download, 
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CardAttachmentsProps {
  cardId: string;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function CardAttachments({ cardId }: CardAttachmentsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: attachments = [], isLoading } = useCardAttachments(cardId);
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();
  const downloadAttachment = useDownloadAttachment();

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    return null;
  };

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    
    for (const file of filesArray) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        continue;
      }

      // Usar identificador único para cada upload (timestamp + nome)
      const uploadId = `${Date.now()}-${file.name}`;
      let progressInterval: NodeJS.Timeout | null = null;

      try {
        // Iniciar progresso
        setUploadProgress((prev) => ({ ...prev, [uploadId]: 0 }));
        
        // Calcular intervalo baseado no tamanho do arquivo (arquivos maiores precisam de mais tempo)
        const fileSizeMB = file.size / (1024 * 1024);
        const intervalTime = Math.max(100, Math.min(500, fileSizeMB * 10)); // Entre 100ms e 500ms
        const increment = Math.max(1, Math.min(5, Math.floor(fileSizeMB / 10))); // Entre 1% e 5% por intervalo
        
        // Simular progresso até 95%
        progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const current = prev[uploadId] || 0;
            if (current >= 95) {
              if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
              }
              return prev;
            }
            return { ...prev, [uploadId]: Math.min(95, current + increment) };
          });
        }, intervalTime);

        // Executar upload
        await uploadAttachment.mutateAsync({
          card_id: cardId,
          file,
        });

        // Limpar intervalo se ainda estiver rodando
        if (progressInterval) {
          clearInterval(progressInterval);
        }

        // Completar progresso (100%) antes de remover
        setUploadProgress((prev) => ({ ...prev, [uploadId]: 100 }));
        
        // Aguardar um pouco para mostrar 100%
        await new Promise(resolve => setTimeout(resolve, 300));

        // Remover do progresso
        setUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[uploadId];
          return newProgress;
        });

        toast.success(`Arquivo "${file.name}" enviado com sucesso`);
      } catch (error) {
        // Limpar intervalo em caso de erro
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        
        // Remover do progresso
        setUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[uploadId];
          return newProgress;
        });
        
        toast.error(`Erro ao enviar "${file.name}"`);
        console.error(error);
      }
    }
  }, [cardId, uploadAttachment]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFileUpload(files);
  }, [handleFileUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (attachmentId: string, fileName: string) => {
    if (!confirm(`Tem certeza que deseja deletar "${fileName}"?`)) return;

    try {
      await deleteAttachment.mutateAsync({ attachmentId, cardId });
      toast.success('Anexo deletado');
    } catch (error) {
      toast.error('Erro ao deletar anexo');
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const blob = await downloadAttachment.mutateAsync(fileUrl);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download iniciado');
    } catch (error) {
      toast.error('Erro ao fazer download');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return ImageIcon;
    if (fileType.startsWith('video/')) return Video;
    if (fileType.startsWith('audio/')) return Music;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (fileType: string) => fileType.startsWith('image/');

  return (
    <div className="space-y-4">
      {/* Área de upload com drag-and-drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
        )}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Arraste arquivos aqui ou clique para selecionar
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
          Tamanho máximo: 100MB por arquivo
        </p>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAttachment.isPending}
        >
          Selecionar Arquivos
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={handleFileSelect}
        />
      </div>

      {/* Progresso de upload */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([uploadId, progress]) => {
            // Extrair nome do arquivo do uploadId (formato: timestamp-nomeArquivo)
            const fileName = uploadId.includes('-') 
              ? uploadId.substring(uploadId.indexOf('-') + 1)
              : uploadId;
            
            return (
              <div key={uploadId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate">{fileName}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            );
          })}
        </div>
      )}

      {/* Lista de anexos */}
      {isLoading ? (
        <div className="text-center text-sm text-muted-foreground py-8">
          Carregando anexos...
        </div>
      ) : attachments.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-8">
          Nenhum anexo ainda
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const FileIcon = getFileIcon(attachment.file_type);
            const isImg = isImage(attachment.file_type);

            return (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                {isImg ? (
                  <img
                    src={attachment.file_url}
                    alt={attachment.file_name}
                    className="h-12 w-12 object-cover rounded"
                  />
                ) : (
                  <div className="h-12 w-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
                    <FileIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attachment.file_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(attachment.file_size)}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(attachment.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                    {attachment.user && (
                      <>
                        <span>•</span>
                        <span>
                          {attachment.user.name && attachment.user.surname
                            ? `${attachment.user.name} ${attachment.user.surname}`
                            : attachment.user.email}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(attachment.file_url, attachment.file_name)}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(attachment.id, attachment.file_name)}
                    disabled={deleteAttachment.isPending}
                    title="Deletar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

