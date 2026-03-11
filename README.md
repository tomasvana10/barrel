# barrel

Media server template using Docker Compose. Supports VPNs, media automation, streaming, and torrent management.

Barrel also provides utilies to generate [homepage](https://gethomepage.dev/) services for your apps, as well as [Headscale](https://headscale.net/) for self-hosted mesh VPN with access controls.

## Services

| Service | Description | External Port (`.shared.env`) |
|---|---|---|
| qBittorrent | Torrent client | 8085 |
| Flood | qBittorrent web UI | 8086 |
| Jellyfin | Media server | 8087 |
| Prowlarr | Indexer manager | 8088 |
| Radarr | Movie automation | 8089 |
| Sonarr | TV automation | 8090 |
| Seerr | Media request manager | 8091 |
| Cleanuparr | Download client cleaner | 8092 |
| Bazarr | Subtitle automation | 8095 |
| Lidarr | Music automation | 8093 |
| Navidrome | Subsonic music streaming server | 8094 |
| FlareSolverr | Cloudflare challenge solver | 8191 |
| Gluetun | Wireguard/OpenVPN client | n/a |
| Headscale | Self-hosted Tailscale control server | 8096 |
| Tailscale | Mesh VPN (subnet router) | n/a |

## Main Setup

1. Copy the example env files and fill in your secrets:
   ```bash
   `cp config/templates/.local.* config/`
   ```

2. Review `config/.shared.env` for changes in shared configurations and `config/.compose.env` for docker compose related config.

3. Create the media directories in your downloads path (matching `DOWNLOADS_PATH` in `.compose.env`):
   ```bash
   mkdir -p /path/to/volume/downloads/{movies,tv,music,torrents}
   ```

4. Set up Headscale:
   ```bash
   mkdir -p headscale/{config,lib,run}
   cp config/templates/headscale.config.yaml headscale/config/config.yaml
   cp config/templates/headscale.acl.json headscale/config/acl.json
   ```
   Update `headscale/config/config.yaml` with your domain and `headscale/config/acl.json` with your users.

5. Build the Homepage services file using `pnpm i && pnpm build`. Move the `_homepage.compose.yaml` service to `compose.yaml` if you wish to run it along with the media suite.

6. Start the media suite: `./start.sh`

## Headscale Setup

After starting the suite for the first time, create your users and auth keys:

```bash
# create admin user
docker exec headscale headscale users create admin

# get the admin user id
docker exec headscale headscale users list

# generate a pre-auth key for the subnet router and set it as TS_AUTHKEY in config/.local.compose.env
docker exec headscale headscale preauthkeys create --user 1 --reusable -e 2160h

# create a user for each friend
docker exec headscale headscale users create friend1

# generate a one-time auth key for them to connect
docker exec headscale headscale preauthkeys create --user <friend user id> -e 48h
```

Your friends can connect their Tailscale client with:
```bash
tailscale up --login-server=https://headscale.yourdomain.com --authkey=<key>
```

### Networking

Headscale must be directly reachable by Tailscale clients. It cannot run behind a Cloudflare Tunnel due to incompatible WebSocket upgrade headers.

1. Generate a TLS certificate using Cloudflare DNS validation:
   ```bash
   CF_API_TOKEN=xxx HEADSCALE_DOMAIN=headscale.yourdomain.com ./scripts/setup-cert.sh
   ```
   Renewal is automatic via certbot's systemd timer. Headscale is restarted on renewal automatically.

2. Port forward `HEADSCALE_PORT` on your router to your server.

3. Add an unproxied DNS address record for `headscale.yourdomain.com` pointing to your public IP. If you don't have a static IP, use this script to keep it updated:
   ```bash
   CF_API_TOKEN=xxx CF_ZONE_ID=xxx CF_RECORD_NAME=headscale.yourdomain.com ./scripts/update-dns.sh
   ```

