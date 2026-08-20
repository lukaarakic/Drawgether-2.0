<div align="center">

# 🎨 Drawgether

**A social media platform built around collaborative real-time drawing.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Appwrite](https://img.shields.io/badge/Appwrite-Database_%26_Storage-FD366E?style=flat-square&logo=appwrite&logoColor=white)](https://appwrite.io/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Durable_Objects-F38020?style=flat-square&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/durable-objects/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-latest-C5F74F?style=flat-square)](https://orm.drizzle.team/)
[![OpenAI](https://img.shields.io/badge/OpenAI-API-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com/)
[![Vitest](https://img.shields.io/badge/Vitest-tested-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)

[Live Demo](https://drawgether.lukarakic.me) · [Report Bug](mailto:admin@lukarakic.me) · [Request Feature](mailto:admin@lukarakic.me)

</div>

---

## 📸 Screenshots

| Home | In-Game Canvas | Profile |
|------|---------------|---------|
| ![Home](https://i.imgur.com/rmqkuLH.png) | ![In-Game](https://i.imgur.com/loogjXt.png) | ![Profile](https://i.imgur.com/avA26Q7.png) |

---

## ✨ Overview

Drawgether is a social media platform centered around drawing, think Instagram, but you make the art live, together. Users join drawing rooms, receive an AI-generated topic, collaborate on a shared canvas in real time, and when the session ends their finished piece is automatically published to their profile and the community feed. Part drawing game, part social network.

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server Actions for mutations, RSC for feed and profile pages |
| **Language** | TypeScript | End-to-end type safety across the data layer, API routes, and UI |
| **Styling** | Tailwind CSS v4 |  |
| **Realtime** | Cloudflare Workers + Durable Objects | One `RoomDO` per room relays canvas strokes and room lifecycle events over a websocket, no external realtime service to run |
| **Canvas** | HTML5 Canvas API | Native, performant, no library overhead for a drawing surface |
| **AI** | OpenAI API | Topic generation at session start. One prompt call per room |
| **Data** | Appwrite (TablesDB + Storage) | Server-only access via `node-appwrite`; images live in Storage as CDN URLs instead of base64 blobs in the DB |
| **ORM (legacy path)** | Drizzle ORM + PostgreSQL | Original backend, kept behind a flag as an instant-rollback path post-migration |
| **Auth** | Custom-built | Full control over session shape, TOTP flows, and role enforcement |
| **Testing** | Vitest | Unit tests (validation, realtime client) + integration tests against live Appwrite |
| **Deploy** | Vercel (app) + Cloudflare (realtime worker) |  |

---

## 🏗️ Architecture

```
Browser
  └── Next.js (Vercel)
        ├── Server Actions (auth mutations, profile updates, room management...)
        ├── RSC (feed, profile pages...)
        ├── RoomSocket client (canvas + room-event websocket)
        └── HTML5 Canvas API

Cloudflare
  └── Worker + Durable Object (`RoomDO`, one per room code)
        ├── /room/:roomId/connect  — websocket upgrade, JWT-verified per connection
        └── /room/:roomId/event    — server → room push, shared-secret guarded

Appwrite
  ├── TablesDB (artists, rooms, artworks, roles, likes, follows, comments...)
  └── Storage (artwork PNGs, public read, served via CDN)

PostgreSQL + Drizzle (legacy)
  └── Same schema, still queryable behind `DATA_BACKEND=drizzle` as a rollback path

OpenAI API
  └── Topic generation at session start (one call per room)
```

**Key decisions:**

- **Cloudflare Durable Objects over a hosted realtime service** — one `RoomDO` instance per room code acts as a websocket relay, scoped naturally per room, so there's no client-side filtering by room ID and no separate realtime infrastructure to provision. Runs on the hibernation API (`acceptWebSocket`), so idle connections don't keep the DO billed as active.
- **Appwrite over staying on Postgres directly** — TablesDB removes the need to run and pay for a Postgres instance, and Storage replaces base64-encoded images in the DB with CDN-backed files, which is what was bloating every feed query.
- **A `DATA_BACKEND` flag instead of a hard cutover** — every repository module in `app/lib/data/` has both a `*.drizzle.ts` and `*.appwrite.ts` implementation behind the same function signatures. Flipping one env var switches the whole app between backends, so the Postgres path stays as an instant, no-code-change rollback during the soak period after migration.
- **Drizzle over Prisma** (original decision, still true for the legacy path) — Drizzle's query builder stays close to raw SQL, making complex joins and cursor-based pagination easier to reason about without fighting ORM abstractions.
- **Custom auth over NextAuth** — NextAuth works well for OAuth but becomes awkward with TOTP-gated actions, custom session shapes, and Discord-style room roles all in one system. Building from scratch meant full control with no adapter workarounds.
- **Cursor-based pagination** — the community feed uses cursor-based infinite scroll (`Query.orderDesc` + `Query.cursorAfter` on Appwrite, an equivalent tuple cursor on Drizzle). Offset pagination breaks on fast-moving feeds as new drawings are inserted; cursors are stable and scale-friendly.

---

## 🔐 Authentication

Built from scratch — no NextAuth, no Auth.js, no third-party providers. Unaffected by the data-layer migration below.

| Flow | Implementation |
|---|---|
| Registration & login | bcrypt password hashing, custom session management |
| Email verification | Non-blocking |
| TOTP | Time-based one-time passwords gate sensitive actions (email and password changes) |
| Forgot password | Token-based email recovery |
| Role-based permissions | Discord-style room roles control what users can see and do |
| Protected routes | Session validation via Next.js middleware (`proxy.ts`) |

**Why from scratch:** NextAuth's session model didn't accommodate TOTP-gated actions cleanly. Rolling it in-house meant the session object, token shape, and role enforcement all work exactly as needed.

---

## 🔀 Data layer: dual backend

Drawgether recently migrated off Supabase (Postgres + Realtime) onto Appwrite (data + storage) and Cloudflare Durable Objects (realtime). The migration was done without a hard cutover:

- Every table has parallel `app/lib/data/*.drizzle.ts` / `*.appwrite.ts` implementations exposed through one shared, backend-agnostic module (e.g. `rooms.ts`, `feed.ts`) — pages and Server Actions only ever import the shared module, never a backend-specific one.
- `DATA_BACKEND=appwrite` (or `drizzle`) in the environment picks the active backend for the whole app in one flip, no code changes.
- `npm run provision:appwrite` provisions the Appwrite database/tables/bucket from scratch (idempotent). `npm run migrate:appwrite` copies existing Postgres data across. `npm run backfill:artwork-images` moves any legacy base64 artwork images into Appwrite Storage.

See `MIGRATION_PLAN.md` for the full phase-by-phase writeup, including the Appwrite schema mapping decisions (composite unique indexes instead of relationships, atomic counters via `incrementRowColumn`, Transactions API for multi-row writes) and real bugs hit along the way.

---

## 🎮 Game Loop

```
Join Room → Wait for Players → Start (5s countdown)
  → AI Topic Reveal (10s) → Canvas Opens → Timer Runs
  → Session Ends → Drawing Auto-Published
```

Each session moves through a strict state machine: **Waiting → Starting → Active → Finished**. The timer is server-authoritative, stored as a timestamp in the database, with a client-side interval for smooth UI ticking. Clients reconcile against the server timestamp on reconnect. Room lifecycle changes (join, kick, leave, countdown, activation) are pushed to every connected client through the same `RoomDO` websocket that carries canvas strokes.

---

## 🖌️ Canvas & Realtime Sync

- Stroke segments are buffered client-side and flushed as one `draw_batch` message roughly every 40ms (instead of one message per pointer-move), keeping message rates low even on the free Cloudflare plan
- `RoomSocket` (`app/lib/realtime-client.ts`) wraps the websocket connection with auto-reconnect and backoff, replacing what used to be three separate Supabase channels with a single per-room socket
- **Collaborative undo** — a `start_drawing` broadcast triggers all connected clients to simultaneously push a history snapshot, keeping undo stacks deterministic across participants
- Custom brush tools — color, shade, size
- Connect tokens are short-lived JWTs minted server-side per room + artist (`mintRealtimeToken`), verified by the Durable Object at connection time

---

## 🐛 Notable Bugs Solved

**Collaborative undo desync** — undo in a multiplayer canvas needs to be deterministic for all participants, not just the user who triggered it. Broadcasting a `start_drawing` event the moment a stroke begins causes all clients to snapshot history simultaneously, keeping stacks in sync.

```ts
// sender
pushHistory();
roomSocket.send({ type: "start_drawing" });

// receiver
roomSocket.on("start_drawing", () => {
  pushHistory();
});
```

**Timer offset bug** — the client-side countdown was consistently off by ~50 minutes after deploying the dual-timer system. Root cause: the database was returning a non-ISO timestamp string that `Date.parse()` was misinterpreting. The fix was converting the timestamp to ISO string when passing it as a prop.

```ts
<RoomManager
  initialStartsAt={room.startsAt?.toISOString() ?? null}
  initialStartingExpiresAt={room.startingExpiresAt?.toISOString() ?? null}
  initialExpiresAt={room.expiresAt?.toISOString() ?? null}
  ...
/>
```

**dotenv vs. hoisted static imports** — a couple of one-off scripts (`backfill-artwork-images.ts`, an old smoke-test script) called `dotenv.config()` after their top-level `import` statements, expecting it to run first. Static imports get hoisted above other top-level code at compile time, so `app/lib/appwrite.ts`'s module-level client was reading `process.env` before dotenv had populated it, silently constructing a client with undefined credentials. Fixed by loading those modules with a dynamic `import()` placed after `dotenv.config()`.

---

## 🚀 Local Setup

### Prerequisites
- Node.js 20+
- An Appwrite project (Cloud or self-hosted) — or a PostgreSQL database if running on the legacy Drizzle backend
- A Cloudflare account (for the realtime worker) — `wrangler dev` works fine locally without deploying
- OpenAI API key

### Steps

```bash
git clone https://github.com/lukarakic/drawgether
cd drawgether
npm install
npm run provision:appwrite   # only if starting from a fresh Appwrite project
npm run dev                  # Next.js app

# in a second terminal, the realtime relay
cd realtime-worker
npm install
cp .dev.vars.example .dev.vars   # fill in REALTIME_JWT_SECRET / REALTIME_PUSH_SECRET
npm run dev                  # wrangler dev, prints a local ws(s):// URL
```

App runs at `http://localhost:3000`. Point `NEXT_PUBLIC_REALTIME_WS_URL` / `REALTIME_PUSH_URL` at the worker's local dev URL (see `realtime-worker/README.md` for details).

If you'd rather run on the legacy Postgres path instead of standing up Appwrite, set `DATA_BACKEND=drizzle` and run `npx drizzle-kit push` against a Postgres database — the app behaves identically either way.

### Environment Variables

```env
# Data backend
DATA_BACKEND=appwrite   # or "drizzle"

# Appwrite (required if DATA_BACKEND=appwrite)
NEXT_PUBLIC_APPWRITE_ENDPOINT=
NEXT_PUBLIC_APPWRITE_PROJECT_ID=
NEXT_PUBLIC_APPWRITE_PROJECT_NAME=
APPWRITE_API_KEY=
APPWRITE_DATABASE_ID=

# Postgres (required if DATA_BACKEND=drizzle, or when running migration/backfill scripts)
DATABASE_URL=

# Auth
JWT_SECRET=
RESEND_API_KEY=

# Realtime (Cloudflare Worker)
NEXT_PUBLIC_REALTIME_WS_URL=
REALTIME_PUSH_URL=
REALTIME_JWT_SECRET=
REALTIME_PUSH_SECRET=

# AI
OPENAI_API_KEY=
```

---

## 🧪 Testing

```bash
npm test         # full suite (unit + Appwrite integration)
npm run test:unit   # unit tests only, no network required
npm run test:watch
```

- **Unit** — validation schemas and helpers (`app/utils/__tests__/`), the `RoomSocket` reconnect/backoff logic against a hand-rolled mock `WebSocket` (`app/lib/__tests__/realtime-client.test.ts`).
- **Integration** — `app/lib/data/__tests__/appwrite.integration.test.ts` exercises the Appwrite repositories against a real project (creates and cleans up its own uniquely-suffixed rows). Auto-skips without Appwrite credentials, so it won't hard-fail on a fresh clone or in CI without secrets.
- Not covered yet: the `realtime-worker/` Durable Object has no test harness, and there are no component/UI tests.

---

## 🔭 Roadmap

- [ ] Finish production cutover to Appwrite (currently soaking with Drizzle/Postgres kept as instant rollback)
- [ ] Remove the legacy Drizzle backend and Supabase project once the soak period is over
- [ ] Test harness for the `RoomDO` Durable Object (`@cloudflare/vitest-pool-workers`)
- [ ] Live cursor tracking for concurrent users
- [ ] Stress testing under high room concurrency
- [ ] E2E testing — Playwright

---

## 📄 License

Distributed under the MIT License.

---

<div align="center">

Made with ☕, 🍺 and way too many open tabs.

</div>
