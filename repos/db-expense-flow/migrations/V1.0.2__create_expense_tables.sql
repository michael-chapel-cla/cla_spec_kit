-- ExpensePolicies, ExpenseReports, ExpenseLineItems, Receipts

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.ExpensePolicies') AND type = 'U')
BEGIN
  CREATE TABLE dbo.ExpensePolicies (
    Id               INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_ExpensePolicies PRIMARY KEY CLUSTERED (Id),
    TenantId         INT NOT NULL CONSTRAINT FK_ExpensePolicies_Tenants FOREIGN KEY REFERENCES dbo.Tenants(Id),
    Category         NVARCHAR(100) NOT NULL,
    MaxAmountPerItem DECIMAL(18,2) NULL,
    MaxAmountPerDay  DECIMAL(18,2) NULL,
    RequiresReceipt  BIT NOT NULL DEFAULT 1,
    RequiresNotes    BIT NOT NULL DEFAULT 0,
    IsActive         BIT NOT NULL DEFAULT 1,
    CreatedOn        DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedOn       DATETIME2 NULL,
    CONSTRAINT CK_ExpensePolicies_Category CHECK (Category IN ('meals', 'travel', 'accommodation', 'other'))
  );
END

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.ExpenseReports') AND type = 'U')
BEGIN
  CREATE TABLE dbo.ExpenseReports (
    Id          INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_ExpenseReports PRIMARY KEY CLUSTERED (Id),
    TenantId    INT NOT NULL CONSTRAINT FK_ExpenseReports_Tenants FOREIGN KEY REFERENCES dbo.Tenants(Id),
    UserId      INT NOT NULL CONSTRAINT FK_ExpenseReports_Users FOREIGN KEY REFERENCES dbo.Users(Id),
    Title       NVARCHAR(255) NOT NULL,
    PeriodStart DATE NOT NULL,
    PeriodEnd   DATE NOT NULL,
    Status      NVARCHAR(50) NOT NULL DEFAULT 'Draft',
    SubmittedOn DATETIME2 NULL,
    TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
    CreatedOn   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedOn  DATETIME2 NULL,
    CONSTRAINT CK_ExpenseReports_Status CHECK (Status IN ('Draft', 'Pending', 'Approved', 'Rejected', 'Reimbursed'))
  );

  CREATE NONCLUSTERED INDEX IX_ExpenseReports_TenantId_UserId_Status ON dbo.ExpenseReports (TenantId, UserId, Status);
  CREATE NONCLUSTERED INDEX IX_ExpenseReports_TenantId_Status ON dbo.ExpenseReports (TenantId, Status);
END

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Receipts') AND type = 'U')
BEGIN
  CREATE TABLE dbo.Receipts (
    Id                 INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_Receipts PRIMARY KEY CLUSTERED (Id),
    TenantId           INT NOT NULL CONSTRAINT FK_Receipts_Tenants FOREIGN KEY REFERENCES dbo.Tenants(Id),
    UploadedByUserId   INT NOT NULL CONSTRAINT FK_Receipts_Users FOREIGN KEY REFERENCES dbo.Users(Id),
    BlobPath           NVARCHAR(500) NOT NULL,
    ContentType        NVARCHAR(100) NOT NULL,
    FileSizeBytes      INT NOT NULL,
    OriginalFileName   NVARCHAR(255) NULL,
    CreatedOn          DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedOn         DATETIME2 NULL
  );
END

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.ExpenseLineItems') AND type = 'U')
BEGIN
  CREATE TABLE dbo.ExpenseLineItems (
    Id         INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_ExpenseLineItems PRIMARY KEY CLUSTERED (Id),
    TenantId   INT NOT NULL CONSTRAINT FK_ExpenseLineItems_Tenants FOREIGN KEY REFERENCES dbo.Tenants(Id),
    ReportId   INT NOT NULL CONSTRAINT FK_ExpenseLineItems_Reports FOREIGN KEY REFERENCES dbo.ExpenseReports(Id),
    Category   NVARCHAR(100) NOT NULL,
    Amount     DECIMAL(18,2) NOT NULL,
    Currency   NCHAR(3) NOT NULL DEFAULT 'GBP',
    SpendDate  DATE NOT NULL,
    Merchant   NVARCHAR(255) NULL,
    Notes      NVARCHAR(2000) NULL,
    ReceiptId  INT NULL CONSTRAINT FK_ExpenseLineItems_Receipts FOREIGN KEY REFERENCES dbo.Receipts(Id),
    CreatedOn  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedOn DATETIME2 NULL,
    CONSTRAINT CK_ExpenseLineItems_Category CHECK (Category IN ('meals', 'travel', 'accommodation', 'other'))
  );

  CREATE NONCLUSTERED INDEX IX_ExpenseLineItems_TenantId_ReportId ON dbo.ExpenseLineItems (TenantId, ReportId);
END
