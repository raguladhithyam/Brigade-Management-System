import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaginationBarProps {
  page: number;
  pageSize: number;
  totalCount: number;
  rowsOnPage: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageSizeChange: (size: number) => void;
  loading?: boolean;
}

const PAGE_SIZES = [20, 50, 100];

export function PaginationBar({
  page,
  pageSize,
  totalCount,
  rowsOnPage,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onPageSizeChange,
  loading,
}: PaginationBarProps) {
  const from = totalCount === 0 ? 0 : page * pageSize + 1;
  const to = page * pageSize + rowsOnPage;

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          Showing <span className="font-medium text-foreground">{from}</span>–
          <span className="font-medium text-foreground">{to}</span> of{' '}
          <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Rows</span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Page {page + 1}</span>
        <Button variant="outline" size="sm" onClick={onPrev} disabled={!hasPrev || loading}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext || loading}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
