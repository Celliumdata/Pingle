import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import type { Request, Response } from 'express';
import { read, write } from './store.js';
import type { Agent, Project } from './store.js';
import { ROLE_TEMPLATES } from './roles.js';
import { runCollaboration } from './collaboration.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'pingle-api' });
});

app.get('/api/roles', (_req: Request, res: Response) => {
  res.json(ROLE_TEMPLATES);
});

// ---- Agents ----
app.get('/api/agents', (_req: Request, res: Response) => {
  res.json(read().agents);
});

app.post('/api/agents', (req: Request, res: Response) => {
  const { name, title, emoji, color, skills } = req.body ?? {};
  if (!name || !title) {
    return res.status(400).json({ error: 'name and title are required' });
  }
  const db = read();
  const agent: Agent = {
    id: randomUUID(),
    name: String(name).trim(),
    title: String(title).trim(),
    emoji: emoji ? String(emoji) : '🤖',
    color: color ? String(color) : '#6366f1',
    skills: skills ? String(skills) : '',
    createdAt: new Date().toISOString(),
  };
  db.agents.push(agent);
  write(db);
  res.status(201).json(agent);
});

app.put('/api/agents/:id', (req: Request, res: Response) => {
  const db = read();
  const agent = db.agents.find((a) => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'agent not found' });
  const { name, title, emoji, color, skills } = req.body ?? {};
  if (name !== undefined) agent.name = String(name).trim();
  if (title !== undefined) agent.title = String(title).trim();
  if (emoji !== undefined) agent.emoji = String(emoji);
  if (color !== undefined) agent.color = String(color);
  if (skills !== undefined) agent.skills = String(skills);
  write(db);
  res.json(agent);
});

app.delete('/api/agents/:id', (req: Request, res: Response) => {
  const db = read();
  const before = db.agents.length;
  db.agents = db.agents.filter((a) => a.id !== req.params.id);
  if (db.agents.length === before) return res.status(404).json({ error: 'agent not found' });
  // Detach the deleted agent from any projects.
  for (const project of db.projects) {
    project.agentIds = project.agentIds.filter((id) => id !== req.params.id);
  }
  write(db);
  res.status(204).end();
});

// ---- Projects ----
app.get('/api/projects', (_req: Request, res: Response) => {
  res.json(read().projects);
});

app.post('/api/projects', (req: Request, res: Response) => {
  const { name, goal, agentIds } = req.body ?? {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const db = read();
  const project: Project = {
    id: randomUUID(),
    name: String(name).trim(),
    goal: goal ? String(goal).trim() : '',
    status: 'draft',
    agentIds: Array.isArray(agentIds) ? agentIds.map(String) : [],
    messages: [],
    artifact: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  db.projects.push(project);
  write(db);
  res.status(201).json(project);
});

app.put('/api/projects/:id', (req: Request, res: Response) => {
  const db = read();
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'project not found' });
  const { name, goal, agentIds } = req.body ?? {};
  if (name !== undefined) project.name = String(name).trim();
  if (goal !== undefined) project.goal = String(goal).trim();
  if (agentIds !== undefined && Array.isArray(agentIds)) {
    project.agentIds = agentIds.map(String);
  }
  write(db);
  res.json(project);
});

app.delete('/api/projects/:id', (req: Request, res: Response) => {
  const db = read();
  const before = db.projects.length;
  db.projects = db.projects.filter((p) => p.id !== req.params.id);
  if (db.projects.length === before) return res.status(404).json({ error: 'project not found' });
  write(db);
  res.status(204).end();
});

// Run the multi-agent collaboration for a project.
app.post('/api/projects/:id/run', (req: Request, res: Response) => {
  const db = read();
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'project not found' });
  const agents = project.agentIds
    .map((id) => db.agents.find((a) => a.id === id))
    .filter((a): a is Agent => Boolean(a));

  const { messages, artifact } = runCollaboration(project, agents);
  project.messages = messages;
  project.artifact = artifact;
  project.status = 'completed';
  project.completedAt = new Date().toISOString();
  write(db);
  res.json(project);
});

app.listen(PORT, () => {
  console.log(`[pingle] API listening on http://localhost:${PORT}`);
});
