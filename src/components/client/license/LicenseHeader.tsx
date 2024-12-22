import { License } from "@/types/database";

interface LicenseHeaderProps {
  license: License;
}

export function LicenseHeader({ license }: LicenseHeaderProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">Status: {license.status}</p>
      <p className="text-sm text-muted-foreground">
        Expira em: {new Date(license.expiration_date).toLocaleDateString()}
      </p>
    </div>
  );
}