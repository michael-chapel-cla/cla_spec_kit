import sql from 'mssql';
import type { DbClient } from '../../../shared/db/db.client.js';
import type { SpendByCategory, ExportRow } from './reports.types.js';

export class ReportsService {
  constructor(private readonly db: DbClient) {}

  async getSpendByCategory(
    tenantId: number,
    periodStart: string,
    periodEnd: string,
  ): Promise<SpendByCategory[]> {
    const result = await this.db.executeQuery<SpendByCategory>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('periodStart', sql.Date, periodStart)
        .input('periodEnd', sql.Date, periodEnd)
        .query(
          `SELECT li.Category, SUM(li.Amount) AS TotalAmount, COUNT(DISTINCT r.Id) AS ReportCount
           FROM dbo.ExpenseLineItems li
           INNER JOIN dbo.ExpenseReports r ON r.Id = li.ReportId AND r.TenantId = li.TenantId
           WHERE li.TenantId = @tenantId AND r.Status = 'Approved'
             AND li.SpendDate >= @periodStart AND li.SpendDate <= @periodEnd
           GROUP BY li.Category
           ORDER BY TotalAmount DESC`,
        ),
    );
    return result.recordset;
  }

  async getExportRows(
    tenantId: number,
    periodStart: string,
    periodEnd: string,
  ): Promise<ExportRow[]> {
    const result = await this.db.executeQuery<ExportRow>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('periodStart', sql.Date, periodStart)
        .input('periodEnd', sql.Date, periodEnd)
        .query(
          `SELECT
             r.Id AS ReportId,
             u.DisplayName AS EmployeeName,
             u.Email AS EmployeeEmail,
             d.Name AS Department,
             r.Title AS ReportTitle,
             r.PeriodStart,
             r.PeriodEnd,
             li.Category,
             li.Amount,
             li.Currency,
             li.SpendDate,
             li.Merchant,
             li.Notes,
             au.DisplayName AS ApprovedBy,
             a.DecidedOn AS ApprovedOn
           FROM dbo.ExpenseLineItems li
           INNER JOIN dbo.ExpenseReports r ON r.Id = li.ReportId AND r.TenantId = li.TenantId
           INNER JOIN dbo.Users u ON u.Id = r.UserId
           LEFT JOIN dbo.Departments d ON d.Id = u.DepartmentId
           LEFT JOIN dbo.Approvals a ON a.ReportId = r.Id AND a.TenantId = r.TenantId AND a.Decision = 'Approved'
           LEFT JOIN dbo.Users au ON au.Id = a.ApproverId
           WHERE li.TenantId = @tenantId AND r.Status = 'Approved'
             AND li.SpendDate >= @periodStart AND li.SpendDate <= @periodEnd
           ORDER BY r.Id, li.SpendDate`,
        ),
    );
    return result.recordset;
  }

  toCsv(rows: ExportRow[]): string {
    const headers = [
      'ReportId', 'Employee', 'Email', 'Department', 'Report', 'PeriodStart', 'PeriodEnd',
      'Category', 'Amount', 'Currency', 'SpendDate', 'Merchant', 'Notes', 'ApprovedBy', 'ApprovedOn',
    ];
    const escape = (v: unknown) => {
      const s = v == null ? '' : String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      headers.join(','),
      ...rows.map((r) =>
        [r.reportId, r.employeeName, r.employeeEmail, r.department, r.reportTitle, r.periodStart, r.periodEnd, r.category, r.amount, r.currency, r.spendDate, r.merchant, r.notes, r.approvedBy, r.approvedOn]
          .map(escape)
          .join(','),
      ),
    ];
    return lines.join('\r\n');
  }
}
