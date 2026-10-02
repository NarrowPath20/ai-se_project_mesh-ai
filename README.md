# MeshAI Server — Project 2 Part 1

A TypeScript and Express backend scaffold with hardcoded responses. Data is not
persisted; authentication, PDF processing, and AI answers are stubs.

## Run

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev
```

The server logs `Server running on port 3000`. For compiled execution:

```sh
npm run build
npm start
```

## Routes

The assignment's endpoint reference and official test download URLs were not
included in the supplied text. The remaining routes below are provisional and
must be compared with the course reference before submission. The `/auth/me`
stub follows the provided controller example; the assignment's later example
uses different user fields.

| Method             | Path                   | Status        |
| ------------------ | ---------------------- | ------------- |
| GET                | /health                | 200           |
| GET                | /auth/me               | 200           |
| POST               | /auth/register         | 201           |
| POST               | /auth/login            | 200           |
| POST               | /auth/logout           | 200           |
| GET, POST          | /chats                 | 200, 201      |
| GET, PATCH, DELETE | /chats/:chatId         | 200, 200, 204 |
| GET, POST          | /documents             | 200, 201      |
| GET, PATCH, DELETE | /documents/:documentId | 200, 200, 204 |
| POST               | /query                 | 201           |
| GET                | /test-error            | 500           |

Responses use `{ "success": true, "data": {}, "error": null }` with resource
data replacing the empty object. DELETE responses have no body. Unknown routes
return 404; unexpected errors return 500; malformed JSON returns 400. Requests
are logged before JSON parsing. `/test-error` is retained for course checks.

## Verify

```sh
npm run lint
npm test
npm run format:check
```

Import `postman/mesh-ai.postman_collection.json` into Postman. The collection
contains resource folders and status/envelope assertions, with `base_url` set to
`http://localhost:3000`. Start the server before sending requests or running it.

The GitHub Actions workflow runs lint, compilation, HTTP integration tests, and
the local Postman collection through Newman on pushes to main/master and pull
requests. This is a project-owned workflow, not the missing official course
`tests.yaml` file or official Postman collection.
