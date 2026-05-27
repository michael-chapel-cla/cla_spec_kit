# web-api-expense-flow — Operations Runbook

## Health checks

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness — returns `{ status: "ok" }` |
| `GET /health/ready` | Readiness — also checks DB connectivity |

If `/health/ready` returns 503, check the MSSQL connection pool (see "DB connectivity" section below).

## Environment variables

All secrets are injected at runtime via Azure Key Vault + Workload Identity. No secrets in image layers or configmaps.

| Variable | Where set |
|---|---|
| `DATABASE_PASSWORD` | Key Vault secret `expense-flow-db-password` |
| `BLOB_ACCOUNT_KEY` | Key Vault secret `expense-flow-blob-key` |
| `DATABASE_SERVER`, `DATABASE_NAME`, `DATABASE_USER` | Helm values / configmap |
| `ENTRA_ISSUER`, `ENTRA_AUDIENCE` | Helm values / configmap |

## Common alerts

### High error rate (5xx)

1. Check pod logs: `kubectl logs -l app=web-api-expense-flow -n expense-flow --tail=100`
2. Look for `INTERNAL_ERROR` log entries — each includes `requestId` for correlation
3. Check DB connectivity (see below)

### DB connectivity failure

1. Verify the SQL Server is reachable: `kubectl exec -it <pod> -- nc -zv <DATABASE_SERVER> 1433`
2. Confirm the Workload Identity UAMI has the `db_datareader`/`db_datawriter` roles
3. Check the connection pool logs — `createDbClient()` logs a startup error if the pool fails to connect

### Authentication failures (401 at scale)

1. JWKS keys rotate automatically — `jwks-rsa` caches for 10 minutes by default
2. If all requests fail with 401, verify `ENTRA_ISSUER` matches the token's `iss` claim
3. Verify `ENTRA_AUDIENCE` matches the token's `aud` claim (`api://expense-flow`)

### Receipt upload failures

1. Check `BLOB_ACCOUNT_NAME` and `BLOB_ACCOUNT_KEY` are set
2. Verify the container `tenant-<tenantId>` exists in the storage account
3. File size limit is 10 MB — check `Content-Length` in request logs

## Flyway migrations

Migrations run as a Kubernetes init container before the API pod starts. They are applied from the `db-expense-flow` repo.

To run migrations manually:

```bash
# In db-expense-flow repo
docker-compose up flyway
```

Never edit or delete applied migration files (`V*.sql`). Always add new files with the next version number.

## Scaling

Autoscaling is configured in `helm/values-*.yaml` (CPU 70%, memory 80%). For traffic spikes during finance reporting periods, temporarily raise `autoscaling.maxReplicas`.

## Rollback

Trigger the Azure DevOps pipeline with `rollback: true` to swap production back to the previous slot.
