export interface SpendByCategory {
  category: string;
  totalAmount: number;
  reportCount: number;
}

export interface ExportRow {
  reportId: number;
  employeeName: string;
  employeeEmail: string;
  department: string | null;
  reportTitle: string;
  periodStart: string;
  periodEnd: string;
  category: string;
  amount: number;
  currency: string;
  spendDate: string;
  merchant: string | null;
  notes: string | null;
  approvedBy: string | null;
  approvedOn: string | null;
}
