import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useLocation } from "@/hooks/useLocation"
import { useCompanies } from "@/features/companies/hooks/useCompanies"
import { ChevronDown, ChevronUp, Check } from "lucide-react"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

const companySchema = z.object({
  name: z.string().min(1, "Nome da empresa é obrigatório"),
  razao_social: z.string().optional(),
  cnpj: z.string().optional(),
  state_id: z.string().min(1, "Estado é obrigatório"),
  city_id: z.string().min(1, "Cidade é obrigatória"),
  showAddress: z.boolean().optional(),
  address: z.object({
    cep: z.string().optional(),
    rua: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
  }).optional(),
})

type CompanyForm = z.infer<typeof companySchema>

interface CompanyQuickFormProps {
  onSuccess?: (company: { id: string; name: string; razao_social?: string | null }) => void
  initialName?: string
}

export function CompanyQuickForm({ 
  onSuccess,
  initialName = ""
}: CompanyQuickFormProps) {
  const { states = [], selectedStateId, setSelectedStateId } = useLocation()
  const { createCompany } = useCompanies()
  const [showAddress, setShowAddress] = React.useState(false)
  const [openState, setOpenState] = React.useState(false)
  const [openCity, setOpenCity] = React.useState(false)

  // Buscar cidades quando o estado for selecionado
  const { data: cities = [] } = useQuery({
    queryKey: ["cities", selectedStateId],
    queryFn: async () => {
      if (!selectedStateId) return [];
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("state_id", selectedStateId)
        .order("name");

      if (error) throw error;
      return data as City[];
    },
    enabled: !!selectedStateId,
  });

  const form = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: initialName,
      razao_social: "",
      cnpj: "",
      state_id: "",
      city_id: "",
      showAddress: false,
      address: {
        cep: "",
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
      },
    },
  })

  // Atualizar cidades quando o estado mudar
  React.useEffect(() => {
    const state_id = form.watch("state_id")
    if (state_id) {
      setSelectedStateId(state_id)
      // Reset cidade quando mudar o estado
      form.setValue("city_id", "")
    }
  }, [form.watch("state_id")])

  const onSubmit = async (data: CompanyForm) => {
    try {
      const company = await createCompany({
        name: data.name,
        razao_social: data.razao_social,
        cnpj: data.cnpj,
        state_id: data.state_id,
        city_id: data.city_id,
        address: data.showAddress ? data.address : undefined
      });

      toast.success("Empresa criada com sucesso!");
      onSuccess?.(company);
    } catch (error: any) {
      console.error("Erro ao criar empresa:", error);
      toast.error(error.message || "Erro ao criar empresa");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Empresa *</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome da empresa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="razao_social"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Razão Social</FormLabel>
              <FormControl>
                <Input placeholder="Digite a razão social" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ</FormLabel>
              <FormControl>
                <Input placeholder="00.000.000/0000-00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="state_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Estado *</FormLabel>
                <Popover open={openState} onOpenChange={setOpenState}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openState}
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? states.find((state) => state.id === field.value)?.name
                          : "Selecione um estado"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar estado..." />
                      <CommandList>
                        <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
                        <CommandGroup>
                          {states.map((state) => (
                            <CommandItem
                              key={state.id}
                              value={state.name}
                              onSelect={() => {
                                form.setValue("state_id", state.id)
                                setOpenState(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === state.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {state.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Cidade *</FormLabel>
                <Popover open={openCity} onOpenChange={setOpenCity}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCity}
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={!form.watch("state_id")}
                      >
                        {field.value
                          ? cities.find((city) => city.id === field.value)?.name
                          : form.watch("state_id")
                          ? "Selecione uma cidade"
                          : "Selecione um estado primeiro"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar cidade..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                        <CommandGroup>
                          {cities.map((city) => (
                            <CommandItem
                              key={city.id}
                              value={city.name}
                              onSelect={() => {
                                form.setValue("city_id", city.id)
                                setOpenCity(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === city.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {city.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Endereço</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddress(!showAddress)}
            >
              {showAddress ? (
                <ChevronUp className="h-4 w-4 mr-2" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
              {showAddress ? "Recolher" : "Expandir"}
            </Button>
          </div>

          {showAddress && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="address.cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.rua"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rua</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite a rua" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address.numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o número" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.complemento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o complemento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address.bairro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o bairro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit">
            Salvar
          </Button>
        </div>
      </form>
    </Form>
  )
}