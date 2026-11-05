# MeshAI

MeshAI is a full-stack AI assistant that lets users upload PDF documents to a personal knowledge base and ask questions through chat. It uses retrieval-augmented generation (RAG), MongoDB, and Nebius AI through the OpenAI SDK to produce answers grounded in uploaded documents.

**EC2 address:** <http://54.234.20.30> (HTTP; no domain configured). This auto-assigned IP can change after the instance is stopped and started.

## Tech stack

- React and Vite - frontend and client-side routing
- TypeScript - frontend and backend
- Express - REST API and JWT authentication
- MongoDB and Mongoose - users, documents, and chat history
- Nebius AI and the OpenAI SDK - embeddings and chat generation
- Docker and Docker Compose - containerized application stack
- Caddy - static hosting, reverse proxy, and HTTPS
- AWS EC2 - deployment target
- GitHub Actions - client and server build and lint validation

## Getting started

Prerequisites: Node.js 24, npm, Git, and Docker with Docker Compose (Docker Desktop on Windows/macOS).

Clone the repository and enter the project directory:

```sh
git clone https://github.com/NarrowPath20/ai-se_project_mesh-ai.git
cd ai-se_project_mesh-ai
```

### Run the full stack with Docker

1. Copy the root `.env.example` to `.env`.
2. Set a strong `JWT_SECRET` and your `NEBIUS_API_KEY`. Set `SITE_ADDRESS=localhost` for local use. Compose supplies the internal MongoDB connection string automatically.
3. Start Docker, then run:

```sh
docker compose up --build -d
```

Open <http://localhost>. Caddy redirects to HTTPS; your browser may prompt you to accept its local development certificate. Client-side routes such as `/chat` and `/knowledge` also work when opened directly.

MongoDB and uploads persist in named volumes. View logs with `docker compose logs -f`; stop the stack with `docker compose down`. Adding `-v` to that command deletes the stored data.

### Run with hot reload

1. Copy `server/.env.example` to `server/.env`. Fill in the MongoDB connection string, JWT secret, and Nebius API key. The development server reads `server/.env`, not the root file.
2. Start a local MongoDB instance reachable at the configured `MONGO_URI`.
3. Install dependencies and start both development servers:

```sh
npm run install:all
npm run dev
```

Open <http://localhost:5173>. The API listens on <http://localhost:3000>; `/health` checks availability. Vite forwards `/api/*` requests to Express and strips the prefix. On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`.

## Environment variables

Keep real values in ignored `.env` files. Use a different JWT secret for production.

| Variable | Description |
| --- | --- |
| `MONGO_URI` | Required MongoDB connection string for the backend. Compose supplies its internal MongoDB address and database; the root value does not override it. |
| `JWT_SECRET` | Required secret used to sign and verify authentication tokens. |
| `NEBIUS_API_KEY` | Nebius API key required for embeddings and AI chat responses. |
| `SITE_ADDRESS` | Caddy site address. Use `localhost` locally, your subdomain for automatic HTTPS, or `http://54.234.20.30` for HTTP access by IP. Defaults to localhost in Compose. |
| `PORT` | Optional backend listening port; defaults to 3000. Keep this default in Docker to match the proxy configuration. |
| `LLM_MODEL` | Nebius chat model override. Docker Compose defaults to `Qwen/Qwen3-30B-A3B-Instruct-2507`, verified in the live model catalog. The backend's legacy fallback outside Docker is `Qwen/Qwen3-32B`; set this variable when running locally because that model is no longer available. |
| `NODE_ENV` | Runtime mode; Compose sets it to production. |
| `TEST_MONGO_URI` | Optional MongoDB connection string for backend integration tests. Tests use an isolated temporary database and otherwise connect to local MongoDB. |

## Validation

```sh
npm run build --prefix server
npm run lint --prefix server
npm run build --prefix client
npm run lint --prefix client
npm test --prefix server
```

Backend integration tests require a running MongoDB instance and mock the AI provider. GitHub Actions runs separate `validate-server` and `validate-client` jobs for builds and linting. See [the backend README](server/README.md) for API details.

## Deployment

On the EC2 host, configure the root `.env` with production secrets and your subdomain as `SITE_ADDRESS`, point the domain's DNS to the host, and allow inbound HTTP and HTTPS. Run `docker compose up --build -d`; Caddy obtains and renews the public HTTPS certificate. API requests pass through Caddy, which strips `/api` before forwarding them to Express.

### Current EC2 installation

- Instance: `i-07d10c9b039ee5093`, Ubuntu 26.04, user `ubuntu`.
- Application directory: `/opt/meshai`.
- Root environment: `/opt/meshai/.env`, readable only by its owner. The server uses a separate production JWT secret.
- `SITE_ADDRESS=http://54.234.20.30` explicitly selects HTTP. Passwords, tokens, and document traffic are not encrypted in transit; configure HTTPS before using sensitive data.
- Docker starts at boot; all four services use `restart: unless-stopped`. MongoDB and uploads use persistent Docker volumes.
- The host has 2 GB of swap and bounded container logs. MongoDB and the backend are not published as host ports.

Connect using your local PuTTY key (the private key must never be committed):

```powershell
& "C:\Program Files\PuTTY\plink.exe" -ssh -i "C:\Users\bossm\Downloads\my-server-key.ppk" ubuntu@54.234.20.30
```

On the server:

```sh
cd /opt/meshai
sudo docker compose ps
sudo docker compose logs --tail=100 backend caddy
curl --fail http://54.234.20.30/api/health
```

To deploy updated source, upload the changed project files to `/opt/meshai`, preserving its `.env`. Build services sequentially to reduce memory pressure:

```sh
cd /opt/meshai
sudo docker compose build backend
sudo docker compose build frontend
sudo docker compose up -d
```

The initial deployment was uploaded from the local workspace; `/opt/meshai` is not a Git checkout, and GitHub pushes do not automatically deploy. Do not run `docker compose down -v`: it deletes application data. Persistent volumes survive container replacement but are not backups.

Deployment verification: public `/api/health` and `/chat`, registration, login, authenticated profile access, PDF upload and embeddings, document-grounded AI responses, and persisted chat history passed against the live EC2 deployment. The running backend key was verified to match the local key without displaying it. Chat uses `Qwen/Qwen3-30B-A3B-Instruct-2507` because Nebius no longer offers `Qwen/Qwen3-32B`. Temporary verification data was removed. After changing server environment variables, run `sudo docker compose up -d --force-recreate backend`. Do not paste API keys into chat or commit them.
