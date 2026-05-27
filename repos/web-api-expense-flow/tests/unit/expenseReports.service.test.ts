import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpenseReportsService } from '../../src/features/expenseReports/v1/expenseReports.service.js';
import type { DbClient } from '../../src/shared/db/db.client.js';

const mockDb: DbClient = {
  executeQuery: vi.fn(),
};

describe('ExpenseReportsService', () => {
  let service: ExpenseReportsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ExpenseReportsService(mockDb);
  });

  describe('list', () => {
    it('returns reports for the given tenant and user', async () => {
      const rows = [{ id: 1, title: 'Q1', status: 'Draft' }];
      vi.mocked(mockDb.executeQuery).mockResolvedValue({ recordset: rows } as never);
      const result = await service.list(1, 42);
      expect(result).toEqual(rows);
    });
  });

  describe('submit', () => {
    it('returns empty violations when no policies are violated', async () => {
      vi.mocked(mockDb.executeQuery)
        .mockResolvedValueOnce({ recordset: [] } as never) // policies
        .mockResolvedValueOnce({ recordset: [] } as never); // line items
      const result = await service.submit(1, 5, 99);
      expect(result.violations).toHaveLength(0);
      expect(result.submitted).toBe(true);
    });

    it('returns violations when max amount policy is exceeded', async () => {
      vi.mocked(mockDb.executeQuery)
        .mockResolvedValueOnce({
          recordset: [{ id: 1, category: 'Travel', maxAmountPerItem: 100, requiresReceipt: false }],
        } as never)
        .mockResolvedValueOnce({
          recordset: [{ id: 10, category: 'Travel', amount: 250, receiptId: null }],
        } as never);
      const result = await service.submit(1, 5, 99);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.submitted).toBe(false);
    });
  });
});
