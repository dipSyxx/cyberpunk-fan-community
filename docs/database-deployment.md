# Database and Ubuntu deployment

The application uses its own `cyberpunk_community` database. The existing `filmdatabase` is outside the initialization, migration, and runtime grants.

## Database and privileges

Use MariaDB 10.11 and Node.js 22.18 or newer. On Ubuntu, connect from the API service over the MariaDB Unix socket. Administrative access can use a host-key-verified SSH login or a loopback SSH tunnel. A direct non-loopback database connection requires a verified CA and hostname.

Create the database through an authorized database administrator. If the administrative credentials are available to the migration runner, `npm run db:init` performs the same operation.

```sql
CREATE DATABASE IF NOT EXISTS cyberpunk_community CHARACTER SET utf8mb4 COLLATE utf8mb4_bin;
```

Provision separate MariaDB accounts for `cyberpunk_migrator` and `cyberpunk_app`, restricted to `localhost` for the Ubuntu socket. Set their passwords through your normal secret provisioning workflow and check the account host with `SELECT CURRENT_USER()`. On a Windows test instance listening on loopback TCP, provision the corresponding loopback account.

```sql
GRANT SELECT, INSERT, CREATE, ALTER, INDEX, REFERENCES, UPDATE
  ON cyberpunk_community.* TO 'cyberpunk_migrator'@'localhost';
GRANT SELECT ON cyberpunk_community.* TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE ON cyberpunk_community.profiles TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE ON cyberpunk_community.character_collection_ratings TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE, DELETE ON cyberpunk_community.favorite_characters TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE, DELETE ON cyberpunk_community.saved_districts TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE, DELETE ON cyberpunk_community.fan_poll_votes TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE, DELETE ON cyberpunk_community.discussion_likes TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE ON cyberpunk_community.discussions TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE ON cyberpunk_community.discussion_replies TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE ON cyberpunk_community.outing_runs TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE ON cyberpunk_community.fan_clues TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE, DELETE ON cyberpunk_community.saved_fan_clues TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE ON cyberpunk_community.district_journal_entries TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE ON cyberpunk_community.district_collections TO 'cyberpunk_app'@'localhost';
GRANT INSERT ON cyberpunk_community.district_collection_items TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE ON cyberpunk_community.saved_district_collections TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE ON cyberpunk_community.finding_checks TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE ON cyberpunk_community.finding_observations TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE ON cyberpunk_community.saved_finding_checks TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE ON cyberpunk_community.saved_finding_observations TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE ON cyberpunk_community.dilemma_responses TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE ON cyberpunk_community.dilemma_argument_shares TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE ON cyberpunk_community.saved_dilemma_arguments TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE, DELETE ON cyberpunk_community.auth_users TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE, DELETE ON cyberpunk_community.auth_accounts TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE, DELETE ON cyberpunk_community.auth_sessions TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE, DELETE ON cyberpunk_community.auth_verifications TO 'cyberpunk_app'@'localhost';
GRANT INSERT, UPDATE, DELETE ON cyberpunk_community.auth_rate_limits TO 'cyberpunk_app'@'localhost';
```

Apply runtime table grants after the first migration. Give the migrator temporary `CREATE` access for initialization only if the administrator has not already created the database.

Set the backend configuration in an ignored local `.env` or a protected environment file for the service. Keep the migration login outside the API process. Generate and store a random `CYBERPUNK_AUTH_SECRET` with at least 32 characters, keep it stable between restarts, and restrict access to the service account.

## Migrations and verification

```bash
npm ci
npm run db:status
npm run db:migrate
npm run db:status
```

An initial status check reports pending versions and exits with status 1. Once applied, rerunning the migration checks the ledger and exits without reapplying completed files. Every SQL file has a recorded SHA-256 checksum. The runner locks one migration session to prevent concurrent applies. MariaDB commits DDL independently, so initial table and index creation can resume after interruption. The seed performs idempotent upserts. Keep applied migration files intact and add a version for schema changes.

| Migration | Contents |
|---|---|
| `000-auth.sql` | Five Better Auth tables for identities, credentials, sessions, verification and rate limiting |
| `001-community.sql` | 27 application tables, relationships, indexes and constraints |
| `002-reference.sql` | Three characters, four districts, four outings, three dilemma prompts, three poll options and three sample threads |

After the migration, expect 33 tables including the migration ledger. The application tables use profile IDs for ownership. Outing runs refer to a template or clue. Clues store the preceding stop and share links expose only the clue fields. District collections own snapshots of selected notes. Finding observations reference their check, while per-account saved relationships determine which observations the account can read. Dilemma share rows are snapshots of a response revision.

