import { useState, useEffect } from 'react';
import { from } from '@/integrations/db/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useCompanySegment } from '@/hooks/useCompanySegment';
import { getApiUrl } from '@/utils/apiUrl';
import { Plus, Edit, Trash2, Shield, Users, LayoutGrid, List, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  is_system: boolean;
  segmento_slug?: string | null;
  created_at: string;
  updated_at: string;
}

const SEGMENTO_LABELS: Record<string, string> = {
  oficina_mecanica: 'Oficina Mecânica',
  assistencia_tecnica: 'Assistência Técnica',
  comercio: 'Comércio',
};

interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
  category: string;
}

interface SegmentModulo {
  id: string;
  nome: string;
  slug: string;
  path?: string;
  label_menu?: string;
  ordem_menu?: number;
}

interface SegmentRecurso {
  id: string;
  modulo_id: string;
  nome: string;
  slug: string;
  permission_key?: string | null;
}

interface RoleModuloConfig {
  id: string;
  nome: string;
  slug: string;
  path?: string;
  label_menu?: string;
  link_ativo: boolean;
  ordem_menu?: number;
}

interface RoleRecursoConfig {
  id: string;
  modulo_id: string;
  nome: string;
  slug: string;
  permission_key?: string | null;
  link_ativo: boolean;
}

