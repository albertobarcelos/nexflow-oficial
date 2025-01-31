import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ClientFormHeaderProps {
  id?: string;
}

export function ClientFormHeader({ id }: ClientFormHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold">
        {id ? 'Editar Cliente' : 'Novo Cliente'}
      </h1>
      <p className="text-muted-foreground">
        {id ? 'Atualize os dados do cliente' : 'Cadastre um novo cliente'}
      </p>
    </div>
  );
}
