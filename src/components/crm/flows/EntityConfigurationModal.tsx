// =====================================================
// MODAL DE CONFIGURAÇÃO COMPLETA DE ENTITIES
// =====================================================
// AIDEV-NOTE: Modal centralizado para todas as configurações de entidade
// Inclui abas para estrutura, relacionamentos, visualizações, etc.

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Database, 
  Link, 
  Eye, 
  Zap, 
  Users, 
  Code,
  Save,
  X,
  Plus,
  Edit,
  Trash2,
  Settings
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface EntityConfigurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityName: string;
}

interface EntityData {
  id: string;
  name: string;
  description?: string;
  table_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EntityField {
  id: string;
  name: string;
  field_type: string;
  is_required: boolean;
  is_unique: boolean;
  default_value?: string;
  validation_rules?: any;
}

interface EntityRelationship {
  id: string;
  name: string;
  related_entity_id: string;
  relationship_type: 'one_to_one' | 'one_to_many' | 'many_to_many';
  foreign_key: string;
}

export function EntityConfigurationModal({ 
  open, 
  onOpenChange, 
  entityId, 
  entityName 
}: EntityConfigurationModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('structure');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para dados da entidade
  const [entityData, setEntityData] = useState<EntityData | null>(null);
  const [fields, setFields] = useState<EntityField[]>([]);
  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  
  // Estados para formulários
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    table_name: '',
    is_active: true
  });

  // =====================================================
  // CARREGAR DADOS DA ENTIDADE
  // =====================================================
  useEffect(() => {
    if (open && entityId) {
      loadEntityData();
    }
  }, [open, entityId]);

  const loadEntityData = async () => {
    setIsLoading(true);
    try {
      // Carregar dados básicos da entidade
      const { data: entity, error: entityError } = await supabase
        .from('web_entities')
        .select('*')
        .eq('id', entityId)
        .single();

      if (entityError) throw entityError;

      setEntityData(entity);
      setFormData({
        name: entity.name || '',
        description: entity.description || '',
        table_name: entity.table_name || '',
        is_active: entity.is_active ?? true
      });

      // Carregar campos
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('web_entity_fields')
        .select('*')
        .eq('entity_id', entityId)
        .order('created_at');

      if (fieldsError) throw fieldsError;
      setFields(fieldsData || []);

      // Carregar relacionamentos
      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from('web_entity_relationships')
        .select('*')
        .eq('source_entity_id', entityId);

      if (relationshipsError) throw relationshipsError;
      setRelationships(relationshipsData || []);

    } catch (error) {
      console.error('Erro ao carregar dados da entidade:', error);
      toast.error('Erro ao carregar configurações da entidade');
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // SALVAR CONFIGURAÇÕES GERAIS
  // =====================================================
  const saveGeneralSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('web_entities')
        .update({
          name: formData.name,
          description: formData.description,
          table_name: formData.table_name,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', entityId);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
      await loadEntityData(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  // =====================================================
  // OBTER TIPO DE CAMPO FORMATADO
  // =====================================================
  const getFieldTypeDisplay = (fieldType: string) => {
    const types: Record<string, string> = {
      'text': 'Texto',
      'number': 'Número',
      'email': 'E-mail',
      'phone': 'Telefone',
      'date': 'Data',
      'datetime': 'Data/Hora',
      'boolean': 'Sim/Não',
      'select': 'Seleção',
      'multiselect': 'Múltipla Seleção',
      'textarea': 'Texto Longo',
      'file': 'Arquivo',
      'url': 'URL'
    };
    return types[fieldType] || fieldType;
  };

  // =====================================================
  // OBTER TIPO DE RELACIONAMENTO FORMATADO
  // =====================================================
  const getRelationshipTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      'one_to_one': 'Um para Um',
      'one_to_many': 'Um para Muitos',
      'many_to_many': 'Muitos para Muitos'
    };
    return types[type] || type;
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando configurações...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Configurações da Entidade: {entityName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="structure" className="flex items-center gap-1">
              <Database className="w-4 h-4" />
              Estrutura
            </TabsTrigger>
            <TabsTrigger value="relationships" className="flex items-center gap-1">
              <Link className="w-4 h-4" />
              Relacionamentos
            </TabsTrigger>
            <TabsTrigger value="views" className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              Visualizações
            </TabsTrigger>
            <TabsTrigger value="automations" className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Automações
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Permissões
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-1">
              <Code className="w-4 h-4" />
              API
            </TabsTrigger>
          </TabsList>

          {/* ABA ESTRUTURA */}
          <TabsContent value="structure" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Entidade</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome da entidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="table_name">Nome da Tabela</Label>
                    <Input
                      id="table_name"
                      value={formData.table_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, table_name: e.target.value }))}
                      placeholder="nome_da_tabela"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da entidade"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="status"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="status">
                    {formData.is_active ? 'Entidade Ativa' : 'Entidade Inativa'}
                  </Label>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveGeneralSettings} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Campos da Entidade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Campos da Entidade
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{fields.length} campos</Badge>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Campo
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Nenhum campo configurado</p>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Campo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{field.name}</h4>
                            <Badge variant="secondary">
                              {getFieldTypeDisplay(field.field_type)}
                            </Badge>
                            {field.is_required && (
                              <Badge variant="destructive" className="text-xs">
                                Obrigatório
                              </Badge>
                            )}
                            {field.is_unique && (
                              <Badge variant="outline" className="text-xs">
                                Único
                              </Badge>
                            )}
                          </div>
                          {field.default_value && (
                            <p className="text-sm text-gray-600 mt-1">
                              Valor padrão: {field.default_value}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA RELACIONAMENTOS */}
          <TabsContent value="relationships" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Relacionamentos
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{relationships.length} relacionamentos</Badge>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Relacionamento
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relationships.length === 0 ? (
                  <div className="text-center py-8">
                    <Link className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Nenhum relacionamento configurado</p>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Relacionamento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {relationships.map((relationship) => (
                      <div key={relationship.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{relationship.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">
                              {getRelationshipTypeDisplay(relationship.relationship_type)}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              Chave: {relationship.foreign_key}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA VISUALIZAÇÕES */}
          <TabsContent value="views" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Visualização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Configure como os dados desta entidade são exibidos nas diferentes telas.
                  </p>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      🚧 Funcionalidade em desenvolvimento
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA AUTOMAÇÕES */}
          <TabsContent value="automations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automações da Entidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Configure automações que são executadas quando dados desta entidade são modificados.
                  </p>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      🚧 Funcionalidade em desenvolvimento
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA PERMISSÕES */}
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Controle de Acesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Configure quem pode visualizar, criar, editar e excluir registros desta entidade.
                  </p>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      🚧 Funcionalidade em desenvolvimento
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA API */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API e Integrações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Configure endpoints de API e integrações externas para esta entidade.
                  </p>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      🚧 Funcionalidade em desenvolvimento
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}