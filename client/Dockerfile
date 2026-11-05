FROM node:24-alpine AS frontend

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY ./ ./
RUN npm run build

FROM caddy:2-alpine

COPY --from=frontend /app/dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
