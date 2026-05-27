import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpenseLineItemsService } from '../../src/features/expenseLineItems/v1/expenseLineItems.service.js';
import type { DbClient } from '../../src/shared/db/db.client.js';

const mockDb: DbClient = {
  executeQuery: vi.fn(),
};

describe('ExpenseLineItemsService', () => {
  let service: ExpenseLineItemsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ExpenseLineItemsService(mockDb);
  });

  it('list returns line items for the given report', async () => {
    const rows = [{ id: 1, category: 'Travel', amount: 120, currency: 'GBP' }];
    vi.mocked(mockDb.executeQuery).mockResolvedValue({ recordset: rows } as never);
    const result = await service.list(1, 5);
    expect(result).toEqual(rows);
  });

  it('create returns the new line item id', async () => {
    vi.mocked(mockDb.executeQuery).mockResolvedValue({
      recordset: [{ id: 99 }],
    } as never);
    const id = await service.create(1, 5, {
      category: 'Travel',
      amount: 150,
      currency: 'GBP',
      spendDate: '2024-03-01',
    });
    expect(id).toBe(99);
  });
});
