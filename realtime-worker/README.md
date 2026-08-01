# Drawgether realtime relay

Cloudflare Worker + Durable Object that replaces Supabase Realtime. One
`RoomDO` instance per room (keyed by room code) relays:

- **Canvas broadcasts** sent directly from clients (`draw_batch`, `draw_dot`,
  `fill_canvas`, `undo_canvas`, `start_drawing`).
- **Room lifecycle events** pushed by the Next.js server right after a
  mutation commits (`artist_joined`, `artist_left`, `room_updated`).

Routes:

- `GET /room/:roomId/connect?token=...` — websocket upgrade. `token` is a
  short-lived JWT minted by `mintRealtimeToken` in the Next app, scoped to
  that room + artist.
- `POST /room/:roomId/event` — server-to-room push. Requires header
  `x-push-secret` matching `REALTIME_PUSH_SECRET`. Body: `{ event, payload }`.

## Local dev

```sh
npm install
cp .dev.vars.example .dev.vars   # fill in real secrets, kept out of git
npm run dev
```

`wrangler dev` prints a local URL (e.g. `http://localhost:8787`) — point the
Next app's `NEXT_PUBLIC_REALTIME_WS_URL` at its `ws://` equivalent and
`REALTIME_PUSH_URL` at the `http://` version while developing.

## Deploy (requires your own Cloudflare account)

```sh
npx wrangler login
npm run deploy
npx wrangler secret put REALTIME_JWT_SECRET
npx wrangler secret put REALTIME_PUSH_SECRET
```

Use the **same values** for `REALTIME_JWT_SECRET` / `REALTIME_PUSH_SECRET`
here and in the Next app's environment — they're a shared secret, not a
public/private keypair.

After deploying, wrangler prints the Worker's URL
(`https://drawgether-realtime.<your-subdomain>.workers.dev`). Set in the Next
app:

- `NEXT_PUBLIC_REALTIME_WS_URL=wss://drawgether-realtime.<your-subdomain>.workers.dev`
- `REALTIME_PUSH_URL=https://drawgether-realtime.<your-subdomain>.workers.dev`
- `REALTIME_JWT_SECRET=<same as worker secret>`
- `REALTIME_PUSH_SECRET=<same as worker secret>`

## Free tier

Durable Objects use the hibernation API (`acceptWebSocket`/`getWebSockets`),
so idle connections don't keep the DO billed as active. With stroke batching
on the client (~1 broadcast every 40ms while drawing, not per pointer-move),
a full game round is a few thousand messages — comfortably inside the free
plan's request allowance.
