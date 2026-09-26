'use client';
import { Badge } from './ui/badge';
import { useT } from './i18n-provider';

const VARIANTS: Record<string, 'success' | 'warning' | 'info' | 'destructive' | 'muted'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  COMPLETED: 'success',
  CANCELLED: 'muted',
  REJECTED: 'destructive',
  ACTIVE: 'success',
  SUSPENDED: 'destructive',
};

export function StatusBadge({ status }: { status: string }) {
  const t = useT();
  const label = (t.status as Record<string, string>)[status] ?? status;
  return (
    <Badge variant={VARIANTS[status] ?? 'muted'}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
