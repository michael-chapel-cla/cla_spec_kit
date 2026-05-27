# Data Model — ExpenseFlow

## Entity overview

| Entity | Table | Description |
|---|---|---|
| Tenant | `dbo.Tenants` | Company / organisation record — root of all multi-tenant isolation |
| User | `dbo.Users` | Employee profile linked to an Entra OID |
| UserRole | `dbo.UserRoles` | Role assignment per user per tenant (employee / manager / finance / admin) |
| Department | `dbo.Departments` | Organisational unit used for spend grouping and manager routing |
| ExpensePolicy | `dbo.ExpensePolicies` | Configurable rules — per-category limits, daily caps, required fields |
| ExpenseReport | `dbo.ExpenseReports` | Container for one submission period, owned by one user |
| ExpenseLineItem | `dbo.ExpenseLineItems` | Individual expense within a report — amount, category, date, notes |
| Receipt | `dbo.Receipts` | Receipt image metadata and blob storage reference |
| Approval | `dbo.Approvals` | Approval or rejection action by a manager on a report |
| Notification | `dbo.Notifications` | Outbound email event log |

## Key fields by entity

### dbo.Tenants
| Column | Type | Notes |
|---|---|---|
| Id | INT IDENTITY(1,1) PK | |
| Name | NVARCHAR(255) NOT NULL | Company display name |
| Slug | NVARCHAR(100) NOT NULL UNIQUE | URL-safe identifier |
| IsActive | BIT NOT NULL DEFAULT 1 | |
| CreatedOn | DATETIME2 NOT NULL | |
| ModifiedOn | DATETIME2 NOT NULL | |

### dbo.Users
| Column | Type | Notes |
|---|---|---|
| Id | INT IDENTITY(1,1) PK | |
| TenantId | INT NOT NULL FK → Tenants | |
| EntraOid | NVARCHAR(36) NOT NULL | Entra object ID — join key from JWT |
| DisplayName | NVARCHAR(255) NOT NULL | |
| Email | NVARCHAR(320) NOT NULL | |
| DepartmentId | INT FK → Departments | Nullable — unassigned on first login |
| ManagerUserId | INT FK → Users | Self-referential — approval routing |
| IsActive | BIT NOT NULL DEFAULT 1 | |
| CreatedOn | DATETIME2 NOT NULL | |
| ModifiedOn | DATETIME2 NOT NULL | |

### dbo.UserRoles
| Column | Type | Notes |
|---|---|---|
| Id | INT IDENTITY(1,1) PK | |
| TenantId | INT NOT NULL FK → Tenants | |
| UserId | INT NOT NULL FK → Users | |
| Role | NVARCHAR(50) NOT NULL | employee / manager / finance / admin |
| GrantedOn | DATETIME2 NOT NULL | |

### dbo.Departments
| Column | Type | Notes |
|---|---|---|
| Id | INT IDENTITY(1,1) PK | |
| TenantId | INT NOT NULL FK → Tenants | |
| Name | NVARCHAR(255) NOT NULL | |
| CostCentreCode | NVARCHAR(50) | For accounting export |
| CreatedOn | DATETIME2 NOT NULL | |
| ModifiedOn | DATETIME2 NOT NULL | |

### dbo.ExpensePolicies
| Column | Type | Notes |
|---|---|---|
| Id | INT IDENTITY(1,1) PK | |
| TenantId | INT NOT NULL FK → Tenants | |
| Category | NVARCHAR(100) NOT NULL | meals / travel / accommodation / other |
| MaxAmountPerItem | DECIMAL(18,2) | NULL = no limit |
| MaxAmountPerDay | DECIMAL(18,2) | NULL = no limit |
| RequiresReceipt | BIT NOT NULL DEFAULT 1 | |
| RequiresNotes | BIT NOT NULL DEFAULT 0 | |
| IsActive | BIT NOT NULL DEFAULT 1 | |
| CreatedOn | DATETIME2 NOT NULL | |
| ModifiedOn | DATETIME2 NOT NULL | |

