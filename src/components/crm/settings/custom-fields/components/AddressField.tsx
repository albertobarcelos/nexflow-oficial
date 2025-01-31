import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface AddressFieldProps {
  value: any;
  onChange: (value: any) => void;
  isRequired?: boolean;
}

interface State {
  id: string;
  name: string;
  uf: string;
}

interface City {
  id: string;
  name: string;
}

export function AddressField({ value, onChange, isRequired }: AddressFieldProps) {
  const [zipCode, setZipCode] = useState(value?.zip_code || "");
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Buscar estados
  const { data: states } = useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('states')
        .select('id, name, uf')
        .order('name');

      if (error) throw error;
      return data as State[];
    }
  });

  // Buscar cidades do estado selecionado
  const { data: cities } = useQuery({
    queryKey: ['cities', value?.state_id],
    enabled: !!value?.state_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name')
        .eq('state_id', value.state_id)
        .order('name');

      if (error) throw error;
      return data as City[];
    }
  });

  const searchCep = async () => {
    if (!zipCode || zipCode.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
      const data = await response.json();

      if (!data.erro) {
        // Buscar estado pelo UF
        const { data: stateData } = await supabase
          .from('states')
          .select('id, name')
          .eq('uf', data.uf)
          .single();

        if (stateData) {
          // Buscar cidade pelo nome e estado
          const { data: cityData } = await supabase
            .from('cities')
            .select('id, name')
            .eq('state_id', stateData.id)
            .ilike('name', data.localidade)
            .single();

          onChange({
            ...value,
            zip_code: zipCode,
            street: data.logradouro,
            neighborhood: data.bairro,
            state_id: stateData.id,
            city_id: cityData?.id,
            complement: data.complemento
          });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsLoadingCep(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Label>CEP</Label>
          <div className="flex gap-2">
            <Input
              value={zipCode}
              onChange={(e) => {
                const onlyNumbers = e.target.value.replace(/\D/g, '');
                setZipCode(onlyNumbers);
                if (onlyNumbers.length === 8) {
                  searchCep();
                }
              }}
              maxLength={8}
              placeholder="00000000"
              required={isRequired}
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={searchCep}
              disabled={zipCode.length !== 8 || isLoadingCep}
            >
              {isLoadingCep ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Estado</Label>
          <Select
            value={value?.state_id || ""}
            onValueChange={(state_id) => {
              onChange({ ...value, state_id, city_id: undefined });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um estado" />
            </SelectTrigger>
            <SelectContent>
              {states?.map((state) => (
                <SelectItem key={state.id} value={state.id}>
                  {state.name} ({state.uf})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Cidade</Label>
          <Select
            value={value?.city_id || ""}
            onValueChange={(city_id) => {
              onChange({ ...value, city_id });
            }}
            disabled={!value?.state_id}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma cidade" />
            </SelectTrigger>
            <SelectContent>
              {cities?.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Rua</Label>
        <Input
          value={value?.street || ""}
          onChange={(e) => onChange({ ...value, street: e.target.value })}
          required={isRequired}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Número</Label>
          <Input
            value={value?.number || ""}
            onChange={(e) => onChange({ ...value, number: e.target.value })}
          />
        </div>

        <div>
          <Label>Complemento</Label>
          <Input
            value={value?.complement || ""}
            onChange={(e) => onChange({ ...value, complement: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label>Bairro</Label>
        <Input
          value={value?.neighborhood || ""}
          onChange={(e) => onChange({ ...value, neighborhood: e.target.value })}
        />
      </div>
    </div>
  );
} 
