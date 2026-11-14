# Production deployment

The development `docker-compose.yml` and the production `docker-compose.production.yml` are separate. Production requires a public DNS name pointed at the host and inbound HTTP/HTTPS access for Caddy to obtain and renew its certificate.

Set these deployment variables through the hosting platform's secret manager, not in source control:

- `FAIZA_DOMAIN`
- `MIGRATION_DB_PASSWORD` (migration-job / database owner only)
- `RUNTIME_DB_PASSWORD` (separate DML-only API account)
- `JWT__KEY` (at least 32 random characters)
- `SEED__ADMINPASSWORD` (unique initial administrator password)

The API is behind Caddy; its forwarded headers are trusted only from Caddy's fixed address on the private web network. Refresh cookies are `Secure`, `HttpOnly`, and `SameSite=Strict` in Production. The PostgreSQL service has no published host port and is isolated from the web network.

The `migrate` service applies EF migrations before the runtime role is provisioned and the API starts. The API does not apply migrations in Production; it refuses to start while migrations are pending. The runtime role receives `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on tables and sequence usage, but no schema or DDL privileges. Migration credentials must not be provided to the API service.

Back up the production volume before a schema deployment. If a migration fails its preflight, stop deployment and review `scripts/diagnose-integrity.sql`; do not bypass the preflight or delete financial rows. Roll back application images first. A schema rollback must be rehearsed on a restored copy of the same database; do not run `Down` against production without a verified backup and an explicit recovery plan.

Compose configuration validation alone does not verify a live TLS certificate, reverse-proxy behavior, or a production database restore. Those checks must be completed in the deployment environment before release.
