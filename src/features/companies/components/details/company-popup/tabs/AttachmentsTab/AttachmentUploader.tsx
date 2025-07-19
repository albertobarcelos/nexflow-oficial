// AIDEV-NOTE: Componente para upload de anexos

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface AttachmentUploaderProps {
  companyId: string;
  onUploadComplete: () => void;
}

/**
 * Componente para upload de anexos da empresa
 */
const AttachmentUploader = ({
  companyId,
  onUploadComplete,
}: AttachmentUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      // Simulação de upload - em produção, implementar upload real para o Supabase Storage
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast.success("Arquivo enviado com sucesso!");
      onUploadComplete();
      
      // Limpar input após upload
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao enviar arquivo");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={fileInputRef}
        type="file"
        onChange={handleUpload}
        disabled={isUploading}
        className="max-w-xs"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <Upload className="h-4 w-4 mr-1" />
        {isUploading ? "Enviando..." : "Enviar"}
      </Button>
    </div>
  );
};

export default AttachmentUploader;