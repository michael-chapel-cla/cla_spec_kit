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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { StatusChip } from '../../components/StatusChip';
import { CurrencyDisplay } from '../../components/CurrencyDisplay';
import {
  getReport,
  listLineItems,
  addLineItem,
  deleteLineItem,
  submitReport,
} from '../../services/expenseReportsApi';
import type { ExpenseReport, ExpenseLineItem, PolicyViolation } from '../../types/expenseFlow.types';

const CATEGORIES = ['Travel', 'Accommodation', 'Meals', 'Equipment', 'Software', 'Other'];

function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const reportId = Number(id);

  const [report, setReport] = useState<ExpenseReport | null>(null);
  const [lineItems, setLineItems] = useState<ExpenseLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [violations, setViolations] = useState<PolicyViolation[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [category, setCategory] = useState('Travel');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [spendDate, setSpendDate] = useState('');
  const [merchant, setMerchant] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getReport(reportId), listLineItems(reportId)])
      .then(([r, items]) => {
        setReport(r);
        setLineItems(items);
      })
      .catch(() => setError('Failed to load report.'))
      .finally(() => setLoading(false));
  }, [reportId]);

  async function handleAddLineItem() {
    setSaving(true);
    try {
      await addLineItem(reportId, {
        category,
        amount: parseFloat(amount),
        currency,
        spendDate,
        merchant: merchant || undefined,
      });
      const items = await listLineItems(reportId);
      setLineItems(items);
      setAddOpen(false);
      setAmount('');
      setMerchant('');
    } catch {
      setError('Failed to add line item.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(lineItemId: number) {
    try {
      await deleteLineItem(reportId, lineItemId);
      setLineItems((prev) => prev.filter((i) => i.id !== lineItemId));
    } catch {
      setError('Failed to delete line item.');
    }
  }

  async function handleSubmit() {
    setViolations([]);
    try {
      const result = await submitReport(reportId);
      if (result.violations.length > 0) {
        setViolations(result.violations);
      } else {
        const updated = await getReport(reportId);
        setReport(updated);
      }
    } catch {
      setError('Failed to submit report.');
    }
  }

  if (loading) return <CircularProgress sx={{ m: 4 }} />;
  if (error || !report) return <Alert severity="error" sx={{ m: 3 }}>{error ?? 'Report not found.'}</Alert>;

  const isDraft = report.status === 'Draft';
  const total = lineItems.reduce((sum, i) => sum + i.amount, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant="h5">{report.title}</Typography>
        <StatusChip status={report.status} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {report.periodStart} – {report.periodEnd}
      </Typography>

      {violations.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Policy violations:
          <ul>
            {violations.map((v) => (
              <li key={v.lineItemId}>{v.message}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">
          Line Items — Total: <CurrencyDisplay amount={total} />
        </Typography>
        {isDraft && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => setAddOpen(true)}>
              Add Item
            </Button>
            <Button variant="contained" onClick={() => void handleSubmit()}>
              Submit for Approval
            </Button>
          </Box>
        )}
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Category</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Merchant</TableCell>
            <TableCell align="right">Amount</TableCell>
            {isDraft && <TableCell />}
          </TableRow>
        </TableHead>
        <TableBody>
          {lineItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.spendDate}</TableCell>
              <TableCell>{item.merchant ?? '—'}</TableCell>
              <TableCell align="right">
                <CurrencyDisplay amount={item.amount} currency={item.currency} />
              </TableCell>
              {isDraft && (
                <TableCell>
                  <Button size="small" color="error" onClick={() => void handleDelete(item.id)}>
                    Remove
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
          {lineItems.length === 0 && (
            <TableRow>
              <TableCell colSpan={isDraft ? 5 : 4} align="center">
                No line items yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Button sx={{ mt: 3 }} onClick={() => void navigate('/expenses')}>
        ← Back
      </Button>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Line Item</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            fullWidth
          >
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
          />
          <TextField
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            fullWidth
          />
          <TextField
            label="Spend Date"
            type="date"
            value={spendDate}
            onChange={(e) => setSpendDate(e.target.value)}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Merchant (optional)"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void handleAddLineItem()}
            disabled={saving || !amount || !spendDate}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ReportDetail;
