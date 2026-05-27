export type ExpenseCategory = 'meals' | 'travel' | 'accommodation' | 'other';

export interface ExpenseLineItem {
  id: number;
  tenantId: number;
  reportId: number;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  spendDate: string;
  merchant: string | null;
  notes: string | null;
  receiptId: number | null;
  createdOn: string;
  modifiedOn: string | null;
}

export interface CreateExpenseLineItemInput {
  reportId: number;
  category: ExpenseCategory;
  amount: number;
  currency?: string;
  spendDate: string;
  merchant?: string;
  notes?: string;
  receiptId?: number;
}

export interface UpdateExpenseLineItemInput {
  category?: ExpenseCategory;
  amount?: number;
  currency?: string;
  spendDate?: string;
  merchant?: string;
  notes?: string;
  receiptId?: number;
}
