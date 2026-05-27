export interface ExpensePolicy {
  id: number;
  tenantId: number;
  category: string;
  maxAmountPerItem: number | null;
  maxAmountPerDay: number | null;
  requiresReceipt: boolean;
  requiresNotes: boolean;
  isActive: boolean;
  createdOn: string;
  modifiedOn: string | null;
}

export interface CreatePolicyInput {
  category: string;
  maxAmountPerItem?: number;
  maxAmountPerDay?: number;
  requiresReceipt: boolean;
  requiresNotes: boolean;
}

export interface UpdatePolicyInput extends CreatePolicyInput {}
