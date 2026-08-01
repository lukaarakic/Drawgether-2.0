# Migration Plan: Supabase → Appwrite (DB + Storage) + Cloudflare Durable Objects (Realtime)

**Goal:** Remove Supabase entirely. Data and images move to Appwrite; all realtime (canvas strokes + room events) moves to a Cloudflare Durable Object relay. Custom auth (bcrypt + jose JWT + TOTP) stays exactly as is.

**Target architecture:**

- **Appwrite TablesDB** — all 12 tables, accessed only server-side via `node-appwrite` with an API key (server actions / route handlers). No client-side Appwrite SDK for data.
- **Appwrite Storage** — artwork images as files + CDN URLs (replaces base64-in-column).
- **Cloudflare Worker + Durable Object** — one DO instance per game room, acting as a websocket relay. Clients connect for strokes AND room events; server actions push room events to it via HTTP.
- **Auth unchanged** — `dg_session_token` JWT, `proxy.ts` middleware, `passwords` / `verification_tokens` tables move to Appwrite like any other table. The DO verifies a short-lived HMAC JWT signed with a shared secret (reuse `jose`).

---

## Phase 1 — Stroke batching (independent; do first) ✅ done

- Buffered stroke segments in `GameCanvas.tsx`, flushed every 40ms as one `draw_batch` broadcast instead of one message per pointermove.
- Message rate while drawing dropped from ~60–120/s to ~25/s max.

## Phase 2 — Durable Object realtime relay ✅ deployed and verified live

Built and cut over while the DB is still on Supabase — de-risks the big move later.

1. **`realtime-worker/` package** (Wrangler project): `RoomDO` Durable Object, one instance per room (keyed by room code). Accepts websocket upgrades at `/room/:roomId/connect?token=...` (JWT verified at the edge), relays broadcast messages to every other connected socket via the hibernation API. `POST /room/:roomId/event` (guarded by a shared secret header) lets the server push room-lifecycle events the same way.
2. **Server side:** `app/lib/realtime.ts` — `publishRoomEvent(roomCode, event, payload)`. Wired into every mutation in `app/lib/actions/room.ts`: `joinRoomAction` → `artist_joined` (full row), `kickPlayerAction`/`leaveRoomAction` → `artist_left`, `startGameCountdownAction`/`cancelGameCountdownAction`/`finalizeGameCountdownAction`/`activateRoomAction` → `room_updated`.
3. **Token minting:** `app/lib/actions/realtime-token.ts` — `mintRealtimeToken(roomCode)`, a 1h JWT scoped to `{ roomId, artistId }`, signed with `REALTIME_JWT_SECRET` (shared with the Worker).
4. **Client side:** `app/lib/realtime-client.ts` — `RoomSocket` class (connect/reconnect-with-backoff/on/send/close) replacing the Supabase channel API 1:1. `GameCanvas.tsx` and `RoomManager.tsx` both use it. `RoomManager` collapsed from 3 Supabase channels (room artists, personal kick-check, room status) to 1 socket, since the DO is already scoped per room — no more client-side filtering by `roomDatabaseId`.
5. `@supabase/supabase-js` removed from `package.json`; no Supabase references remain in `app/`.

**Deployed:** `https://drawgether-realtime.lukarakic0.workers.dev`. Both secrets generated (32-byte random hex) and set on the Worker via `wrangler secret put`, and mirrored into `.env.local`:
- `NEXT_PUBLIC_REALTIME_WS_URL=wss://drawgether-realtime.lukarakic0.workers.dev`
- `REALTIME_PUSH_URL=https://drawgether-realtime.lukarakic0.workers.dev`
- `REALTIME_JWT_SECRET` / `REALTIME_PUSH_SECRET` — set on both sides.

**Verified live** (`curl` against the deployed Worker): a request with the wrong `x-push-secret` is rejected with 401; the correct one (read straight from `.env.local`) returns 200 `ok` — confirms the secret round-trips correctly between the Worker and the Next app. Still only spot-checked at the HTTP level, not with a real browser websocket session yet — that's the next thing to try once you run the app locally or deploy it.

**Still needed on your production host** (this Worker deploy and `.env.local` only cover local dev): copy the four `REALTIME_*`/`NEXT_PUBLIC_REALTIME_WS_URL` vars into your deploy host's environment when you're ready to cut over for real.

Full details in `realtime-worker/README.md`.

**Exit criteria:** full game round (lobby → kick → countdown → draw → finish) works across two browsers with Supabase realtime code deleted.

