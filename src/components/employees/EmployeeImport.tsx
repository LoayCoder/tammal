import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreateEmployeeInput } from "@/hooks/useEmployees";

interface EmployeeImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  onImport: (employees: CreateEmployeeInput[]) => void;
  isLoading?: boolean;
}

interface CSVRow {
  [key: string]: string;
}

const REQUIRED_FIELDS = ['full_name', 'email'];
const OPTIONAL_FIELDS = ['employee_number', 'department', 'role_title', 'hire_date', 'status'];

export function EmployeeImport({ open, onOpenChange, tenantId, onImport, isLoading }: EmployeeImportProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');

  const parseCSV = (text: string): { headers: string[]; rows: CSVRow[] } => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    return { headers, rows };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { headers, rows } = parseCSV(text);
      setCsvHeaders(headers);
      setCsvData(rows);
      
      // Auto-map similar field names
      const autoMapping: Record<string, string> = {};
      [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].forEach(field => {
        const match = headers.find(h => 
          h.toLowerCase().includes(field.replace('_', ' ')) ||
          h.toLowerCase().includes(field.replace('_', '')) ||
          h.toLowerCase() === field
        );
        if (match) autoMapping[field] = match;
      });
      setFieldMapping(autoMapping);
      setStep('map');
    };
    reader.readAsText(file);
  };

  const validateMapping = (): boolean => {
    const newErrors: string[] = [];
    REQUIRED_FIELDS.forEach(field => {
      if (!fieldMapping[field]) {
        newErrors.push(t('employees.importMissingField', { field }));
      }
    });
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleProceedToPreview = () => {
    if (validateMapping()) {
      setStep('preview');
    }
  };

  const getMappedData = (): CreateEmployeeInput[] => {
    return csvData.map(row => ({
      tenant_id: tenantId,
      full_name: row[fieldMapping['full_name']] || '',
      email: row[fieldMapping['email']] || '',
      employee_number: fieldMapping['employee_number'] ? row[fieldMapping['employee_number']] : undefined,
      department: fieldMapping['department'] ? row[fieldMapping['department']] : undefined,
      role_title: fieldMapping['role_title'] ? row[fieldMapping['role_title']] : undefined,
      hire_date: fieldMapping['hire_date'] ? row[fieldMapping['hire_date']] : undefined,
      status: (fieldMapping['status'] ? row[fieldMapping['status']] : 'active') as 'active' | 'resigned' | 'terminated',
    })).filter(emp => emp.full_name && emp.email);
  };

  const handleImport = () => {
    const data = getMappedData();
    onImport(data);
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setCsvData([]);
    setCsvHeaders([]);
    setFieldMapping({});
    setErrors([]);
    setStep('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetState(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('employees.importEmployees')}</DialogTitle>
          <DialogDescription>{t('employees.importDescription')}</DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center w-full">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">{t('employees.dropCSV')}</p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <FileText className="h-4 w-4 me-2" />
                {t('employees.selectFile')}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        )}

        {step === 'map' && (
          <div className="space-y-4">
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc ps-4">
                    {errors.map((error, i) => <li key={i}>{error}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <p className="text-sm text-muted-foreground">{t('employees.mapFields')}</p>
            
            <div className="grid gap-3">
              {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map(field => (
                <div key={field} className="flex items-center gap-4">
                  <span className="w-40 text-sm font-medium">
                    {t(`employees.${field}`)}
                    {REQUIRED_FIELDS.includes(field) && <span className="text-destructive">*</span>}
                  </span>
                  <Select
                    value={fieldMapping[field] || ''}
                    onValueChange={(val) => setFieldMapping({ ...fieldMapping, [field]: val })}
                  >
                    <SelectTrigger className="w-60">
                      <SelectValue placeholder={t('employees.selectColumn')} />
                    </SelectTrigger>
                    <SelectContent>
                      {csvHeaders.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('employees.previewCount', { count: getMappedData().length })}
            </p>
            
            <div className="rounded-md border max-h-80 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('employees.name')}</TableHead>
                    <TableHead>{t('employees.email')}</TableHead>
                    <TableHead>{t('employees.department')}</TableHead>
                    <TableHead>{t('employees.role')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getMappedData().slice(0, 10).map((emp, i) => (
                    <TableRow key={i}>
                      <TableCell>{emp.full_name}</TableCell>
                      <TableCell>{emp.email}</TableCell>
                      <TableCell>{emp.department || '-'}</TableCell>
                      <TableCell>{emp.role_title || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {getMappedData().length > 10 && (
              <p className="text-sm text-muted-foreground text-center">
                {t('employees.andMore', { count: getMappedData().length - 10 })}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
          )}
          {step === 'map' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                {t('common.back')}
              </Button>
              <Button onClick={handleProceedToPreview}>
                {t('common.next')}
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('map')}>
                {t('common.back')}
              </Button>
              <Button onClick={handleImport} disabled={isLoading}>
                {t('employees.importNow', { count: getMappedData().length })}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
