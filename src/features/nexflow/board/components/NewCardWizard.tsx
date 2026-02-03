import { useState, useCallback, useMemo } from "react";
import {
  UserPlus,
  Building2,
  Package,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { useContactsForSelect } from "@/hooks/useContactsForSelect";
import { useCreateContact } from "@/hooks/useCreateContact";
import { useCompanies } from "@/features/companies/hooks/useCompanies";
import { CompanyQuickForm } from "@/components/ui/company-quick-form";
import { ProductSelector } from "@/features/nexflow/card-details/components/ProductSelector";
import type { CardProduct } from "@/features/nexflow/card-details/types";
import { cn } from "@/lib/utils";

export interface NewCardWizardResult {
  contactIds: string[];
  contactId: string | null;
  companyId: string | null;
  companyName: string;
  products: CardProduct[];
  value: number;
}

interface NewCardWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (data: NewCardWizardResult) => Promise<void>;
  flowId: string;
  stepId: string;
  clientId: string;
}

const STEPS = [
  { id: 1, label: "Contato(s)", icon: UserPlus },
  { id: 2, label: "Empresa", icon: Building2 },
  { id: 3, label: "Produto / Orçamento", icon: Package },
] as const;

export function NewCardWizard({
  open,
  onOpenChange,
  onSuccess,
  flowId,
  stepId,
  clientId,
}: NewCardWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createContactOpen, setCreateContactOpen] = useState(false);
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [newContactClientName, setNewContactClientName] = useState("");
  const [newContactMainContact, setNewContactMainContact] = useState("");
  const [contactSearchTerm, setContactSearchTerm] = useState("");

  const { data: contacts = [] } = useContactsForSelect();
  const createContactMutation = useCreateContact();
  const { companies } = useCompanies();

  const totalValue = useMemo(
    () => products.reduce((sum, p) => sum + (p.totalValue || 0), 0),
    [products]
  );

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === companyId),
    [companies, companyId]
  );

  // Lista de contatos filtrada por pesquisa (client_name ou main_contact)
  const filteredContacts = useMemo(() => {
    const term = contactSearchTerm.trim().toLowerCase();
    if (!term) return contacts;
    return contacts.filter(
      (c) =>
        (c.client_name ?? "").toLowerCase().includes(term) ||
        (c.main_contact ?? "").toLowerCase().includes(term)
    );
  }, [contacts, contactSearchTerm]);

  const canGoNext = useMemo(() => {
    if (step === 1) return contactIds.length > 0;
    if (step === 2) return companyId != null && companyName.length > 0;
    return true;
  }, [step, contactIds.length, companyId, companyName]);

  const handleNext = useCallback(() => {
    if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3);
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  }, [step]);

  const handleCompanySelect = useCallback(
    (id: string) => {
      setCompanyId(id);
      const c = companies.find((x) => x.id === id);
      setCompanyName(c?.name ?? "");
    },
    [companies]
  );

  const handleToggleContact = useCallback((id: string, checked: boolean) => {
    setContactIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  }, []);

  const handleCreateContactSubmit = useCallback(async () => {
    if (!newContactClientName.trim() || !newContactMainContact.trim()) return;
    try {
      const created = await createContactMutation.mutateAsync({
        client_name: newContactClientName.trim(),
        main_contact: newContactMainContact.trim(),
      });
      setContactIds((prev) => [...prev, created.id]);
      setNewContactClientName("");
      setNewContactMainContact("");
      setCreateContactOpen(false);
    } catch {
      // toast já tratado no hook
    }
  }, [
    newContactClientName,
    newContactMainContact,
    createContactMutation,
  ]);

  const handleCreateCompanySuccess = useCallback(
    (company: { id: string; name: string; razao_social?: string | null }) => {
      handleCompanySelect(company.id);
      setCreateCompanyOpen(false);
    },
    [handleCompanySelect]
  );

  const handleFinish = useCallback(async () => {
    if (!canGoNext && step < 2) return;
    setIsSubmitting(true);
    try {
      await onSuccess({
        contactIds,
        contactId: contactIds[0] ?? null,
        companyId,
        companyName: companyName || selectedCompany?.name || "",
        products,
        value: totalValue,
      });
      onOpenChange(false);
      setStep(1);
      setContactIds([]);
      setCompanyId(null);
      setCompanyName("");
      setProducts([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    canGoNext,
    step,
    contactIds,
    companyId,
    companyName,
    selectedCompany?.name,
    products,
    totalValue,
    onSuccess,
    onOpenChange,
  ]);

  const resetOnClose = useCallback(() => {
    setStep(1);
    setContactIds([]);
    setCompanyId(null);
    setCompanyName("");
    setProducts([]);
    setCreateContactOpen(false);
    setCreateCompanyOpen(false);
    setNewContactClientName("");
    setNewContactMainContact("");
    setContactSearchTerm("");
  }, []);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          onOpenChange(next);
          if (!next) resetOnClose();
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => {
            if (createContactOpen || createCompanyOpen) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Novo card</DialogTitle>
            <DialogDescription className="sr-only">
              Wizard em 3 etapas: contato(s), empresa e produto ou orçamento.
            </DialogDescription>
          </DialogHeader>

          {/* Indicador de steps */}
          <div className="flex items-center gap-2 border-b border-border pb-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isPast = step > s.id;
              return (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center gap-2",
                    i > 0 && "flex-1"
                  )}
                >
                  {i > 0 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium",
                      isActive && "bg-primary text-primary-foreground",
                      isPast && "bg-primary/20 text-primary",
                      !isActive && !isPast && "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conteúdo do step */}
          <div className="min-h-[280px] py-4">
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione um ou mais contatos para o card. Você pode criar um
                  novo contato se necessário.
                </p>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    aria-hidden
                  />
                  <Input
                    type="search"
                    value={contactSearchTerm}
                    onChange={(e) => setContactSearchTerm(e.target.value)}
                    placeholder="Pesquisar contatos..."
                    aria-label="Pesquisar contatos por nome ou contato principal"
                    className={cn("pl-9")}
                  />
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                  {contacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Nenhum contato cadastrado. Crie um novo abaixo.
                    </p>
                  ) : filteredContacts.length === 0 &&
                    contactSearchTerm.trim() !== "" ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Nenhum contato encontrado para essa pesquisa.
                    </p>
                  ) : (
                    filteredContacts.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50"
                      >
                        <Checkbox
                          id={`contact-${c.id}`}
                          checked={contactIds.includes(c.id)}
                          onCheckedChange={(checked) =>
                            handleToggleContact(c.id, !!checked)
                          }
                        />
                        <Label
                          htmlFor={`contact-${c.id}`}
                          className="flex-1 cursor-pointer text-sm font-normal"
                        >
                          {c.client_name}
                          {c.main_contact && (
                            <span className="text-muted-foreground ml-1">
                              – {c.main_contact}
                            </span>
                          )}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateContactOpen(true)}
                  className="w-full"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar novo contato
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione a empresa vinculada ao card. O nome da empresa será
                  o título do card.
                </p>
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Combobox
                    items={companies.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                    value={companyId ?? ""}
                    onChange={handleCompanySelect}
                    placeholder="Selecione uma empresa"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateCompanyOpen(true)}
                  className="w-full"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Criar nova empresa
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Opcional: selecione produtos e valores para o orçamento.
                </p>
                <ProductSelector
                  clientId={clientId}
                  products={products}
                  onProductsChange={setProducts}
                  disabled={isSubmitting}
                  compact
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between pt-4 border-t border-border">
            <div>
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
              )}
            </div>
            <div>
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canGoNext}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleFinish}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Criando..." : "Criar card"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Criar novo contato */}
      <Dialog open={createContactOpen} onOpenChange={setCreateContactOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Criar novo contato</DialogTitle>
            <DialogDescription className="sr-only">
              Preencha nome ou empresa e contato principal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="new-contact-client">Nome / Empresa</Label>
              <Input
                id="new-contact-client"
                value={newContactClientName}
                onChange={(e) => setNewContactClientName(e.target.value)}
                placeholder="Ex.: Empresa XYZ"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-contact-main">Contato principal</Label>
              <Input
                id="new-contact-main"
                value={newContactMainContact}
                onChange={(e) => setNewContactMainContact(e.target.value)}
                placeholder="Ex.: João Silva"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateContactOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCreateContactSubmit}
                disabled={
                  !newContactClientName.trim() ||
                  !newContactMainContact.trim() ||
                  createContactMutation.isPending
                }
              >
                {createContactMutation.isPending ? "Criando..." : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Criar nova empresa — reutiliza CompanyQuickForm (nome, CNPJ, razão social, estado, cidade, endereço) */}
      <Dialog open={createCompanyOpen} onOpenChange={setCreateCompanyOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar nova empresa</DialogTitle>
            <DialogDescription className="sr-only">
              Preencha nome, CNPJ e demais campos da empresa.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <CompanyQuickForm
              initialName=""
              onSuccess={handleCreateCompanySuccess}
            />
            <div className="flex justify-end mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateCompanyOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
