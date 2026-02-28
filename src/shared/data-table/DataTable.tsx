import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import type { DataTableProps } from './types';

function DataTableInner<T>({
  columns,
  data,
  rowKey,
  isLoading = false,
  loadingRows = 5,
  emptyMessage,
  emptyIcon,
  emptyDescription,
  bordered = true,
}: DataTableProps<T>) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: loadingRows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        {emptyIcon && <div className="mb-4">{emptyIcon}</div>}
        <p className="text-muted-foreground">
          {emptyMessage ?? t('common.noData')}
        </p>
        {emptyDescription && (
          <p className="text-muted-foreground text-sm mt-1">{emptyDescription}</p>
        )}
      </div>
    );
  }

  const tableContent = (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.id} className={col.className}>
              {col.headerHidden ? '' : col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={rowKey(row)}>
            {columns.map((col) => (
              <TableCell key={col.id} className={col.className}>
                {col.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (bordered) {
    return <div className="rounded-md border">{tableContent}</div>;
  }

  return tableContent;
}

// React.memo for generic components requires a type-cast
export const DataTable = React.memo(DataTableInner) as typeof DataTableInner;
