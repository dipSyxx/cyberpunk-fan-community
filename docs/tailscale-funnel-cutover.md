# Tailscale Funnel and Vercel cutover

Keep `https://cyberpunk-fan-community.vercel.app` as the browser origin. Vercel will rewrite `/api/*` to the HTTPS name assigned to `yurili-lamp` under `ts.net`. Funnel forwards only to Apache at `127.0.0.1:3081`. Apache checks a Vercel-only credential before proxying to Node at `127.0.0.1:3001`. MariaDB stays on `127.0.0.1:3306` and the existing schema and data require no migrations.

Funnel is available on the free Personal plan for eligible personal use. It supplies a hostname and TLS certificate, requires no purchased domain or inbound port forwarding, and has provider bandwidth limits. The hostname remains the same while the node name and tailnet DNS name stay the same. Tailscale lists Funnel as beta. [Funnel requirements](https://tailscale.com/docs/features/tailscale-funnel) · [Plan details](https://tailscale.com/pricing)

## Active production deployment

On 24 November 2026, Tailscale Funnel began forwarding `https://yurili-lamp.tail486396.ts.net` to Apache at `127.0.0.1:3081`. The `tag:cyberpunk-funnel` node attribute enables Funnel only for the tagged node. The tailnet grants members access to their own user-owned devices. The tagged server uses the separate Funnel route. Tailscale persisted the route through a `tailscaled` restart.

Vercel deployment `dpl_54gUVRid2czJDsRoJgq2uqUsJk29` serves `https://cyberpunk-fan-community.vercel.app`. `/api/health` returns HTTP 200 with `{"ok":true}` and `Cache-Control: private, no-store`. Direct Funnel requests without the Vercel credential return 403 or 401. Production Playwright verified registration, secure cookies, login, logout, journal persistence, collection sharing, and isolation between two accounts. The previous SPA-only deployment for rollback is `dpl_BDZ6owba3NUsPdV57hzEYcqYXmjt`.

## Before school network approval

The files under `deploy/` are templates. The school network owner must approve enrolling `yurili-lamp` in the tailnet and using Funnel for public ingress before any installation or activation. Ask for outbound TCP 443 to the Tailscale coordination and relay services. Outbound UDP 3478 supports NAT discovery and UDP connectivity improves direct peering. TCP relays can support connections when UDP is unavailable. On 24 November 2026, `tailscale netcheck` on `yurili-lamp` reported `UDP: true`, IPv4 connectivity and working DERP relays. Verify the public HTTPS listener separately after enrollment. [Firewall requirements](https://tailscale.com/docs/reference/faq/firewall-ports)

## Enroll the server after approval

1. In the Tailscale DNS page, verify MagicDNS and enable HTTPS certificates. The hostname on the certificate will appear in public Certificate Transparency logs. Review and merge the [tag and Funnel policy entries](../deploy/tailscale/funnel-policy.example.hujson) in Access controls. Assign the tag only to `yurili-lamp`. Check that any existing member-wide Funnel rule and default private grants fit the intended policy. For this node, tailnet peers should have no access to unrelated host services. [HTTPS certificates](https://tailscale.com/docs/how-to/set-up-https-certificates) · [Policy syntax](https://tailscale.com/docs/reference/syntax/policy-file)
2. Install Tailscale from the [signed Ubuntu Noble package repository](https://pkgs.tailscale.com/stable/#ubuntu-noble). Enable the package-provided `tailscaled` systemd service and enroll the VM. Open the login URL in the authorized account and approve the device if requested. Keep it as a regular node without subnet routing or exit-node duties.

   ```bash
   sudo systemctl enable --now tailscaled
   sudo tailscale up --hostname=yurili-lamp --advertise-tags=tag:cyberpunk-funnel \
     --accept-dns=false --accept-routes=false --ssh=false
   tailscale netcheck
   tailscale status --json | python3 -c 'import json, sys; print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))'
   ```

3. Record the exact DNS name in `deploy/vercel.funnel.example.json` in place of `yurili-lamp.tail-example.ts.net` when preparing the production deployment. Leave Funnel off until the Apache check below passes.

## Protect Apache and configure the browser origin

1. Save the current Apache site and `/etc/cyberpunk-community/api.env` in a root-only backup. The latter includes the existing Better Auth secret and MariaDB credentials.

   ```bash
   sudo install -d -o root -g root -m 0700 /var/backups/cyberpunk-funnel
   sudo install -o root -g root -m 0600 /etc/apache2/sites-available/cyberpunk-community.conf /var/backups/cyberpunk-funnel/apache.conf
   sudo install -o root -g root -m 0600 /etc/cyberpunk-community/api.env /var/backups/cyberpunk-funnel/api.env
   ```

2. Generate a dedicated 64-character random hex credential in a password manager. Enter it twice at the `htpasswd` prompts on Ubuntu. The command stores a bcrypt hash readable by Apache. Use a fresh password file for this first cutover.

   ```bash
   sudo install -d -o root -g www-data -m 0750 /etc/apache2/cyberpunk-community-auth
   sudo htpasswd -cB /etc/apache2/cyberpunk-community-auth/vercel.htpasswd vercel
   sudo chown root:www-data /etc/apache2/cyberpunk-community-auth/vercel.htpasswd
   sudo chmod 0640 /etc/apache2/cyberpunk-community-auth/vercel.htpasswd
   ```

3. Encode `vercel:<credential>` with Base64 in a trusted local session. In the Vercel project settings, create the **Production** secret `CYBERPUNK_FUNNEL_AUTHORIZATION` with the value `Basic <base64>`. Store the value as Sensitive when available. Base64 is reversible, so handle it as the same secret as the raw credential. Keep both representations out of Git, `VITE_*` variables, build output and logs. [Vercel environment variables](https://vercel.com/docs/environment-variables)
4. Copy the [Funnel Apache site template](../deploy/tailscale/cyberpunk-community.conf.example) to your Ubuntu working directory. Install it in place of the existing Cyberpunk site. Reload Apache only after syntax validation passes. Check that the first loopback request returns `401`. Enter the `htpasswd` credential at curl's prompt for the second request, which should return `200` with `{"ok":true}`.

   ```bash
   sudo install -o root -g root -m 0644 ./cyberpunk-community.conf.example /etc/apache2/sites-available/cyberpunk-community.conf
   sudo apache2ctl configtest && sudo systemctl reload apache2
   curl -i -H 'X-Real-IP: 192.0.2.1' http://127.0.0.1:3081/api/health
   curl -i -u vercel -H 'X-Real-IP: 192.0.2.1' http://127.0.0.1:3081/api/health
   ```

5. In `/etc/cyberpunk-community/api.env`, set `CYBERPUNK_APP_ORIGIN=https://cyberpunk-fan-community.vercel.app` and keep `CYBERPUNK_TRUST_LOCAL_PROXY=1`. Preserve the existing auth secret and database settings. Restart only `cyberpunk-community.service` and verify the Node health URL still returns JSON. Better Auth uses the Vercel origin for cookies and CSRF. Apache overwrites the IP header consumed by Node with Vercel's `X-Real-IP` after authentication, then strips the proxy credential and `X-Real-IP`. The database-backed Better Auth rate limits use that validated client IP. [Vercel external rewrites](https://vercel.com/docs/routing/rewrites#rewriting-to-external-origins)

## Activate and verify

After approval and the local Apache tests, start the persistent HTTPS listener. The setting is stored by `tailscaled` and resumes on reboot. [Funnel CLI](https://tailscale.com/docs/reference/tailscale-cli/funnel)

```bash
sudo tailscale funnel --bg --https=443 http://127.0.0.1:3081
tailscale funnel status
```

1. From outside the tailnet, verify trusted TLS on the actual Funnel hostname. Its `/api/health` must reject a request without the credential, including with a caller-supplied IP header. Verify Apache denies paths outside `/api/`. If Funnel offers to add broader access, stop and check the device tag and policy.
2. Use the completed Vercel template as `vercel.json` for the authorized production build of the existing frontend. It rewrites API calls before the filesystem and SPA routes, drops incoming `X-Real-IP` before Vercel adds its visitor IP, injects `Authorization` on the server, and disables CDN caching for API responses. Check Vercel `/api/health` returns `200`, `application/json` and `{"ok":true}` with `Cache-Control: private, no-store`. Verify a static asset and a direct SPA browser route still load. Check response headers and cookies for absence of the proxy credential.
3. In two separate browser sessions on the real Vercel hostname, register two temporary accounts. Check login, `Secure` and `HttpOnly` host-only cookies with `SameSite=Lax`, note persistence across reload and re-login, and isolation on the same journal route for each account. Check logout invalidates the session and a logged-out request for private data returns `401`. A POST with an untrusted `Origin` must return `403`.
4. Validate the rate-limit boundary with two controlled clients on distinct source IPs. Caller-supplied `X-Real-IP` and `X-Cyberpunk-Proxy-Client-IP` on the Vercel side must not change the caller's rate bucket. The other source IP must retain its own quota. Confirm session and authenticated responses never produce a cache hit or a shared response. Recheck that ports `3001`, `3081` and `3306` still listen only on Ubuntu loopback.

## Roll back

Disable this Funnel listener first.

```bash
sudo tailscale funnel --bg --https=443 off
tailscale funnel status
```

Verify that the listener is absent in the status output and inaccessible from outside the tailnet. Roll Vercel back to its saved prior production deployment. Restore the backed-up site and API environment, and check both original loopback health URLs. Confirm the Vercel SPA still loads. Remove the Vercel production secret if retiring the route.

```bash
sudo install -o root -g root -m 0644 /var/backups/cyberpunk-funnel/apache.conf /etc/apache2/sites-available/cyberpunk-community.conf
sudo install -o root -g root -m 0600 /var/backups/cyberpunk-funnel/api.env /etc/cyberpunk-community/api.env
sudo apache2ctl configtest && sudo systemctl reload apache2
sudo systemctl restart cyberpunk-community.service
curl -fsS http://127.0.0.1:3001/api/health
curl -fsS http://127.0.0.1:3081/api/health
```
