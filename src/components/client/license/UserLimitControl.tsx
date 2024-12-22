import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MinusCircle, PlusCircle } from "lucide-react";

interface UserLimitControlProps {
  userLimit: number;
  onUpdateLimit: (newLimit: number) => void;
}

export function UserLimitControl({ userLimit, onUpdateLimit }: UserLimitControlProps) {
  const handleIncrement = () => {
    onUpdateLimit(userLimit + 1);
  };

  const handleDecrement = () => {
    if (userLimit > 3) {
      onUpdateLimit(userLimit - 1);
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
          disabled={userLimit <= 3}
        >
          <MinusCircle className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          value={userLimit}
          readOnly
          className="w-20 text-center"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleIncrement}
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