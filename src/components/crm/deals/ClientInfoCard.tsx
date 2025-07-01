import ReactToyFace from "react-toy-face";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Phone, Mail, Instagram, Link, Check, X, Building2, Edit2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CompanySelector } from "./CompanySelector";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { useAuth } from "@/hooks/useAuth";
import type { CompanyWithRelations } from "@/features/companies/hooks/useCompanies";
import type { MockDeal } from "./DealViewDialog";

// Client Info Card Component: Displays core client information and allows for inline editing of related links and company.
export function ClientInfoCard({ deal }: { deal: MockDeal }) {
    // State for Instagram link editing
    const [isEditingInstagram, setIsEditingInstagram] = useState(false);
    const [instagramInputValue, setInstagramInputValue] = useState(deal.instagram_link || "");

    // State for Live link editing
    const [isEditingLive, setIsEditingLive] = useState(false);
    const [liveInputValue, setLiveInputValue] = useState(deal.live_link || "");

    // State for company selection modal visibility
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

    // Auth and Company data hooks for filtering available companies
    const { user } = useAuth();
    const { companies = [] } = useCompanies();

    // Filter companies relevant to the current user's client ID
    const filteredCompanies = companies.filter(
        (c: CompanyWithRelations) => user && c.client_id === user.id
    );
    // Find the currently associated company based on deal.company_id
    const currentCompany = deal.company_id ? companies.find(c => c.id === deal.company_id) : null;

    // Handles saving the Instagram link (in a real app, this would update the backend)
    const handleSaveInstagram = () => {
        // Placeholder for actual API call or state update to parent deal object
        setIsEditingInstagram(false);
    };

    // Handles canceling Instagram link edit, reverting to original value
    const handleCancelInstagram = () => {
        setInstagramInputValue(deal.instagram_link || "");
        setIsEditingInstagram(false);
    };

    // Handles saving the Live link (in a real app, this would update the backend)
    const handleSaveLive = () => {
        // Placeholder for actual API call or state update to parent deal object
        setIsEditingLive(false);
    };

    // Handles canceling Live link edit, reverting to original value
    const handleCancelLive = () => {
        setLiveInputValue(deal.live_link || "");
        setIsEditingLive(false);
    };

    // Handles company selection from the modal (in a real app, this would update the parent deal object)
    const handleCompanySelect = (companyId: string) => {
        console.log("Selected company ID:", companyId); // Log for demonstration
        setIsCompanyModalOpen(false);
    };

    // Generates a deterministic ToyFace avatar based on the deal ID
    const toyNumber = 1 + ((Array.from(deal.id) as string[]).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 18);
    const avatarUrl = ``; // Placeholder for actual avatar URL if available

    return (
        <Card className="border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardContent className="p-5">
                {/* Client Avatar and Title Section */}
                <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-8 w-8 ring-2 ring-white shadow-md">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold p-0">
                            <ReactToyFace size={32} toyNumber={toyNumber} rounded={8} />
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base text-slate-800 ">{deal.title}</h3>
                    </div>
                </div>

                {/* Contact Information Section (User, Phone, Email) */}
                <div className="space-y-3">
                    {/* User Info */}
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg">
                            <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="flex-1 truncate font-medium">João Silva</span> {/* Placeholder for client name */}
                    </div>
                    {/* Phone Info */}
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg">
                            <Phone className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="flex-1 truncate">+55 11 99999-9999</span> {/* Placeholder for phone number */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                            <Phone className="h-4 w-4" />
                        </Button>
                    </div>
                    {/* Email Info */}
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg">
                            <Mail className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="flex-1 truncate">joao@empresa.com</span> {/* Placeholder for email address */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 transition-colors"
                        >
                            <Mail className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Separator className="my-4" />
                {/* Company Information Section with Company Selector Modal */}
                <div className="space-y-3 ">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-600 mb-1">Empresa</h4>
                    </div>
                    <div className="flex justify-between items-center gap-3 text-sm text-slate-600 bg-blue-50 rounded">
                        <div className=" flex items-center gap-3 text-sm text-slate-600">

                            <div className="flex items-center justify-center w-10 h-14 bg-blue-100 rounded">
                                <Building2 className="h-5 w-5 text-blue-600" />
                            </div>

                            <div>
                                <p className="text-sm font-medium text-slate-700">
                                    Nome da Empresa
                                </p>
                                <div className="text-xs text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <span className="font-sm text-slate-500">CNPJ:</span>
                                        <span className="font-sm text-slate-500">0000000000</span>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* O codigo abaixo vai mostrar os dados da empresa, se houver empresa */}
                        {/*
                        {currentCompany ? (
                            <div className="space-y-2">
                                <p className="text-lg font-bold text-blue-700">
                                    {currentCompany.name}
                                </p>
                                <div className="space-y-2 text-sm text-slate-700">
                                    {currentCompany.cnpj && (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-500">CNPJ:</span>
                                            <span className="truncate">{currentCompany.cnpj}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Button
                                variant="link"
                                size="sm"
                                className="flex-1 h-auto p-0 justify-start text-sm text-blue-600 font-medium hover:underline"
                                onClick={() => setIsCompanyModalOpen(true)}
                            >
                                Adicionar Empresa
                            </Button>
                        )}
                        */}
                        
                        {/* Edit button to open company selection modal */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            onClick={() => setIsCompanyModalOpen(true)}
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                    </div>
                    {/* Company Selector Modal */}
                    <Dialog open={isCompanyModalOpen} onOpenChange={setIsCompanyModalOpen}>
                        <DialogContent className="max-w-md z-[1100]" style={{ zIndex: 1100 }}>
                            <CompanySelector
                                value={deal.company_id || ""} // Current selected company ID
                                options={filteredCompanies.map((c: CompanyWithRelations) => ({ id: c.id, name: c.name }))} // Options for the selector
                                onChange={handleCompanySelect} // Callback on company selection
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <Separator className="my-4" />

                {/* Other Information Section (Instagram, Live Link) with inline editing */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-600 mb-1">Outras Informações</h4>

                    {/* Instagram Link Section */}
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg">
                            <Instagram className="h-4 w-4 text-pink-500" />
                        </div>
                        {/* Conditionally renders input for editing or link/add button */}
                        {isEditingInstagram ? (
                            <div className="flex flex-1 gap-2">
                                <Input
                                    value={instagramInputValue}
                                    onChange={(e) => setInstagramInputValue(e.target.value)}
                                    placeholder="Link do Instagram"
                                    className="flex-1 h-8 text-sm"
                                    onBlur={handleSaveInstagram} // Save on blur
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSaveInstagram();
                                        }
                                        if (e.key === 'Escape') {
                                            handleCancelInstagram();
                                        }
                                    }}
                                />
                                <Button size="icon" variant="ghost" className="h-8 w-8 p-0" onClick={handleSaveInstagram}>
                                    <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 p-0" onClick={handleCancelInstagram}>
                                    <X className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ) : deal.instagram_link ? (
                            <a
                                href={deal.instagram_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 truncate font-medium hover:underline text-blue-600 cursor-pointer"
                                onClick={() => setIsEditingInstagram(true)} // Click to edit existing link
                            >
                                Instagram
                            </a>
                        ) : (
                            <Button
                                variant="link"
                                size="sm"
                                className="flex-1 h-auto p-0 justify-start text-sm text-blue-600 font-medium hover:underline"
                                onClick={() => setIsEditingInstagram(true)} // Click to add new link
                            >
                                Adicionar link
                            </Button>
                        )}
                    </div>

                    {/* Live Link Section */}
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg">
                            <Link className="h-4 w-4 text-purple-500" />
                        </div>
                        {/* Conditionally renders input for editing or link/add button */}
                        {isEditingLive ? (
                            <div className="flex flex-1 gap-2">
                                <Input
                                    value={liveInputValue}
                                    onChange={(e) => setLiveInputValue(e.target.value)}
                                    placeholder="Link da Live"
                                    className="flex-1 h-8 text-sm"
                                    onBlur={handleSaveLive} // Save on blur
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSaveLive();
                                        }
                                        if (e.key === 'Escape') {
                                            handleCancelLive();
                                        }
                                    }}
                                />
                                <Button size="icon" variant="ghost" className="h-8 w-8 p-0" onClick={handleSaveLive}>
                                    <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 p-0" onClick={handleCancelLive}>
                                    <X className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ) : deal.live_link ? (
                            <a
                                href={deal.live_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 truncate font-medium hover:underline text-blue-600 cursor-pointer"
                                onClick={() => setIsEditingLive(true)} // Click to edit existing link
                            >
                                Link da Live
                            </a>
                        ) : (
                            <Button
                                variant="link"
                                size="sm"
                                className="flex-1 h-auto p-0 justify-start text-sm text-blue-600 font-medium hover:underline"
                                onClick={() => setIsEditingLive(true)} // Click to add new link
                            >
                                Adicionar link
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}