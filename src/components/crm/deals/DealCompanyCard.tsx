import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Mail, Tag, Edit2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CompanySelector } from "./CompanySelector";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { useAuth } from "@/hooks/useAuth";
import type { CompanyWithRelations } from "@/features/companies/hooks/useCompanies";

export interface DealCompanyCardProps {
    company: {
        id: string;
        name: string;
        cnpj?: string;
        address?: string;
        phone?: string;
        email?: string;
        tags?: string[];
        avatar?: string;
        client_id?: string;
        client?: {
            id: string;
            name: string;
        };
        company_id?: string;
        company?: {
            id: string;
            name: string;
        };
    };
    onChangeCompany?: (companyId: string) => void;
}

export function DealCompanyCard({ company, onChangeCompany }: DealCompanyCardProps) {
    const [hovered, setHovered] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const { user } = useAuth();
    const { companies = [] } = useCompanies();

    // Filter companies by client_id if available
    const filteredCompanies = companies.filter(
        (c: CompanyWithRelations) => user && c.client_id === user.id // Adjust if user.client_id is available
    );

    return (
        <Card
            className="border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 shadow-sm relative group"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Edit button, only on hover */}
            <button
                className="absolute top-2 right-2 z-30 bg-white rounded-full p-1 shadow hover:bg-blue-100 transition-opacity opacity-0 group-hover:opacity-100 border border-blue-200"
                style={{ zIndex: 1010 }}
                onClick={() => setModalOpen(true)}
                tabIndex={-1}
            >
                <Edit2 className="w-4 h-4 text-blue-600" />
            </button>
            <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
                        <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-600 mb-1">Empresa</p>
                        <p className="text-lg font-bold text-blue-700 truncate">{company.name}</p>
                    </div>
                </div>
                <div className="space-y-2 text-sm text-slate-700">
                    {company.cnpj && (
                        <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-500">CNPJ:</span>
                            <span className="truncate">{company.cnpj}</span>
                        </div>
                    )}
                </div>
            </CardContent>
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-md z-[1100]" style={{ zIndex: 1100 }}>
                    <CompanySelector
                        value={company.id}
                        options={filteredCompanies.map((c: CompanyWithRelations) => ({ id: c.id, name: c.name }))}
                        onChange={id => {
                            setModalOpen(false);
                            onChangeCompany?.(id);
                        }}
                    />
                </DialogContent>
            </Dialog>
        </Card>
    );
} 