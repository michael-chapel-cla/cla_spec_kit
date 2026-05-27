import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from '../../src/features/users/v1/users.service.js';
import type { DbClient } from '../../src/shared/db/db.client.js';

const mockDb: DbClient = {
  executeQuery: vi.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UsersService(mockDb);
  });

  it('list returns users for the tenant', async () => {
    const rows = [{ id: 1, displayName: 'Emma Walsh', email: 'emma@example.com', role: 'employee' }];
    vi.mocked(mockDb.executeQuery).mockResolvedValue({ recordset: rows } as never);
    const result = await service.list(1);
    expect(result).toEqual(rows);
  });

  it('upsertFromToken resolves without throwing', async () => {
    vi.mocked(mockDb.executeQuery).mockResolvedValue({ recordset: [] } as never);
    await expect(
      service.upsertFromToken(1, { oid: 'aaa', name: 'Emma Walsh', email: 'emma@example.com' }),
    ).resolves.not.toThrow();
  });
});
