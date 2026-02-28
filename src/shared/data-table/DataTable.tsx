import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SkeletonTable } from '@/shared/loading/Skeletons';
import { EmptyState } from '@/shared/empty/EmptyState';
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
    return <SkeletonTable rows={loadingRows} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyMessage ?? t('common.noData')}
        description={emptyDescription}
        icon={emptyIcon}
      />
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
