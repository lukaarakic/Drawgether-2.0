<div align="center">

# 🎨 Drawgether

**A social media platform built around collaborative real-time drawing.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-latest-C5F74F?style=flat-square)](https://orm.drizzle.team/)
[![OpenAI](https://img.shields.io/badge/OpenAI-API-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com/)

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
| **Framework** | Next.js 16 (App Router) | Server Actions for mutations, RSC for feed and profile pages|
| **Language** | TypeScript | End-to-end type safety across DB schema, API layer, and UI |
| **Styling** | Tailwind CSS v4 |  |
| **Realtime** | Supabase Realtime | Broadcasting model maps cleanly onto drawing rooms, each room is a channel. No WebSocket infrastructure to manage |
| **Canvas** | HTML5 Canvas API | Native, performant, no library overhead for a drawing surface |
| **AI** | OpenAI API | Topic generation at session start. One prompt call per room |
| **ORM** | Drizzle ORM | SQL-like syntax, lighter than Prisma, better control over complex joins and cursor-based pagination |
| **Database** | PostgreSQL (Supabase) | Relational model for users, rooms, drawings, roles |
| **Auth** | Custom-built | Full control over session shape, TOTP flows, and role enforcement |
| **Deploy** | Vercel |  |

---

## 🏗️ Architecture

```
Browser
  └── Next.js (Vercel)
        ├── Server Actions (auth mutations, profile updates, room management...)
        ├── RSC (feed, profile pages...)
        ├── Supabase Realtime client (canvas broadcasting)
        └── HTML5 Canvas API

Supabase
  ├── PostgreSQL + Drizzle ORM (users, rooms, drawings, roles)
  ├── Realtime channels (one per drawing room)
  └── RLS policies (row-level access control)

OpenAI API
  └── Topic generation at session start (one call per room)
```

**Key decisions:**

- **Drizzle over Prisma** — Drizzle's query builder stays close to raw SQL, making complex joins and cursor-based pagination easier to reason about without fighting ORM abstractions.
- **Custom auth over NextAuth** — NextAuth works well for OAuth but becomes awkward with TOTP-gated actions, custom session shapes, and Discord-style room roles all in one system. Building from scratch meant full control with no adapter workarounds.
- **Supabase Realtime over raw WebSockets** — the channel abstraction maps naturally onto drawing rooms without managing raw WebSocket state, reconnection logic, or a separate backend process.
- **Cursor-based pagination** — the community feed uses cursor-based infinite scroll. Offset pagination breaks on fast-moving feeds as new drawings are inserted; cursors are stable and scale-friendly.

---

## 🔐 Authentication

Built from scratch — no NextAuth, no Auth.js, no third-party providers.

| Flow | Implementation |
|---|---|
| Registration & login | bcrypt password hashing, custom session management |
| Email verification | Non-blocking |
| TOTP | Time-based one-time passwords gate sensitive actions (email and password changes) |
| Forgot password | Token-based email recovery |
| Role-based permissions | Discord-style room roles control what users can see and do |
| Protected routes | Session validation via Next.js middleware |

**Why from scratch:** NextAuth's session model didn't accommodate TOTP-gated actions cleanly. Rolling it in-house meant the session object, token shape, and role enforcement all work exactly as needed.

---

## 🎮 Game Loop

```
Join Room → Wait for Players → Start (5s countdown)
  → AI Topic Reveal (10s) → Canvas Opens → Timer Runs
  → Session Ends → Drawing Auto-Published
```

Each session moves through a strict state machine: **Waiting → Starting → Active → Finished**. The timer is server-authoritative, stored as an timestamp in the database, with a client-side interval for smooth UI ticking. Clients reconcile against the server timestamp on reconnect.

---

## 🖌️ Canvas & Realtime Sync

- Stroke events serialized as JSON deltas and broadcast via Supabase Realtime, not full canvas snapshots, keeping payloads small
- **Collaborative undo** — a `start_drawing` broadcast event triggers all connected clients to simultaneously push a history snapshot, keeping undo stacks deterministic across participants
- Custom brush tools — color, shade, size
- Sub-100ms broadcast latency within the same region

---

## 🐛 Notable Bugs Solved

**Collaborative undo desync** — undo in a multiplayer canvas needs to be deterministic for all participants, not just the user who triggered it. Broadcasting a `start_drawing` event the moment a stroke begins causes all clients to snapshot history simultaneously, keeping stacks in sync.

```ts
// sender
pushHistory();
channelRef.current?.send({ type: 'broadcast', event: 'start_drawing' })

// receiver
.on('broadcast', { event: 'start_drawing' }, () => {
  pushHistory();
})
```

**Timer offset bug** — the client-side countdown was consistently off by ~50 minutes after deploying the dual-timer system. Root cause: Supabase was returning a non-ISO timestamp string that `Date.parse()` was misinterpreting. The fix was converting the timestamp to ISO string when passing it as a prop.

```ts
<RoomManager
  initialStartsAt={room.startsAt?.toISOString() ?? null}
  initialStartingExpiresAt={room.startingExpiresAt?.toISOString() ?? null}
  initialExpiresAt={room.expiresAt?.toISOString() ?? null}
  ...
/>
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL (or a Supabase project)
- OpenAI API key

### Steps

```bash
git clone https://github.com/lukarakic/drawgether
cd drawgether
npm install
npm run db:push
npm run dev
```

App runs at `http://localhost:3000`

### Environment Variables

```env
DATABASE_UR=
JWT_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

---

## 🔭 Roadmap

- [ ] Live cursor tracking for concurrent users
- [ ] Stress testing under high room concurrency
- [ ] E2E Testing - Playwright
- [ ] Unit/Integration testing - Vitest

---

## 📄 License

Distributed under the MIT License.

---

<div align="center">

Made with ☕, 🍺 and way too many open tabs.

</div>
