import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import { getApprovalDetail, decideApproval } from '../../services/approvalsApi';
import { CurrencyDisplay } from '../../components/CurrencyDisplay';
import type { ApprovalDetail as ApprovalDetailType } from '../../types/expenseFlow.types';

function ApprovalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reportId = Number(id);

  const [detail, setDetail] = useState<ApprovalDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState('');
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    getApprovalDetail(reportId)
      .then(setDetail)
      .catch(() => setError('Failed to load approval details.'))
      .finally(() => setLoading(false));
  }, [reportId]);

  async function handleDecide(decision: 'Approved' | 'Rejected') {
    setDeciding(true);
    try {
      await decideApproval(reportId, { decision, comments: comments || undefined });
      void navigate('/approvals');
    } catch {
      setError('Failed to record decision. Please try again.');
      setDeciding(false);
    }
  }

  if (loading) return <CircularProgress sx={{ m: 4 }} />;
  if (error || !detail) return <Alert severity="error" sx={{ m: 3 }}>{error ?? 'Not found.'}</Alert>;

  const isPending = detail.status === 'Pending';
  const total = detail.lineItems.reduce((sum, i) => sum + i.amount, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        {detail.reportTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {detail.employeeName} · {detail.department ?? 'No department'} · {detail.periodStart} –{' '}
        {detail.periodEnd}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Submitted: {detail.submittedOn ?? '—'}
      </Typography>

      <Table size="small" sx={{ mb: 3 }}>
        <TableHead>
          <TableRow>
            <TableCell>Category</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Merchant</TableCell>
            <TableCell>Notes</TableCell>
            <TableCell align="right">Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {detail.lineItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.spendDate}</TableCell>
              <TableCell>{item.merchant ?? '—'}</TableCell>
              <TableCell>{item.notes ?? '—'}</TableCell>
              <TableCell align="right">
                <CurrencyDisplay amount={item.amount} currency={item.currency} />
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={4}>
              <strong>Total</strong>
            </TableCell>
            <TableCell align="right">
              <strong>
                <CurrencyDisplay amount={total} />
              </strong>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {isPending && (
        <>
          <Divider sx={{ mb: 2 }} />
          <TextField
            label="Comments (optional)"
            multiline
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              onClick={() => void handleDecide('Approved')}
              disabled={deciding}
            >
              Approve
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => void handleDecide('Rejected')}
              disabled={deciding}
            >
              Reject
            </Button>
          </Box>
        </>
      )}

      <Button sx={{ mt: 3 }} onClick={() => void navigate('/approvals')}>
        ← Back
      </Button>
    </Box>
  );
}

export default ApprovalDetail;
