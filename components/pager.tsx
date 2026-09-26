'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { useT, useLocale } from './i18n-provider';

/** Shared prev/next pager. Hidden when everything fits on one page. */
export function Pager({
  page,
  total,
  limit,
  onChange,
}: {
  page: number;
  total: number;
  limit: number;
  onChange: (p: number) => void;
}) {
  const t = useT();
  const locale = useLocale();
  const pages = Math.max(1, Math.ceil((total ?? 0) / limit));
  if (pages <= 1) return null;
  const Prev = locale === 'ar' ? ChevronRight : ChevronLeft;
  const Next = locale === 'ar' ? ChevronLeft : ChevronRight;

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onChange(Math.max(1, page - 1))}>
        <Prev /> {t.common.prev}
      </Button>
      <span className="min-w-24 text-center text-xs font-bold text-muted-foreground">
        {t.common.pageWord} {page} {t.common.ofWord} {pages}
      </span>
      <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onChange(Math.min(pages, page + 1))}>
        {t.common.next} <Next />
      </Button>
    </div>
  );
}
