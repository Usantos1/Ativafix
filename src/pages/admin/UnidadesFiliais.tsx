import { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, Plus, RefreshCw, Save, Users } from 'lucide-react';
import { ModernLayout } from '@/components/ModernLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth, Branch } from '@/contexts/AuthContext';
import { getApiUrl } from '@/utils/apiUrl';
import { from } from '@/integrations/db/client';

type BranchForm = {
  id?: string;
  name: string;
  type: 'matriz' | 'filial' | 'laboratorio' | 'deposito';
  document: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  is_active: boolean;
};

type UserAccess = {
  id: string;
  email: string;
  display_name?: string | null;
  role?: string | null;
  branches: Array<{ branch_id: string; branch_name: string; role?: string | null; is_default: boolean }>;
};

const emptyForm: BranchForm = {
  name: '',
  type: 'filial',
  document: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  is_active: true,
};

const onlyDigits = (value: string) => String(value || '').replace(/\D+/g, '');

const formatDocument = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
};

const formatPhone = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
};

const formatZipCode = (value: string) => onlyDigits(value).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');

const formatState = (value: string) => String(value || '').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();

const createSlug = (value: string) =>
  String(value || 'unidade')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unidade';

export default function UnidadesFiliais() {
  const { toast } = useToast();
  const { reloadBranches, user } = useAuth();
  const [branches, setBranches] = useState<(Branch & { users_count?: number })[]>([]);
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [defaultBranchId, setDefaultBranchId] = useState<string>('');
  const [form, setForm] = useState<BranchForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
  }), []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [branchesRes, usersRes] = await Promise.allSettled([
        fetch(`${getApiUrl()}/branches`, { headers }),
        fetch(`${getApiUrl()}/branches/user-access`, { headers }),
      ]);

      let loadedBranches: (Branch & { users_count?: number })[] = [];
      if (branchesRes.status === 'fulfilled' && branchesRes.value.ok) {
        const branchesData = await branchesRes.value.json();
        loadedBranches = branchesData.branches || [];
      } else if (user?.company_id) {
        const { data, error } = await from('branches')
          .select('*')
          .eq('company_id', user.company_id)
          .order('is_main', { ascending: false })
          .execute();
        if (error) {
          throw new Error(error.message || 'Erro ao carregar unidades');
        }
        loadedBranches = data || [];
      } else {
        const response = branchesRes.status === 'fulfilled' ? branchesRes.value : null;
        const errorBody = response ? await response.json().catch(() => ({})) : {};
        throw new Error(errorBody.error || 'Erro ao carregar unidades');
      }

      setBranches(loadedBranches);

      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const usersData = await usersRes.value.json();
        setUsers(usersData.users || []);
      } else {
        setUsers([]);
        console.warn('[Unidades] Não foi possível carregar vínculos de usuários. Verifique se a API foi reiniciada com as novas rotas.');
      }
    } catch (error: any) {
      toast({ title: 'Erro ao carregar unidades', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => setForm(emptyForm);

  const editBranch = (branch: Branch) => {
    setForm({
      id: branch.id,
      name: branch.name || '',
      type: branch.type || 'filial',
      document: formatDocument(branch.document || ''),
      phone: formatPhone(branch.phone || ''),
      email: String(branch.email || '').toLowerCase(),
      address: branch.address || '',
      city: branch.city || '',
      state: formatState(branch.state || ''),
      zip_code: formatZipCode(branch.zip_code || ''),
      is_active: branch.is_active !== false,
    });
  };

  const saveBranch = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Informe o nome da unidade', variant: 'destructive' });
      return;
    }

    const payload = {
      ...form,
      document: formatDocument(form.document),
      phone: formatPhone(form.phone),
      email: form.email.trim().toLowerCase(),
      state: formatState(form.state),
      zip_code: formatZipCode(form.zip_code),
    };

    setSaving(true);
    try {
      const method = form.id ? 'PUT' : 'POST';
      const url = form.id ? `${getApiUrl()}/branches/${form.id}` : `${getApiUrl()}/branches`;
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (form.id) {
          const { id, ...updatePayload } = payload;
          const { data, error } = await from('branches')
            .update(updatePayload)
            .eq('id', form.id)
            .select('*')
            .single();
          if (error) {
            throw new Error(error.message || body.error || body.message || 'Erro ao salvar unidade');
          }
          if (!data) {
            throw new Error(body.error || body.message || 'Nenhuma unidade foi atualizada. Verifique se a API foi reiniciada com o suporte a filiais.');
          }
        } else {
          if (!user?.company_id) {
            throw new Error('Usuário sem empresa vinculada. Não foi possível criar unidade.');
          }
          const baseSlug = createSlug(payload.name);
          const sameSlugCount = branches.filter((branch) => branch.slug === baseSlug || branch.slug?.startsWith(`${baseSlug}-`)).length;
          const slug = sameSlugCount > 0 ? `${baseSlug}-${sameSlugCount + 1}` : baseSlug;
          const { data, error } = await from('branches')
            .insert({
              company_id: user.company_id,
              name: payload.name.trim(),
              slug,
              type: payload.type === 'matriz' ? 'filial' : payload.type,
              document: payload.document || null,
              phone: payload.phone || null,
              email: payload.email || null,
              address: payload.address || null,
              city: payload.city || null,
              state: payload.state || null,
              zip_code: payload.zip_code || null,
              is_main: false,
              is_active: payload.is_active,
            })
            .select('*')
            .single();
          if (error || !data) {
            throw new Error(error?.message || body.error || body.message || 'Erro ao criar unidade.');
          }
        }
      }
      toast({ title: form.id ? 'Unidade atualizada' : 'Unidade criada' });
      resetForm();
      await loadData();
      await reloadBranches();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar unidade', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (branch: Branch) => {
    try {
      const res = await fetch(`${getApiUrl()}/branches/${branch.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_active: !branch.is_active }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Erro ao alterar status');
      await loadData();
      await reloadBranches();
    } catch (error: any) {
      toast({ title: 'Erro ao alterar status', description: error.message, variant: 'destructive' });
    }
  };

  const setMain = async (branch: Branch) => {
    try {
      const res = await fetch(`${getApiUrl()}/branches/${branch.id}/set-main`, { method: 'POST', headers });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Erro ao definir matriz');
      toast({ title: 'Unidade principal atualizada' });
      await loadData();
      await reloadBranches();
    } catch (error: any) {
      toast({ title: 'Erro ao definir matriz', description: error.message, variant: 'destructive' });
    }
  };

  const selectUser = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find((item) => item.id === userId);
    const ids = user?.branches?.map((branch) => branch.branch_id) || [];
    setSelectedBranchIds(ids);
    setDefaultBranchId(user?.branches?.find((branch) => branch.is_default)?.branch_id || ids[0] || '');
  };

  const toggleUserBranch = (branchId: string, checked: boolean) => {
    setSelectedBranchIds((current) => {
      const next = checked ? Array.from(new Set([...current, branchId])) : current.filter((id) => id !== branchId);
      if (!next.includes(defaultBranchId)) setDefaultBranchId(next[0] || '');
      return next;
    });
  };

  const saveUserAccess = async () => {
    if (!selectedUserId || selectedBranchIds.length === 0) {
      toast({ title: 'Selecione usuário e ao menos uma unidade', variant: 'destructive' });
      return;
    }

    try {
      const res = await fetch(`${getApiUrl()}/branches/user-access/${selectedUserId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          branch_ids: selectedBranchIds,
          default_branch_id: defaultBranchId || selectedBranchIds[0],
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Erro ao salvar acessos');
      toast({ title: 'Acessos do usuário atualizados' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar acessos', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <ModernLayout title="Unidades / Filiais" subtitle="Gerencie matriz, filiais, laboratórios e depósitos">
      <div className="space-y-4">
        <Card className="border-2 border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Unidades da empresa</CardTitle>
                  <CardDescription>Mantenha a Matriz e as unidades operacionais da mesma company_id.</CardDescription>
                </div>
              </div>
              <Button variant="outline" className="rounded-full" onClick={loadData} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {branches.map((branch) => (
              <Card key={branch.id} className="rounded-3xl border-2">
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{branch.name}</CardTitle>
                      <CardDescription>{branch.city || branch.type}</CardDescription>
                    </div>
                    <Badge variant={branch.is_active ? 'default' : 'secondary'}>{branch.is_active ? 'Ativa' : 'Inativa'}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {branch.is_main && <Badge className="bg-emerald-600">Matriz</Badge>}
                    <Badge variant="outline">{branch.users_count || 0} usuário(s)</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full rounded-full" onClick={() => editBranch(branch)}>Editar</Button>
                  {!branch.is_main && (
                    <Button variant="outline" className="w-full rounded-full" onClick={() => setMain(branch)} disabled={!branch.is_active}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Definir Matriz
                    </Button>
                  )}
                  <Button variant="ghost" className="w-full rounded-full" onClick={() => toggleStatus(branch)} disabled={branch.is_main}>
                    {branch.is_active ? 'Inativar' : 'Ativar'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {form.id ? 'Editar unidade' : 'Nova unidade'}
              </CardTitle>
              <CardDescription>Cadastre filiais, laboratórios ou depósitos da empresa.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome da unidade</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ex.: Loja Shopping" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(value: BranchForm['type']) => setForm((p) => ({ ...p, type: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matriz">Matriz</SelectItem>
                    <SelectItem value="filial">Filial</SelectItem>
                    <SelectItem value="laboratorio">Laboratório</SelectItem>
                    <SelectItem value="deposito">Depósito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>CNPJ/documento</Label>
                <Input
                  value={form.document}
                  onChange={(e) => setForm((p) => ({ ...p, document: formatDocument(e.target.value) }))}
                  placeholder="00.000.000/0000-00"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: formatPhone(e.target.value) }))}
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value.trim().toLowerCase() }))}
                  placeholder="unidade@empresa.com"
                  inputMode="email"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Endereço</Label>
                <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm((p) => ({ ...p, state: formatState(e.target.value) }))}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  value={form.zip_code}
                  onChange={(e) => setForm((p) => ({ ...p, zip_code: formatZipCode(e.target.value) }))}
                  placeholder="00000-000"
                  inputMode="numeric"
                />
              </div>
              <label className="flex items-center gap-2 rounded-xl border p-3">
                <Switch checked={form.is_active} onCheckedChange={(checked) => setForm((p) => ({ ...p, is_active: checked }))} />
                <span className="text-sm">Unidade ativa</span>
              </label>
              <div className="flex gap-2 md:col-span-2">
                <Button className="rounded-full" onClick={saveBranch} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar unidade
                </Button>
                {form.id && <Button variant="outline" className="rounded-full" onClick={resetForm}>Cancelar edição</Button>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários por unidade
              </CardTitle>
              <CardDescription>Defina quais unidades cada usuário pode acessar e qual será a padrão.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Usuário</Label>
                <Select value={selectedUserId} onValueChange={selectUser}>
                  <SelectTrigger><SelectValue placeholder="Selecione um usuário" /></SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.display_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Unidades liberadas</Label>
                <div className="space-y-2 rounded-2xl border p-3">
                  {branches.filter((branch) => branch.is_active).map((branch) => (
                    <label key={branch.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedBranchIds.includes(branch.id)}
                          onCheckedChange={(checked) => toggleUserBranch(branch.id, checked === true)}
                        />
                        <span className="text-sm font-medium">{branch.name}</span>
                      </div>
                      {selectedBranchIds.includes(branch.id) && (
                        <Button
                          type="button"
                          size="sm"
                          variant={defaultBranchId === branch.id ? 'default' : 'outline'}
                          className="rounded-full"
                          onClick={() => setDefaultBranchId(branch.id)}
                        >
                          {defaultBranchId === branch.id ? 'Padrão' : 'Definir padrão'}
                        </Button>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <Button className="rounded-full" onClick={saveUserAccess} disabled={!selectedUserId}>
                <Save className="mr-2 h-4 w-4" />
                Salvar acessos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModernLayout>
  );
}
