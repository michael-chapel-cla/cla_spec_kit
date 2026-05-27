import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { listPendingApprovals } from '../../services/approvalsApi';
import { CurrencyDisplay } from '../../components/CurrencyDisplay';
import type { Approval } from '../../types/expenseFlow.types';

function ApprovalQueue() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPendingApprovals()
      .then(setApprovals)
      .catch(() => setError('Failed to load approval queue.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Approval Queue
      </Typography>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Report</TableCell>
              <TableCell>Period</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Submitted</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {approvals.map((a) => (
              <TableRow
                key={a.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => void navigate(`/approvals/${a.reportId}`)}
              >
                <TableCell>{a.employeeName}</TableCell>
                <TableCell>{a.department ?? '—'}</TableCell>
                <TableCell>{a.reportTitle}</TableCell>
                <TableCell>
                  {a.periodStart} – {a.periodEnd}
                </TableCell>
                <TableCell align="right">
                  <CurrencyDisplay amount={a.totalAmount} currency={a.currency} />
                </TableCell>
                <TableCell>{a.submittedOn ?? '—'}</TableCell>
              </TableRow>
            ))}
            {approvals.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No pending approvals.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}

export default ApprovalQueue;
