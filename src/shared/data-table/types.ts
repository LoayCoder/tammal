import type { ReactNode } from 'react';

/** Column definition for the shared DataTable component. */
export interface ColumnDef<T> {
  /** Unique key identifying this column */
  id: string;
  /** Header label (already translated) */
  header: string;
  /** Render the cell content for this column */
  cell: (row: T) => ReactNode;
  /** Optional className applied to both <th> and <td> */
  className?: string;
  /** If true, header text is hidden (e.g. actions column) */
  headerHidden?: boolean;
}

/** Props accepted by the shared DataTable. */
export interface DataTableProps<T> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Data rows */
  data: T[];
  /** Extract a unique string key per row */
  rowKey: (row: T) => string;
  /** Show loading skeleton */
  isLoading?: boolean;
  /** Number of skeleton rows to show while loading (default 5) */
  loadingRows?: number;
  /** Message shown when data is empty */
  emptyMessage?: string;
  /** Optional icon rendered above empty message */
  emptyIcon?: ReactNode;
  /** Optional secondary text below empty message */
  emptyDescription?: string;
  /** Wrap the table in a bordered container (default true) */
  bordered?: boolean;
}
