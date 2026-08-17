# frontend/Dockerfile
#
# Multi-stage build: compile the Vite app, then serve the static
# output through nginx — the build toolchain never ships in the final
# image.

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite bakes VITE_* env vars into the JS bundle at BUILD time, not
# runtime — this must be a real host-reachable URL (the browser calls
# it directly), never a Docker-internal hostname like
# "http://backend:8000", which the browser cannot resolve. Defaults to
# localhost:8000 (the backend's published host port in
# docker-compose.yml); override at build time for any other target.
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# 127.0.0.1, not localhost: nginx here only binds 0.0.0.0:80 (IPv4), but
# /etc/hosts resolves "localhost" to ::1 first inside this image, and
# BusyBox wget doesn't fall back to the IPv4 address on a refused IPv6
# connection — it just fails, marking a perfectly healthy container
# "unhealthy". Confirmed via `docker compose exec frontend wget
# http://localhost` (connection refused) vs `http://127.0.0.1` (succeeds).
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:80/ || exit 1
