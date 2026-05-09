import { useState, useMemo, useEffect } from 'react';
import { ModernLayout } from '@/components/ModernLayout';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Brain,
  Clock,
  Users,
  ShieldCheck,
  FileText,
  CalendarCheck,
  Briefcase,
  Search,
  UserCog,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const RECRUTAMENTO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

interface RHSection {
  title: string;
  description: string;
  icon: any;
  path: string;
  color: string;
  category: 'recrutamento' | 'desenvolvimento' | 'gestao' | 'avaliacao' | 'compliance';
  badge?: string;
}

const categoryTone: Record<RHSection['category'], { icon: string; chip: string; iconBox: string }> = {
  recrutamento: {
    icon: 'text-emerald-700 dark:text-emerald-300',
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100',
    iconBox: 'border-emerald-200 bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/20',
  },
  desenvolvimento: {
    icon: 'text-blue-700 dark:text-blue-300',
    chip: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-100',
    iconBox: 'border-blue-200 bg-blue-100 dark:border-blue-500/40 dark:bg-blue-500/20',
  },
  avaliacao: {
    icon: 'text-purple-700 dark:text-purple-300',
    chip: 'border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-100',
    iconBox: 'border-purple-200 bg-purple-100 dark:border-purple-500/40 dark:bg-purple-500/20',
  },
  gestao: {
    icon: 'text-slate-700 dark:text-slate-200',
    chip: 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-500/40 dark:bg-slate-500/15 dark:text-slate-100',
    iconBox: 'border-slate-200 bg-slate-100 dark:border-slate-500/40 dark:bg-slate-500/20',
  },
  compliance: {
    icon: 'text-zinc-700 dark:text-zinc-200',
    chip: 'border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-500/40 dark:bg-zinc-500/15 dark:text-zinc-100',
    iconBox: 'border-zinc-200 bg-zinc-100 dark:border-zinc-500/40 dark:bg-zinc-500/20',
  },
};

