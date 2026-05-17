import { Check, ChevronsUpDown, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

export function BranchSelector() {
  const { branches, activeBranchId, activeBranch, canViewAllBranches, setActiveBranchId } = useAuth();

  const activeBranches = branches.filter((branch) => branch.is_active !== false);
  const hasSelectableBranches = activeBranches.length > 1;

  if (!hasSelectableBranches) return null;

  const label = activeBranchId === 'all' ? 'Todas as unidades' : activeBranch?.name || activeBranches[0]?.name || 'Matriz';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:inline-flex h-8 max-w-[170px] rounded-full border border-[hsl(var(--sidebar-primary,var(--primary)))]/25 bg-[hsl(var(--sidebar-primary,var(--primary)))]/10 px-2.5 text-[11px] font-medium text-slate-700 shadow-none hover:bg-[hsl(var(--sidebar-primary,var(--primary)))]/15 hover:text-slate-900"
        >
          <Store className="mr-1.5 h-3.5 w-3.5 text-[hsl(var(--sidebar-primary,var(--primary)))]" />
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="ml-1.5 h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-2xl">
        <DropdownMenuLabel className="text-xs">Unidade ativa</DropdownMenuLabel>
        {canViewAllBranches && activeBranches.length > 1 && (
          <>
            <DropdownMenuItem onSelect={() => setActiveBranchId('all')}>
              <Check className={`mr-2 h-4 w-4 ${activeBranchId === 'all' ? 'opacity-100' : 'opacity-0'}`} />
              Todas as unidades
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {activeBranches.map((branch) => (
          <DropdownMenuItem key={branch.id} onSelect={() => setActiveBranchId(branch.id)}>
            <Check className={`mr-2 h-4 w-4 ${activeBranchId === branch.id ? 'opacity-100' : 'opacity-0'}`} />
            <div className="min-w-0">
              <p className="truncate font-medium">{branch.name}</p>
              <p className="text-xs text-muted-foreground">{branch.is_main ? 'Matriz' : branch.type}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
