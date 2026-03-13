/**
 * CSV template generation and parsing for representative bulk task import.
 */

export const CSV_COLUMNS = [
  'employee_email',
  'title',
  'title_ar',
  'description',
  'due_date',
  'priority',
  'estimated_minutes',
] as const;

export type CsvRow = Record<(typeof CSV_COLUMNS)[number], string>;

export function generateTemplate(): string {
  const header = CSV_COLUMNS.join(',');
  const sample1 = 'ahmed@company.com,Complete safety training,إكمال تدريب السلامة,Mandatory annual training,2026-04-01,2,60';
  const sample2 = 'sara@company.com,Submit quarterly report,تقديم التقرير الربعي,Q1 performance report,2026-03-31,3,120';
  return [header, sample1, sample2].join('\n');
}

export function downloadTemplate() {
  const csv = generateTemplate();
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `task-import-template-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());

  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    header.forEach((col, i) => {
      row[col] = (values[i] ?? '').trim();
    });
    return row as CsvRow;
  });
}

/** Simple CSV line parser that handles quoted values */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
