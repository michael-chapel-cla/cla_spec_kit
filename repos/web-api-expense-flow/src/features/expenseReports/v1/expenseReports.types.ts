export type ReportStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Reimbursed';

export interface ExpenseReport {
  id: number;
  tenantId: number;
  userId: number;
  title: string;
  periodStart: string;
  periodEnd: string;
  status: ReportStatus;
  submittedOn: string | null;
  totalAmount: number;
  createdOn: string;
  modifiedOn: string | null;
}

export interface CreateExpenseReportInput {
  title: string;
  periodStart: string;
  periodEnd: string;
}

export interface UpdateExpenseReportInput {
  title?: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface PolicyViolation {
  field: string;
  message: string;
}
