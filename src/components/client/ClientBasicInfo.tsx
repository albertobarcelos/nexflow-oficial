import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ClientFormData } from "@/lib/validations/client";
import InputMask from "react-input-mask";

interface ClientBasicInfoProps {
  form: UseFormReturn<ClientFormData>;
}

export function ClientBasicInfo({ form }: ClientBasicInfoProps) {
  const tax_id = form.watch('tax_id');
  const isCPF = tax_id ? tax_id.replace(/[^\d]/g, '').length <= 11 : true;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="tax_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CNPJ/CPF</FormLabel>
            <FormControl>
              <InputMask
                mask={isCPF ? "999.999.999-99" : "99.999.999/9999-99"}
                value={field.value || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value);
                }}
              >
                {(inputProps: any) => (
                  <Input {...inputProps} placeholder="000.000.000-00 ou 00.000.000/0000-00" />
                )}
              </InputMask>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="company_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome da Empresa</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contact_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do Contato</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Telefone</FormLabel>
            <FormControl>
              <InputMask
                mask="(99) 99999-9999"
                value={field.value || ''}
                onChange={field.onChange}
              >
                {(inputProps: any) => (
                  <Input {...inputProps} placeholder="(00) 00000-0000" />
                )}
              </InputMask>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}