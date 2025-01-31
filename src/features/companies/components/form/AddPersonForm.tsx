import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface AddPersonFormProps {
  onSubmit: (data: {
    name: string;
    email?: string;
    phone?: string;
    role?: string;
    type: string;
  }) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export default function AddPersonForm({ onSubmit, onCancel, loading }: AddPersonFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [type, setType] = useState("contact");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome da pessoa",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSubmit({
        name,
        email,
        phone,
        role,
        type,
      });

      // Limpar formulário
      setName("");
      setEmail("");
      setPhone("");
      setRole("");
      setType("contact");
    } catch (error) {
      console.error("Error adding person:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da pessoa"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplo.com"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(00) 00000-0000"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Cargo</Label>
        <Input
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Ex: Gerente de Vendas"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <Select value={type} onValueChange={setType} disabled={loading}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contact">Contato</SelectItem>
            <SelectItem value="decision_maker">Decisor</SelectItem>
            <SelectItem value="influencer">Influenciador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Adicionando..." : "Adicionar Pessoa"}
        </Button>
      </div>
    </form>
  );
}