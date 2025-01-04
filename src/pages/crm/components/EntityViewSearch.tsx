import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface EntityViewSearchProps {
  entityName: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function EntityViewSearch({ entityName, searchTerm, onSearchChange }: EntityViewSearchProps) {
  return (
    <div className="flex items-center space-x-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={`Buscar ${entityName.toLowerCase()}...`}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}