import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import DownloadIcon from '@mui/icons-material/Download';
import { getSpendByCategory, downloadExport } from '../../services/reportsApi';
import { CurrencyDisplay } from '../../components/CurrencyDisplay';
import type { SpendByCategory } from '../../types/expenseFlow.types';

function FinanceDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';

  const [periodStart, setPeriodStart] = useState(firstOfMonth);
  const [periodEnd, setPeriodEnd] = useState(today);
  const [rows, setRows] = useState<SpendByCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  async function handleLoad() {
    setLoading(true);
    setError(null);
    try {
      const data = await getSpendByCategory(periodStart, periodEnd);
      setRows(data);
    } catch {
      setError('Failed to load spend data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await downloadExport(periodStart, periodEnd);
    } catch {
      setError('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  const total = rows.reduce((sum, r) => sum + r.totalAmount, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Finance Dashboard
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', mb: 3 }}>
        <TextField
          label="Period Start"
          type="date"
          value={periodStart}
          onChange={(e) => setPeriodStart(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Period End"
          type="date"
          value={periodEnd}
          onChange={(e) => setPeriodEnd(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button variant="contained" onClick={() => void handleLoad()} disabled={loading}>
          Load
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => void handleExport()}
          disabled={exporting}
        >
          Export CSV
        </Button>
      </Box>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && rows.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell align="right">Reports</TableCell>
              <TableCell align="right">Total Spend</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.category}>
                <TableCell>{r.category}</TableCell>
                <TableCell align="right">{r.reportCount}</TableCell>
                <TableCell align="right">
                  <CurrencyDisplay amount={r.totalAmount} />
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={2}>
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
      )}
    </Box>
  );
}

export default FinanceDashboard;
