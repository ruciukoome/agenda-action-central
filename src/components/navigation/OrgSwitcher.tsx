import { Check, ChevronsUpDown, Building2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOrganization } from '@/contexts/OrganizationContext';
import { cn } from '@/lib/utils';

export function OrgSwitcher() {
  const { organization, memberships, switchOrganization } = useOrganization();
  const navigate = useNavigate();

  if (memberships.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-[220px] gap-2">
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{organization?.name ?? 'Select organization'}</span>
          <ChevronsUpDown className="h-3 w-3 ml-auto opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Switch organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((m) => {
          const isCurrent = m.organization_id === organization?.id;
          return (
            <DropdownMenuItem
              key={m.id}
              onClick={() => {
                if (!isCurrent) {
                  switchOrganization(m.organization_id);
                  // Force a reload of org-scoped data
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2"
            >
              <Building2 className="h-4 w-4 opacity-70" />
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm">{m.organization.name}</div>
                <div className="truncate text-xs text-muted-foreground capitalize">{m.role}</div>
              </div>
              <Check className={cn('h-4 w-4', isCurrent ? 'opacity-100' : 'opacity-0')} />
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/onboarding?add=1')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create or join another
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
