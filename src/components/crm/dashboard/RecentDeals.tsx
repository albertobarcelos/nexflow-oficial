import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeals } from "@/hooks/useDeals";

export function RecentDeals() {
  const { deals, loading, fetchDeals } = useDeals();

  useEffect(() => {
    fetchDeals();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Negócios Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pipeline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : deals?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Nenhum negócio encontrado
                </TableCell>
              </TableRow>
            ) : (
              deals?.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>{deal.title}</TableCell>
                  <TableCell>{deal.company}</TableCell>
                  <TableCell>{deal.value}</TableCell>
                  <TableCell>{deal.status}</TableCell>
                  <TableCell>{deal.pipeline}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 
