# barrel

Media server template using Docker Compose. Supports VPNs, media automation, streaming, and torrent management.

Barrel also provides utilies to generate [homepage](https://gethomepage.dev/) services for your apps, as well as reference for [Tailscale](https://tailscale.com/) access controls.

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
| Lidarr | Music automation | 8093 |
| Navidrome | Subsonic music streaming server | 8094 |
| FlareSolverr | Cloudflare challenge solver | 8191 |
| Gluetun | Wireguard/OpenVPN client | n/a |
| Tailscale | Mesh VPN | n/a |

## Setup

1. Copy the example env files and fill in your secrets: `cp config/templates/. config/`
2. Review `config/.shared.env` for changes in shared configurations and `config/.compose.env` for docker compose related config.
3. Build the Homepage services file: `pnpm i && pnpm build`
4. Start the media suite: `docker compose up -d`
