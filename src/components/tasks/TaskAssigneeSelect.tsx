import { useWorkspaceMembers, WorkspaceMember } from '@/hooks/useWorkspaceMembers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface TaskAssigneeSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
  compact?: boolean;
}

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  if (name) return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  if (email) return email[0].toUpperCase();
  return '?';
}

export function TaskAssigneeSelect({ value, onChange, className, compact }: TaskAssigneeSelectProps) {
  const { members } = useWorkspaceMembers();

  return (
    <Select value={value || '_none'} onValueChange={(v) => onChange(v === '_none' ? null : v)}>
      <SelectTrigger className={cn(compact ? "h-7 text-mono" : "h-8 text-xs", className)}>
        <SelectValue placeholder="Sem responsável" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="_none">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <User className="w-3 h-3" /> Sem responsável
          </span>
        </SelectItem>
        {members.map((m) => (
          <SelectItem key={m.user_id} value={m.user_id}>
            <span className="flex items-center gap-1.5">
              <Avatar className="w-4 h-4">
                <AvatarImage src={m.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-micro">{getInitials(m.profile?.full_name, m.profile?.email)}</AvatarFallback>
              </Avatar>
              {m.profile?.full_name || m.profile?.email?.split('@')[0] || 'Usuário'}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Compact inline avatar display for cards
export function TaskAssigneeAvatar({ userId }: { userId: string | null }) {
  const { members } = useWorkspaceMembers();
  if (!userId) return null;
  const member = members.find(m => m.user_id === userId);
  if (!member) return null;

  return (
    <Avatar className="w-5 h-5 flex-shrink-0" title={member.profile?.full_name || member.profile?.email || ''}>
      <AvatarImage src={member.profile?.avatar_url || undefined} />
      <AvatarFallback className="text-micro bg-primary/10 text-primary">
        {getInitials(member.profile?.full_name, member.profile?.email)}
      </AvatarFallback>
    </Avatar>
  );
}
