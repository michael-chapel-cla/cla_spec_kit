import axios from 'axios';
import type {
  ExpenseReport,
  ExpenseLineItem,
  CreateReportRequest,
  CreateLineItemRequest,
  SubmitResult,
} from '../types/expenseFlow.types';

const base = '/api/v1';

export async function listMyReports(): Promise<ExpenseReport[]> {
  const { data } = await axios.get<ExpenseReport[]>(`${base}/ExpenseReports`);
  return data;
}

export async function getReport(id: number): Promise<ExpenseReport> {
  const { data } = await axios.get<ExpenseReport>(`${base}/ExpenseReports/${id}`);
  return data;
}

export async function createReport(body: CreateReportRequest): Promise<{ id: number }> {
  const { data } = await axios.post<{ id: number }>(`${base}/ExpenseReports`, body);
  return data;
}

export async function deleteReport(id: number): Promise<void> {
  await axios.delete(`${base}/ExpenseReports/${id}`);
}

export async function submitReport(id: number): Promise<SubmitResult> {
  const { data } = await axios.post<SubmitResult>(`${base}/ExpenseReports/${id}/Submit`);
  return data;
}

export async function listLineItems(reportId: number): Promise<ExpenseLineItem[]> {
  const { data } = await axios.get<ExpenseLineItem[]>(
    `${base}/ExpenseReports/${reportId}/LineItems`,
  );
  return data;
}

export async function addLineItem(
  reportId: number,
  body: CreateLineItemRequest,
): Promise<{ id: number }> {
  const { data } = await axios.post<{ id: number }>(
    `${base}/ExpenseReports/${reportId}/LineItems`,
    body,
  );
  return data;
}

export async function deleteLineItem(reportId: number, lineItemId: number): Promise<void> {
  await axios.delete(`${base}/ExpenseReports/${reportId}/LineItems/${lineItemId}`);
}
