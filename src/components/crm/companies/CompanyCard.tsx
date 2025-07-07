import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MoreVertical, Edit, Trash2, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatCNPJ, formatPhone } from "@/lib/format";

export function CompanyCard({ company, onEdit, onDelete, onClick }: {
    company: any;
    onEdit?: (e: React.MouseEvent, company: any) => void;
    onDelete?: (company: any) => void;
    onClick?: () => void;
}) {
    const getStatusColor = (status: string) => {
        const colors = {
            PENDENTE: "bg-yellow-500",
            ATIVO: "bg-green-500",
            INATIVO: "bg-gray-500",
            BLOQUEADO: "bg-red-500"
        };
        return colors[status as keyof typeof colors] || "bg-gray-500";
    };
    return (
        <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={onClick}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <CardTitle className="text-base truncate">{company.name}</CardTitle>
                            {company.razao_social && (
                                <p className="text-sm text-muted-foreground truncate">
                                    {company.razao_social}
                                </p>
                            )}
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={e => e.stopPropagation()}
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={e => onEdit?.(e, company)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(company)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-2">
                    {company.cnpj && (
                        <p className="text-sm font-mono">
                            {formatCNPJ(company.cnpj)}
                        </p>
                    )}
                    <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(company.status || "ATIVO")}>{company.status || "ATIVO"}</Badge>
                    </div>
                    {(company.email || company.whatsapp) && (
                        <div className="space-y-1">
                            {company.email && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="w-3 h-3" />
                                    <span className="truncate">{company.email}</span>
                                </div>
                            )}
                            {company.whatsapp && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="w-3 h-3" />
                                    <span className="truncate">{formatPhone(company.whatsapp)}</span>
                                </div>
                            )}
                        </div>
                    )}
                    {(company.cidade || company.estado) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{[company.cidade, company.estado].filter(Boolean).join(', ')}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 