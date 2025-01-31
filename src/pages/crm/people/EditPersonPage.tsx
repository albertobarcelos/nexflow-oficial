import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

export function EditPersonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { people, updatePerson } = usePeople();
  const { users = [], currentUser, isLoading: isLoadingUsers } = useUsers();
  const { 
    states, 
    cities, 
    isLoadingStates, 
    isLoadingCities, 
    selectedStateId, 
    setSelectedStateId, 
    selectedCityId, 
    setSelectedCityId 
  } = useLocation();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedResponsavelId, setSelectedResponsavelId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Buscar dados da pessoa
  const person = people?.find(p => p.id === id);

  useEffect(() => {
    if (!person) {
      toast.error("Pessoa não encontrada");
      navigate("/crm/people");
      return;
    }

    // Preencher estado e cidade
    if (person.estado) {
      setSelectedStateId(person.estado);
    }
    if (person.cidade) {
      setSelectedCityId(person.cidade);
    }

    // Preencher empresa e responsável
    if (person.company_id) {
      setSelectedCompanyId(person.company_id);
    }
    if (person.responsavel_id) {
      setSelectedResponsavelId(person.responsavel_id);
    }
  }, [person, navigate, setSelectedStateId, setSelectedCityId]);

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

  const handleCepBlur = async () => {
    const cepInput = document.querySelector('input[name="cep"]') as HTMLInputElement;
    const cep = cepInput.value.replace(/\D/g, '');

    if (cep.length !== 8) {
      toast.error('CEP inválido');
      return;
    }

    setIsLoadingCep(true);

    try {
      // 1. Buscar dados do CEP
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      // 2. Preencher campos de endereço
      const form = document.querySelector('form') as HTMLFormElement;
      if (form) {
        const logradouroInput = form.querySelector('input[name="logradouro"]') as HTMLInputElement;
        const bairroInput = form.querySelector('input[name="bairro"]') as HTMLInputElement;
        
        if (logradouroInput) logradouroInput.value = data.logradouro || '';
        if (bairroInput) bairroInput.value = data.bairro || '';

        // 3. Encontrar o estado correspondente
        console.log('Procurando estado:', data.uf);
        const state = states?.find(s => s.uf.toLowerCase() === data.uf.toLowerCase());
        console.log('Estado encontrado:', state);
        
        if (state) {
          // 4. Setar o estado
          setSelectedStateId(state.id);
          
          // 5. Aguardar as cidades serem carregadas
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 6. Normalizar nomes para comparação
          const normalizedViaCepCity = data.localidade
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
          
          console.log('Cidade do ViaCEP normalizada:', normalizedViaCepCity);
          
          // 7. Encontrar a cidade correspondente
          const city = cities?.find(c => {
            const normalizedCityName = c.name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim();
            console.log('Comparando com:', normalizedCityName);
            return normalizedCityName === normalizedViaCepCity;
          });
          
          console.log('Cidade encontrada:', city);

          // 8. Setar a cidade se encontrada
          if (city) {
            setSelectedCityId(city.id);
          } else {
            console.warn('Cidade não encontrada:', data.localidade);
            toast.error('Cidade não encontrada automaticamente. Por favor, selecione manualmente.');
          }
        } else {
          console.warn('Estado não encontrado:', data.uf);
          toast.error('Estado não encontrado. Por favor, selecione manualmente.');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP');
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
        id: person?.id,
        name: formData.get("name") as string,
        cpf: formData.get("cpf") as string || undefined,
        cargo: formData.get("cargo") as string || undefined,
        categoria: formData.get("categoria") as string || undefined,
        company_id: selectedCompanyId || undefined,
        responsavel_id: selectedResponsavelId || undefined,
        description: formData.get("description") as string || undefined,
        email: formData.get("email") as string || undefined,
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
      if (!personData.name || !personData.categoria || !personData.cargo || !personData.whatsapp) {
        toast.error("Nome, categoria, cargo e whatsapp são campos obrigatórios");
        return;
      }

      try {
        await updatePerson(personData);
        navigate("/crm/people");
      } catch (error) {
        console.error("Error updating person:", error);
        toast.error("Erro ao atualizar pessoa");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para mudança de estado
  const handleStateChange = (value: string) => {
    console.log("Estado selecionado:", value);
    setSelectedStateId(value);
    setSelectedCityId(null); // Resetar cidade ao mudar estado
  };

  // Handler para mudança de cidade
  const handleCityChange = (value: string) => {
    console.log("Cidade selecionada:", value);
    setSelectedCityId(value);
  };

  if (!person) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto pb-8">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold">Editar pessoa</h1>
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
                <Input 
                  name="name" 
                  placeholder="Nome completo" 
                  required 
                  defaultValue={person.name}
                />
                <Input 
                  name="cpf" 
                  placeholder="000.000.000-00" 
                  onChange={handleCPFChange} 
                  defaultValue={person.cpf || ""}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Categoria <span className="text-red-500">*</span></Label>
                  <Select 
                    name="categoria" 
                    defaultValue={person.categoria}
                    required
                  >
                    <SelectTrigger className={!person.categoria ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLIENTE">Cliente</SelectItem>
                      <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
                      <SelectItem value="FUNCIONARIO">Funcionário</SelectItem>
                      <SelectItem value="OUTRO">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  {!person.categoria && (
                    <p className="text-sm text-red-500 mt-1">Categoria é obrigatória</p>
                  )}
                </div>

                <div>
                  <Label>Cargo <span className="text-red-500">*</span></Label>
                  <Select 
                    name="cargo" 
                    defaultValue={person.cargo || undefined}
                    required
                  >
                    <SelectTrigger className={!person.cargo ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                      <SelectItem value="PROPRIETARIO">Proprietário</SelectItem>
                      <SelectItem value="CONTATO">Contato</SelectItem>
                    </SelectContent>
                  </Select>
                  {!person.cargo && (
                    <p className="text-sm text-red-500 mt-1">Cargo é obrigatório</p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Empresa Vinculada</Label>
                  <CompanySelect
                    value={selectedCompanyId}
                    onChange={setSelectedCompanyId}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <Select
                    name="responsavel"
                    value={selectedResponsavelId}
                    onValueChange={setSelectedResponsavelId}
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
                defaultValue={person.description || ""}
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
            <Input 
              name="email" 
              placeholder="Email" 
              type="email" 
              defaultValue={person.email}
            />
            <Input 
              name="whatsapp" 
              placeholder="WhatsApp" 
              required 
              onChange={handlePhoneChange} 
              defaultValue={person.whatsapp || ""}
            />
            <Input 
              name="celular" 
              placeholder="Celular" 
              onChange={handlePhoneChange} 
              defaultValue={person.celular || ""}
            />
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
              onChange={handleCepChange}
              onBlur={handleCepBlur} 
              defaultValue={person.cep || ""}
            />
            <Input name="pais" defaultValue="Brasil" />

            <Select 
              name="estado" 
              value={selectedStateId || undefined}
              onValueChange={handleStateChange}
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
              onValueChange={handleCityChange}
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

            <Input 
              name="bairro" 
              placeholder="Bairro" 
              defaultValue={person.bairro || ""}
            />
            <Input 
              name="rua" 
              placeholder="Rua" 
              defaultValue={person.rua || ""}
            />
            <Input 
              name="numero" 
              placeholder="Número" 
              defaultValue={person.numero || ""}
            />
            <Input 
              name="complemento" 
              placeholder="Complemento" 
              defaultValue={person.complemento || ""}
            />
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
            {isSubmitting ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </form>
  );
}