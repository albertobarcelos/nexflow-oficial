import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BarChart3, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResellerReports() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-600 mt-1">
          Análises e relatórios sobre sua performance
        </p>
      </div>

      {/* Tipos de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Relatório de Clientes
            </CardTitle>
            <CardDescription>
              Análise detalhada da sua carteira de clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                • Total de clientes por status<br/>
                • Crescimento mensal<br/>
                • Distribuição por planos
              </div>
              <Button variant="outline" className="w-full" disabled>
                <Download className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Relatório de Comissões
            </CardTitle>
            <CardDescription>
              Histórico e projeções de comissões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                • Comissões por período<br/>
                • Comparativo mensal<br/>
                • Projeções futuras
              </div>
              <Button variant="outline" className="w-full" disabled>
                <Download className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Relatório Executivo
            </CardTitle>
            <CardDescription>
              Resumo executivo da sua performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                • KPIs principais<br/>
                • Metas vs. Resultados<br/>
                • Insights e recomendações
              </div>
              <Button variant="outline" className="w-full" disabled>
                <Download className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Recentes</CardTitle>
          <CardDescription>
            Histórico dos relatórios gerados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Nenhum relatório gerado ainda
            </h3>
            <p className="text-gray-600">
              Os relatórios gerados aparecerão aqui para download
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 