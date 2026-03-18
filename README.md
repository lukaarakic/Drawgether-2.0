<div align="center">

# 🎨 Drawgether 2.0

**A social media platform built around collaborative drawing.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-latest-C5F74F?style=flat-square)](https://orm.drizzle.team/)
[![OpenAI](https://img.shields.io/badge/OpenAI-API-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com/)

[Live Demo](https://drawgether.lukarakic.me/) · [Report Bug](mailto:admin@lukarakic.me) · [Request Feature](mailto:admin@lukarakic.me)

</div>

## 📸 Screenshots

| Home | In-Game Canvas | Profile |
|------|---------------|---------|
| ![Home](https://i.imgur.com/rmqkuLH.png) | ![In-Game](https://i.imgur.com/loogjXt.png) | ![Profile](https://i.imgur.com/avA26Q7.png) |

---

## ✨ Overview

Drawgether 2.0 is a social media platform centered around drawing — think Instagram, but you make the art live, together. Users join drawing rooms, receive an AI-generated topic to draw, collaborate on a shared canvas in real time, and when the session ends their finished piece is automatically published to their profile and the community feed. It's part drawing game, part social network.

---

## 🚀 Features

### 🎮 Game Flow
1. Hit **Play** in the navigation, then hit **Draw** to enter a room
2. Wait for others to join or play solo — then hit **Start**
3. A 5-second countdown gives you a chance to cancel before the game locks in
4. You're greeted with your **AI-generated drawing topic**, powered by the OpenAI API — 10 seconds to read it and get your ideas together
5. The canvas opens and the timer starts — draw!
6. When time runs out, your drawing is **automatically published** to your profile and the community feed

### 🖌️ Drawing & Canvas
- **HTML5 Canvas** — smooth, performant drawing surface
- **Custom brush tools** — adjust color, shade, and size to your liking
- **Undo history** — step back through your own actions and your friends'

### 👥 Real-Time Collaboration
- **Live multiplayer sync** — see collaborators' strokes as they draw, powered by Supabase Realtime broadcasting
- **Rooms & session management** — create or join named drawing rooms, each with its own persistent canvas state and timer

### 📱 Social & Discovery
- **Profile pages** — every user has a profile showcasing their published drawings
- **Community feed** — browse artwork from all users with cursor-based infinite scroll

### 🔐 Authentication & Security

Drawgether ships a complete, proprietary authentication system — built from scratch, no third-party auth providers.

- **Registration & login flows** — built end-to-end with secure password hashing prior to database storage
- **Email verification pipeline** — account authenticity is verified without blocking onboarding; users can start drawing immediately while verification happens in the background
- **TOTP verification** — Time-based One Time Passwords gate sensitive actions like email and password changes
- **Forgot password flow** — token-based email recovery for seamless account restoration
- **Role-based permissions** — Discord-style roles control what users can see and do within rooms
- **Protected routes** — session management and route protection handled natively within Next.js

> 🔭 **Coming soon:** Cursor presence — see exactly where your collaborators are drawing in real time.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Real-time** | Supabase Realtime (broadcasting) |
| **Canvas** | HTML5 Canvas API |
| **AI** | OpenAI API (topic generation) |
| **ORM** | Drizzle ORM |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Custom-built, proprietary |

---

## 🏗️ Architecture Highlights

- **OpenAI-powered topic generation** — at the start of each session, a unique drawing prompt is generated via the OpenAI API and revealed to players before the canvas opens.
- **Proprietary auth system** — no black-box third-party auth. Every flow (registration, login, recovery, TOTP, role enforcement) is engineered in-house, giving full control over security and UX.
- **TOTP-gated sensitive actions** — email and password changes require a time-sensitive one-time code, adding a second layer of protection beyond the session.
- **Supabase Realtime broadcasting** — stroke events are broadcast to all room participants; the channel model maps cleanly onto drawing rooms.
- **Cursor-based infinite scroll** — the community feed and profile pages use cursor-based pagination for efficient, scale-friendly querying.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Made with ☕, 🍺 and way too many open tabs.

</div>