| Area | Application tables |
|---|---|
| Accounts | `profiles` |
| Reference data | `characters`, `districts`, `outing_templates`, `character_dilemmas`, `fan_poll_options` |
| Favorites and ratings | `favorite_characters`, `saved_districts`, `fan_poll_votes`, `character_collection_ratings` |
| Community | `discussions`, `discussion_replies`, `discussion_likes` |
| Outings and clues | `outing_runs`, `fan_clues`, `saved_fan_clues` |
| District journals | `district_journal_entries`, `district_collections`, `district_collection_items`, `saved_district_collections` |
| Finding checks | `finding_checks`, `finding_observations`, `saved_finding_checks`, `saved_finding_observations` |
| Dilemmas | `dilemma_responses`, `dilemma_argument_shares`, `saved_dilemma_arguments` |

```sql
SELECT version, applied_at FROM cyberpunk_community.schema_migrations ORDER BY version;
SELECT COUNT(*) AS table_count FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = 'cyberpunk_community' AND TABLE_TYPE = 'BASE TABLE';
SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = 'cyberpunk_community' ORDER BY TABLE_NAME, CONSTRAINT_TYPE, CONSTRAINT_NAME;
SELECT (SELECT COUNT(*) FROM cyberpunk_community.characters) AS characters,
       (SELECT COUNT(*) FROM cyberpunk_community.districts) AS districts,
       (SELECT COUNT(*) FROM cyberpunk_community.outing_templates) AS outings,
       (SELECT COUNT(*) FROM cyberpunk_community.character_dilemmas) AS dilemmas,
       (SELECT COUNT(*) FROM cyberpunk_community.fan_poll_options) AS poll_options;
```

For the integration suite, set `CYBERPUNK_DB_TEST=1`, `CYBERPUNK_DB_HOST=127.0.0.1`, a dedicated non-default loopback port, `CYBERPUNK_DB_USER=cyberpunk_test`, its password, and a test auth secret. Apply migrations to that disposable instance first and run `npm run test:integration`. The suite creates two unique test accounts and leaves its fixtures in the test instance.

## API service

Build the frontend with `npm run build`. Install runtime dependencies with `npm ci --omit=dev` on the service host if the build is done elsewhere. Deploy the API code and migrated schema before the frontend.

A systemd unit can run the API as a dedicated OS user. Adapt the example paths to the installation.

```ini
[Unit]
Description=Cyberpunk Community API
After=network.target mariadb.service

[Service]
Type=simple
User=cyberpunk
Group=cyberpunk
WorkingDirectory=/srv/cyberpunk-community
Environment=NODE_ENV=production
EnvironmentFile=/etc/cyberpunk-community/api.env
ExecStart=/usr/bin/node /srv/cyberpunk-community/server/index.ts
Restart=on-failure
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

The service listens on loopback only. A health check should return JSON `{"ok":true}` through `/api/health`. Configure the database socket and `CYBERPUNK_APP_ORIGIN` in the service environment before starting it.

## HTTPS and Vercel

Apache may serve the built frontend and proxy `/api/` on one HTTPS virtual host. Configure DNS, a trusted certificate, and the permitted network route before making the host available. Enable the relevant Apache modules and add the following to an existing TLS virtual host for this site.

```apache
ProxyRequests Off
ProxyPass /api/ http://127.0.0.1:3001/api/
ProxyPassReverse /api/ http://127.0.0.1:3001/api/
<Location "/api/">
  RequestHeader set X-Cyberpunk-Proxy-Client-IP "expr=%{REMOTE_ADDR}"
</Location>
```

Set `CYBERPUNK_TRUST_LOCAL_PROXY=1` when Apache always overwrites that header and is the only ingress to the loopback service. For Apache hosting, set `DocumentRoot` to the built `dist` directory and use a SPA fallback for browser routes outside `/api/`.

For the Vercel-hosted frontend without a custom domain, use the [Tailscale Funnel cutover runbook](tailscale-funnel-cutover.md) once the network owner approves it. The [Cloudflare and Vercel cutover runbook](cloudflare-vercel-cutover.md) covers deployments with a managed domain.

## Verified private deployment

On 23 November 2026, all three migrations applied on `yurili-lamp` using MariaDB 10.11.14. The migration ledger, 33 tables, 49 foreign keys, and reference seed counts were verified. The `cyberpunk-community.service` unit is enabled and runs the API on `127.0.0.1:3001` with Node.js 22.23.5. Apache proxies `/api/` on `127.0.0.1:3081`. Both health checks returned `{"ok":true}`. Two test accounts verified persisted notes, account isolation, session invalidation, and rejection of an untrusted origin through Apache.

MariaDB listens on `127.0.0.1:3306`. On 24 November 2026, the approved Funnel cutover connected Vercel to the existing Apache proxy. `https://cyberpunk-fan-community.vercel.app/api/health` returns JSON over HTTPS. See the [active deployment and rollback details](tailscale-funnel-cutover.md#active-production-deployment).

References: [Vercel rewrites](https://vercel.com/docs/routing/rewrites), [Apache request headers](https://httpd.apache.org/docs/2.4/mod/mod_headers.html), [Better Auth security](https://better-auth.com/docs/reference/security).
