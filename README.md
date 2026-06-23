# Pingle

Pingle is an **agent studio**: a dashboard where you create agents with different job
titles, manage them, assemble them onto a project, and run a multi-agent
collaboration that produces a build plan and deliverable.

## Features

- **Agents** — hire agents with a name, job title, skills, avatar, and color. Quick-start
  presets for common roles (PM, Engineer, Designer, QA, DevOps, Data, Writer, Marketer).
- **Projects** — describe what you want to build, assign a team of agents, and run a
  collaboration.
- **Collaboration engine** — each agent contributes based on its role, and the work is
  synthesized into a compiled **Deliverable** (a build plan you can read in the UI).
- **PokéValley** — a playable in-app game (a Pokémon × Stardew Valley mashup) shipped by the
  agents. Open the **🌾 PokéValley** tab to till and plant crops, sleep to advance the day,
  trade at the shop, and catch wild creatures in the tall grass. It runs entirely client-side
  and saves to `localStorage` (no server or API keys needed).

## Tech stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node + Express + TypeScript (file-based JSON store, no external DB)
- Monorepo via npm workspaces (`client`, `server`)

## Getting started

```bash
npm install        # installs all workspaces
npm run dev        # starts API (:3001) and web app (:5173) together
```

Then open http://localhost:5173.

### Other scripts

```bash
npm run lint       # eslint across client + server
npm run typecheck  # tsc --noEmit for both workspaces
npm run build      # production build of server + client
```

The API runs on port `3001`; the Vite dev server proxies `/api` to it.
Runtime data is persisted to `server/data.json` (gitignored).
