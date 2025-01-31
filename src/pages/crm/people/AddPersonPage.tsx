import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePeople } from "@/hooks/usePeople";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "@/hooks/useLocation";
import { CompanySelect } from "@/components/crm/people/CompanySelect";
import { useUsers } from "@/hooks/useUsers";

interface AddressData {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

type PersonType = "LEAD" | "CLIENTE" | "COLABORADOR";

// Funções de formatação
const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .substr(0, 14);
};

const formatRG = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1})/, '$1-$2')
    .substr(0, 12);
};

const formatCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substr(0, 9);
};

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substr(0, 14);
  } else {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substr(0, 15);
  }
};

export function AddPersonPage() {
  const navigate = useNavigate();
  const { addPerson } = usePeople();
  const { users = [], currentUser, isLoading: isLoadingUsers } = useUsers();
  const { states, isLoadingStates, getCitiesByState, fetchCitiesByStateId } = useLocation();
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedResponsavelId, setSelectedResponsavelId] = useState<string>(currentUser?.id || "");
  const { data: cities = [], isLoading: isLoadingCities } = getCitiesByState(selectedStateId || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    e.target.value = formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    e.target.value = formatted;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    e.target.value = formatted;
  };

  const handleRGChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRG(e.target.value);
    e.target.value = formatted;
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data: AddressData = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      // Preencher os campos com os dados do CEP
      const form = e.target.form as HTMLFormElement;
      if (form) {
        form.querySelector<HTMLInputElement>('input[name="rua"]')!.value = data.logradouro;
        form.querySelector<HTMLInputElement>('input[name="bairro"]')!.value = data.bairro;

        // Encontrar o estado correspondente
        const state = states.find(s => s.uf.toLowerCase() === data.uf.toLowerCase());
        if (state) {
          setSelectedStateId(state.id);
          
          try {
            // Buscar cidades usando a função não-hook
            const cityData = await fetchCitiesByStateId(state.id);
            
            // Normalizar o nome da cidade do CEP
            const normalizedViaCepCity = data.localidade
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim();
            
            // Encontrar a cidade correspondente
            const city = cityData.find(c => {
              const normalizedCityName = c.name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim();
              return normalizedCityName === normalizedViaCepCity;
            });

            if (city) {
              setSelectedCityId(city.id.toString());
            } else {
              console.warn("Cidade não encontrada:", data.localidade);
              toast.error("Cidade não encontrada automaticamente. Por favor, selecione manualmente.");
            }
          } catch (error) {
            console.error("Erro ao buscar cidades:", error);
            toast.error("Erro ao buscar cidades do estado");
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const personData = {
        name: formData.get("name") as string,
        cpf: formData.get("cpf") as string || undefined,
        rg: formData.get("rg") as string || undefined,
        person_type: formData.get("person_type") as PersonType || undefined,
        cargo: formData.get("cargo") as string || undefined,
        company_id: selectedCompanyId || undefined,
        responsavel_id: selectedResponsavelId || undefined,
        description: formData.get("description") as string || undefined,
        email: formData.get("email") as string,
        whatsapp: formData.get("whatsapp") as string || undefined,
        celular: formData.get("celular") as string || undefined,
        cep: formData.get("cep") as string || undefined,
        estado: selectedStateId || undefined,
        cidade: selectedCityId || undefined,
        bairro: formData.get("bairro") as string || undefined,
        rua: formData.get("rua") as string || undefined,
        numero: formData.get("numero") as string || undefined,
        complemento: formData.get("complemento") as string || undefined,
      };

      // Validar campos obrigatórios
      if (!personData.name || !personData.email) {
        toast.error("Nome e email são campos obrigatórios");
        return;
      }

      await addPerson.mutateAsync(personData);
      navigate("/crm/people");
    } catch (error) {
      console.error("Error creating person:", error);
      toast.error("Erro ao criar pessoa");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para mudança de estado
  const handleStateChange = (value: string) => {
    console.log("Estado selecionado:", value);
    setSelectedStateId(value);
    setSelectedCityId(""); // Resetar cidade ao mudar estado
  };

  // Handler para mudança de cidade
  const handleCityChange = (value: string) => {
    console.log("Cidade selecionada:", value);
    setSelectedCityId(value);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto pb-8">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold">Adicionar nova pessoa</h1>
      </div>

      <div className="space-y-8">
        {/* Dados Básicos */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-1">Dados básicos</h2>
            <p className="text-sm text-muted-foreground">
              Informações essenciais para identificação da pessoa.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8">
            {/* Upload de Foto */}
            <div className="flex flex-col items-center">
              <div className="w-[120px] h-[120px] border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <button type="button" className="text-primary text-sm mt-2">
                Adicionar foto
              </button>
            </div>

            {/* Campos Básicos */}
            <div className="flex-1 grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input name="name" placeholder="Nome completo" required />
                <Input 
                  name="cpf" 
                  placeholder="000.000.000-00" 
                  onChange={handleCPFChange} 
                />
              </div>

              <Select name="cargo" required>
                <SelectTrigger>
                  <SelectValue placeholder="Cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                  <SelectItem value="PROPRIETARIO">Proprietário</SelectItem>
                  <SelectItem value="CONTATO">Contato</SelectItem>
                </SelectContent>
              </Select>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Empresa Vinculada</Label>
                  <CompanySelect 
                    value={selectedCompanyId} 
                    onChange={(value) => setSelectedCompanyId(value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Select 
                    name="responsavel" 
                    value={selectedResponsavelId}
                    onChange={(value) => setSelectedResponsavelId(value)}
                    disabled={isLoadingUsers}
                  >
                    <SelectTrigger>
                      {isLoadingUsers ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Carregando...</span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Selecione o responsável" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Textarea 
                name="description"
                placeholder="Descrição da pessoa"
                className="min-h-[100px]"
              />
            </div>
          </div>
        </section>

        {/* Informações para Contato */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Informações para contato</h2>
            <p className="text-sm text-muted-foreground">
              Dados de contato principais da pessoa.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input name="email" placeholder="Email" type="email" required />
            <Input name="whatsapp" placeholder="WhatsApp" required onChange={handlePhoneChange} />
            <Input name="celular" placeholder="Celular" onChange={handlePhoneChange} />
          </div>
        </section>

        {/* Dados do Endereço */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Endereço</h2>
            <p className="text-sm text-muted-foreground">
              Localização da pessoa.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input 
              name="cep" 
              placeholder="CEP" 
              required 
              onChange={handleCepChange}
              onBlur={handleCepBlur} 
            />
            <Input name="pais" defaultValue="Brasil" required />
            
            <Select 
              name="estado" 
              value={selectedStateId || undefined} 
              onChange={(value) => handleStateChange(value)}
            >
              <SelectTrigger disabled={isLoadingStates}>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                {states.map(state => (
                  <SelectItem key={state.id} value={state.id}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              name="cidade" 
              value={selectedCityId || undefined}
              onChange={(value) => handleCityChange(value)}
            >
              <SelectTrigger disabled={!selectedStateId || isLoadingCities}>
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                {cities.map(city => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input name="bairro" placeholder="Bairro" required />
            <Input name="rua" placeholder="Rua" required />
            <Input name="numero" placeholder="Número" required />
            <Input name="complemento" placeholder="Complemento" />
          </div>
        </section>

        {/* Privacidade */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Privacidade</h2>
            <p className="text-sm text-muted-foreground">
              Defina quem pode ver esta pessoa.
            </p>
          </div>

          <RadioGroup defaultValue="todos" name="privacidade" className="grid gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="todos" id="todos" />
              <Label htmlFor="todos">Todos podem ver</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="somente-eu" id="somente-eu" />
              <Label htmlFor="somente-eu">Somente eu posso ver</Label>
            </div>
          </RadioGroup>
        </section>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/crm/people")}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar pessoa"}
          </Button>
        </div>
      </div>
    </form>
  );
} 