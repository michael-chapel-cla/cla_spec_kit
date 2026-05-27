import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReceiptsService } from '../../src/features/receipts/v1/receipts.service.js';
import type { DbClient } from '../../src/shared/db/db.client.js';

const mockDb: DbClient = {
  executeQuery: vi.fn(),
};

describe('ReceiptsService', () => {
  let service: ReceiptsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ReceiptsService(mockDb);
  });

  it('list returns receipts for the given report', async () => {
    const rows = [{ id: 1, lineItemId: 10, blobName: 'receipt-001.pdf', uploadedOn: '2024-02-01' }];
    vi.mocked(mockDb.executeQuery).mockResolvedValue({ recordset: rows } as never);
    const result = await service.list(1, 5);
    expect(result).toEqual(rows);
  });
});
