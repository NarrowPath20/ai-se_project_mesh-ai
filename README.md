# MeshAI

MeshAI is a full-stack AI assistant that lets users upload PDF documents to a personal knowledge base and ask questions through chat. It uses retrieval-augmented generation (RAG), MongoDB, and Nebius AI through the OpenAI SDK to produce answers grounded in uploaded documents.

**Live:** Deployment URL pending. Add the production HTTPS link here once the subdomain is configured and verified.

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
| `SITE_ADDRESS` | Hostname used by Caddy, without a protocol. Use localhost locally and your subdomain in production. Defaults to localhost in Compose. |
| `PORT` | Optional backend listening port; defaults to 3000. Keep this default in Docker to match the proxy configuration. |
| `LLM_MODEL` | Optional Nebius chat model override; defaults to Qwen/Qwen3-32B. Supported by the backend environment; Compose does not forward this variable by default. |
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
