-- ExpenseFlow schema guard
-- SQL Server uses dbo by default; this file ensures the schema is documented.
-- All tables use the dbo schema.
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'dbo')
BEGIN
  EXEC('CREATE SCHEMA dbo');
END
