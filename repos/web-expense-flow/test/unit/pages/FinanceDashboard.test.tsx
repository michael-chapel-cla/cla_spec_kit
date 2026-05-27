import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FinanceDashboard from '../../../src/pages/FinanceDashboard/FinanceDashboard';
import * as api from '../../../src/services/reportsApi';

vi.mock('../../../src/services/reportsApi');

const mockSpend = [
  { category: 'Travel', totalAmount: 1200.0, reportCount: 3 },
  { category: 'Meals', totalAmount: 450.0, reportCount: 5 },
];

describe('FinanceDashboard', () => {
  it('renders the page heading', () => {
    render(
      <MemoryRouter>
        <FinanceDashboard />
      </MemoryRouter>,
    );
    expect(screen.getByText('Finance Dashboard')).toBeInTheDocument();
  });

  it('shows spend by category after loading', async () => {
    vi.mocked(api.getSpendByCategory).mockResolvedValue(mockSpend);
    render(
      <MemoryRouter>
        <FinanceDashboard />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Load'));
    await waitFor(() => {
      expect(screen.getByText('Travel')).toBeInTheDocument();
      expect(screen.getByText('Meals')).toBeInTheDocument();
    });
  });

  it('shows error when API fails', async () => {
    vi.mocked(api.getSpendByCategory).mockRejectedValue(new Error('network'));
    render(
      <MemoryRouter>
        <FinanceDashboard />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('Load'));
    await waitFor(() => {
      expect(screen.getByText('Failed to load spend data.')).toBeInTheDocument();
    });
  });
});
