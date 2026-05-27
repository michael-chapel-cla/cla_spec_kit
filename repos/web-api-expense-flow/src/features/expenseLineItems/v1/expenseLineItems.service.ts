import sql from 'mssql';
import type { DbClient } from '../../../shared/db/db.client.js';
import type {
  ExpenseLineItem,
  CreateExpenseLineItemInput,
  UpdateExpenseLineItemInput,
} from './expenseLineItems.types.js';

export class ExpenseLineItemsService {
  constructor(private readonly db: DbClient) {}

  async listForReport(tenantId: number, reportId: number): Promise<ExpenseLineItem[]> {
    const result = await this.db.executeQuery<ExpenseLineItem>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('reportId', sql.Int, reportId)
        .query(
          'SELECT Id, TenantId, ReportId, Category, Amount, Currency, SpendDate, Merchant, Notes, ReceiptId, CreatedOn, ModifiedOn FROM dbo.ExpenseLineItems WHERE TenantId = @tenantId AND ReportId = @reportId ORDER BY SpendDate',
        ),
    );
    return result.recordset;
  }

  async create(tenantId: number, input: CreateExpenseLineItemInput): Promise<number> {
    const result = await this.db.executeQuery<{ Id: number }>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('reportId', sql.Int, input.reportId)
        .input('category', sql.NVarChar(100), input.category)
        .input('amount', sql.Decimal(18, 2), input.amount)
        .input('currency', sql.NChar(3), input.currency ?? 'GBP')
        .input('spendDate', sql.Date, input.spendDate)
        .input('merchant', sql.NVarChar(255), input.merchant ?? null)
        .input('notes', sql.NVarChar(2000), input.notes ?? null)
        .input('receiptId', sql.Int, input.receiptId ?? null)
        .query(
          'INSERT INTO dbo.ExpenseLineItems (TenantId, ReportId, Category, Amount, Currency, SpendDate, Merchant, Notes, ReceiptId) OUTPUT INSERTED.Id VALUES (@tenantId, @reportId, @category, @amount, @currency, @spendDate, @merchant, @notes, @receiptId)',
        ),
    );
    return result.recordset[0].Id;
  }

  async update(tenantId: number, id: number, input: UpdateExpenseLineItemInput): Promise<void> {
    await this.db.executeQuery((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('id', sql.Int, id)
        .input('category', sql.NVarChar(100), input.category ?? null)
        .input('amount', sql.Decimal(18, 2), input.amount ?? null)
        .input('currency', sql.NChar(3), input.currency ?? null)
        .input('spendDate', sql.Date, input.spendDate ?? null)
        .input('merchant', sql.NVarChar(255), input.merchant ?? null)
        .input('notes', sql.NVarChar(2000), input.notes ?? null)
        .input('receiptId', sql.Int, input.receiptId ?? null)
        .query(
          'UPDATE dbo.ExpenseLineItems SET Category = COALESCE(@category, Category), Amount = COALESCE(@amount, Amount), Currency = COALESCE(@currency, Currency), SpendDate = COALESCE(@spendDate, SpendDate), Merchant = COALESCE(@merchant, Merchant), Notes = COALESCE(@notes, Notes), ReceiptId = COALESCE(@receiptId, ReceiptId), ModifiedOn = SYSUTCDATETIME() WHERE TenantId = @tenantId AND Id = @id',
        ),
    );
  }

  async delete(tenantId: number, id: number): Promise<void> {
    await this.db.executeQuery((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('id', sql.Int, id)
        .query('DELETE FROM dbo.ExpenseLineItems WHERE TenantId = @tenantId AND Id = @id'),
    );
  }
}
