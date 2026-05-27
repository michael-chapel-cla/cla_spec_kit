export interface Receipt {
  id: number;
  tenantId: number;
  uploadedByUserId: number;
  blobPath: string;
  contentType: string;
  fileSizeBytes: number;
  originalFileName: string | null;
  createdOn: string;
}
