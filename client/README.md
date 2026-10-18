# MeshAI frontend

React, TypeScript, and Vite frontend for Project 2 Part 3.

## Run locally

From `client`, run `npm ci` and `npm run dev`. Vite opens
http://localhost:5173. The frontend uses delayed mock responses and does not
require the backend or authentication.

Run `npm run build` for a production build and `npm run lint` for lint checks.

## Knowledge Base

The page loads sample PDFs, accepts PDFs through the file picker or drag-and-drop,
and prepends selected files to the list. Files are local metadata only and reset
on refresh. Save and delete are visual placeholders for the next API integration.
Loading, error, empty, and populated states are mutually exclusive.

To check empty/error states manually, temporarily return `data: []` or throw an
error in `src/utils/api.ts`, then restore the stub. The default delay is 700 ms.

The provided starter archive was unavailable, so the upload component and mock
API were implemented from the assignment. The Figma connector denied access to
the linked design. Styling is provisional; the CSS delete icon must be replaced
with the exported Figma asset once access is available.

## Repository

Backend code, environment files, uploads, tests, and backend documentation are in
`../server`. Run backend commands from that directory. GitHub Actions stays at the
repository root and runs backend steps from `server`.
