import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Upload, File, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ClientDocument } from "@/types/database";

interface DocumentUploadProps {
  clientId: string;
  documents: ClientDocument[];
  onDocumentsUpdate: (documents: ClientDocument[]) => void;
}

export function DocumentUpload({ clientId, documents, onDocumentsUpdate }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', clientId);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-document`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({
        title: "Documento enviado",
        description: "O documento foi enviado com sucesso.",
      });

      onDocumentsUpdate([...documents, data.document]);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Erro ao enviar documento",
        description: "Ocorreu um erro ao enviar o documento.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentPath: string) => {
    try {
      const { error: deleteError } = await supabase.storage
        .from('client-documents')
        .remove([documentPath]);

      if (deleteError) throw deleteError;

      const updatedDocuments = documents.filter(doc => doc.path !== documentPath);
      
      const { error: updateError } = await supabase
        .from('clients')
        .update({ 
          documents: updatedDocuments.map(doc => ({
            name: doc.name,
            path: doc.path,
            type: doc.type,
            size: doc.size,
            uploadedAt: doc.uploadedAt
          }))
        })
        .eq('id', clientId);

      if (updateError) throw updateError;

      toast({
        title: "Documento excluído",
        description: "O documento foi excluído com sucesso.",
      });

      onDocumentsUpdate(updatedDocuments);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Erro ao excluir documento",
        description: "Ocorreu um erro ao excluir o documento.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          type="file"
          onChange={handleFileUpload}
          disabled={isUploading}
          className="hidden"
          id="document-upload"
        />
        <label
          htmlFor="document-upload"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? "Enviando..." : "Enviar documento"}
        </label>
      </div>

      {documents.length > 0 && (
        <div className="border rounded-md divide-y">
          {documents.map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <File className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{doc.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteDocument(doc.path)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
