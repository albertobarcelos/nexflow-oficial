import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ClientFormActionsProps {
  id?: string;
  isSubmitting: boolean;
}

export function ClientFormActions({ id, isSubmitting }: ClientFormActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex gap-2">
      <Button type="submit" disabled={isSubmitting}>
        {id ? 'Atualizar' : 'Cadastrar'}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate('/admin/clients')}
      >
        Cancelar
      </Button>
    </div>
  );
}
