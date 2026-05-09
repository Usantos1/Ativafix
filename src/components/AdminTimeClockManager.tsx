import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { from } from '@/integrations/db/client';
import { useToast } from '@/hooks/use-toast';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Edit, Clock, MapPin, Trash2, FileDown, Calendar, FileText } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';
import { LocationDisplay } from '@/utils/locationUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeSheetManager } from '@/components/TimeSheetManager';

const inputClass = 'border-border bg-background text-foreground placeholder:text-muted-foreground';
const outlineButtonClass = 'border-border bg-background text-foreground hover:bg-muted hover:text-foreground';
const statusBadgeClass = (status: string) => {
  if (status === 'approved') {
    return 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-100';
  }
  if (status === 'rejected') {
    return 'border-red-200 bg-red-100 text-red-800 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-100';
  }
  return 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-100';
};

interface TimeClockRecord {
  id: string;
  user_id: string;
  date: string;
  clock_in?: string;
  clock_out?: string;
  break_start?: string;
  break_end?: string;
  lunch_start?: string;
  lunch_end?: string;
  total_hours?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  location?: string;
  ip_address?: string;
  created_at: string;
  updated_at: string;
}

export const AdminTimeClockManager = () => {
  const [records, setRecords] = useState<TimeClockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<TimeClockRecord | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [dateFilter, setDateFilter] = useState({
    start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const { toast } = useToast();
  const { users } = useUsers();
  const { isAdmin } = useAuth();

  const formatTotalHours = (totalHours: unknown): string => {
    if (!totalHours) return '-';
    if (typeof totalHours === 'string') return totalHours;
    if (typeof totalHours === 'number') return String(totalHours);
    if (typeof totalHours === 'object' && totalHours !== null) {
      // Se for objeto com hours e minutes
      if ('hours' in totalHours && 'minutes' in totalHours) {
        const hours = Number(totalHours.hours) || 0;
        const minutes = Number(totalHours.minutes) || 0;
        return `${hours}:${String(minutes).padStart(2, '0')}`;
      }
      return '--:--';
    }
    return String(totalHours);
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let query = from('time_clock')
        .select('*')
        .order('date', { ascending: false });

      // Apply date filter
      if (dateFilter.start) {
        query = query.gte('date', dateFilter.start);
      }
      if (dateFilter.end) {
        query = query.lte('date', dateFilter.end);
      }

      const { data, error } = await query.limit(500).execute();

      if (error) {
        console.error('Error fetching time records:', error);
        return;
      }

      const formattedRecords: TimeClockRecord[] = (data || []).map(record => ({
        id: record.id,
        user_id: record.user_id,
        date: record.date,
        clock_in: record.clock_in,
        clock_out: record.clock_out,
        break_start: record.break_start,
        break_end: record.break_end,
        lunch_start: record.lunch_start,
        lunch_end: record.lunch_end,
        total_hours: formatTotalHours(record.total_hours),
        status: record.status as 'pending' | 'approved' | 'rejected',
        notes: record.notes,
        location: record.location,
        ip_address: record.ip_address,
        created_at: record.created_at,
        updated_at: record.updated_at,
      }));
      
      setRecords(formattedRecords);
    } catch (error) {
      console.error('Error in fetchRecords:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRecord = async (recordId: string, updates: Partial<TimeClockRecord>) => {
    try {
      const { error } = await from('time_clock')
        .update(updates)
        .eq('id', recordId)
        .execute();

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar registro",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Registro atualizado com sucesso"
      });

      fetchRecords();
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  const deleteRecord = async (recordId: string) => {
    try {
      const { data, error } = await from('time_clock')
        .eq('id', recordId)
        .delete();

      if (error) {
        console.error('Delete error:', error);
        toast({
          title: "Erro",
          description: `Erro ao excluir registro: ${error.message || 'Erro desconhecido'}`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Registro excluído com sucesso"
      });

      fetchRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir registro",
        variant: "destructive"
      });
    }
  };

  const exportToExcel = () => {
    if (filteredRecords.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum registro encontrado para exportar",
        variant: "destructive"
      });
      return;
    }

    // Prepare data for Excel
    const excelData = filteredRecords.map(record => {
      const formatDateSafe = (dateStr: string | undefined) => {
        if (!dateStr) return '-';
        try {
          const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
          return isValid(date) ? format(date, 'HH:mm') : '-';
        } catch {
          return '-';
        }
      };
      
      const formatDateOnly = (dateStr: string | undefined) => {
        if (!dateStr) return '-';
        try {
          const dateStrOnly = typeof dateStr === 'string' ? dateStr.split('T')[0] : format(new Date(dateStr), 'yyyy-MM-dd');
          const date = parseISO(dateStrOnly + 'T00:00:00');
          return isValid(date) ? format(date, 'dd/MM/yyyy') : '-';
        } catch {
          return '-';
        }
      };
      
      return {
        'Usuário': getUserName(record.user_id),
        'Data': formatDateOnly(record.date),
        'Entrada': formatDateSafe(record.clock_in),
        'Saída': formatDateSafe(record.clock_out),
        'Início Almoço': formatDateSafe(record.lunch_start),
        'Fim Almoço': formatDateSafe(record.lunch_end),
        'Total de Horas': formatTotalHours(record.total_hours),
        'Localização': record.location || '-',
        'IP': record.ip_address || '-',
        'Status': record.status === 'pending' ? 'Pendente' : 
                  record.status === 'approved' ? 'Aprovado' : 'Rejeitado',
        'Observações': record.notes || '-'
      };
    });

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    
    // Set column widths
    const colWidths = [
      { wch: 20 }, // Usuário
      { wch: 12 }, // Data
      { wch: 10 }, // Entrada
      { wch: 10 }, // Saída
      { wch: 12 }, // Início Almoço
      { wch: 12 }, // Fim Almoço
      { wch: 12 }, // Total
      { wch: 30 }, // Localização
      { wch: 15 }, // IP
      { wch: 10 }, // Status
      { wch: 20 }  // Observações
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Relatório de Ponto');
    
    // Generate filename with date range
    const startDate = dateFilter.start || records[records.length - 1]?.date || new Date().toISOString().split('T')[0];
    const endDate = dateFilter.end || records[0]?.date || new Date().toISOString().split('T')[0];
    const filename = `relatorio_ponto_${format(new Date(startDate), 'ddMMyyyy')}_a_${format(new Date(endDate), 'ddMMyyyy')}.xlsx`;
    
    // Download file
    XLSX.writeFile(wb, filename);
    
    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso"
    });
  };

  const getStatusBadge = (status: string) => {
    const labels = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado'
    };

    return (
      <Badge variant="outline" className={statusBadgeClass(status)}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.display_name || 'Usuário desconhecido';
  };

  const filteredRecords = records.filter(record => {
    const userName = getUserName(record.user_id).toLowerCase();
    const matchesSearch = userName.includes(searchTerm.toLowerCase()) ||
           record.date.includes(searchTerm) ||
           record.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUserFilter = userFilter === 'all' || record.user_id === userFilter;
    
    return matchesSearch && matchesUserFilter;
  });

  useEffect(() => {
    fetchRecords();
  }, [dateFilter]);

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="rounded-full border border-primary/25 bg-primary/10 p-2 text-primary">
                  <Clock className="h-4 w-4" />
                </span>
                Gestão de Espelhos de Ponto - RH
              </CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <TabsList className="inline-flex h-auto w-auto max-w-full flex-wrap gap-1 rounded-2xl border border-border bg-card p-1 shadow-sm">
                  <TabsTrigger value="list" className="min-h-9 rounded-full px-4 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <FileText className="h-4 w-4" />
                    Lista de Registros
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="min-h-9 rounded-full px-4 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Calendar className="h-4 w-4" />
                    Espelho de Ponto
                  </TabsTrigger>
                </TabsList>
                <Button onClick={exportToExcel} variant="outline" size="sm" className={outlineButtonClass}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="list" className="space-y-4 mt-0">
          <div className="space-y-4">
            {/* Search and User Filter */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuário, data ou localização..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 ${inputClass}`}
                />
              </div>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className={`w-full lg:w-60 ${inputClass}`}>
                  <SelectValue placeholder="Filtrar por colaborador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os colaboradores</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={fetchRecords} variant="outline" className={outlineButtonClass}>
                Atualizar
              </Button>
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <Label htmlFor="start-date">De:</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                  className={`w-full sm:w-40 ${inputClass}`}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="end-date">Até:</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                  className={`w-full sm:w-40 ${inputClass}`}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-foreground/70 dark:text-foreground/80">Carregando registros...</p>
            </div>
          ) : (
            <div className="border border-border rounded-2xl overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 450px)' }}>
              <Table>
                <TableHeader className="sticky top-0 bg-muted z-10 dark:bg-muted/70">
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">
                        {getUserName(record.user_id)}
                      </TableCell>
                      <TableCell className="text-foreground/80 dark:text-foreground/90">
                        {(() => {
                          try {
                            const dateStr = record.date ? (typeof record.date === 'string' ? record.date.split('T')[0] : format(new Date(record.date), 'yyyy-MM-dd')) : '';
                            const date = dateStr ? parseISO(dateStr + 'T00:00:00') : null;
                            return date && isValid(date) ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : '-';
                          } catch {
                            return '-';
                          }
                        })()}
                      </TableCell>
                      <TableCell className="text-foreground/80 dark:text-foreground/90">
                        {record.clock_in ? (() => {
                          try {
                            const date = typeof record.clock_in === 'string' ? parseISO(record.clock_in) : new Date(record.clock_in);
                            return isValid(date) ? format(date, 'HH:mm') : '-';
                          } catch {
                            return '-';
                          }
                        })() : '-'}
                      </TableCell>
                      <TableCell className="text-foreground/80 dark:text-foreground/90">
                        {record.clock_out ? (() => {
                          try {
                            const date = typeof record.clock_out === 'string' ? parseISO(record.clock_out) : new Date(record.clock_out);
                            return isValid(date) ? format(date, 'HH:mm') : '-';
                          } catch {
                            return '-';
                          }
                        })() : '-'}
                      </TableCell>
                      <TableCell className="font-medium text-foreground/90">{formatTotalHours(record.total_hours)}</TableCell>
                      <TableCell className="text-foreground/80 dark:text-foreground/90">
                        <div className="flex items-center gap-1">
                          {record.location && <MapPin className="h-3 w-3" />}
                          {record.location ? (
                            <LocationDisplay location={record.location} />
                          ) : (
                            '-'
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-foreground/70 dark:text-foreground/80">{record.ip_address || '-'}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isAdmin ? (
                            <>
                              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={outlineButtonClass}
                                    onClick={() => setSelectedRecord(record)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl border-border bg-card">
                                  <DialogHeader>
                                    <DialogTitle>Editar Registro de Ponto</DialogTitle>
                                  </DialogHeader>
                                  {selectedRecord && (
                                    <EditRecordForm
                                      record={selectedRecord}
                                      onSave={updateRecord}
                                      getUserName={getUserName}
                                    />
                                  )}
                                </DialogContent>
                              </Dialog>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200 dark:hover:bg-red-500/25">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Registro</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este registro de ponto? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteRecord(record.id)}>
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          ) : (
                            <span className="text-xs text-foreground/70 dark:text-foreground/80">
                              Apenas visualização
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-0">
              <TimeSheetManager />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

interface EditRecordFormProps {
  record: TimeClockRecord;
  onSave: (id: string, updates: Partial<TimeClockRecord>) => void;
  getUserName: (userId: string) => string;
}

const EditRecordForm: React.FC<EditRecordFormProps> = ({ record, onSave, getUserName }) => {
  const [formData, setFormData] = useState({
    clock_in: record.clock_in ? format(new Date(record.clock_in), "yyyy-MM-dd'T'HH:mm") : '',
    clock_out: record.clock_out ? format(new Date(record.clock_out), "yyyy-MM-dd'T'HH:mm") : '',
    break_start: record.break_start ? format(new Date(record.break_start), "yyyy-MM-dd'T'HH:mm") : '',
    break_end: record.break_end ? format(new Date(record.break_end), "yyyy-MM-dd'T'HH:mm") : '',
    lunch_start: record.lunch_start ? format(new Date(record.lunch_start), "yyyy-MM-dd'T'HH:mm") : '',
    lunch_end: record.lunch_end ? format(new Date(record.lunch_end), "yyyy-MM-dd'T'HH:mm") : '',
    status: record.status,
    notes: record.notes || '',
    location: record.location || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates: Partial<TimeClockRecord> = {
      clock_in: formData.clock_in ? new Date(formData.clock_in).toISOString() : null,
      clock_out: formData.clock_out ? new Date(formData.clock_out).toISOString() : null,
      break_start: formData.break_start ? new Date(formData.break_start).toISOString() : null,
      break_end: formData.break_end ? new Date(formData.break_end).toISOString() : null,
      lunch_start: formData.lunch_start ? new Date(formData.lunch_start).toISOString() : null,
      lunch_end: formData.lunch_end ? new Date(formData.lunch_end).toISOString() : null,
      status: formData.status as 'pending' | 'approved' | 'rejected',
      notes: formData.notes,
      location: formData.location,
    };

    // Calculate total hours if both clock_in and clock_out are present
    if (updates.clock_in && updates.clock_out) {
      const clockInTime = new Date(updates.clock_in);
      const clockOutTime = new Date(updates.clock_out);
      const totalMs = clockOutTime.getTime() - clockInTime.getTime();
      const totalHours = Math.floor(totalMs / (1000 * 60 * 60));
      const totalMinutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
      updates.total_hours = `${totalHours}:${totalMinutes.toString().padStart(2, '0')}:00`;
    }

    onSave(record.id, updates);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Usuário</Label>
          <Input value={getUserName(record.user_id)} disabled className={inputClass} />
        </div>
        <div>
          <Label>Data</Label>
          <Input value={format(new Date(record.date), 'dd/MM/yyyy')} disabled className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="clock_in">Entrada</Label>
          <Input
            id="clock_in"
            type="datetime-local"
            value={formData.clock_in}
            onChange={(e) => setFormData(prev => ({ ...prev, clock_in: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <Label htmlFor="clock_out">Saída</Label>
          <Input
            id="clock_out"
            type="datetime-local"
            value={formData.clock_out}
            onChange={(e) => setFormData(prev => ({ ...prev, clock_out: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="break_start">Início da Pausa</Label>
          <Input
            id="break_start"
            type="datetime-local"
            value={formData.break_start}
            onChange={(e) => setFormData(prev => ({ ...prev, break_start: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <Label htmlFor="break_end">Fim da Pausa</Label>
          <Input
            id="break_end"
            type="datetime-local"
            value={formData.break_end}
            onChange={(e) => setFormData(prev => ({ ...prev, break_end: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="lunch_start">Início do Almoço</Label>
          <Input
            id="lunch_start"
            type="datetime-local"
            value={formData.lunch_start}
            onChange={(e) => setFormData(prev => ({ ...prev, lunch_start: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <Label htmlFor="lunch_end">Fim do Almoço</Label>
          <Input
            id="lunch_end"
            type="datetime-local"
            value={formData.lunch_end}
            onChange={(e) => setFormData(prev => ({ ...prev, lunch_end: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'pending' | 'approved' | 'rejected' }))}>
            <SelectTrigger className={inputClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="location">Localização</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className={inputClass}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">Salvar Alterações</Button>
      </div>
    </form>
  );
};