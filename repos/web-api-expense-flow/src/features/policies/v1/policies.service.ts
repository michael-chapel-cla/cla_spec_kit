import sql from 'mssql';
import type { DbClient } from '../../../shared/db/db.client.js';
import type { ExpensePolicy, CreatePolicyInput } from './policies.types.js';

export class PoliciesService {
  constructor(private readonly db: DbClient) {}

  async list(tenantId: number): Promise<ExpensePolicy[]> {
    const result = await this.db.executeQuery<ExpensePolicy>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .query(
          'SELECT Id, TenantId, Category, MaxAmountPerItem, MaxAmountPerDay, RequiresReceipt, RequiresNotes, IsActive, CreatedOn, ModifiedOn FROM dbo.ExpensePolicies WHERE TenantId = @tenantId AND IsActive = 1 ORDER BY Category',
        ),
    );
    return result.recordset;
  }

  async create(tenantId: number, input: CreatePolicyInput): Promise<number> {
    const result = await this.db.executeQuery<{ Id: number }>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('category', sql.NVarChar(100), input.category)
        .input('maxAmountPerItem', sql.Decimal(18, 2), input.maxAmountPerItem ?? null)
        .input('maxAmountPerDay', sql.Decimal(18, 2), input.maxAmountPerDay ?? null)
        .input('requiresReceipt', sql.Bit, input.requiresReceipt ? 1 : 0)
        .input('requiresNotes', sql.Bit, input.requiresNotes ? 1 : 0)
        .query(
          'INSERT INTO dbo.ExpensePolicies (TenantId, Category, MaxAmountPerItem, MaxAmountPerDay, RequiresReceipt, RequiresNotes) OUTPUT INSERTED.Id VALUES (@tenantId, @category, @maxAmountPerItem, @maxAmountPerDay, @requiresReceipt, @requiresNotes)',
        ),
    );
    return result.recordset[0].Id;
  }

  async update(tenantId: number, id: number, input: CreatePolicyInput): Promise<void> {
    await this.db.executeQuery((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('id', sql.Int, id)
        .input('category', sql.NVarChar(100), input.category)
        .input('maxAmountPerItem', sql.Decimal(18, 2), input.maxAmountPerItem ?? null)
        .input('maxAmountPerDay', sql.Decimal(18, 2), input.maxAmountPerDay ?? null)
        .input('requiresReceipt', sql.Bit, input.requiresReceipt ? 1 : 0)
        .input('requiresNotes', sql.Bit, input.requiresNotes ? 1 : 0)
        .query(
          'UPDATE dbo.ExpensePolicies SET Category = @category, MaxAmountPerItem = @maxAmountPerItem, MaxAmountPerDay = @maxAmountPerDay, RequiresReceipt = @requiresReceipt, RequiresNotes = @requiresNotes, ModifiedOn = SYSUTCDATETIME() WHERE TenantId = @tenantId AND Id = @id',
        ),
    );
  }

  async deactivate(tenantId: number, id: number): Promise<void> {
    await this.db.executeQuery((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('id', sql.Int, id)
        .query(
          'UPDATE dbo.ExpensePolicies SET IsActive = 0, ModifiedOn = SYSUTCDATETIME() WHERE TenantId = @tenantId AND Id = @id',
        ),
    );
  }
}