export default function RH() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const canAccessRecrutamento = user?.company_id === RECRUTAMENTO_COMPANY_ID;

  const rhSections: RHSection[] = [
    // Recrutamento
    {
      title: 'Recrutamento e Seleção',
      description: 'Formulários de vagas, entrevistas e banco de talentos',
      icon: Briefcase,
      path: '/admin/job-surveys',
      color: 'text-emerald-700',
      category: 'recrutamento',
    },
    {
      title: 'Entrevistas',
      description: 'Agendar e avaliar entrevistas com IA',
      icon: CalendarCheck,
      path: '/admin/interviews',
      color: 'text-indigo-700',
      category: 'recrutamento',
    },
    {
      title: 'Banco de Talentos',
      description: 'Candidatos e currículos',
      icon: UserPlus,
      path: '/admin/talent-bank',
      color: 'text-blue-700',
      category: 'recrutamento',
    },
    
    // Avaliação
    {
      title: 'Teste DISC',
      description: 'Avaliações comportamentais e perfis DISC',
      icon: Brain,
      path: '/teste-disc',
      color: 'text-purple-600',
      category: 'avaliacao',
    },
    {
      title: 'Avaliações DISC (Admin)',
      description: 'Ferramentas administrativas de avaliação e clima',
      icon: FileText,
      path: '/admin/disc',
      color: 'text-orange-600',
      category: 'avaliacao',
    },
    
    // Gestão
    {
      title: 'Colaboradores',
      description: 'Dados dos colaboradores e usuários do sistema',
      icon: Users,
      path: '/admin/users',
      color: 'text-slate-700',
      category: 'gestao',
    },
    {
      title: 'Ponto Eletrônico',
      description: 'Registro de ponto e controle de jornada',
      icon: Clock,
      path: '/ponto',
      color: 'text-indigo-600',
      category: 'gestao',
    },
    {
      title: 'Gestão de Ponto (Admin)',
      description: 'Monitore e gerencie registros de ponto dos funcionários',
      icon: Clock,
      path: '/admin/timeclock',
      color: 'text-indigo-700',
      category: 'gestao',
    },
    // Compliance
    {
      title: 'Compliance / Documentos',
      description: 'Políticas internas, documentos e estrutura organizacional',
      icon: ShieldCheck,
      path: '/admin/estrutura',
      color: 'text-slate-800',
      category: 'compliance',
    },
  ];

  const categories = useMemo(() => {
    const base = [
      { id: 'recrutamento', label: 'Recrutamento', icon: Briefcase, color: 'text-emerald-700' },
      { id: 'desenvolvimento', label: 'Desenvolvimento', icon: GraduationCap, color: 'text-blue-600' },
      { id: 'avaliacao', label: 'Avaliação', icon: Brain, color: 'text-purple-600' },
      { id: 'gestao', label: 'Gestão', icon: UserCog, color: 'text-slate-700' },
      { id: 'compliance', label: 'Compliance', icon: ShieldCheck, color: 'text-slate-800' },
    ] as const;
    if (!canAccessRecrutamento) return base.filter(c => c.id !== 'recrutamento');
    return base;
  }, [canAccessRecrutamento]);

  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');

  useEffect(() => {
    if (!canAccessRecrutamento && selectedCategory === 'recrutamento') setSelectedCategory('all');
  }, [canAccessRecrutamento, selectedCategory]);

  // Filtrar seções (Recrutamento só para empresa 1)
  const filteredSections = useMemo(() => {
    return rhSections.filter(section => {
      if (section.category === 'recrutamento' && !canAccessRecrutamento) return false;
      const matchesSearch = !searchTerm || 
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || section.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory, canAccessRecrutamento]);

  // Agrupar por categoria
  const groupedSections = useMemo(() => {
    const groups: Record<string, RHSection[]> = {};
    filteredSections.forEach(section => {
      if (!groups[section.category]) {
        groups[section.category] = [];
      }
      groups[section.category].push(section);
    });
    return groups;
  }, [filteredSections]);

  return (
    <ModernLayout title="Recursos Humanos" subtitle="Gestão completa de pessoas e desenvolvimento">
      <div className="space-y-5 md:space-y-6 px-1 md:px-0 [&_button]:rounded-full [&_input]:rounded-full [&_badge]:rounded-full">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-medium text-foreground/70 dark:text-foreground/80">Módulos disponíveis</p>
                <p className="text-2xl font-bold tabular-nums">{filteredSections.length}</p>
              </div>
              <div className="rounded-full border border-primary/25 bg-primary/10 p-3 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-medium text-foreground/70 dark:text-foreground/80">Categorias</p>
                <p className="text-2xl font-bold tabular-nums">{categories.length}</p>
              </div>
              <div className="rounded-full border border-blue-500/25 bg-blue-500/10 p-3 text-blue-700 dark:text-blue-300">
                <UserCog className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-medium text-foreground/70 dark:text-foreground/80">Filtro atual</p>
                <p className="text-lg font-bold truncate">
                  {selectedCategory === 'all' ? 'Todos' : categories.find((c) => c.id === selectedCategory)?.label}
                </p>
              </div>
              <div className="rounded-full border border-emerald-500/25 bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-300">
                <Search className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Busca e Filtros */}
        <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Campo de Busca */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar módulo ou funcionalidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 rounded-full border-border bg-background text-foreground placeholder:text-muted-foreground"
                />
              </div>
              
              {/* Filtros de Categoria */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full border font-semibold text-sm transition-all min-h-10 ${
                    selectedCategory === 'all'
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'border-border bg-background text-foreground/80 hover:bg-muted hover:text-foreground'
                  }`}
                >
                  Todos
                </button>
                {categories.map(category => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-full border font-semibold text-sm transition-all flex items-center gap-2 min-h-10 ${
                        selectedCategory === category.id
                          ? `bg-primary text-primary-foreground border-primary shadow-sm`
                          : 'border-border bg-background text-foreground/80 hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seções Agrupadas */}
        {selectedCategory === 'all' ? (
          // Exibir agrupado por categoria
          categories.map(category => {
            const sectionsInCategory = groupedSections[category.id] || [];
            if (sectionsInCategory.length === 0) return null;
            
            const CategoryIcon = category.icon;
            
            return (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                  <div className={cn('rounded-full border p-2', categoryTone[category.id as RHSection['category']].iconBox)}>
                    <CategoryIcon className={cn('h-4 w-4', categoryTone[category.id as RHSection['category']].icon)} />
                  </div>
                  <h2 className="text-lg font-bold">{category.label}</h2>
                  <Badge variant="outline" className={cn('ml-auto rounded-full', categoryTone[category.id as RHSection['category']].chip)}>
                    {sectionsInCategory.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {sectionsInCategory.map((section) => {
                    const Icon = section.icon;
                    return (
                      <Card
                        key={section.path}
                        className="group cursor-pointer overflow-hidden rounded-2xl border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg active:scale-[0.98]"
                        onClick={() => navigate(section.path)}
                      >
                        <CardHeader className="px-4 pb-4 pt-4">
                          <div className="flex items-start gap-3">
                            <div className={cn('rounded-2xl border p-3 shadow-sm transition-transform group-hover:scale-105', categoryTone[section.category].iconBox)}>
                              <Icon className={cn('h-5 w-5', categoryTone[section.category].icon)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <CardTitle className="text-base font-semibold leading-tight">{section.title}</CardTitle>
                                {section.badge && (
                                  <Badge variant="outline" className="text-xs rounded-full border-border">
                                    {section.badge}
                                  </Badge>
                                )}
                              </div>
                              <CardDescription className="text-sm leading-relaxed text-foreground/70 line-clamp-2 dark:text-foreground/80">{section.description}</CardDescription>
                              <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                                Abrir módulo
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          // Exibir apenas categoria selecionada
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filteredSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.path}
                  className="group cursor-pointer overflow-hidden rounded-2xl border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg active:scale-[0.98]"
                  onClick={() => navigate(section.path)}
                >
                  <CardHeader className="px-4 pb-4 pt-4">
                    <div className="flex items-start gap-3">
                      <div className={cn('rounded-2xl border p-3 shadow-sm transition-transform group-hover:scale-105', categoryTone[section.category].iconBox)}>
                        <Icon className={cn('h-5 w-5', categoryTone[section.category].icon)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <CardTitle className="text-base font-semibold leading-tight">{section.title}</CardTitle>
                          {section.badge && (
                            <Badge variant="outline" className="text-xs rounded-full border-border">
                              {section.badge}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm leading-relaxed text-foreground/70 line-clamp-2 dark:text-foreground/80">{section.description}</CardDescription>
                        <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          Abrir módulo
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}

        {/* Mensagem quando não há resultados */}
        {filteredSections.length === 0 && (
          <Card className="rounded-2xl border-border bg-card overflow-hidden">
            <CardContent className="py-8 text-center">
              <p className="text-foreground/70 dark:text-foreground/80">
                Nenhum módulo encontrado com os filtros selecionados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </ModernLayout>
  );
}
