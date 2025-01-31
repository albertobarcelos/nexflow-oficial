import { useState, useEffect } from "react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Input } from "./input";
import { PartnerAvatar } from "./partner-avatar";
import { Upload, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartnerAvatarPickerProps {
  currentType?: string;
  currentSeed?: string | number;
  onSelect: (type: string, seed: string | number) => void;
  className?: string;
}

export function PartnerAvatarPicker({ 
  currentType = "toy_face",
  currentSeed = "1|1",
  onSelect,
  className 
}: PartnerAvatarPickerProps) {
  const [open, setOpen] = useState(false);
  const [previewSeed, setPreviewSeed] = useState<string>(String(currentSeed));
  const [customUrl, setCustomUrl] = useState("");

  // Reseta o preview quando o modal abre
  useEffect(() => {
    if (open) {
      setPreviewSeed(String(currentSeed));
    }
  }, [open, currentSeed]);

  // Gera um número aleatório entre 1 e 36, mapeando para grupo e número
  const handleRandomToyFace = () => {
    const totalNumber = Math.floor(Math.random() * 36) + 1; // 1-36
    const group = totalNumber <= 18 ? 1 : 2;
    const toyNumber = totalNumber <= 18 ? totalNumber : totalNumber - 18;
    
    console.log("Gerando novo toy face:", { totalNumber, group, toyNumber });
    setPreviewSeed(`${toyNumber}|${group}`);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomUrl(url);
    }
  };

  const handleSave = () => {
    onSelect("toy_face", previewSeed);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn("rounded-full p-0", className)}
        onClick={() => setOpen(true)}
      >
        <PartnerAvatar
          avatarType={currentType}
          avatarSeed={currentSeed}
          size="md"
        />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Escolha um avatar</DialogTitle>
            <DialogDescription>
              Clique no botão de atualizar para ver diferentes opções
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="toy">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="toy">Toy Face</TabsTrigger>
              <TabsTrigger value="custom">Personalizado</TabsTrigger>
            </TabsList>

            <TabsContent value="toy" className="space-y-4">
              <div className="flex justify-between items-center">
                <div key={`preview-${previewSeed}`}>
                  <PartnerAvatar
                    avatarType="toy_face"
                    avatarSeed={previewSeed}
                    size="lg"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleRandomToyFace}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <PartnerAvatar
                  avatarType={customUrl ? "custom" : undefined}
                  avatarSeed={customUrl}
                  size="lg"
                />
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="avatar-upload"
                    onChange={handleCustomUpload}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById("avatar-upload")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Fazer upload
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 