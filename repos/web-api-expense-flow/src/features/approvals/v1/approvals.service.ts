import sql from 'mssql';
import type { DbClient } from '../../../shared/db/db.client.js';
import type { Approval, CreateApprovalInput } from './approvals.types.js';

export class ApprovalsService {
  constructor(private readonly db: DbClient) {}

  async listPendingForManager(tenantId: number, managerId: number): Promise<Approval[]> {
    const result = await this.db.executeQuery<Approval>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('managerId', sql.Int, managerId)
        .query(
          `SELECT a.Id, a.TenantId, a.ReportId, a.ApproverId, a.Decision, a.Comment, a.DecidedOn, a.CreatedOn
           FROM dbo.Approvals a
           INNER JOIN dbo.ExpenseReports r ON r.Id = a.ReportId AND r.TenantId = a.TenantId
           INNER JOIN dbo.Users u ON u.Id = r.UserId
           WHERE a.TenantId = @tenantId AND u.ManagerUserId = @managerId AND r.Status = 'Pending'
           ORDER BY a.CreatedOn DESC`,
        ),
    );
    return result.recordset;
  }

  async getById(tenantId: number, id: number): Promise<Approval | null> {
    const result = await this.db.executeQuery<Approval>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('id', sql.Int, id)
        .query(
          'SELECT Id, TenantId, ReportId, ApproverId, Decision, Comment, DecidedOn, CreatedOn FROM dbo.Approvals WHERE TenantId = @tenantId AND Id = @id',
        ),
    );
    return result.recordset[0] ?? null;
  }

  async create(tenantId: number, approverId: number, input: CreateApprovalInput): Promise<number> {
    const result = await this.db.executeQuery<{ Id: number }>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('reportId', sql.Int, input.reportId)
        .input('approverId', sql.Int, approverId)
        .input('decision', sql.NVarChar(20), input.decision)
        .input('comment', sql.NVarChar(2000), input.comment ?? null)
        .query(
          "INSERT INTO dbo.Approvals (TenantId, ReportId, ApproverId, Decision, Comment) OUTPUT INSERTED.Id VALUES (@tenantId, @reportId, @approverId, @decision, @comment)",
        ),
    );

    const newStatus = input.decision === 'Approved' ? 'Approved' : 'Rejected';
    await this.db.executeQuery((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('reportId', sql.Int, input.reportId)
        .input('status', sql.NVarChar(50), newStatus)
        .query(
          'UPDATE dbo.ExpenseReports SET Status = @status, ModifiedOn = SYSUTCDATETIME() WHERE TenantId = @tenantId AND Id = @reportId',
        ),
    );

    return result.recordset[0].Id;
  }
}
