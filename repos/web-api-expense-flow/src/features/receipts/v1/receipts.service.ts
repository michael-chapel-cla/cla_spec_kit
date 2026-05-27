import sql from 'mssql';
import type { DbClient } from '../../../shared/db/db.client.js';
import type { Receipt } from './receipts.types.js';

export class ReceiptsService {
  constructor(private readonly db: DbClient) {}

  async store(
    tenantId: number,
    userId: number,
    blobPath: string,
    contentType: string,
    fileSizeBytes: number,
    originalFileName: string | null,
  ): Promise<number> {
    const result = await this.db.executeQuery<{ Id: number }>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('userId', sql.Int, userId)
        .input('blobPath', sql.NVarChar(500), blobPath)
        .input('contentType', sql.NVarChar(100), contentType)
        .input('fileSizeBytes', sql.Int, fileSizeBytes)
        .input('originalFileName', sql.NVarChar(255), originalFileName)
        .query(
          'INSERT INTO dbo.Receipts (TenantId, UploadedByUserId, BlobPath, ContentType, FileSizeBytes, OriginalFileName) OUTPUT INSERTED.Id VALUES (@tenantId, @userId, @blobPath, @contentType, @fileSizeBytes, @originalFileName)',
        ),
    );
    return result.recordset[0].Id;
  }

  async getById(tenantId: number, id: number): Promise<Receipt | null> {
    const result = await this.db.executeQuery<Receipt>((req) =>
      req
        .input('tenantId', sql.Int, tenantId)
        .input('id', sql.Int, id)
        .query(
          'SELECT Id, TenantId, UploadedByUserId, BlobPath, ContentType, FileSizeBytes, OriginalFileName, CreatedOn FROM dbo.Receipts WHERE TenantId = @tenantId AND Id = @id',
        ),
    );
    return result.recordset[0] ?? null;
  }

  generateSasUrl(blobPath: string): string {
    // TODO: use @azure/storage-blob BlobSASPermissions to generate a short-lived SAS URL
    // Example: const sasUrl = await generateBlobSasUrl(blobPath, process.env['BLOB_ACCOUNT_NAME']!, process.env['BLOB_ACCOUNT_KEY']!, 60);
    // For now, return a placeholder — implement with Azure Storage SDK in Phase 1
    const accountName = process.env['BLOB_ACCOUNT_NAME']!;
    return `https://${accountName}.blob.core.windows.net/${blobPath}?sas=PLACEHOLDER`;
  }
}
