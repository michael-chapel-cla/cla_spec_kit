import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApprovalsService } from '../../src/features/approvals/v1/approvals.service.js';
import type { DbClient } from '../../src/shared/db/db.client.js';

const mockDb: DbClient = {
  executeQuery: vi.fn(),
};

describe('ApprovalsService', () => {
  let service: ApprovalsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ApprovalsService(mockDb);
  });

  describe('list', () => {
    it('returns pending reports under the manager', async () => {
      const rows = [{ reportId: 1, employeeName: 'Emma Walsh', status: 'Pending' }];
      vi.mocked(mockDb.executeQuery).mockResolvedValue({ recordset: rows } as never);
      const result = await service.list(1, 10);
      expect(result).toEqual(rows);
    });
  });

  describe('create', () => {
    it('inserts an approval and updates report status', async () => {
      vi.mocked(mockDb.executeQuery).mockResolvedValue({ recordset: [] } as never);
      await expect(
        service.create(1, 5, { decision: 'Approved', comments: 'Looks good' }),
      ).resolves.not.toThrow();
    });
  });
});