export function RolesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { segmentoSlug, segmentoId } = useCompanySegment();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolesPermissionsMap, setRolesPermissionsMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Map<string, boolean>>(new Map());
  const [permissionViewMode, setPermissionViewMode] = useState<'categoria' | 'segmento'>('segmento');
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    home_path: '' as string,
  });
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [roleMenuTab, setRoleMenuTab] = useState<'info' | 'modulos' | 'permissoes'>('info');
  const [roleModulos, setRoleModulos] = useState<RoleModuloConfig[]>([]);
  const [roleRecursos, setRoleRecursos] = useState<RoleRecursoConfig[]>([]);
  const [savingMenuConfig, setSavingMenuConfig] = useState(false);

  const apiUrl = getApiUrl();
  const { data: segmentRecursosData } = useQuery({
    queryKey: ['segment-recursos'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${apiUrl}/me/segment-recursos`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return { modulos: [] as SegmentModulo[], recursos: [] as SegmentRecurso[] };
      const json = await res.json();
      return { modulos: json.modulos || [], recursos: json.recursos || [] };
    },
    enabled: dialogOpen && !!segmentoId,
    staleTime: 1000 * 60 * 2,
  });
  const segmentModulos = segmentRecursosData?.modulos ?? [];
  const segmentRecursos = segmentRecursosData?.recursos ?? [];

  const { data: roleMenuConfigData } = useQuery({
    queryKey: ['role-menu-config', editingRole?.id],
    queryFn: async () => {
      if (!editingRole?.id) return null;
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${apiUrl}/roles/${editingRole.id}/menu-config`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!editingRole?.id && dialogOpen,
    staleTime: 1000 * 60 * 1,
  });
  useEffect(() => {
    if (roleMenuConfigData) {
      setRoleModulos(roleMenuConfigData.modulos || []);
      setRoleRecursos(roleMenuConfigData.recursos || []);
      setFormData((prev) => ({ ...prev, home_path: roleMenuConfigData.home_path || '' }));
    }
  }, [roleMenuConfigData]);

  useEffect(() => {
    loadData();
  }, [segmentoSlug]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar roles (globais + do segmento atual)
      const { data: rolesData, error: rolesError } = await from('roles')
        .select('*')
        .order('display_name', { ascending: true })
        .execute();

      if (rolesError) throw rolesError;
      const allRoles = (rolesData || []) as Role[];
      const filtered = allRoles.filter(
        (r) => r.segmento_slug == null || r.segmento_slug === segmentoSlug
      );
      setRoles(filtered);

      // Carregar permissões
      const { data: permsData, error: permsError } = await from('permissions')
        .select('*')
        .order('category', { ascending: true })
        .execute();

      if (permsError) throw permsError;
      setPermissions(permsData || []);

      // Carregar contagem de permissões por role
      const { data: rolePermsData } = await from('role_permissions')
        .select('role_id')
        .execute();

      if (rolePermsData) {
        const countMap = new Map<string, number>();
        rolePermsData.forEach((rp: any) => {
          countMap.set(rp.role_id, (countMap.get(rp.role_id) || 0) + 1);
        });
        setRolesPermissionsMap(countMap);
      }

      // Se estiver editando, carregar permissões do role
      if (editingRole) {
        await loadRolePermissions(editingRole.id);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar roles e permissões',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async (roleId: string) => {
    try {
      const { data, error } = await from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId)
        .execute();

      if (error) throw error;

      const permMap = new Map<string, boolean>();
      (data || []).forEach((rp: any) => {
        permMap.set(rp.permission_id, true);
      });
      setRolePermissions(permMap);
    } catch (error: any) {
      console.error('Erro ao carregar permissões do role:', error);
    }
  };

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        display_name: role.display_name,
        description: role.description || '',
        home_path: '',
      });
      setRoleModulos([]);
      setRoleRecursos([]);
      loadRolePermissions(role.id);
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        display_name: '',
        description: '',
        home_path: '',
      });
      setRolePermissions(new Map());
      setRoleModulos([]);
      setRoleRecursos([]);
    }
    setRoleMenuTab('info');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRole(null);
    setFormData({
      name: '',
      display_name: '',
      description: '',
      home_path: '',
    });
    setRolePermissions(new Map());
    setRoleModulos([]);
    setRoleRecursos([]);
  };

  const saveRoleMenuConfig = async () => {
    if (!editingRole?.id) return;
    setSavingMenuConfig(true);
    try {
      const token = localStorage.getItem('auth_token');
      const activeOrdered = roleModulos.filter((m) => m.link_ativo).sort((a, b) => (a.ordem_menu ?? 999) - (b.ordem_menu ?? 999));
      const modulosPayload = activeOrdered.map((m, i) => ({ modulo_id: m.id, ativo: true, ordem_menu: i }));
      const recursosPayload = roleRecursos.filter((r) => r.link_ativo).map((r) => ({ recurso_id: r.id, ativo: true }));
      const res = await fetch(`${apiUrl}/roles/${editingRole.id}/menu-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          modulos: modulosPayload,
          recursos: recursosPayload,
          home_path: formData.home_path || null,
        }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      toast({ title: 'Sucesso', description: 'Menu do cargo atualizado.' });
      queryClient.invalidateQueries({ queryKey: ['role-menu-config', editingRole.id] });
      queryClient.invalidateQueries({ queryKey: ['role-menu'] });
    } catch (e) {
      toast({ title: 'Erro', description: 'Não foi possível salvar o menu do cargo.', variant: 'destructive' });
    } finally {
      setSavingMenuConfig(false);
    }
  };

  const handleTogglePermission = (permissionId: string) => {
    const newMap = new Map(rolePermissions);
    if (newMap.get(permissionId)) {
      newMap.delete(permissionId);
    } else {
      newMap.set(permissionId, true);
    }
    setRolePermissions(newMap);
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.display_name) {
        toast({
          title: 'Erro',
          description: 'Nome e nome de exibição são obrigatórios',
          variant: 'destructive',
        });
        return;
      }

      let roleId: string;

      if (editingRole) {
        // Atualizar role
        const { data, error } = await from('roles')
          .update({
            display_name: formData.display_name,
            description: formData.description || null,
          })
          .eq('id', editingRole.id)
          .select('*')
          .single();

        if (error) throw error;
        roleId = data.id;
        if (roleModulos.length > 0 || roleRecursos.length > 0 || formData.home_path) {
          try {
            const token = localStorage.getItem('auth_token');
            const activeOrdered = roleModulos.filter((m) => m.link_ativo).sort((a, b) => (a.ordem_menu ?? 999) - (b.ordem_menu ?? 999));
            const modulosPayload = activeOrdered.map((m, i) => ({ modulo_id: m.id, ativo: true, ordem_menu: i }));
            const recursosPayload = roleRecursos.filter((r) => r.link_ativo).map((r) => ({ recurso_id: r.id, ativo: true }));
            await fetch(`${apiUrl}/roles/${editingRole.id}/menu-config`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
              body: JSON.stringify({ modulos: modulosPayload, recursos: recursosPayload, home_path: formData.home_path || null }),
            });
            queryClient.invalidateQueries({ queryKey: ['role-menu'] });
          } catch (_) { /* menu-config opcional */ }
        }
      } else {
        // Verificar se já existe um role com o mesmo nome no mesmo segmento
        const { data: existingRoles } = await from('roles')
          .select('id, name, segmento_slug')
          .eq('name', formData.name)
          .execute();

        const sameSegment = (existingRoles || []).find(
          (r: Role) => (r.segmento_slug ?? null) === (segmentoSlug ?? null)
        );
        if (sameSegment) {
          throw new Error(`Já existe uma função com o nome "${formData.name}" neste segmento. Por favor, escolha outro nome.`);
        }

        // Criar role (vinculado ao segmento atual quando houver)
        const { data, error } = await from('roles')
          .insert({
            name: formData.name,
            display_name: formData.display_name,
            description: formData.description || null,
            is_system: false,
            segmento_slug: segmentoSlug || null,
          })
          .select('*')
          .single();

        if (error) throw error;
        roleId = data.id;
      }

      // Atualizar permissões do role
      // Remover todas as permissões existentes (eq no DeleteBuilder para filtrar por role_id)
      const { error: deleteError } = await from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .execute();
      if (deleteError) throw deleteError;

      // Adicionar novas permissões (deduplicar por permission_id e inserir em lotes para evitar perda)
      if (rolePermissions.size > 0) {
        const uniqueIds = Array.from(new Set(rolePermissions.keys()));
        const permissionsToInsert = uniqueIds.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId,
        }));

        const BATCH_SIZE = 20;
        for (let i = 0; i < permissionsToInsert.length; i += BATCH_SIZE) {
          const batch = permissionsToInsert.slice(i, i + BATCH_SIZE);
          const { error: insertError } = await from('role_permissions')
            .insert(batch)
            .execute();
          if (insertError) throw insertError;
        }
      }

      toast({
        title: 'Sucesso',
        description: editingRole ? 'Role atualizado com sucesso' : 'Role criado com sucesso',
      });

      handleCloseDialog();
      loadData();
      queryClient.invalidateQueries({ queryKey: ['roles-for-user-form'] });
    } catch (error: any) {
      console.error('Erro ao salvar role:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar role',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;

    try {
      // Verificar se há usuários usando este role (verificar na tabela profiles)
      const { data: usersWithRole, error: usersError } = await from('profiles')
        .select('user_id')
        .eq('role', roleToDelete.name)
        .execute();

      if (usersError) {
        console.warn('Erro ao verificar usuários com role:', usersError);
      }

      const userCount = usersWithRole?.length || 0;
      
      if (userCount > 0) {
        // Avisar mas permitir continuar
        const confirmed = window.confirm(
          `ATENÇÃO: Há ${userCount} usuário(s) usando a função "${roleToDelete.display_name}".\n\n` +
          `Ao remover esta função, os usuários ficarão sem função definida.\n\n` +
          `Deseja continuar mesmo assim?`
        );
        
        if (!confirmed) {
          setDeleteDialogOpen(false);
          setRoleToDelete(null);
          return;
        }
      }

      // Limpar referências em user_position_departments (setar role_id para NULL)
      const { error: updError } = await from('user_position_departments')
        .update({ role_id: null })
        .eq('role_id', roleToDelete.id)
        .execute();

      if (updError) {
        console.warn('Erro ao limpar referências em user_position_departments:', updError);
        // Tentar deletar diretamente se update falhar
        try {
          await from('user_position_departments')
            .delete()
            .eq('role_id', roleToDelete.id)
            .execute();
        } catch (delError) {
          console.warn('Erro ao deletar referências em user_position_departments:', delError);
        }
      }

      // Deletar permissões associadas
      const { error: permError } = await from('role_permissions')
        .delete()
        .eq('role_id', roleToDelete.id)
        .execute();

      if (permError) {
        console.warn('Erro ao deletar permissões do role:', permError);
        // Continuar mesmo assim
      }

      // Excluir role
      const { error } = await from('roles')
        .delete()
        .eq('id', roleToDelete.id)
        .execute();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Função "${roleToDelete.display_name}" removida com sucesso`,
      });

      setDeleteDialogOpen(false);
      setRoleToDelete(null);
      loadData();
      queryClient.invalidateQueries({ queryKey: ['roles-for-user-form'] });
    } catch (error: any) {
      console.error('Erro ao excluir role:', error);
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Erro ao excluir função';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Verificar se é erro de constraint (usuários usando)
      if (errorMessage.includes('foreign key') || errorMessage.includes('constraint') || errorMessage.includes('violates')) {
        if (errorMessage.includes('user_position_departments')) {
          errorMessage = `Erro: há referências na tabela user_position_departments. Tente novamente - o sistema tentará limpar automaticamente.`;
        } else {
          errorMessage = `Não é possível excluir: há dados relacionados usando esta função.`;
        }
      }

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Recursos eliminados do sistema — não exibir no editor de funções:
  // - Processo: Criar/Editar/Deletar processo
  // - NPS: recurso nps ou descrição com "pesquisas NPS", "responder NPS", "NPS"
  // - Treinamentos: recurso com "training", "treinamento", "academy" ou descrição com "acessar treinamento(s)"
  const isHiddenPermission = (p: Permission) =>
    (p.resource && p.resource.toLowerCase() === 'processes') ||
    (p.description && /Criar processo|Editar processo|Deletar processo/i.test(p.description)) ||
    (p.resource && p.resource.toLowerCase() === 'nps') ||
    (p.description && /pesquisas?\s*NPS|responder.*NPS|NPS/i.test(p.description)) ||
    (p.resource && /training|treinamento|academy/i.test(p.resource)) ||
    (p.description && /acessar\s*treinamento|treinamentos?/i.test(p.description));

  // Agrupar permissões por categoria, removendo duplicatas e permissões ocultas
  const permissionsByCategory = permissions
    .filter((p) => !isHiddenPermission(p))
    .reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      const isDuplicate = acc[perm.category].some(
        (existing) => existing.resource === perm.resource && existing.action === perm.action
      );
      const isDescriptionDuplicate =
        perm.description &&
        acc[perm.category].some(
          (existing) =>
            existing.description &&
            existing.description.toLowerCase().trim() === perm.description!.toLowerCase().trim()
        );
      if (!isDuplicate && !isDescriptionDuplicate) {
        acc[perm.category].push(perm);
      }
      return acc;
    }, {} as Record<string, Permission[]>);

  const categoryLabels: Record<string, string> = {
    pdv: 'PDV - Vendas',
    assistencia: 'Assistência Técnica',
    clientes: 'Clientes',
    admin: 'Administração',
    rh: 'Recursos Humanos',
    gestao: 'Gestão',
  };

  const permissionsFiltered = permissions.filter((p) => !isHiddenPermission(p));
  const permissionKeyToId = new Map<string, string>();
  permissionsFiltered.forEach((p) => permissionKeyToId.set(`${p.resource}.${p.action}`, p.id));

  const recursosByModulo = segmentModulos.map((mod) => ({
    modulo: mod,
    recursos: segmentRecursos.filter((r) => r.modulo_id === mod.id && r.permission_key),
  })).filter((g) => g.recursos.length > 0);
  const showSegmentView = !!segmentoId && segmentModulos.length > 0 && recursosByModulo.length > 0;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Roles</h2>
          <p className="text-sm text-muted-foreground">
            Crie e gerencie roles predefinidos com permissões específicas
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funções do Sistema</CardTitle>
          <CardDescription>
            As permissões definidas aqui aplicam-se aos usuários que tiverem a função correspondente (definida ao editar o usuário).
            {segmentoSlug && (
              <> Exibidos apenas roles globais e do segmento <strong>{SEGMENTO_LABELS[segmentoSlug] || segmentoSlug}</strong>.</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => {
                // Contar permissões do role
                const permCount = rolesPermissionsMap.get(role.id) || 0;
                const segmentoLabel = role.segmento_slug
                  ? (SEGMENTO_LABELS[role.segmento_slug] || role.segmento_slug)
                  : 'Global';
                return (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.display_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {role.description || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {segmentoLabel}
                    </TableCell>
                    <TableCell>
                      {role.is_system ? (
                        <Badge variant="outline">Sistema</Badge>
                      ) : (
                        <Badge variant="secondary">Customizado</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{permCount} permissões</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(role)}
                          title="Editar função"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRoleToDelete(role);
                            setDeleteDialogOpen(true);
                          }}
                          title="Remover função"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de criar/editar role */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editar cargo' : 'Novo cargo'}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Configure informações, módulos do menu e permissões do cargo — como em segmentos.'
                : 'Crie um novo cargo e defina suas permissões'}
              {!editingRole && segmentoSlug && (
                <span className="block mt-1 text-muted-foreground">
                  Este cargo será do segmento: <strong>{SEGMENTO_LABELS[segmentoSlug] || segmentoSlug}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={roleMenuTab} onValueChange={(v) => setRoleMenuTab(v as 'info' | 'modulos' | 'permissoes')} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="modulos" disabled={!editingRole}>Módulos e menu</TabsTrigger>
              <TabsTrigger value="permissoes">Permissões</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="flex-1 overflow-y-auto mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome (código) *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: vendedor_senior"
                  disabled={!!editingRole}
                />
                <p className="text-xs text-muted-foreground">
                  {editingRole ? 'Nome não pode ser alterado' : 'Apenas letras minúsculas, números e underscore'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Nome de Exibição *</Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Ex: Vendedor Sênior"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o propósito deste cargo"
                rows={3}
              />
            </div>

            {editingRole && roleModulos.length > 0 && (
              <div className="space-y-2">
                <Label>Tela inicial do colaborador</Label>
                <select
                  value={formData.home_path}
                  onChange={(e) => setFormData({ ...formData, home_path: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Dashboard (padrão)</option>
                  <option value="/">/ — Dashboard</option>
                  {roleModulos.filter((m) => m.link_ativo && m.path).map((m) => (
                    <option key={m.id} value={m.path || '/'}>
                      {m.path || '/'} — {m.path === '/inventario' ? 'Inventário' : (m.label_menu || m.nome)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Ex.: vendedor pode ter PDV como tela inicial.</p>
              </div>
            )}

            </TabsContent>

            <TabsContent value="modulos" className="flex-1 overflow-y-auto mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">Ative os módulos que este cargo possui e defina a ordem no menu. Defina a tela inicial na aba Informações.</p>
              {roleModulos.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Carregando módulos do segmento...</p>
              ) : (
                <>
                  <div className="space-y-2 max-h-[240px] overflow-y-auto">
                    {(() => {
                      const activeOrdered = roleModulos.filter((m) => m.link_ativo).sort((a, b) => (a.ordem_menu ?? 999) - (b.ordem_menu ?? 999));
                      return roleModulos.map((m) => {
                        const activeIndex = activeOrdered.findIndex((x) => x.id === m.id);
                        const canMoveUp = m.link_ativo && activeIndex > 0;
                        const canMoveDown = m.link_ativo && activeIndex >= 0 && activeIndex < activeOrdered.length - 1;
                        return (
                          <div key={m.id} className="flex items-center gap-2 p-2 rounded border">
                            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                            <Switch
                              checked={!!m.link_ativo}
                              onCheckedChange={(checked) => {
                                setRoleModulos((prev) => {
                                  const next = prev.map((x) =>
                                    x.id === m.id ? { ...x, link_ativo: checked } : x
                                  );
                                  const active = next.filter((x) => x.link_ativo);
                                  return next.map((x) => {
                                    if (!x.link_ativo) return x;
                                    const i = active.findIndex((a) => a.id === x.id);
                                    return { ...x, ordem_menu: i >= 0 ? i : x.ordem_menu };
                                  });
                                });
                              }}
                            />
                            <span className="flex-1 font-medium min-w-0 truncate text-sm">
                              {m.path === '/inventario' ? 'Inventário' : (m.label_menu || m.nome)}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">{m.path || m.slug}</span>
                            <div className="flex flex-col shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={!canMoveUp}
                                onClick={() => {
                                  if (!canMoveUp) return;
                                  setRoleModulos((prev) => {
                                    const active = [...prev.filter((x) => x.link_ativo)].sort((a, b) => (a.ordem_menu ?? 999) - (b.ordem_menu ?? 999));
                                    const idx = active.findIndex((x) => x.id === m.id);
                                    if (idx <= 0) return prev;
                                    [active[idx - 1], active[idx]] = [active[idx], active[idx - 1]];
                                    const orderMap = Object.fromEntries(active.map((x, i) => [x.id, i]));
                                    return prev.map((x) => ({ ...x, ordem_menu: orderMap[x.id] ?? x.ordem_menu }));
                                  });
                                }}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={!canMoveDown}
                                onClick={() => {
                                  if (!canMoveDown) return;
                                  setRoleModulos((prev) => {
                                    const active = [...prev.filter((x) => x.link_ativo)].sort((a, b) => (a.ordem_menu ?? 999) - (b.ordem_menu ?? 999));
                                    const idx = active.findIndex((x) => x.id === m.id);
                                    if (idx < 0 || idx >= active.length - 1) return prev;
                                    [active[idx], active[idx + 1]] = [active[idx + 1], active[idx]];
                                    const orderMap = Object.fromEntries(active.map((x, i) => [x.id, i]));
                                    return prev.map((x) => ({ ...x, ordem_menu: orderMap[x.id] ?? x.ordem_menu }));
                                  });
                                }}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Recursos por módulo</Label>
                    {roleModulos.filter((m) => m.link_ativo).sort((a, b) => (a.ordem_menu ?? 999) - (b.ordem_menu ?? 999)).map((mod) => (
                      <div key={mod.id} className="pl-2 space-y-1">
                        <p className="font-medium text-sm">{mod.path === '/inventario' ? 'Inventário' : (mod.label_menu || mod.nome)}</p>
                        <div className="pl-4 space-y-1">
                          {roleRecursos.filter((r) => r.modulo_id === mod.id).map((r) => (
                            <div key={r.id} className="flex items-center gap-2 text-sm">
                              <Switch
                                checked={!!r.link_ativo}
                                onCheckedChange={(checked) => {
                                  setRoleRecursos((prev) => prev.map((x) => (x.id === r.id ? { ...x, link_ativo: checked } : x)));
                                }}
                              />
                              <span>{r.nome}</span>
                              {r.permission_key && <span className="text-xs text-muted-foreground">({r.permission_key})</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Prévia do menu: {roleModulos.filter((m) => m.link_ativo).sort((a, b) => (a.ordem_menu ?? 999) - (b.ordem_menu ?? 999)).map((m) => m.path === '/inventario' ? 'Inventário' : (m.label_menu || m.nome)).join(' → ')}</p>
                  <Button onClick={saveRoleMenuConfig} disabled={savingMenuConfig}>
                    {savingMenuConfig ? 'Salvando...' : 'Salvar menu deste cargo'}
                  </Button>
                </>
              )}
            </TabsContent>

            <TabsContent value="permissoes" className="flex-1 overflow-y-auto mt-4 space-y-4">
            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <Label className="text-base font-semibold">Permissões</Label>
                  <p className="text-xs text-muted-foreground">
                    Selecione as permissões que este role terá
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">
                    {Array.from(rolePermissions.values()).filter(Boolean).length}
                  </span>
                  {' / '}
                  {permissionsFiltered.length} selecionadas
                </div>
              </div>

              {showSegmentView ? (
                <Tabs value={permissionViewMode} onValueChange={(v) => setPermissionViewMode(v as 'categoria' | 'segmento')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="segmento" className="gap-1.5">
                      <LayoutGrid className="h-4 w-4" />
                      Por segmento (módulos)
                    </TabsTrigger>
                    <TabsTrigger value="categoria" className="gap-1.5">
                      <List className="h-4 w-4" />
                      Por categoria
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="segmento" className="mt-3">
                    <ScrollArea className="h-[420px] border rounded-md p-4">
                      <div className="space-y-5">
                        {recursosByModulo.map(({ modulo, recursos }) => {
                          const selectedInMod = recursos.filter(
                            (r) => rolePermissions.get(permissionKeyToId.get(r.permission_key!)!)
                          ).length;
                          return (
                            <div key={modulo.id} className="border-l-2 border-primary/20 pl-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  {modulo.label_menu || modulo.nome}
                                </h4>
                                <Badge variant="secondary" className="text-xs">
                                  {selectedInMod} / {recursos.length}
                                </Badge>
                              </div>
                              <div className="space-y-1.5 pl-2">
                                {recursos.map((r) => {
                                  const permId = permissionKeyToId.get(r.permission_key!);
                                  if (!permId) return null;
                                  const isChecked = rolePermissions.get(permId) || false;
                                  return (
                                    <div key={r.id} className="flex items-center gap-2 py-1 hover:bg-muted/50 rounded px-2 -mx-2">
                                      <Checkbox
                                        id={`role-seg-${r.id}`}
                                        checked={isChecked}
                                        onCheckedChange={() => handleTogglePermission(permId)}
                                      />
                                      <Label htmlFor={`role-seg-${r.id}`} className="text-sm cursor-pointer flex-1">
                                        {r.nome}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                    <p className="text-xs text-muted-foreground mt-2">
                      Mesmo sistema de liberar acessos por segmento usado nas empresas. Só aparecem recursos do seu segmento.
                    </p>
                  </TabsContent>
                  <TabsContent value="categoria" className="mt-3">
                    <ScrollArea className="h-[420px] border rounded-md p-4">
                      <div className="space-y-6">
                        {Object.entries(permissionsByCategory).map(([category, perms]) => {
                          const selectedCount = perms.filter((p) => rolePermissions.get(p.id)).length;
                          return (
                            <div key={category} className="border-l-2 border-primary/20 pl-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  {categoryLabels[category] || category}
                                </h4>
                                <Badge variant="secondary" className="text-xs">
                                  {selectedCount} / {perms.length}
                                </Badge>
                              </div>
                              <div className="space-y-2 pl-2">
                                {perms.map((perm) => {
                                  const isChecked = rolePermissions.get(perm.id) || false;
                                  return (
                                    <div key={perm.id} className="flex items-center gap-2 py-1 hover:bg-muted/50 rounded px-2 -mx-2">
                                      <Checkbox
                                        id={`role-perm-${perm.id}`}
                                        checked={isChecked}
                                        onCheckedChange={() => handleTogglePermission(perm.id)}
                                      />
                                      <Label htmlFor={`role-perm-${perm.id}`} className="text-sm cursor-pointer flex-1">
                                        {perm.description}
                                      </Label>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              ) : (
                <ScrollArea className="h-[500px] border rounded-md p-4">
                  <div className="space-y-6">
                    {Object.entries(permissionsByCategory).map(([category, perms]) => {
                      const selectedCount = perms.filter((p) => rolePermissions.get(p.id)).length;
                      return (
                        <div key={category} className="border-l-2 border-primary/20 pl-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              {categoryLabels[category] || category}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              {selectedCount} / {perms.length}
                            </Badge>
                          </div>
                          <div className="space-y-2 pl-2">
                            {perms.map((perm) => {
                              const isChecked = rolePermissions.get(perm.id) || false;
                              return (
                                <div key={perm.id} className="flex items-center gap-2 py-1 hover:bg-muted/50 rounded px-2 -mx-2">
                                  <Checkbox
                                    id={`role-perm-${perm.id}`}
                                    checked={isChecked}
                                    onCheckedChange={() => handleTogglePermission(perm.id)}
                                  />
                                  <Label htmlFor={`role-perm-${perm.id}`} className="text-sm cursor-pointer flex-1">
                                    {perm.description}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingRole ? 'Salvar alterações' : 'Criar cargo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a função "{roleToDelete?.display_name}"?
              {roleToDelete?.is_system && (
                <span className="block mt-2 font-semibold text-amber-600 dark:text-amber-400">
                  Esta é uma função do sistema. Certifique-se de que nenhum usuário está usando esta função.
                </span>
              )}
              <span className="block mt-2">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRoleToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

