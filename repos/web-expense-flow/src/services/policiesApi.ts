import axios from 'axios';
import type { Policy, CreatePolicyRequest } from '../types/expenseFlow.types';

const base = '/api/v1';

export async function listPolicies(): Promise<Policy[]> {
  const { data } = await axios.get<Policy[]>(`${base}/Policies`);
  return data;
}

export async function createPolicy(body: CreatePolicyRequest): Promise<{ id: number }> {
  const { data } = await axios.post<{ id: number }>(`${base}/Policies`, body);
  return data;
}

export async function updatePolicy(
  id: number,
  body: Partial<CreatePolicyRequest>,
): Promise<void> {
  await axios.put(`${base}/Policies/${id}`, body);
}

export async function deletePolicy(id: number): Promise<void> {
  await axios.delete(`${base}/Policies/${id}`);
}
