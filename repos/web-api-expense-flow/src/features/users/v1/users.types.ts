export interface User {
  id: number;
  tenantId: number;
  entraOid: string;
  displayName: string;
  email: string;
  departmentId: number | null;
  managerUserId: number | null;
  isActive: boolean;
  createdOn: string;
}

export interface UserWithRole extends User {
  role: string;
}
