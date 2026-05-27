import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { createReport } from '../../services/expenseReportsApi';

function NewReport() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { id } = await createReport({ title, periodStart, periodEnd });
      void navigate(`/expenses/${id}`);
    } catch {
      setError('Failed to create report. Please try again.');
      setSaving(false);
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 480 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        New Expense Report
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={(e) => void handleSubmit(e)} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Report Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Period Start"
          type="date"
          value={periodStart}
          onChange={(e) => setPeriodStart(e.target.value)}
          required
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Period End"
          type="date"
          value={periodEnd}
          onChange={(e) => setPeriodEnd(e.target.value)}
          required
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" type="submit" disabled={saving}>
            {saving ? 'Creating…' : 'Create Report'}
          </Button>
          <Button variant="outlined" onClick={() => void navigate('/expenses')}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default NewReport;
