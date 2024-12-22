import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MinusCircle, PlusCircle } from "lucide-react";
import { useState } from "react";

interface UserLimitControlProps {
  userLimit: number;
  onUpdateLimit: (newLimit: number) => void;
  onSave: (newLimit: number) => void;
}

export function UserLimitControl({ userLimit, onUpdateLimit, onSave }: UserLimitControlProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [tempLimit, setTempLimit] = useState(userLimit);

  const handleIncrement = () => {
    setTempLimit(tempLimit + 1);
    onUpdateLimit(tempLimit + 1);
  };

  const handleDecrement = () => {
    if (tempLimit > 3) {
      setTempLimit(tempLimit - 1);
      onUpdateLimit(tempLimit - 1);
    }
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await onSave(tempLimit);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Limite de Usuários</Label>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={tempLimit <= 3}
          type="button"
        >
          <MinusCircle className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          value={tempLimit}
          readOnly
          className="w-20 text-center"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          type="button"
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
        <Button 
          onClick={handleSave}
          disabled={isUpdating || tempLimit === userLimit}
        >
          {isUpdating ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Mínimo de 3 usuários por licença
      </p>
    </div>
  );
}