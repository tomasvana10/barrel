#!/bin/bash

cat config/.*.env > .env
docker compose pull
docker compose --env-file .env up -d --remove-orphans
