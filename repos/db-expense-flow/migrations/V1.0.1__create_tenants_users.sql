-- Tenants, Users, UserRoles, Departments

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Tenants') AND type = 'U')
BEGIN
  CREATE TABLE dbo.Tenants (
    Id         INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_Tenants PRIMARY KEY CLUSTERED (Id),
    Name       NVARCHAR(255) NOT NULL,
    Slug       NVARCHAR(100) NOT NULL,
    IsActive   BIT NOT NULL DEFAULT 1,
    CreatedOn  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedOn DATETIME2 NULL,
    CONSTRAINT UQ_Tenants_Slug UNIQUE (Slug)
  );
END

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Departments') AND type = 'U')
BEGIN
  CREATE TABLE dbo.Departments (
    Id             INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_Departments PRIMARY KEY CLUSTERED (Id),
    TenantId       INT NOT NULL CONSTRAINT FK_Departments_Tenants FOREIGN KEY REFERENCES dbo.Tenants(Id),
    Name           NVARCHAR(255) NOT NULL,
    CostCentreCode NVARCHAR(50) NULL,
    CreatedOn      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedOn     DATETIME2 NULL
  );
END

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.Users') AND type = 'U')
BEGIN
  CREATE TABLE dbo.Users (
    Id            INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (Id),
    TenantId      INT NOT NULL CONSTRAINT FK_Users_Tenants FOREIGN KEY REFERENCES dbo.Tenants(Id),
    EntraOid      NVARCHAR(36) NOT NULL,
    DisplayName   NVARCHAR(255) NOT NULL,
    Email         NVARCHAR(320) NOT NULL,
    DepartmentId  INT NULL CONSTRAINT FK_Users_Departments FOREIGN KEY REFERENCES dbo.Departments(Id),
    ManagerUserId INT NULL CONSTRAINT FK_Users_Manager FOREIGN KEY REFERENCES dbo.Users(Id),
    IsActive      BIT NOT NULL DEFAULT 1,
    CreatedOn     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedOn    DATETIME2 NULL
  );

  CREATE NONCLUSTERED INDEX IX_Users_TenantId_EntraOid ON dbo.Users (TenantId, EntraOid);
END

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.UserRoles') AND type = 'U')
BEGIN
  CREATE TABLE dbo.UserRoles (
    Id        INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_UserRoles PRIMARY KEY CLUSTERED (Id),
    TenantId  INT NOT NULL CONSTRAINT FK_UserRoles_Tenants FOREIGN KEY REFERENCES dbo.Tenants(Id),
    UserId    INT NOT NULL CONSTRAINT FK_UserRoles_Users FOREIGN KEY REFERENCES dbo.Users(Id),
    Role      NVARCHAR(50) NOT NULL,
    GrantedOn DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedOn DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedOn DATETIME2 NULL,
    CONSTRAINT CK_UserRoles_Role CHECK (Role IN ('employee', 'manager', 'finance', 'admin'))
  );
END
