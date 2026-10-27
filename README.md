# MeshAI full-stack development

Requires Node.js 24 and a running MongoDB server.

1. Copy `server/.env.example` to `server/.env` if it does not exist. Set a random
   `JWT_SECRET`, your `MONGO_URI`, and your own `NEBIUS_API_KEY`.
2. Run `npm run install:all` from this directory.
3. Run `npm run dev` to start Express and Vite in one terminal.

On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`.

Open http://localhost:5173 for the frontend. The API listens on
http://localhost:3000; use `/health` to check it. Vite forwards `/api/*` to the
backend and strips `/api`, so `/api/users/me` reaches `/users/me`.

Register with `POST /auth/register` using `{ email, password, name }` (passwords
must have at least eight characters), then log in with `POST /auth/login` using
`{ email, password }`. Save `data.token` from the login response. Send
`Authorization: Bearer <token>` to `GET /users/me` to receive
`{ success: true, data: { userId, name, email }, error: null }`.

Run `npm test --prefix server` for backend integration tests, which require MongoDB
and use an isolated temporary database. Run `npm run build --prefix client` to
check the frontend build. See `server/README.md` for the rest of the API.