## Phase 3 — Appwrite project + schema provisioning ✅ done

Ran against your live Appwrite project (`.env.local`: `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID`).

- `scripts/provision-appwrite.ts` (idempotent — safe to re-run, skips anything that already exists) created the `drawgether` database, all 12 tables with their columns and indexes, and the `artworks` Storage bucket (public read, 10MB file cap, png/jpg/jpeg/webp only).
- One real Appwrite constraint discovered along the way: a column can't be both `required` and carry a default (`xdefault`) — Appwrite rejects that combination outright, unlike Postgres' `NOT NULL DEFAULT`. Every counter column (`likesCount`, `followerCount`, etc.) and the `rooms.status` enum are `required: false` with a default instead; Appwrite still always populates them, it just won't let a column claim both properties.
- Run it again any time with `npm run provision:appwrite` — it only creates what's missing.

Original plan for reference (now implemented as above):

1. Create Appwrite Cloud project (or self-host), database, and an API key with DB + Storage scopes.
2. Provision schema via `appwrite.json` + Appwrite CLI (repeatable, in-repo) or a `scripts/provision-appwrite.ts` using `node-appwrite`.
3. **Mapping decisions:**
   - **Plain string-ID columns instead of Appwrite relationship columns.** Rationale: bulk operations don't support tables with relationship columns (breaks data import), and the app already joins in app code / denormalizes counters. Enforce integrity in server actions.
   - **Keep cuid2 IDs** as custom row `$id`s (24 chars — fits Appwrite's 36-char limit). Existing IDs survive migration; URLs don't break.
   - Junction tables (`likes`, `follows`, `artists_artworks`, `roles_permissions`): two string columns + **composite unique index** (replaces composite PK).
   - Enums (`room_status`, `auth_token_type`): Appwrite enum columns.
   - Unique constraints: unique indexes on `artists.username`, `artists.email`, `rooms.code`, `artworks.roomId`, `passwords.artistId`, `verification_tokens(target,type)`, `permissions(action,entity,access)`.
   - Timestamps: use built-in `$createdAt`/`$updatedAt` where semantics match; explicit datetime columns for `startsAt`, `startingExpiresAt`, `expiresAt`, `emailVerified`.
   - Query indexes: `artworks($createdAt desc, $id)` for feed cursor; `rooms.code`; `artists.roomId`; `comments.artworkId`; `follows` both directions; **fulltext index on `artists.username`** (needed for `searchArtists.ts` → `Query.search`).
   - All tables: no client permissions (server API key bypasses permissions; nothing is client-readable — realtime doesn't need it since the DO handles it).
4. Storage bucket `artworks` (image mime types only, public read).

## Phase 4 — Images out of the database ✅ code done, one script left for you to run

Shipped ahead of the data migration — the DB is still Postgres/Supabase, only the image storage moved.

- `app/lib/artwork-storage.ts` — `uploadArtworkImage(dataUrl)` decodes the base64 PNG, uploads it to the Appwrite `artworks` bucket, and returns a public view URL (`.../storage/buckets/artworks/files/:id/view?project=...`).
- `finishGameAction` (`app/lib/actions/room.ts`) now calls this before inserting the artwork row, so **new** games already store a short URL instead of a multi-MB data URL.
- `next.config.ts` — added `fra.cloud.appwrite.io` to `images.remotePatterns` (your Appwrite Cloud region's host), since every artwork render goes through `next/image` (`FeedInfiniteList.tsx`, `ArtworkPost.tsx`, `SmallArtwork.tsx`) and Next blocks unlisted remote hosts.
- `scripts/backfill-artwork-images.ts` — one-off migration for **existing** artworks still holding a `data:` URL: uploads each to Storage and rewrites the column. Idempotent (only touches rows still starting with `data:`).

**Still to do (needs `DATABASE_URL`, which isn't in this machine's `.env.local`):**
```sh
npm run backfill:artwork-images
```
Run this once, whenever convenient — it's safe to re-run and only affects legacy rows.

**Exit criteria:** feed payload drops from megabytes to kilobytes; no `data:` URLs remain in the DB (confirm via the backfill script's own count, or `SELECT count(*) FROM artworks WHERE artwork_image LIKE 'data:%'`).

## Phase 5 — Repository layer extraction (pure refactor, still on Drizzle) ✅ done

- Created six `app/lib/data/` modules: `artists.ts`, `auth.ts` (passwords, verification tokens, roles), `rooms.ts`, `artworks.ts`, `feed.ts`, `interactions.ts` (likes/follows/comments).
- All ~42 `db.query/insert/update/delete/transaction` call sites moved behind named functions. Every page, action, and `auth-utils.ts` now imports only from `app/lib/data/` — verified with `grep -rl "from \"@/app/lib/db\"" app`, which returns only the six data modules themselves.
- `app/(app)/feed/feed-query.ts` was deleted; its logic + `FeedArtwork`/`FeedCursor` types moved into `app/lib/data/feed.ts` (3 importers updated).
- One duplicated query pattern (the "which of these artwork IDs has this artist liked" check, previously copy-pasted across `feed-query.ts`, `ArtworksContainer.tsx`) is now the single `getLikedArtworkIds` helper in `interactions.ts`.
- **One real bug fixed in passing:** `artist/[artistId]/artwork/[artworkId]/page.tsx` computed its "is this liked by me" check with `eq(like.artistId, artistId) && eq(like.artworkId, artworkId)` — plain JS `&&` between two Drizzle condition objects, not the `and()` helper, so the `artistId` condition silently evaporated and the check actually meant "has *anyone* liked this artwork." Every other call site in the app used `and()` correctly; this one now shares the same correct `isArtworkLikedByArtist` helper.
- Confirmed zero behavior change otherwise, including preserving one genuinely odd pre-existing query in `reset-passoword.ts`'s password update (a subquery that filters `artists` by `passwords.artistId` without an explicit join) — left byte-for-byte identical since fixing it wasn't in scope here.
- Whole project: `tsc --noEmit` and `eslint app` both clean (same pre-existing warnings as before, zero new ones).

**Exit criteria met:** `grep -r "app/lib/db\|drizzle" app` matches only `app/lib/data/**`; app behaves identically (module bug above excepted, which was a genuine fix).

## Phase 6 — Reimplement repositories on Appwrite ✅ done, verified live

Every `app/lib/data/*.drizzle.ts` module now has a sibling `*.appwrite.ts` implementation, and the public `app/lib/data/{artists,auth,rooms,artworks,interactions,feed}.ts` files are thin selectors:

```ts
const impl = DATA_BACKEND === "appwrite" ? appwriteImpl : drizzleImpl;
export const getRoomForLobby = impl.getRoomForLobby;
// ...
```

`DATA_BACKEND` (`app/lib/data/backend.ts`) defaults to `"drizzle"`; set `DATA_BACKEND=appwrite` to flip every module at once. Because both implementations live behind the exact same function signatures, **pages and actions were not touched again** in this phase beyond one shape fix (below) — the whole point of Phase 5's extraction paid off here.

**Key translations, as built:**
- **Row shape mapping** (`appwrite-mappers.ts`): Appwrite rows carry `$id`/`$createdAt`/`$updatedAt` as ISO strings; mappers convert to the `id`/`Date` shape the rest of the app already expects from Drizzle.
- **No relational `with:`** → batched follow-up queries stitched in code. `appwrite-artist-stubs.ts` centralizes the "username+avatar for these artist IDs" batch fetch shared by `artists.appwrite.ts`, `artworks.appwrite.ts`, and `feed.appwrite.ts` (was three near-identical copies during a first pass — consolidated).
- **Feed cursor pagination** → `Query.orderDesc("$createdAt")` + `Query.cursorAfter(lastRowId)`, replacing the manual `(createdAt, id)` tuple cursor.
- **Compare-and-swap room updates** (start/cancel/finalize countdown, activate) → Appwrite's bulk `updateRows({ data, queries })` accepts a filter; if the room's state changed underneath (lost the race), the filter matches zero rows and `total` comes back `0` — the same optimistic-concurrency guarantee as the Postgres `WHERE status = X AND startsAt = Y` pattern. **Verified live**: the smoke test's step 5 confirms a stale CAS attempt is correctly rejected.
- **Transactions** (`toggleArtworkLike`, `toggleFollow`, `addComment`/`deleteComment`, `createRoomWithOwner`, `createArtworkForRoom`) → Appwrite's Transactions API (`createTransaction` → stage ops with `transactionId` → `updateTransaction({commit: true})`, rollback on error). Counter bumps use atomic `incrementRowColumn`/`decrementRowColumn` staged in the same transaction.
- **IDs**: new rows created under `DATA_BACKEND=appwrite` still use `createId()` (cuid2) for primary entities (artists, rooms, artworks) — same ID shape as Drizzle, so nothing downstream needs to care which backend wrote a row.
- **A shape mismatch caught by `tsc`, not by hand**: the Drizzle backend's `getArtworkWithArtistsAndComments`/`getArtistProfileByUsername` originally returned raw Drizzle join-row wrappers (`{artistId, artworkId, artist: {...}}[]`) and left the *flattening* to each page (`.map(joinRow => joinRow.artist)`). The Appwrite backend naturally returns flat `ArtistStub[]`. Rather than fake the join-row wrapper on the Appwrite side, the flattening moved into the Drizzle repo functions themselves, and the 4 pages that used to flatten now just use the array directly — this is what "the two backends must have identical contracts" actually forces you to clean up.

**Not done in this phase (deliberately, still on Drizzle by default):** register/join flows still rely on Postgres unique-constraint errors when `DATA_BACKEND=drizzle`; the Appwrite paths use explicit availability checks instead (`checkArtistAvailability`, CAS filters) rather than catching 409s, since that was the more direct translation of the existing logic.

**Exit criteria met — verified against the real Appwrite project, not just type-checked:**
- `scripts/smoke-test-appwrite.ts` (`npm run smoke-test:appwrite`) exercises all ten flows end-to-end against live Appwrite: role setup, account creation, availability checks, full room lifecycle (create → join → countdown → finalize → activate), a stale-CAS rejection, artwork creation, likes/comments/follows with counters, feed pagination, kick/leave, and the nested artist-profile view. All ten passed, twice in a row, cleaning up after itself both times.
- `tsc --noEmit` and `eslint app` both clean across the whole project (same pre-existing warnings only).
- Found and fixed a **real latent bug** in two standalone scripts (`backfill-artwork-images.ts`, and the new smoke test) while wiring this up: `dotenv.config()` calls placed after static `import` statements don't actually run first — static imports get hoisted above other top-level code during compilation, so `app/lib/appwrite.ts`'s module-level client construction was reading `process.env` *before* dotenv had populated it. Fixed by loading those modules with dynamic `import()` after `dotenv.config()` instead of static imports. `scripts/provision-appwrite.ts` was never affected (it builds its own client inline rather than importing `app/lib/appwrite.ts`).

## Phase 7 — Data migration + cutover ✅ real data migrated and verified

Ran against your actual Supabase database. Final verified counts (Postgres = Appwrite for every table):

| Table | Rows |
|---|---|
| artists | 10 |
| rooms | 38 |
| artworks | 20 |
| artists_artworks | 67 |
| comments | 36 |
| likes | 68 |
| follows | 6 |
| passwords | 10 |
| roles / permissions / roles_permissions | 2 / 9 / 15 |
| verification_tokens | 2 |

**What actually happened, in order:**
1. `DATABASE_URL` initially pointed at Supabase's *direct* connection (`db.<ref>.supabase.co`), which is IPv6-only — this environment has no outbound IPv6 route, so it failed with `ENETUNREACH`. Fixed by switching to the **session pooler** connection string (`aws-*.pooler.supabase.com`, username `postgres.<ref>`), which is IPv4-reachable.
2. First migration attempt got through roles/permissions/roles_permissions/artists/rooms/passwords/verification_tokens, then failed on `artworks` — 20 rows still held raw base64 `data:image/png;base64,...` payloads (the Phase 4 backfill script had never been run, since `DATABASE_URL` wasn't available until this point). Ran `npm run backfill:artwork-images` first (all 20 uploaded to Appwrite Storage), then re-ran the migration — idempotent, so it skipped everything already written and picked up cleanly from `artworks`.
3. Verification initially flagged `passwords: postgres=10 appwrite=14 MISMATCH` — traced to my own two earlier smoke-test runs: `createArtistAccount` writes both an `artists` row and a `passwords` row, but the smoke test's cleanup only tracked and deleted the `artists` rows, leaking 4 orphaned `passwords` rows (2 runs × 2 test artists). Identified and deleted them by cross-referencing against real Postgres artist IDs, then re-ran the migration — all 12 tables now report `OK`.
4. Started the Next.js dev server locally with `DATA_BACKEND=appwrite` set and confirmed it boots cleanly and serves `/login`, `/register`, `/search`, and `/api/feed` with correct behavior (200s and a proper 401 on the unauthenticated feed API) — no server errors, no 500s.

**What's left — all yours, deliberately:**

1. ~~Migrate data~~ ✅ done. ~~Spot-check locally~~ ✅ done (dev server verified against Appwrite).
2. **Cutover:** pick a moment with no `ACTIVE` game rooms (they're short-lived, easy to find), re-run `npm run migrate:appwrite` to catch any last-minute deltas since this session, set `DATA_BACKEND=appwrite` in your **deploy host's** environment (Vercel or wherever this runs in production — separate from this machine's `.env.local`), deploy.
3. **Soak for about a week** with Supabase paused-but-intact as your rollback (flip `DATA_BACKEND` back to `drizzle` and redeploy — instant revert, no data loss, since the migration script only ever reads Postgres and writes Appwrite, never the other way).
4. Once confident: remove `drizzle-orm`, `drizzle-kit`, `postgres`, `pg` from `package.json`, delete `drizzle/`, `app/lib/db.ts`, every `*.drizzle.ts` file in `app/lib/data/`, the `DATA_BACKEND` flag plumbing, and the Supabase project itself.

---

## Test suite (added post-migration)

There was no test infrastructure in this repo before — added Vitest, since it's zero-config with this stack:

- `npm test` — everything (42 tests). `npm run test:unit` — skips the live Appwrite suite. `npm run test:watch` — watch mode.
- **Unit tests**: `app/utils/__tests__/` (validation schemas, `generateRoomCode`/`maskEmail`), `app/lib/__tests__/realtime-client.test.ts` (the `RoomSocket` reconnect/backoff logic, using a hand-rolled mock `WebSocket` + `vi.useFakeTimers()` — no network involved).
- **Integration test**: `app/lib/data/__tests__/appwrite.integration.test.ts` — 13 tests hitting your **real** Appwrite project (creates and cleans up its own uniquely-suffixed rows), covering the same ground as the old manual smoke-test script but as a proper `describe`/`it` suite. Auto-skips if Appwrite credentials aren't set (`describe.skipIf`), so it won't hard-fail on a fresh clone or in CI without secrets. This replaced `scripts/smoke-test-appwrite.ts`, which is now redundant and was deleted.
- **A real bug the validation tests caught immediately**: `UsernameSchema` (`app/utils/user-validation.ts`) ends in `.transform(toLowerCase)`, implying it accepts any case and normalizes it — but Zod runs `.regex(/^[a-z0-9_.]+$/)` against the *original* input before the transform ever fires, so `"LukaRakic"` is rejected outright rather than being lowercased. The transform is a no-op in practice; only already-lowercase input reaches it. Not fixed (outside this task's scope), but now documented by a test instead of being a silent surprise.

**Not covered:** the `realtime-worker/` Durable Object (no test harness set up for it — `@cloudflare/vitest-pool-workers` would be the tool if you want that later), and no component/UI tests anywhere in the app.

## Risks & watch-items

- **DO free tier:** 100k requests/day; incoming ws messages count. Phase 1 batching keeps a round at a few thousand messages. If the app grows, Workers Paid ($5/mo) removes the ceiling.
- **Appwrite free tier:** watch bandwidth (image CDN traffic counts) and DB reads; the feed's stitched queries are the hot path — keep `limit ≤ 20` and consider caching.
- **No DB-enforced integrity:** uniqueness stays (indexes), but FKs/cascades are now app-code responsibility — concentrate all writes in `app/lib/data/` and never bypass it.
- **Latency:** choose the Appwrite region closest to your users; all queries are server→Appwrite HTTP calls, so the Next server region matters too.
- **`likesCount`-style counters** can drift without FK cascades — add a periodic reconciliation script (nice-to-have).

## Order of execution & rough effort

| Phase | Depends on | Effort |
|---|---|---|
| 1. Stroke batching | — | 0.5 day |
| 2. DO relay | 1 | 2–3 days |
| 3. Appwrite provisioning | — | 1 day |
| 4. Images → Storage | 3 | 1–2 days |
| 5. Repository extraction | — | 2–3 days |
| 6. Appwrite repositories | 3, 5 | 3–5 days |
| 7. Data migration + cutover | 2, 4, 6 | 1–2 days |

Phases 1–2 (realtime) and 3–4 (images) each ship independently and deliver speed wins before the DB moves. The point of no return is only at Phase 7 cutover, with a flag-flip rollback until Supabase is deleted.

## What you (Luka) need to provide

- ✅ Appwrite account + project + API key — done, provisioned live this session.
- Cloudflare account + `wrangler login`, to deploy `realtime-worker/` (steps in its README).
- `DATABASE_URL` in `.env.local` (or wherever you run these scripts from) to run `migrate:appwrite` and `backfill:artwork-images` — not present in this environment, so I couldn't run either against real data.
- The actual go/no-go on cutover timing (Phase 7, step 4) — flipping `DATA_BACKEND=appwrite` in production is the one step here that touches your live app.
