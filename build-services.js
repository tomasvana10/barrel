#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");
const yaml = require("yaml");

const ROOT_PATH = __dirname;
const ENV_PATH = path.join(ROOT_PATH, "config");
const OUTPUT_PATH = path.join(ROOT_PATH, "services.yaml");
const ENV_FILES = [".shared.env", ".homepage.env", ".local.homepage.env"];

const env = ENV_FILES.reduce((acc, file) => {
  const parsed = dotenv.config({
    path: path.join(ENV_PATH, file),
    processEnv: {},
  });
  Object.assign(acc, parsed.parsed);
  return acc;
}, {});

function getWidgetUrl(portVar) {
  return `${env.WIDGET_PROTO}://${env.SERVICE_HOSTNAME}:${env[portVar]}`;
}

function getServiceUrl(subdomain, portVar) {
  if (env.ROOT_DOMAIN) {
    const proto = env.SERVICE_HREF_PROTO || "https";
    return `${proto}://${subdomain}.${env.ROOT_DOMAIN}`;
  }
  return getWidgetUrl(portVar);
}

function getWidgetFields(fields) {
  const obj = {};
  for (const [key, val] of fields) {
    if (val === undefined || val === "") continue;
    obj[key] = val;
  }
  return obj;
}

function buildYaml() {
  const groups = [
    {
      name: "Media & Torrents",
      services: [
        {
          name: "qBittorrent",
          subdomain: env.QBITTORRENT_SUBDOMAIN || "qbt",
          icon: "qbittorrent",
          description: "Torrent Client",
          port: "QBITTORRENT_PORT",
          widget: {
            type: "qbittorrent",
            fields: [
              ["username", env.QBITTORRENT_USER],
              ["password", env.QBITTORRENT_PASS],
              ["enableLeechProgress", true],
            ],
          },
        },
        {
          name: "Jellyfin",
          subdomain: env.JELLYFIN_SUBDOMAIN || "jellyfin",
          icon: "jellyfin",
          description: "Media Server",
          port: "JELLYFIN_PORT",
          widget: {
            type: "jellyfin",
            fields: [["key", env.JELLYFIN_KEY]],
          },
        },
        {
          name: "Prowlarr",
          subdomain: env.PROWLARR_SUBDOMAIN || "prowlarr",
          icon: "prowlarr",
          description: "Indexer Manager",
          port: "PROWLARR_PORT",
          widget: {
            type: "prowlarr",
            fields: [["key", env.PROWLARR_KEY]],
          },
        },
        {
          name: "Radarr",
          subdomain: env.RADARR_SUBDOMAIN || "radarr",
          icon: "radarr",
          description: "PVR for movies",
          port: "RADARR_PORT",
          widget: {
            type: "radarr",
            fields: [
              ["key", env.RADARR_KEY],
              ["enableQueue", true],
            ],
          },
        },
        {
          name: "Sonarr",
          subdomain: env.SONARR_SUBDOMAIN || "sonarr",
          icon: "sonarr",
          description: "PVR for TV",
          port: "SONARR_PORT",
          widget: {
            type: "sonarr",
            fields: [
              ["key", env.SONARR_KEY],
              ["enableQueue", true],
            ],
          },
        },
        {
          name: "Bazarr",
          subdomain: env.BAZARR_SUBDOMAIN || "bazarr",
          icon: "bazarr",
          description: "Subtitle manager",
          port: "BAZARR_PORT",
          widget: {
            type: "bazarr",
            fields: [["key", env.BAZARR_KEY]],
          },
        },
        {
          name: "Lidarr",
          subdomain: env.LIDARR_SUBDOMAIN || "lidarr",
          icon: "lidarr",
          description: "Music manager",
          port: "LIDARR_PORT",
          widget: {
            type: "lidarr",
            fields: [["key", env.LIDARR_KEY]],
          },
        },
        {
          name: "Seerr",
          subdomain: env.SEERR_SUBDOMAIN || "seerr",
          icon: "jellyseerr",
          description: "Media library manager",
          port: "SEERR_PORT",
          widget: {
            type: "jellyseerr",
            fields: [["key", env.SEERR_KEY]],
          },
        },
        {
          name: "Navidrome",
          subdomain: env.NAVIDROME_SUBDOMAIN || "music",
          icon: "navidrome",
          description: "Music manager",
          port: "NAVIDROME_PORT",
          widget: {
            type: "navidrome",
            fields: [
              ["user", env.NAVIDROME_USER],
              ["token", env.NAVIDROME_TOKEN],
              ["salt", env.NAVIDROME_SALT],
            ],
          },
        },
        {
          name: "Headscale",
          subdomain: env.HEADSCALE_SUBDOMAIN || "headscale",
          icon: "tailscale",
          description: "Self-hosted mesh VPN",
          port: "HEADSCALE_PORT",
          widget: {
            type: "headscale",
            urlOverride: `https://${env.SERVICE_HOSTNAME}:${env.HEADSCALE_PORT}`,
            fields: [
              ["nodeId", env.HEADSCALE_NODE_ID],
              ["key", env.HEADSCALE_API_KEY],
            ],
          },
        },
        {
          name: "Aurral",
          subdomain: env.AURRAL_SUBDOMAIN || "aurral",
          icon: "mdi-music-box",
          description: "Music discovery for Lidarr",
          port: "AURRAL_PORT",
          pingPath: "/",
        },
        {
          name: "Cleanuparr",
          subdomain: env.CLEANUPARR_SUBDOMAIN || "cleanuparr",
          icon: "mdi-broom",
          description: "Download queue cleaner",
          port: "CLEANUPARR_PORT",
          pingPath: "/health",
        },
      ],
    },
  ];

  return groups.map((group) => ({
    [group.name]: group.services.map((svc) => {
      const entry = {
        [svc.name]: {
          href: getServiceUrl(svc.subdomain, svc.port),
          icon: svc.icon,
          description: svc.description,
          ...(svc.widget && {
            widget: {
              type: svc.widget.type,
              url: svc.widget.urlOverride || getWidgetUrl(svc.port),
              ...getWidgetFields(svc.widget.fields),
            },
          }),
          ...(svc.pingPath && {
            ping: `${getWidgetUrl(svc.port)}${svc.pingPath}`,
          }),
        },
      };
      return entry;
    }),
  }));
}

fs.writeFileSync(
  OUTPUT_PATH,
  yaml.stringify(buildYaml(), { indent: 2, lineWidth: 0 }),
);
console.log("Built services.yaml successfully!");
