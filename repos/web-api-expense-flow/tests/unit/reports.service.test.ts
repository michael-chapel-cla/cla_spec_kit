import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportsService } from '../../src/features/reports/v1/reports.service.js';
import type { DbClient } from '../../src/shared/db/db.client.js';
import type { ExportRow } from '../../src/features/reports/v1/reports.types.js';

const mockDb: DbClient = {
  executeQuery: vi.fn(),
};

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ReportsService(mockDb);
  });

  describe('getSpendByCategory', () => {
    it('returns aggregated spend rows', async () => {
      const rows = [{ category: 'Travel', totalAmount: 1200, reportCount: 3 }];
      vi.mocked(mockDb.executeQuery).mockResolvedValue({ recordset: rows } as never);
      const result = await service.getSpendByCategory(1, '2024-01-01', '2024-03-31');
      expect(result).toEqual(rows);
    });
  });

  describe('toCsv', () => {
    it('produces RFC-4180 CSV with correct headers', () => {
      const rows: ExportRow[] = [
        {
          reportId: 1,
          employeeName: 'Emma Walsh',
          employeeEmail: 'emma@example.com',
          department: 'Sales',
          reportTitle: 'Q1 Travel',
          periodStart: '2024-01-01',
          periodEnd: '2024-03-31',
          category: 'Travel',
          amount: 450,
          currency: 'GBP',
          spendDate: '2024-02-10',
          merchant: 'Trainline',
          notes: null,
          approvedBy: 'Daniel',
          approvedOn: '2024-04-01',
        },
      ];
      const csv = service.toCsv(rows);
      const lines = csv.split('\r\n');
      expect(lines[0]).toBe(
        'ReportId,Employee,Email,Department,Report,PeriodStart,PeriodEnd,Category,Amount,Currency,SpendDate,Merchant,Notes,ApprovedBy,ApprovedOn',
      );
      expect(lines[1]).toContain('Emma Walsh');
    });

    it('escapes values containing commas', () => {
      const rows: ExportRow[] = [
        {
          reportId: 2,
          employeeName: 'Smith, John',
          employeeEmail: 'john@example.com',
          department: null,
          reportTitle: 'Test',
          periodStart: '2024-01-01',
          periodEnd: '2024-01-31',
          category: 'Meals',
          amount: 50,
          currency: 'GBP',
          spendDate: '2024-01-15',
          merchant: null,
          notes: null,
          approvedBy: null,
          approvedOn: null,
        },
      ];
      const csv = service.toCsv(rows);
      expect(csv).toContain('"Smith, John"');
    });
  });
});
