import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EntityBasicInfoProps {
  singularName: string;
  pluralName: string;
  description: string;
  onSingularNameChange: (value: string) => void;
  onPluralNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function EntityBasicInfo({
  singularName,
  pluralName,
  description,
  onSingularNameChange,
  onPluralNameChange,
  onDescriptionChange,
}: EntityBasicInfoProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="singularName">Nome no Singular</Label>
          <Input 
            id="singularName" 
            placeholder="Ex: Empresa" 
            value={singularName}
            onChange={(e) => onSingularNameChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pluralName">Nome no Plural</Label>
          <Input 
            id="pluralName" 
            placeholder="Ex: Empresas" 
            value={pluralName}
            onChange={(e) => onPluralNameChange(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Descreva o propósito desta entidade"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>
    </div>
  );
}