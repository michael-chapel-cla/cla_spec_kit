export type ApprovalDecision = 'Approved' | 'Rejected';

export interface Approval {
  id: number;
  tenantId: number;
  reportId: number;
  approverId: number;
  decision: ApprovalDecision;
  comment: string | null;
  decidedOn: string;
  createdOn: string;
}

export interface CreateApprovalInput {
  reportId: number;
  decision: ApprovalDecision;
  comment?: string;
}
