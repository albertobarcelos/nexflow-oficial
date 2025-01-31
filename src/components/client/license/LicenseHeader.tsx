import { License } from "@/types/database";

interface LicenseHeaderProps {
  license: License;
}

export function LicenseHeader({ license }: LicenseHeaderProps) {
  return (
    <div>
      <h4 className="font-medium">Plano {license.type === 'premium' ? 'Premium' : 'Gratuito'}</h4>
      <p className="text-sm text-muted-foreground">
        Expira em: {new Date(license.expiration_date).toLocaleDateString('pt-BR')}
      </p>
    </div>
  );
}
