import { License } from "@/types/database";

interface LicensesTableProps {
  licenses: (License & { clients: { name: string; email: string; plan: string } })[];
}

export function LicensesTable({ licenses }: LicensesTableProps) {
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-4 text-left">Cliente</th>
            <th className="p-4 text-left">Plano Atual</th>
            <th className="p-4 text-left">Tipo da Licença</th>
            <th className="p-4 text-left">Status</th>
            <th className="p-4 text-left">Início</th>
            <th className="p-4 text-left">Vencimento</th>
          </tr>
        </thead>
        <tbody>
          {licenses?.map((license) => (
            <tr key={license.id} className="border-b">
              <td className="p-4">{license.clients.name}</td>
              <td className="p-4">{license.clients.plan}</td>
              <td className="p-4">{license.type}</td>
              <td className="p-4">{license.status}</td>
              <td className="p-4">
                {new Date(license.start_date).toLocaleDateString()}
              </td>
              <td className="p-4">
                {new Date(license.expiration_date).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
