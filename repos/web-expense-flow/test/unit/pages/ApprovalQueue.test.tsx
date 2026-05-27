import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ApprovalQueue from '../../../src/pages/ApprovalQueue/ApprovalQueue';
import * as api from '../../../src/services/approvalsApi';

vi.mock('../../../src/services/approvalsApi');

const mockApprovals = [
  {
    id: 1,
    reportId: 10,
    reportTitle: 'March Expenses',
    employeeName: 'Emma Walsh',
    employeeEmail: 'emma@example.com',
    department: 'Sales',
    periodStart: '2024-03-01',
    periodEnd: '2024-03-31',
    totalAmount: 450.0,
    currency: 'GBP',
    status: 'Pending' as const,
    submittedOn: '2024-04-01',
  },
];

describe('ApprovalQueue', () => {
  beforeEach(() => {
    vi.mocked(api.listPendingApprovals).mockResolvedValue(mockApprovals);
  });

  it('renders the page heading', async () => {
    render(
      <MemoryRouter>
        <ApprovalQueue />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Approval Queue')).toBeInTheDocument();
    });
  });

  it('displays pending approvals', async () => {
    render(
      <MemoryRouter>
        <ApprovalQueue />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Emma Walsh')).toBeInTheDocument();
      expect(screen.getByText('March Expenses')).toBeInTheDocument();
    });
  });

  it('shows empty state when queue is empty', async () => {
    vi.mocked(api.listPendingApprovals).mockResolvedValue([]);
    render(
      <MemoryRouter>
        <ApprovalQueue />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('No pending approvals.')).toBeInTheDocument();
    });
  });
});
