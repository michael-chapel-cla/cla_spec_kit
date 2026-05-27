import sql from 'mssql';
import type { DbClient } from '../../../shared/db/db.client.js';
import type {
  ExpenseReport,
  CreateExpenseReportInput,
  UpdateExpenseReportInput,
  PolicyViolation,
} from './expenseReports.types.js';

export class ExpenseReportsService {
  constructor(private readonly db: DbClient) {}

  async listForUser(tenantId: number, userId: number): Promise<ExpenseReport[]> {
    const result = await this.db.executeQuery<ExpenseReport>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('userId', sql.Int, userId)
        .query(
          'SELECT Id, TenantId, UserId, Title, PeriodStart, PeriodEnd, Status, SubmittedOn, TotalAmount, CreatedOn, ModifiedOn FROM dbo.ExpenseReports WHERE TenantId = @tenantId AND UserId = @userId ORDER BY CreatedOn DESC',
        ),
    );
    return result.recordset;
  }

  async listAll(tenantId: number): Promise<ExpenseReport[]> {
    const result = await this.db.executeQuery<ExpenseReport>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .query(
          'SELECT Id, TenantId, UserId, Title, PeriodStart, PeriodEnd, Status, SubmittedOn, TotalAmount, CreatedOn, ModifiedOn FROM dbo.ExpenseReports WHERE TenantId = @tenantId ORDER BY CreatedOn DESC',
        ),
    );
    return result.recordset;
  }

  async getById(tenantId: number, id: number): Promise<ExpenseReport | null> {
    const result = await this.db.executeQuery<ExpenseReport>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('id', sql.Int, id)
        .query(
          'SELECT Id, TenantId, UserId, Title, PeriodStart, PeriodEnd, Status, SubmittedOn, TotalAmount, CreatedOn, ModifiedOn FROM dbo.ExpenseReports WHERE TenantId = @tenantId AND Id = @id',
        ),
    );
    return result.recordset[0] ?? null;
  }

  async create(tenantId: number, userId: number, input: CreateExpenseReportInput): Promise<number> {
    const result = await this.db.executeQuery<{ Id: number }>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('userId', sql.Int, userId)
        .input('title', sql.NVarChar(255), input.title)
        .input('periodStart', sql.Date, input.periodStart)
        .input('periodEnd', sql.Date, input.periodEnd)
        .query(
          "INSERT INTO dbo.ExpenseReports (TenantId, UserId, Title, PeriodStart, PeriodEnd, Status) OUTPUT INSERTED.Id VALUES (@tenantId, @userId, @title, @periodStart, @periodEnd, 'Draft')",
        ),
    );
    return result.recordset[0].Id;
  }

  async update(tenantId: number, id: number, input: UpdateExpenseReportInput): Promise<void> {
    await this.db.executeQuery((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('id', sql.Int, id)
        .input('title', sql.NVarChar(255), input.title ?? null)
        .input('periodStart', sql.Date, input.periodStart ?? null)
        .input('periodEnd', sql.Date, input.periodEnd ?? null)
        .query(
          'UPDATE dbo.ExpenseReports SET Title = COALESCE(@title, Title), PeriodStart = COALESCE(@periodStart, PeriodStart), PeriodEnd = COALESCE(@periodEnd, PeriodEnd), ModifiedOn = SYSUTCDATETIME() WHERE TenantId = @tenantId AND Id = @id AND Status = \'Draft\'',
        ),
    );
  }

  async submit(tenantId: number, id: number): Promise<PolicyViolation[]> {
    // Evaluate policy rules against line items
    const violations: PolicyViolation[] = [];

    const policyResult = await this.db.executeQuery<{
      Category: string;
      MaxAmountPerItem: number | null;
      RequiresReceipt: boolean;
    }>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .query(
          'SELECT Category, MaxAmountPerItem, RequiresReceipt FROM dbo.ExpensePolicies WHERE TenantId = @tenantId AND IsActive = 1',
        ),
    );

    const lineItemResult = await this.db.executeQuery<{
      Id: number;
      Category: string;
      Amount: number;
      ReceiptId: number | null;
    }>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('reportId', sql.Int, id)
        .query(
          'SELECT Id, Category, Amount, ReceiptId FROM dbo.ExpenseLineItems WHERE TenantId = @tenantId AND ReportId = @reportId',
        ),
    );

    const policies = Object.fromEntries(policyResult.recordset.map((p) => [p.Category, p]));

    for (const item of lineItemResult.recordset) {
      const policy = policies[item.Category];
      if (!policy) continue;
      if (policy.MaxAmountPerItem !== null && item.Amount > policy.MaxAmountPerItem) {
        violations.push({
          field: `lineItem.${item.Id}.amount`,
          message: `Amount £${item.Amount} exceeds the ${item.Category} limit of £${policy.MaxAmountPerItem}`,
        });
      }
      if (policy.RequiresReceipt && !item.ReceiptId) {
        violations.push({
          field: `lineItem.${item.Id}.receipt`,
          message: `A receipt is required for ${item.Category} expenses`,
        });
      }
    }

    if (violations.length === 0) {
      await this.db.executeQuery((req) =>
        req
          .input('tenantId', sql.Int, tenantId)
          .input('id', sql.Int, id)
          .query(
            "UPDATE dbo.ExpenseReports SET Status = 'Pending', SubmittedOn = SYSUTCDATETIME(), ModifiedOn = SYSUTCDATETIME() WHERE TenantId = @tenantId AND Id = @id AND Status = 'Draft'",
          ),
      );
    }

    return violations;
  }

  async delete(tenantId: number, id: number): Promise<void> {
    await this.db.executeQuery((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('id', sql.Int, id)
        .query(
          "DELETE FROM dbo.ExpenseReports WHERE TenantId = @tenantId AND Id = @id AND Status = 'Draft'",
        ),
    );
  }
}
