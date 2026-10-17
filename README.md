# MeshAI ? Project 2 Part 2

Express 5 / TypeScript API backed by MongoDB, with bcrypt passwords, JWT authentication,
PDF extraction, Nebius embeddings, cosine retrieval, and generated answers saved to chats.

## Setup

Requires Node.js 24 and a running MongoDB server.

1. Run `npm ci`.
2. Copy `.env.example` to `.env` (a local file has already been created in this workspace).
3. Set `JWT_SECRET` to a random secret and `NEBIUS_API_KEY` to your Nebius token.
4. Run `npm run dev`, or `npm run build` then `npm start`.

The API listens on `PORT` (default 3000) after MongoDB connects. Environment files and
uploads are ignored by Git. Never log or commit API keys. The local environment already
contains a generated JWT secret. Configure the Nebius key locally.

## API

All responses use `{ success, data, error }`; errors contain `{ message }`.
Registration and `/auth/me` return the user directly in `data`, with `userId`, `email`, and `name`.
Login returns `data.user` with the same fields and `data.token`.
Other resource responses use MongoDB `_id` fields. Supply the JWT as
`Authorization: Bearer <token>` for all chat, document, query, and current-user routes.

| Method | Path                | Behavior                                               |
| ------ | ------------------- | ------------------------------------------------------ |
| GET    | /health             | Health check                                           |
| POST   | /auth/register      | email, password (8+ characters), name; 201             |
| POST   | /auth/login         | email, password; token and user                        |
| GET    | /auth/me            | Current user                                           |
| POST   | /chats              | title; 201                                             |
| GET    | /chats              | Current user's chats                                   |
| GET    | /chats/:id          | { chat, messages } in chronological order              |
| PATCH  | /chats/:id          | Update title                                           |
| DELETE | /chats/:id          | Delete chat and messages                               |
| POST   | /chats/:id/messages | question; returns [userMessage, assistantMessage], 201 |
| POST   | /documents          | Multipart PDF field file, optional title; 201          |
| GET    | /documents          | Current user's documents                               |
| GET    | /documents/:id      | Document metadata                                      |
| PATCH  | /documents/:id      | Update title                                           |
| DELETE | /documents/:id      | Delete metadata and chunks                             |
| POST   | /query              | question; returns { answer, sources }                  |

Uploads are limited to 20 MiB. Text is split into 500-character chunks and embedded with
Qwen/Qwen3-Embedding-8B. Queries rank the user's chunks by cosine similarity and give the
best five to the configured LLM. The default is the assignment's Qwen/Qwen3-32B;
set `LLM_MODEL` to an available model if that ID returns 404. `.env.example` uses
Qwen/Qwen3-30B-A3B-Instruct-2507, verified with the live API. Scanned PDFs require OCR before upload. Temporary uploaded
files are removed after processing; extracted text and embeddings remain in MongoDB.
Embedding calls are sequential to bound concurrent provider requests. Failed embedding
uploads do not create document records. Chunk insertion failures trigger cleanup.

## Verification

Run `npm run lint`, `npm test`, and `npm run format:check`.
The integration test uses a uniquely named temporary MongoDB database and drops only
that database afterward. Set `TEST_MONGO_URI` to change the test server. It covers real
MongoDB persistence and PDF parsing, authentication, ownership, and RAG with mocked
provider responses. It does not consume Nebius credits or verify live model availability.

Import `postman/mesh-ai.postman_collection.json`. Run Core first to register, log in,
and save a chat ID. Then run RAG with a configured Nebius key; `pdf_path` defaults to
the included launch PDF. Run both folders in sequence to verify live generated answers
and persisted messages. The official course collection URL was omitted from the task;
this is a project-owned collection, not a fork of the official collection.

GitHub Actions starts MongoDB, runs lint and integration tests, then runs the Core
Postman folder. No live provider key is needed in CI. `package.json` is set to part 2.

Live verification also passed all 33 assertions across 15 Postman requests, including
real embeddings, generated answers, and persisted chat history.
