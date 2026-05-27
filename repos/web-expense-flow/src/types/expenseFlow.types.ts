export type ExpenseReportStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected';
export type ApprovalDecision = 'Approved' | 'Rejected';
export type PolicyViolationType = 'MaxAmountPerItem' | 'RequiresReceipt';

export interface ExpenseReport {
  id: number;
  title: string;
  periodStart: string;
  periodEnd: string;
  status: ExpenseReportStatus;
  submittedOn: string | null;
  createdOn: string;
  userId: number;
}

export interface ExpenseLineItem {
  id: number;
  reportId: number;
  category: string;
  amount: number;
  currency: string;
  spendDate: string;
  merchant: string | null;
  notes: string | null;
  receiptId: number | null;
}

export interface PolicyViolation {
  lineItemId: number;
  category: string;
  violationType: PolicyViolationType;
  message: string;
}

export interface SubmitResult {
  submitted: boolean;
  violations: PolicyViolation[];
}

export interface Approval {
  id: number;
  reportId: number;
  reportTitle: string;
  employeeName: string;
  employeeEmail: string;
  department: string | null;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  currency: string;
  status: ExpenseReportStatus;
  submittedOn: string | null;
}

export interface ApprovalDetail extends Approval {
  lineItems: ExpenseLineItem[];
  decision: ApprovalDecision | null;
  decidedOn: string | null;
  comments: string | null;
}

export interface User {
  id: number;
  displayName: string;
  email: string;
  departmentId: number | null;
  department: string | null;
  role: string;
  isActive: boolean;
}

export interface Policy {
  id: number;
  category: string | null;
  maxAmountPerItem: number | null;
  requiresReceipt: boolean;
  isActive: boolean;
}

export interface SpendByCategory {
  category: string;
  totalAmount: number;
  reportCount: number;
}

export interface CreateReportRequest {
  title: string;
  periodStart: string;
  periodEnd: string;
}

export interface CreateLineItemRequest {
  category: string;
  amount: number;
  currency: string;
  spendDate: string;
  merchant?: string;
  notes?: string;
}

export interface DecideApprovalRequest {
  decision: ApprovalDecision;
  comments?: string;
}

export interface CreatePolicyRequest {
  category?: string;
  maxAmountPerItem?: number;
  requiresReceipt: boolean;
}
