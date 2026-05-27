import sql from 'mssql';
import type { DbClient } from '../../../shared/db/db.client.js';
import type { User, UserWithRole } from './users.types.js';

export class UsersService {
  constructor(private readonly db: DbClient) {}

  async upsertFromToken(
    tenantId: number,
    entraOid: string,
    displayName: string,
    email: string,
  ): Promise<User> {
    const existing = await this.getByOid(tenantId, entraOid);
    if (existing) {
      await this.db.executeQuery((req) =>
        req
          .input('tenantId', sql.Int, tenantId)
          .input('oid', sql.NVarChar(36), entraOid)
          .input('displayName', sql.NVarChar(255), displayName)
          .input('email', sql.NVarChar(320), email)
          .query(
            'UPDATE dbo.Users SET DisplayName = @displayName, Email = @email, ModifiedOn = SYSUTCDATETIME() WHERE TenantId = @tenantId AND EntraOid = @oid',
          ),
      );
      return { ...existing, displayName, email };
    }

    const result = await this.db.executeQuery<{ Id: number }>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('oid', sql.NVarChar(36), entraOid)
        .input('displayName', sql.NVarChar(255), displayName)
        .input('email', sql.NVarChar(320), email)
        .query(
          'INSERT INTO dbo.Users (TenantId, EntraOid, DisplayName, Email) OUTPUT INSERTED.Id VALUES (@tenantId, @oid, @displayName, @email)',
        ),
    );
    return this.getById(tenantId, result.recordset[0].Id) as Promise<User>;
  }

  async getByOid(tenantId: number, entraOid: string): Promise<User | null> {
    const result = await this.db.executeQuery<User>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('oid', sql.NVarChar(36), entraOid)
        .query(
          'SELECT Id, TenantId, EntraOid, DisplayName, Email, DepartmentId, ManagerUserId, IsActive, CreatedOn FROM dbo.Users WHERE TenantId = @tenantId AND EntraOid = @oid',
        ),
    );
    return result.recordset[0] ?? null;
  }

  async getById(tenantId: number, id: number): Promise<User | null> {
    const result = await this.db.executeQuery<User>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('id', sql.Int, id)
        .query(
          'SELECT Id, TenantId, EntraOid, DisplayName, Email, DepartmentId, ManagerUserId, IsActive, CreatedOn FROM dbo.Users WHERE TenantId = @tenantId AND Id = @id',
        ),
    );
    return result.recordset[0] ?? null;
  }

  async getRoleForUser(tenantId: number, userId: number): Promise<string> {
    const result = await this.db.executeQuery<{ Role: string }>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('userId', sql.Int, userId)
        .query(
          'SELECT TOP 1 Role FROM dbo.UserRoles WHERE TenantId = @tenantId AND UserId = @userId',
        ),
    );
    return result.recordset[0]?.Role ?? 'employee';
  }

  async listForTenant(tenantId: number): Promise<UserWithRole[]> {
    const result = await this.db.executeQuery<UserWithRole>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .query(
          `SELECT u.Id, u.TenantId, u.EntraOid, u.DisplayName, u.Email, u.DepartmentId, u.ManagerUserId, u.IsActive, u.CreatedOn, COALESCE(r.Role, 'employee') AS Role
           FROM dbo.Users u
           LEFT JOIN dbo.UserRoles r ON r.UserId = u.Id AND r.TenantId = u.TenantId
           WHERE u.TenantId = @tenantId AND u.IsActive = 1
           ORDER BY u.DisplayName`,
        ),
    );
    return result.recordset;
  }
}
