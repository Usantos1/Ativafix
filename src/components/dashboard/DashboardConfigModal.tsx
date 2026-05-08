import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDashboardConfig, DashboardWidgetConfig } from '@/hooks/useDashboardConfig';
import { GripVertical, Settings, LayoutGrid, RefreshCw, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DashboardConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WIDGET_LABELS: Record<string, string> = {
  'financial-cards': 'Cards Financeiros',
  'trend-charts': 'Gráficos de Tendência',
  'quick-actions': 'Ações Rápidas',
  'main-sections': 'Seções Principais',
};

const REFRESH_INTERVALS = [
  { value: 30, label: '30 segundos' },
  { value: 60, label: '1 minuto' },
  { value: 120, label: '2 minutos' },
  { value: 300, label: '5 minutos' },
  { value: 600, label: '10 minutos' },
];

export function DashboardConfigModal({ open, onOpenChange }: DashboardConfigModalProps) {
  const { config, saveConfig } = useDashboardConfig();
  const [localConfig, setLocalConfig] = useState({
    widgets: config.widgets,
    presentationMode: config.presentationMode,
    autoRefreshEnabled: config.autoRefreshEnabled,
    autoRefreshInterval: config.autoRefreshInterval,
  });

  useEffect(() => {
    if (open) {
      setLocalConfig({
        widgets: config.widgets,
        presentationMode: config.presentationMode,
        autoRefreshEnabled: config.autoRefreshEnabled,
        autoRefreshInterval: config.autoRefreshInterval,
      });
    }
  }, [open, config]);

  const handleSave = async () => {
    await saveConfig(localConfig);
    onOpenChange(false);
  };

  const handleToggleWidget = (widgetId: string) => {
    setLocalConfig(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => (w.id === widgetId ? { ...w, enabled: !w.enabled } : w))
    }));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newWidgets = [...localConfig.widgets];
    [newWidgets[index - 1], newWidgets[index]] = [newWidgets[index], newWidgets[index - 1]];
    setLocalConfig(prev => ({
      ...prev,
      widgets: newWidgets.map((w, i) => ({ ...w, order: i + 1 }))
    }));
  };

  const handleMoveDown = (index: number) => {
    if (index === localConfig.widgets.length - 1) return;
    const newWidgets = [...localConfig.widgets];
    [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
    setLocalConfig(prev => ({
      ...prev,
      widgets: newWidgets.map((w, i) => ({ ...w, order: i + 1 }))
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Settings className="h-4 w-4 text-blue-600" />
            Configurar Dashboard
          </DialogTitle>
          <DialogDescription className="text-xs">
            Personalize widgets, modo apresentação e atualização automática
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="widgets" className="w-full">
          <TabsList className="mx-5 mt-4 grid h-10 grid-cols-3 rounded-xl bg-muted p-1">
            <TabsTrigger 
              value="widgets" 
              className="flex items-center justify-center gap-1.5 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <LayoutGrid className="h-4 w-4" />
              Widgets
            </TabsTrigger>
            <TabsTrigger 
              value="presentation" 
              className="flex items-center justify-center gap-1.5 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Monitor className="h-4 w-4" />
              Modo TV
            </TabsTrigger>
            <TabsTrigger 
              value="refresh" 
              className="flex items-center justify-center gap-1.5 rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              Atualização
            </TabsTrigger>
          </TabsList>

          <div className="max-h-[65dvh] overflow-y-auto px-5 py-4">
            {/* Tab: Widgets */}
            <TabsContent value="widgets" className="mt-0 space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Widgets do Dashboard</Label>
                <p className="text-xs text-muted-foreground">
                  Ative ou desative widgets e organize a ordem de exibição
                </p>
                <div className="space-y-2 rounded-xl border bg-muted/30 p-2">
                  {localConfig.widgets
                    .sort((a, b) => a.order - b.order)
                    .map((widget, index) => (
                      <div
                        key={widget.id}
                        className="flex items-center justify-between rounded-lg border bg-background p-3 transition-colors hover:border-blue-300"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <Label htmlFor={`widget-${widget.id}`} className="text-sm font-medium cursor-pointer truncate">
                            {WIDGET_LABELS[widget.id] || widget.id}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-xs"
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              title="Mover para cima"
                            >
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-xs"
                              onClick={() => handleMoveDown(index)}
                              disabled={index === localConfig.widgets.length - 1}
                              title="Mover para baixo"
                            >
                              ↓
                            </Button>
                          </div>
                          <Switch
                            id={`widget-${widget.id}`}
                            checked={widget.enabled}
                            onCheckedChange={() => handleToggleWidget(widget.id)}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </TabsContent>

            {/* Tab: Modo Apresentação */}
            <TabsContent value="presentation" className="mt-0 space-y-4">
              <div className="space-y-4">
                <div className="rounded-xl border bg-purple-50/60 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <Label htmlFor="presentation-mode" className="text-sm font-semibold flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-purple-600" />
                        Modo Apresentação (TV)
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dashboard otimizado para exibição em TV da loja
                      </p>
                    </div>
                    <Switch
                      id="presentation-mode"
                      checked={localConfig.presentationMode}
                      onCheckedChange={(checked) => 
                        setLocalConfig(prev => ({ ...prev, presentationMode: checked }))
                      }
                    />
                  </div>
                  {localConfig.presentationMode && (
                    <div className="mt-3 rounded-lg border border-purple-200 bg-background/80 p-3">
                      <p className="text-xs text-purple-700">
                        <strong>Dica:</strong> Use a tecla ESC ou o botão no canto superior direito para sair do modo apresentação.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab: Atualização Automática */}
            <TabsContent value="refresh" className="mt-0 space-y-4">
              <div className="space-y-4">
                <div className="rounded-xl border bg-emerald-50/60 p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label htmlFor="auto-refresh" className="text-sm font-semibold flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-green-600" />
                          Atualização Automática
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recarregar dados automaticamente apenas no Modo Apresentação (TV)
                        </p>
                      </div>
                      <Switch
                        id="auto-refresh"
                        checked={localConfig.autoRefreshEnabled}
                        onCheckedChange={(checked) => 
                          setLocalConfig(prev => ({ ...prev, autoRefreshEnabled: checked }))
                        }
                        disabled={!localConfig.presentationMode}
                      />
                    </div>

                    {localConfig.autoRefreshEnabled && localConfig.presentationMode && (
                      <div className="mt-4 space-y-3 rounded-lg border border-green-200 bg-background/80 p-3">
                        <Label htmlFor="refresh-interval" className="text-sm font-medium">
                          Intervalo de Atualização
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {REFRESH_INTERVALS.map((interval) => (
                            <Button
                              key={interval.value}
                              variant={localConfig.autoRefreshInterval === interval.value ? 'default' : 'outline'}
                              size="sm"
                              className={`h-9 text-xs ${
                                localConfig.autoRefreshInterval === interval.value
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : ''
                              }`}
                              onClick={() => 
                                setLocalConfig(prev => ({ ...prev, autoRefreshInterval: interval.value }))
                              }
                            >
                              {interval.label}
                            </Button>
                          ))}
                        </div>
                        <div className="mt-2">
                          <Label htmlFor="custom-interval" className="text-xs text-muted-foreground">
                            Ou defina um intervalo personalizado (em segundos):
                          </Label>
                          <Input
                            id="custom-interval"
                            type="number"
                            min="10"
                            max="3600"
                            value={localConfig.autoRefreshInterval}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 60;
                              setLocalConfig(prev => ({ 
                                ...prev, 
                                autoRefreshInterval: Math.max(10, Math.min(3600, value))
                              }));
                            }}
                            className="mt-1 h-9 text-base md:text-sm"
                            placeholder="60"
                          />
                        </div>
                      </div>
                    )}

                    {localConfig.autoRefreshEnabled && !localConfig.presentationMode && (
                      <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                        <p className="text-xs text-yellow-700">
                          <strong>Atenção:</strong> A atualização automática só funciona no Modo Apresentação (TV). 
                          Ative o Modo Apresentação primeiro.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 sm:w-28"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="h-9 sm:w-44"
          >
            Salvar Configurações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
