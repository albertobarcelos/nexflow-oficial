import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

interface Partner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  type?: string;
}

interface RelatedPartnersListProps {
  partners: Partner[];
}

export function RelatedPartnersList({ partners }: RelatedPartnersListProps) {
  if (!partners?.length) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Nenhum parceiro relacionado encontrado
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {partners.map((partner) => (
        <div
          key={partner.id}
          className="flex items-center justify-between p-2 rounded-lg border"
        >
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{partner.name}</span>
              {partner.email && (
                <span className="text-sm text-muted-foreground">
                  {partner.email}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
