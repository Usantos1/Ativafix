import { useEffect, useState } from 'react';
import { ModernLayout } from '@/components/ModernLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Copy, Globe2, Loader2, Power, RefreshCw, ShieldCheck, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiUrl';
import { authAPI } from '@/integrations/auth/api-client';

type CompanyDomain = {
  id: string;
  company_id: string;
  domain: string;
  type: 'default' | 'custom';
  status: 'pending' | 'verified' | 'active' | 'failed' | 'disabled';
  verification_token: string;
  verification_method: 'cname' | 'txt';
  cname_target: string;
  txt_record_name: string;
  txt_record_value: string;
  ssl_status: 'pending' | 'issuing' | 'active' | 'failed' | 'expired';
  is_primary: boolean;
  last_checked_at?: string | null;
  verified_at?: string | null;
  activated_at?: string | null;
  error_message?: string | null;
};

type DomainEntitlement = {
  allowed: boolean;
  limit: number;
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  verified: 'Verificado',
  active: 'Ativo',
  failed: 'Falha',
  disabled: 'Desativado',
};

const sslLabels: Record<string, string> = {
  pending: 'Pendente',
  issuing: 'Emitindo',
  active: 'Ativo',
  failed: 'Falha',
  expired: 'Expirado',
};

const statusClassNames: Record<string, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  verified: 'border-blue-200 bg-blue-50 text-blue-700',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  failed: 'border-red-200 bg-red-50 text-red-700',
  disabled: 'border-slate-200 bg-slate-50 text-slate-600',
};

const normalizeDomainInput = (value: string) =>
  value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '').replace(/\s+/g, '');

const getCnameName = (domain: string) => domain.split('.')[0] || domain;

