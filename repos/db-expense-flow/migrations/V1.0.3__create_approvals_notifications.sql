-- Approvals, Notifications

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Approvals') AND type = 'U')
BEGIN
  CREATE TABLE dbo.Approvals (
    Id         INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_Approvals PRIMARY KEY CLUSTERED (Id),
    TenantId   INT NOT NULL CONSTRAINT FK_Approvals_Tenants FOREIGN KEY REFERENCES dbo.Tenants(Id),
    ReportId   INT NOT NULL CONSTRAINT FK_Approvals_Reports FOREIGN KEY REFERENCES dbo.ExpenseReports(Id),
    ApproverId INT NOT NULL CONSTRAINT FK_Approvals_Users FOREIGN KEY REFERENCES dbo.Users(Id),
    Decision   NVARCHAR(20) NOT NULL,
    Comment    NVARCHAR(2000) NULL,
    DecidedOn  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedOn  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedOn DATETIME2 NULL,
    CONSTRAINT CK_Approvals_Decision CHECK (Decision IN ('Approved', 'Rejected'))
  );

  CREATE NONCLUSTERED INDEX IX_Approvals_TenantId_ReportId ON dbo.Approvals (TenantId, ReportId);
END

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Notifications') AND type = 'U')
BEGIN
  CREATE TABLE dbo.Notifications (
    Id               INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_Notifications PRIMARY KEY CLUSTERED (Id),
    TenantId         INT NOT NULL CONSTRAINT FK_Notifications_Tenants FOREIGN KEY REFERENCES dbo.Tenants(Id),
    RecipientUserId  INT NOT NULL CONSTRAINT FK_Notifications_Users FOREIGN KEY REFERENCES dbo.Users(Id),
    EventType        NVARCHAR(100) NOT NULL,
    ReportId         INT NULL CONSTRAINT FK_Notifications_Reports FOREIGN KEY REFERENCES dbo.ExpenseReports(Id),
    SentOn           DATETIME2 NULL,
    DeliveryStatus   NVARCHAR(50) NOT NULL DEFAULT 'Pending',
    CreatedOn        DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedOn       DATETIME2 NULL,
    CONSTRAINT CK_Notifications_DeliveryStatus CHECK (DeliveryStatus IN ('Pending', 'Sent', 'Failed'))
  );

  CREATE NONCLUSTERED INDEX IX_Notifications_TenantId_DeliveryStatus ON dbo.Notifications (TenantId, DeliveryStatus);
END
