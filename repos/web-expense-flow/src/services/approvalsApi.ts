import axios from 'axios';
import type { Approval, ApprovalDetail, DecideApprovalRequest } from '../types/expenseFlow.types';

const base = '/api/v1';

export async function listPendingApprovals(): Promise<Approval[]> {
  const { data } = await axios.get<Approval[]>(`${base}/Approvals`);
  return data;
}

export async function getApprovalDetail(reportId: number): Promise<ApprovalDetail> {
  const { data } = await axios.get<ApprovalDetail>(`${base}/Approvals/${reportId}`);
  return data;
}

export async function decideApproval(
  reportId: number,
  body: DecideApprovalRequest,
): Promise<void> {
  await axios.post(`${base}/Approvals/${reportId}/Decision`, body);
}
