# MeshAI frontend

React, TypeScript, and Vite frontend for Project 2 Part 4.

## Run locally

From `client`, run `npm ci` and `npm run dev`. Vite opens
http://localhost:5173. The frontend uses delayed mock responses and does not
require the backend or authentication.

Run `npm run build` for a production build and `npm run lint` for lint checks.
Run `npm run test:e2e` for the browser checklist tests. The tests use installed
Google Chrome via Playwright and launch their own Vite server on port 5188.

## Routes and navigation

- `/` shows the static Intro page without the shared header. Start opens `/knowledge`.
- `/knowledge` shows the existing Knowledge Base within AppLayout.
- `/chat` shows the conversation sidebar and message panel within AppLayout.

The shared header links to Knowledge Base and Chat and highlights the active
route. Its logo links home. BrowserRouter supports client navigation; Vite also
serves these routes directly on refresh. Production hosting must rewrite unknown
page paths to `index.html`.

The design references are the supplied Part 3 Knowledge Base copy and Part 4
Header, Intro, Chat copy (`Jn66Vwk0y1e4JqB4Pr0U33`, page `445:1744`). Desktop
and mobile styles use their layout, typography, copy, and exported illustrations.
The header logo is a 4x PNG; icons are local SVGs and the favicon is the exported
16px PNG. Intro cards use separate desktop/mobile PNG exports of the complete
illustration frames. No temporary Figma URLs are used at runtime.

## Chat sidebar

The delayed local API returns three sample conversations. Click a conversation
to select it. Click **+ New Chat**, type a name, and press Enter or **Create chat** to prepend and
select the new conversation. A blank or whitespace-only name becomes **New
Chat**. Escape closes and clears the input without creating anything.

Chat data is local component state and resets when leaving the page or
refreshing. Loading and API errors appear in the sidebar.

Below 1200px, the header hamburger on the left opens a sliding navigation and conversation
panel. The backdrop, close button, and Escape dismiss it. Selecting or creating a
conversation dismisses it too. **Start New Chat** opens the panel and focuses the
name input. Conversations occupy the top of the 256px panel and navigation sits
at the bottom. Focus stays inside the open panel and page scrolling is locked.
At 1200px and above, navigation and the chat sidebar use the desktop layout.

## Message area

The main panel shows one state at a time: no selected chat, loading, error,
an empty conversation, or a message thread. Each sample conversation loads four
messages through the delayed `getChat` stub; newly created chats load no messages.
Switching chats discards responses from older requests. User messages appear on
the right and assistant messages on the left, with Markdown rendered by
`react-markdown`.
The PostHog sample matches the design's user prompt and formatted assistant
sections; the other stub conversations demonstrate additional threads.

The input bar appears for an active chat once loading completes successfully,
including empty conversations. Enter sends a trimmed, nonempty message;
Shift+Enter inserts a line break. The user message appears immediately and the
input clears. The local `sendMessage` stub returns a sample assistant reply after
1.5 seconds. While waiting, the textarea and send button are disabled. Failed
requests append an assistant error message, and replies from a conversation left
while sending are discarded. Messages remain local and reset when switching
conversations or refreshing.

To check manually, select **Who are our users** and verify loading followed by
four messages with formatted assistant lists. Create a chat to see the empty
conversation state. To check errors, temporarily throw inside the message effect's
`try` block, select a different conversation, then restore the effect.

## Knowledge Base

The page loads sample PDFs, accepts PDFs through the file picker or drag-and-drop,
and prepends selected files to the list. Files are local metadata only and reset
on refresh. The remove button immediately deletes a document from the local list.
Removing the last document displays the empty state. Save is a visual placeholder
for later API integration.
Uploaded files appear immediately, including while the initial document list is
still loading. Empty and error states are handled separately.

To check empty/error states manually, temporarily return `data: []` or throw an
error in `src/utils/api.ts`, then restore the stub. The default delay is 700 ms.

The upload component and mock API were implemented from the assignment. Document
names come from the stub and selected PDFs; the layout supports wrapping long
filenames. The remove icon is exported from Figma. Local record IDs have a fallback
for HTTP previews where `crypto.randomUUID` is unavailable.

## Repository

Backend code, environment files, uploads, tests, and backend documentation are in
`../server`. Run backend commands from that directory. GitHub Actions stays at the
repository root and runs backend steps from `server`.
