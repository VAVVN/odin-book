# Odin-Book

A small social network built for [The Odin Project's Odin-Book assignment](https://www.theodinproject.com/lessons/node-path-nodejs-odin-book). Sign in with GitHub, post, like, comment, and follow other users.

## Stack

- **Server:** Express 5, Prisma + PostgreSQL, Passport (GitHub OAuth), express-session
- **Client:** React (Vite), React Router

## Project structure

```
server/   Express API (auth, posts, comments, likes, follows, users)
client/   React SPA
```

## Local development

1. Create a Postgres database and set `DATABASE_URL` in `server/.env` (copy `server/.env` values from your local setup).
2. Register a GitHub OAuth App at https://github.com/settings/developers with callback URL `http://localhost:3001/api/auth/github/callback`, and fill in `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` in `server/.env`.
3. Install and run:

```bash
cd server && npm install && npx prisma migrate dev && npm run dev
cd client && npm install && npm run dev
```

4. Optionally seed fake data (posts/users/follows) for the currently logged-in account:

```bash
cd server && npm run seed
```

## Deployment (Render)

This repo includes a `render.yaml` Blueprint that provisions a web service (serving the built client from the Express server) plus a free Postgres database.

1. Push this repo to GitHub.
2. On Render, choose **New > Blueprint** and point it at the repo. Render will read `render.yaml` and create the web service + database.
3. After the first deploy, note the assigned URL (e.g. `https://odin-book.onrender.com`).
4. In the Render dashboard, set the remaining env vars on the web service:
   - `CLIENT_URL` — the deployed URL from step 3
   - `GITHUB_CALLBACK_URL` — `<deployed URL>/api/auth/github/callback`
   - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — from a GitHub OAuth App whose callback URL matches `GITHUB_CALLBACK_URL`
5. Redeploy so the new env vars take effect.

The server serves the built client as static files in production, so the whole app lives at one origin — no CORS/cross-site cookie complications.
