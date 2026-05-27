import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyExpenses from '../../../src/pages/MyExpenses/MyExpenses';
import * as api from '../../../src/services/expenseReportsApi';

vi.mock('../../../src/services/expenseReportsApi');

const mockReports = [
  {
    id: 1,
    title: 'Q1 Travel',
    periodStart: '2024-01-01',
    periodEnd: '2024-03-31',
    status: 'Draft' as const,
    submittedOn: null,
    createdOn: '2024-01-15',
    userId: 42,
  },
];

describe('MyExpenses', () => {
  beforeEach(() => {
    vi.mocked(api.listMyReports).mockResolvedValue(mockReports);
  });

  it('renders the page heading', async () => {
    render(
      <MemoryRouter>
        <MyExpenses />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('My Expenses')).toBeInTheDocument();
    });
  });

  it('shows reports returned from the API', async () => {
    render(
      <MemoryRouter>
        <MyExpenses />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Q1 Travel')).toBeInTheDocument();
    });
  });

  it('shows empty state when no reports exist', async () => {
    vi.mocked(api.listMyReports).mockResolvedValue([]);
    render(
      <MemoryRouter>
        <MyExpenses />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('No expense reports yet.')).toBeInTheDocument();
    });
  });

  it('shows error alert when API fails', async () => {
    vi.mocked(api.listMyReports).mockRejectedValue(new Error('network error'));
    render(
      <MemoryRouter>
        <MyExpenses />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Failed to load expense reports.')).toBeInTheDocument();
    });
  });
});
