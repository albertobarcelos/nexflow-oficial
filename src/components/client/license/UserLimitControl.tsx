import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MinusCircle, PlusCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface UserLimitControlProps {
  userLimit: number;
  onUpdateLimit: (newLimit: number) => void;
  onSave: (newLimit: number) => void;
}

export function UserLimitControl({ userLimit, onUpdateLimit, onSave }: UserLimitControlProps) {
  const [tempLimit, setTempLimit] = useState(userLimit);

  useEffect(() => {
    setTempLimit(userLimit);
  }, [userLimit]);

  const handleIncrement = () => {
    const newLimit = tempLimit + 1;
    setTempLimit(newLimit);
    onUpdateLimit(newLimit);
  };

  const handleDecrement = () => {
    if (tempLimit > 3) {
      const newLimit = tempLimit - 1;
      setTempLimit(newLimit);
      onUpdateLimit(newLimit);
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
      </div>
      <p className="text-sm text-muted-foreground">
        Mínimo de 3 usuários por licença
      </p>
    </div>
  );
}