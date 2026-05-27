import axios from 'axios';
import type { User } from '../types/expenseFlow.types';

const base = '/api/v1';

export async function listUsers(): Promise<User[]> {
  const { data } = await axios.get<User[]>(`${base}/Users`);
  return data;
}

export async function updateUserRole(userId: number, role: string): Promise<void> {
  await axios.put(`${base}/Users/${userId}/Role`, { role });
}
