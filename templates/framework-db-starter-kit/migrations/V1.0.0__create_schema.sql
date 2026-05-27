-- Schema guard: SQL Server uses dbo by default; this file documents that choice.
-- All tables in this database use the dbo schema.
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'dbo')
BEGIN
  EXEC('CREATE SCHEMA dbo');
END
