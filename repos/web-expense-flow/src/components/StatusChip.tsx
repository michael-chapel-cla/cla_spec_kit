import Chip from '@mui/material/Chip';
import type { ExpenseReportStatus } from '../types/expenseFlow.types';

const COLOR_MAP: Record<ExpenseReportStatus, 'default' | 'warning' | 'success' | 'error'> = {
  Draft: 'default',
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error',
};

interface Props {
  status: ExpenseReportStatus;
}

export function StatusChip({ status }: Props) {
  return <Chip label={status} color={COLOR_MAP[status]} size="small" />;
}
