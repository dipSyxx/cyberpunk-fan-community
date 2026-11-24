# Cloudflare and Vercel cutover

The proposed request path is the Vercel frontend, Cloudflare Access, Cloudflare Tunnel, Apache on `127.0.0.1:3081`, and Node on `127.0.0.1:3001`. The browser sends same-origin requests to the Vercel frontend. The tunnel uses an outbound connection from Ubuntu. MariaDB continues listening on `127.0.0.1:3306`.

## Prerequisites

| Required item | Where to get it |
|---|---|
| Network authorization | Confirm permission to publish the API hostname through Cloudflare and connect the Vercel production deployment. |
| Cloudflare account and active DNS zone | Use an account with access to create a tunnel, manage DNS for the chosen zone, and administer Zero Trust Access applications and service tokens. Choose an API hostname such as `api.<your-domain>`. |
| Access team and audience | In Zero Trust, get the team name before `.cloudflareaccess.com` and copy the self-hosted API application’s Application Audience tag (AUD). |
| Tunnel UUID and connector credential | Create a named, locally managed tunnel. Keep the tunnel JSON for systemd. The broader account certificate from `cloudflared tunnel login` can stay on the operator’s machine. |
| Vercel production access | Use the `cyberpunk-fan-community` project and permission to set production secrets and deploy to its domain. Confirm the browser origin, currently `https://cyberpunk-fan-community.vercel.app`. |

## Preflight results

On 24 November 2026, the API and Apache both returned JSON health on loopback. The public Vercel health path continued to return SPA HTML. Ubuntu reached all 20 IPv4 TCP endpoints resolved for the two Cloudflare regions on port 7844 and verified a TLS handshake with each region. The Cloudflare management API was reachable on port 443. The selected HTTP/2 transport uses TCP; the QUIC path and the chosen team's Access certificate endpoint await verification.

Cloudflared 2026.11.2 was staged in the SSH user's private directory and verified against its published SHA-256 digest. The ingress, systemd unit and Vercel routes passed validation. An isolated Apache instance verified IPv4 and IPv6 forwarding, denial of requests without the expected Access assertion and client IP, and credential-header stripping. The running deployment still uses its loopback origin. Its deployed Better Auth configuration also produced the expected cookie and rate-limit settings when initialized separately with the HTTPS frontend origin.

## Cloudflare

1. Create a self-hosted Access application for the entire API hostname. Give it a **Service Auth** policy allowing only a dedicated Vercel service token. Check that this application does not issue a `CF_Authorization` cookie to the browser on a service-token request. Strict service-token authentication provides this behavior. Avoid changing organization-wide settings without reviewing their impact.
2. On an authorized operator machine, use `cloudflared tunnel login` and `cloudflared tunnel create cyberpunk-community`. Record the UUID and install its connector JSON at `/etc/cloudflared/cyberpunk-tunnel.json` as root with mode `0600`. In the YAML below, replace the sample UUID, hostname, team name, and audience. [Locally managed tunnel](https://developers.cloudflare.com/tunnel/features/locally-managed-tunnels/create-local-tunnel/) · [Service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/)
3. After authorization, create a proxied CNAME for the API hostname to `<UUID>.cfargotunnel.com` in the selected Cloudflare zone. Bypass caching for this hostname. Confirm its HTTPS certificate is active and that Access protects the route before making it available to Vercel. [Tunnel DNS routing](https://developers.cloudflare.com/tunnel/routing/)

## Ubuntu and Vercel

Apply these steps after network authorization and the prerequisite values are confirmed.

1. Install an official `cloudflared` package on Ubuntu. Place the filled [ingress config](../deploy/cloudflared/cyberpunk.yml.example) at `/etc/cloudflared/cyberpunk.yml` and the [systemd unit](../deploy/cloudflared/cyberpunk-cloudflared.service) at `/etc/systemd/system/cyberpunk-cloudflared.service`. Validate ingress with `cloudflared tunnel --config /etc/cloudflared/cyberpunk.yml ingress validate`. The unit reads its credential through systemd and the ingress requires the Access JWT. Allow HTTP/2 on outbound TCP port 7844 and confirm outbound HTTPS to the Access team's `<team>.cloudflareaccess.com` certificate endpoint. [Firewall destinations](https://developers.cloudflare.com/tunnel/configuration/) · [Connector-side Access validation](https://developers.cloudflare.com/tunnel/reference/origin-parameters/#access)
2. Back up the current Cyberpunk Apache vhost and use the [prepared vhost](../deploy/cloudflared/cyberpunk-community.conf.example) in its place. Run `apache2ctl configtest` before reloading Apache. The connector uses the internal Host alias and validates Access before forwarding. Apache accepts Vercel’s single `X-Real-IP` for that Host after checking the Access assertion is present, strips Access credentials, and sends the verified proxy IP to Node on loopback. Direct local health checks continue to work.
3. Back up `/etc/cyberpunk-community/api.env` in a root-only location. Set `CYBERPUNK_APP_ORIGIN` to the exact HTTPS **frontend** origin and retain `CYBERPUNK_TRUST_LOCAL_PROXY=1` and the existing auth secret. Restart the existing Node service once to apply the configuration. Confirm the API and proxy health checks still return JSON. Enable and start the tunnel service after validating the Apache and Tunnel configurations.
4. Add the service token client ID and secret to Vercel **Production** environment variables `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`. Use the dashboard’s secret storage for credentials. Replace the example API hostname in the [prepared routing configuration](../deploy/vercel.cloudflare.example.json), then apply that file as the root `vercel.json` for the deployment. It sends `/api/*` through the Access-protected origin, keeps static files ahead of the SPA fallback, and disables API caching. Deploy the current frontend together with the route. [Vercel external rewrites](https://vercel.com/docs/routing/rewrites)

## Acceptance after cutover

- From outside Ubuntu, confirm the Cloudflare API hostname requires service authentication, and the Vercel frontend’s `/api/health` returns HTTPS JSON without a redirect. A client outside the trusted route must be denied even if it sets the forwarded IP header.
- Confirm assets and direct SPA navigation work. Register two test accounts using the actual Vercel domain. Check that only Better Auth’s host-only session cookie is issued to the browser, with `Secure`, `HttpOnly`, and `SameSite=Lax`. A POST with a different Origin must be rejected.
- Write a journal note in account A, log out, and sign in again. Verify session invalidation, persistence in A, and isolation from B. Confirm requests from two independent visitor IPs reach distinct Better Auth rate-limit buckets. The expected limits are 5 registrations, 10 logins, and 20 logouts per minute.
- Verify authenticated responses retain `Cache-Control: no-store`. Confirm Apache, Node, and MariaDB still listen on loopback for the Cyberpunk ports.

If acceptance fails, restore the previous Vercel deployment, stop the Cyberpunk tunnel, and restore the backed-up Cyberpunk vhost and API origin. Validate Apache configuration before reloading it and restart the API to apply the restored origin.
