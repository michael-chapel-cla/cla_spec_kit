import axios from 'axios';
import type { SpendByCategory } from '../types/expenseFlow.types';

const base = '/api/v1';

export async function getSpendByCategory(
  periodStart: string,
  periodEnd: string,
): Promise<SpendByCategory[]> {
  const { data } = await axios.get<SpendByCategory[]>(`${base}/Reports/Spend`, {
    params: { periodStart, periodEnd },
  });
  return data;
}

export async function downloadExport(periodStart: string, periodEnd: string): Promise<void> {
  const response = await axios.get(`${base}/Reports/Export`, {
    params: { periodStart, periodEnd },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expense-export-${periodStart}-${periodEnd}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