export default function CompanyDomains() {
  const [domains, setDomains] = useState<CompanyDomain[]>([]);
  const [cnameTarget, setCnameTarget] = useState('custom.ativafix.com');
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [entitlement, setEntitlement] = useState<DomainEntitlement>({ allowed: false, limit: 1 });

  const headers = () => {
    const token = authAPI.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadDomains = async () => {
    setLoading(true);
    setPageError(null);
    try {
      const res = await fetch(`${getApiUrl()}/company-domains`, { headers: headers() });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar domínios');
      setDomains(json.domains || []);
      setCnameTarget(json.cname_target || 'custom.ativafix.com');
      setEntitlement(json.entitlement || { allowed: false, limit: 1 });
    } catch (error: any) {
      const message = error?.message || 'Erro ao carregar domínios';
      setPageError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomains();
  }, []);

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast.success('Copiado');
  };

  const createDomain = async () => {
    const domain = normalizeDomainInput(newDomain);
    const activeDomains = domains.filter((item) => item.status !== 'disabled').length;
    if (!entitlement.allowed) {
      toast.error('Seu plano atual não libera domínio personalizado.');
      return;
    }
    if (activeDomains >= entitlement.limit) {
      toast.error(`Esta empresa já possui o limite de ${entitlement.limit} domínio personalizado.`);
      return;
    }
    if (!domain) {
      toast.error('Informe o domínio');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/company-domains`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ domain }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Erro ao cadastrar domínio');
      setNewDomain('');
      toast.success('Domínio cadastrado');
      await loadDomains();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao cadastrar domínio');
    } finally {
      setSaving(false);
    }
  };

  const activeDomainsCount = domains.filter((domain) => domain.status !== 'disabled').length;
  const canCreateDomain = entitlement.allowed && activeDomainsCount < entitlement.limit;
  const guideDomain = domains.find((domain) => domain.status !== 'disabled')?.domain || normalizeDomainInput(newDomain) || 'app.seudominio.com.br';
  const guideCnameName = getCnameName(guideDomain);
  const clientGuideText = `Para configurar seu domínio no Ativa FIX:

1. Acesse o painel DNS do seu domínio.
2. Crie ou edite este registro:
Tipo: CNAME
Nome: ${guideCnameName}
Destino: ${cnameTarget}
TTL: Automático

Se usar Cloudflare, deixe o registro como "Somente DNS" (nuvem cinza), não "Com proxy".

Depois de salvar, aguarde a propagação do DNS e avise o suporte para verificar o domínio no Ativa FIX.

Domínio escolhido: ${guideDomain}`;

  const runDomainAction = async (domain: CompanyDomain, action: 'verify' | 'set-primary' | 'enable' | 'disable' | 'delete') => {
    const confirmDelete = action === 'delete' ? window.confirm(`Remover o domínio ${domain.domain}?`) : true;
    if (!confirmDelete) return;
    setBusyId(domain.id);
    try {
      const res = await fetch(`${getApiUrl()}/company-domains/${domain.id}/${action === 'delete' ? '' : action}`.replace(/\/$/, ''), {
        method: action === 'delete' ? 'DELETE' : 'POST',
        headers: headers(),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Erro ao executar ação');
      if (action === 'verify') {
        toast[json.verification?.ok ? 'success' : 'error'](json.verification?.ok ? 'Domínio verificado' : (json.verification?.errorMessage || json.domain?.error_message || 'DNS ainda não propagou'));
      } else if (action === 'enable') {
        toast.success('Domínio ativado');
      } else {
        toast.success('Ação realizada');
      }
      await loadDomains();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao executar ação');
    } finally {
      setBusyId(null);
    }
  };

  const enableDomain = (domain: CompanyDomain) => {
    if (!entitlement.allowed) {
      toast.error('Para ativar, primeiro libere "Domínio personalizado" no plano da empresa em Revenda > Gerenciar Planos.');
      return;
    }
    if (activeDomainsCount >= entitlement.limit) {
      toast.error(`Esta empresa já possui ${entitlement.limit} domínio personalizado ativo. Desative o atual antes de ativar outro.`);
      return;
    }
    runDomainAction(domain, 'enable');
  };

  return (
    <ModernLayout title="Domínios" subtitle="Configure domínios personalizados por empresa">
      <div className="space-y-6">
        <Card className="border-2 border-emerald-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-emerald-600" />
              Adicionar domínio personalizado
            </CardTitle>
            <CardDescription>
              O acesso atual por app.ativafix.com continua funcionando. O domínio próprio é uma camada adicional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!entitlement.allowed && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                Domínio personalizado não está liberado no plano atual desta empresa.
              </div>
            )}
            {entitlement.allowed && activeDomainsCount >= entitlement.limit && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-900">
                Limite atingido: esta empresa pode ter apenas {entitlement.limit} domínio personalizado ativo.
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label>Domínio</Label>
                <Input
                  value={newDomain}
                  onChange={(event) => setNewDomain(event.target.value)}
                  placeholder="sistema.seudominio.com.br"
                  className="h-11 rounded-full"
                  disabled={!canCreateDomain}
                />
              </div>
              <Button onClick={createDomain} disabled={saving || !canCreateDomain} className="self-end rounded-full bg-emerald-600 hover:bg-emerald-700">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar
              </Button>
            </div>
            {pageError && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {pageError}
              </div>
            )}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">HTTPS seguro</p>
              <p className="mt-1">
                Depois que o DNS for verificado, o Ativa FIX ativa o acesso seguro do domínio.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle>Como o cliente deve configurar o domínio</CardTitle>
            <CardDescription>
              Envie este passo a passo para quem cuida do DNS do cliente. O Ativa FIX aceita 1 domínio personalizado por empresa.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border bg-slate-50 p-4">
                <p className="font-bold text-slate-900">1. Escolher o endereço</p>
                <p className="mt-2 text-slate-600">Use um subdomínio como:</p>
                <div className="mt-3 space-y-1 font-mono text-xs text-slate-700">
                  <p>app.seudominio.com.br</p>
                  <p>sistema.seudominio.com.br</p>
                  <p>gestao.seudominio.com.br</p>
                </div>
              </div>
              <div className="rounded-2xl border bg-slate-50 p-4">
                <p className="font-bold text-slate-900">2. Criar CNAME no DNS</p>
                <div className="mt-3 space-y-1 text-slate-700">
                  <p>Tipo: <b>CNAME</b></p>
                  <p>Nome: <b>{guideCnameName}</b></p>
                  <p>Destino: <b>{cnameTarget}</b></p>
                  <p>TTL: <b>Automático</b></p>
                </div>
              </div>
              <div className="rounded-2xl border bg-slate-50 p-4">
                <p className="font-bold text-slate-900">3. Verificar no Ativa FIX</p>
                <p className="mt-2 text-slate-600">
                  Depois de salvar o DNS, aguarde a propagação e clique em <b>Verificar</b> no domínio cadastrado.
                </p>
                <p className="mt-2 text-slate-600">
                  No Cloudflare, deixe como <b>Somente DNS</b>, com a nuvem cinza.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-900">
              <p className="font-semibold">Importante</p>
              <p className="mt-1">
                Não use endereço com caminho, como app.seudominio.com.br/login. Cadastre apenas o domínio.
              </p>
            </div>
            <Button variant="outline" className="rounded-full" onClick={() => copyText(clientGuideText)}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar instruções para enviar ao cliente
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Domínios cadastrados</CardTitle>
            <CardDescription>Cadastre, verifique DNS, defina o principal e acompanhe o status de SSL.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center rounded-2xl bg-slate-50 py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Carregando domínios...
              </div>
            ) : domains.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-slate-50 p-8 text-center text-muted-foreground">
                Nenhum domínio cadastrado ainda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domínio</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>SSL</TableHead>
                      <TableHead>DNS</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.map((domain) => (
                      <TableRow key={domain.id}>
                        <TableCell className="min-w-[240px]">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 font-semibold">
                              {domain.domain}
                              {domain.is_primary && <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600">Principal</Badge>}
                            </div>
                            {domain.error_message && (
                              <span className="flex items-center gap-1 text-xs text-red-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {domain.error_message}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`rounded-full ${statusClassNames[domain.status] || ''}`}>
                            {statusLabels[domain.status] || domain.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-full">{sslLabels[domain.ssl_status] || domain.ssl_status}</Badge>
                        </TableCell>
                        <TableCell className="min-w-[360px]">
                          <div className="space-y-3 text-xs">
                            <div className="rounded-xl bg-slate-50 p-3">
                              <p className="mb-1 font-bold text-slate-700">Registro CNAME recomendado</p>
                              <div className="grid gap-1 sm:grid-cols-3">
                                <span>Tipo: <b>CNAME</b></span>
                                <span>Nome: <b>{getCnameName(domain.domain)}</b></span>
                                <span>Destino: <b>{domain.cname_target || cnameTarget}</b></span>
                              </div>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                              <p className="mb-1 font-bold text-slate-700">TXT opcional</p>
                              <p>Nome: <b>{domain.txt_record_name}</b></p>
                              <p className="break-all">Valor: <b>{domain.txt_record_value}</b></p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button size="sm" variant="outline" className="rounded-full" onClick={() => copyText(domain.txt_record_value)}>
                              <Copy className="mr-1 h-3.5 w-3.5" />
                              TXT
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-full" disabled={busyId === domain.id || domain.status === 'disabled'} onClick={() => runDomainAction(domain, 'verify')}>
                              <RefreshCw className="mr-1 h-3.5 w-3.5" />
                              Verificar
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-full" disabled={busyId === domain.id || domain.is_primary || !['verified', 'active'].includes(domain.status)} onClick={() => runDomainAction(domain, 'set-primary')}>
                              <Star className="mr-1 h-3.5 w-3.5" />
                              Principal
                            </Button>
                            {domain.status === 'disabled' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full text-emerald-700 hover:text-emerald-800"
                                disabled={busyId === domain.id}
                                onClick={() => enableDomain(domain)}
                              >
                                <Power className="mr-1 h-3.5 w-3.5" />
                                Ativar
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" className="rounded-full" disabled={busyId === domain.id} onClick={() => runDomainAction(domain, 'disable')}>
                                <Power className="mr-1 h-3.5 w-3.5" />
                                Desativar
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="rounded-full text-red-600 hover:text-red-700" disabled={busyId === domain.id || ['verified', 'active'].includes(domain.status)} onClick={() => runDomainAction(domain, 'delete')}>
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Remover
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="flex gap-3 p-4 text-sm text-blue-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Segurança</p>
              <p>O domínio resolve a empresa, mas não libera dados sozinho. O usuário ainda precisa fazer login e pertencer à mesma empresa do domínio.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
}
