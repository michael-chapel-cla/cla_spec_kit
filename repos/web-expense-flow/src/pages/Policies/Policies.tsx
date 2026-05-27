import { useEffect, useState } from 'react';
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
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import AddIcon from '@mui/icons-material/Add';
import { listPolicies, createPolicy, deletePolicy } from '../../services/policiesApi';
import type { Policy } from '../../types/expenseFlow.types';

function Policies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [requiresReceipt, setRequiresReceipt] = useState(false);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    listPolicies()
      .then(setPolicies)
      .catch(() => setError('Failed to load policies.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCreate() {
    setSaving(true);
    try {
      await createPolicy({
        category: category || undefined,
        maxAmountPerItem: maxAmount ? parseFloat(maxAmount) : undefined,
        requiresReceipt,
      });
      setAddOpen(false);
      setCategory('');
      setMaxAmount('');
      setRequiresReceipt(false);
      load();
    } catch {
      setError('Failed to create policy.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deletePolicy(id);
      setPolicies((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError('Failed to delete policy.');
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Expense Policies</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
          Add Policy
        </Button>
      </Box>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell align="right">Max Amount</TableCell>
              <TableCell>Requires Receipt</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {policies.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.category ?? '(All categories)'}</TableCell>
                <TableCell align="right">
                  {p.maxAmountPerItem != null ? `£${p.maxAmountPerItem.toFixed(2)}` : '—'}
                </TableCell>
                <TableCell>{p.requiresReceipt ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => void handleDelete(p.id)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {policies.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No policies defined.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Policy</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Category (leave blank for all)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            fullWidth
          />
          <TextField
            label="Max Amount Per Item (£)"
            type="number"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={requiresReceipt}
                onChange={(e) => setRequiresReceipt(e.target.checked)}
              />
            }
            label="Requires Receipt"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void handleCreate()} disabled={saving}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Policies;
