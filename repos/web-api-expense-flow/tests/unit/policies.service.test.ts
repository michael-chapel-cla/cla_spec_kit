import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PoliciesService } from '../../src/features/policies/v1/policies.service.js';
import type { DbClient } from '../../src/shared/db/db.client.js';

const mockDb: DbClient = {
  executeQuery: vi.fn(),
};

describe('PoliciesService', () => {
  let service: PoliciesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PoliciesService(mockDb);
  });

  it('list returns active policies for tenant', async () => {
    const rows = [{ id: 1, category: 'Travel', maxAmountPerItem: 200, requiresReceipt: true, isActive: true }];
    vi.mocked(mockDb.executeQuery).mockResolvedValue({ recordset: rows } as never);
    const result = await service.list(1);
    expect(result).toEqual(rows);
  });

  it('create returns the new policy id', async () => {
    vi.mocked(mockDb.executeQuery).mockResolvedValue({
      recordset: [{ id: 5 }],
    } as never);
    const id = await service.create(1, { category: 'Meals', requiresReceipt: false });
    expect(id).toBe(5);
  });

  it('deactivate resolves without throwing', async () => {
    vi.mocked(mockDb.executeQuery).mockResolvedValue({ recordset: [] } as never);
    await expect(service.deactivate(1, 3)).resolves.not.toThrow();
  });
});
