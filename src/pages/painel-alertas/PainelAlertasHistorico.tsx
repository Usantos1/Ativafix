/**
 * Painel de Alertas — Histórico de alertas enviados.
 * Rota: /painel-alertas/historico
 */
import { useState, useMemo } from 'react';
import { ModernLayout } from '@/components/ModernLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAlertsLogs } from '@/hooks/useAlerts';
import { cn } from '@/lib/utils';
import { CATEGORIAS } from './constants';
import { PainelAlertasNav } from './PainelAlertasNav';

const statusBadgeClass = (status?: string | null) =>
  status === 'enviado'
    ? 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-100'
    : 'border-red-200 bg-red-100 text-red-800 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-100';

export default function PainelAlertasHistorico() {
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [categoria, setCategoria] = useState('');
  const [status, setStatus] = useState('');
  const filters = useMemo(
    () => ({
      periodo_inicio: periodoInicio || undefined,
      periodo_fim: periodoFim || undefined,
      categoria: categoria || undefined,
      status: status || undefined,
      limit: 100,
      offset: 0,
    }),
    [periodoInicio, periodoFim, categoria, status]
  );
  const { logs, logsTotal, logsLoading } = useAlertsLogs(filters);

  return (
    <ModernLayout
      title="Painel de Alertas"
      subtitle="Histórico de alertas enviados"
    >
      <div className="h-full flex flex-col min-h-0 p-4 md:p-6 w-full">
        <PainelAlertasNav />
        <Card className="flex-1 flex flex-col min-h-0 rounded-2xl border-border">
          <CardHeader>
            <CardTitle>Histórico de alertas</CardTitle>
            <CardDescription>
              Últimos alertas enviados. Filtre por período, categoria e status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col min-h-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-foreground/80">Início</Label>
                <Input
                  type="date"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                  className="border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-foreground/80">Fim</Label>
                <Input
                  type="date"
                  value={periodoFim}
                  onChange={(e) => setPeriodoFim(e.target.value)}
                  className="border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-foreground/80">Categoria</Label>
                <Select
                  value={categoria || '__all__'}
                  onValueChange={(v) => setCategoria(v === '__all__' ? '' : v)}
                >
                  <SelectTrigger className="border-border bg-background text-foreground">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
                    {Object.entries(CATEGORIAS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-foreground/80">Status</Label>
                <Select
                  value={status || '__all__'}
                  onValueChange={(v) => setStatus(v === '__all__' ? '' : v)}
                >
                  <SelectTrigger className="border-border bg-background text-foreground">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    <SelectItem value="enviado">Enviado</SelectItem>
                    <SelectItem value="erro">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {logsLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : (
              <ScrollArea className="w-full flex-1 rounded-2xl border border-border">
                <Table>
                  <TableHeader className="bg-muted/70 dark:bg-muted/40">
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="max-w-[200px]">Mensagem</TableHead>
                      <TableHead>Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center text-muted-foreground py-8"
                        >
                          Nenhum registro no período.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((row) => (
                        <TableRow key={row.id} className="hover:bg-muted/40">
                          <TableCell className="whitespace-nowrap text-sm text-foreground/80 dark:text-foreground/90">
                            {row.created_at
                              ? new Date(row.created_at).toLocaleString('pt-BR')
                              : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-foreground/80 dark:text-foreground/90">
                            {row.codigo_alerta}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/20 dark:text-blue-100">
                              {CATEGORIAS[row.categoria ?? ''] ?? row.categoria ?? '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-foreground/80 dark:text-foreground/90">{row.destino}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('rounded-full', statusBadgeClass(row.status))}>
                              {row.status}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="max-w-[200px] truncate text-sm text-foreground/80 dark:text-foreground/90"
                            title={row.mensagem_final}
                          >
                            {row.mensagem_final ?? '-'}
                          </TableCell>
                          <TableCell
                            className="max-w-[150px] truncate text-xs text-red-700 dark:text-red-300"
                            title={row.erro}
                          >
                            {row.erro ?? '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
            {logsTotal > 0 && (
              <p className="text-sm text-muted-foreground">
                Total: {logsTotal} registro(s)
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </ModernLayout>
  );
}