### dbo.ExpenseReports
| Column | Type | Notes |
|---|---|---|
| Id | INT IDENTITY(1,1) PK | |
| TenantId | INT NOT NULL FK → Tenants | |
| UserId | INT NOT NULL FK → Users | Report owner |
| Title | NVARCHAR(255) NOT NULL | Employee-supplied name |
| PeriodStart | DATE NOT NULL | |
| PeriodEnd | DATE NOT NULL | |
| Status | NVARCHAR(50) NOT NULL | Draft / Pending / Approved / Rejected / Reimbursed |
| SubmittedOn | DATETIME2 | NULL until submitted |
| TotalAmount | DECIMAL(18,2) NOT NULL DEFAULT 0 | Denormalised sum — recalculated on line item change |
| CreatedOn | DATETIME2 NOT NULL | |
| ModifiedOn | DATETIME2 NOT NULL | |

### dbo.ExpenseLineItems
| Column | Type | Notes |
|---|---|---|
| Id | INT IDENTITY(1,1) PK | |
| TenantId | INT NOT NULL FK → Tenants | |
| ReportId | INT NOT NULL FK → ExpenseReports | |
| Category | NVARCHAR(100) NOT NULL | Must match a policy category |
| Amount | DECIMAL(18,2) NOT NULL | |
| Currency | NCHAR(3) NOT NULL DEFAULT 'GBP' | ISO 4217 |
| SpendDate | DATE NOT NULL | |
| Merchant | NVARCHAR(255) | |
| Notes | NVARCHAR(2000) | |
| ReceiptId | INT FK → Receipts | |
| CreatedOn | DATETIME2 NOT NULL | |
| ModifiedOn | DATETIME2 NOT NULL | |

### dbo.Receipts
| Column | Type | Notes |
|---|---|---|
| Id | INT IDENTITY(1,1) PK | |
| TenantId | INT NOT NULL FK → Tenants | |
| UploadedByUserId | INT NOT NULL FK → Users | |
| BlobPath | NVARCHAR(500) NOT NULL | Path within the tenant's blob container |
| ContentType | NVARCHAR(100) NOT NULL | image/jpeg, image/png, application/pdf |
| FileSizeBytes | INT NOT NULL | |
| OriginalFileName | NVARCHAR(255) | |
| CreatedOn | DATETIME2 NOT NULL | |

### dbo.Approvals
| Column | Type | Notes |
|---|---|---|
| Id | INT IDENTITY(1,1) PK | |
| TenantId | INT NOT NULL FK → Tenants | |
| ReportId | INT NOT NULL FK → ExpenseReports | |
| ApproverId | INT NOT NULL FK → Users | Manager who acted |
| Decision | NVARCHAR(20) NOT NULL | Approved / Rejected |
| Comment | NVARCHAR(2000) | |
| DecidedOn | DATETIME2 NOT NULL | |
| CreatedOn | DATETIME2 NOT NULL | |

### dbo.Notifications
| Column | Type | Notes |
|---|---|---|
| Id | INT IDENTITY(1,1) PK | |
| TenantId | INT NOT NULL FK → Tenants | |
| RecipientUserId | INT NOT NULL FK → Users | |
| EventType | NVARCHAR(100) NOT NULL | ReportSubmitted / ReportApproved / ReportRejected / ReportReimbursed |
| ReportId | INT FK → ExpenseReports | |
| SentOn | DATETIME2 | NULL until delivered |
| DeliveryStatus | NVARCHAR(50) NOT NULL | Pending / Sent / Failed |
| CreatedOn | DATETIME2 NOT NULL | |

## Key relationships

```
Tenants ──< Users ──< ExpenseReports ──< ExpenseLineItems
                 │                │
                 │                └──< Receipts
                 │
                 └──< UserRoles
                 └──< Approvals (as ApproverId)

Departments ──< Users (DepartmentId)
Users ──< Users (ManagerUserId — self-referential)
ExpensePolicies — scoped to TenantId, evaluated at submission time
```

## Indexes

| Table | Index | Columns | Reason |
|---|---|---|---|
| Users | IX_Users_TenantId_EntraOid | TenantId, EntraOid | Login lookup |
| ExpenseReports | IX_ExpenseReports_TenantId_UserId_Status | TenantId, UserId, Status | Employee report list |
| ExpenseReports | IX_ExpenseReports_TenantId_Status | TenantId, Status | Approval queue |
| ExpenseLineItems | IX_ExpenseLineItems_TenantId_ReportId | TenantId, ReportId | Line item fetch |
| Approvals | IX_Approvals_TenantId_ReportId | TenantId, ReportId | Approval history |
| Notifications | IX_Notifications_TenantId_DeliveryStatus | TenantId, DeliveryStatus | Pending delivery queue |
