#!/bin/bash

cat config/.*.env > .env
docker compose --env-file .env up -d