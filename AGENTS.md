# AGENTS.md

## Skills

- **autoresearch** — `.agents/skills/autoresearch/SKILL.md`. A general autonomous
  iterative-experimentation loop (define goal + measurable metric + scope, then loop:
  edit → commit → run → measure → keep/discard) inspired by karpathy/autoresearch. Managed by
  the [`skills`](https://github.com/vercel-labs/skills) CLI; the source is pinned in
  `skills-lock.json`. Installed with
  `npx skills add https://github.com/github/awesome-copilot --skill autoresearch`. Update with
  `npx skills update`. These files are committed, so no startup install step is needed.
- **Autonomous LLM Research** — `skills/autonomous-research.md`. Use when asked to improve an
  LLM training setup autonomously via the karpathy/autoresearch loop (edit `train.py`, fixed
  5-min training budget, optimize `val_bpb`, keep/discard, repeat). The same skill is exposed
  in the Pingle app as the **"AI Research Agent"** role preset.

## Cursor Cloud specific instructions

Pingle is an npm-workspaces monorepo with two services:

- `server/` — Express + TypeScript API (port **3001**). Dev: `npm run dev:server` (tsx watch).
- `client/` — React + Vite + Tailwind web app (port **5173**). Dev: `npm run dev:client`.

Standard commands live in the root `package.json` scripts and `README.md`; prefer those:
`npm run dev` (both services via concurrently), `npm run lint`, `npm run typecheck`, `npm run build`.

Non-obvious notes:

- The Vite dev server proxies `/api` → `http://localhost:3001`, so start **both** services
  (use `npm run dev`) when testing the UI end-to-end. The frontend talks only to `/api`.
- Persistence is a flat JSON file at `server/data.json` (gitignored, created on first write).
  There is no database. To reset all agents/projects, stop the server and delete that file.
- The multi-agent collaboration engine is a **local simulation** (see `server/src/collaboration.ts`);
  it does not call any external LLM and needs no API keys/secrets.
