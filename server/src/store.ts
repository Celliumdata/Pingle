import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(dirname, '..', 'data.json');

export interface Agent {
  id: string;
  name: string;
  title: string;
  emoji: string;
  color: string;
  skills: string;
  createdAt: string;
}

export interface Message {
  id: string;
  agentId: string | null;
  agentName: string;
  title: string;
  emoji: string;
  color: string;
  content: string;
  createdAt: string;
}

export type ProjectStatus = 'draft' | 'running' | 'completed';

export interface Project {
  id: string;
  name: string;
  goal: string;
  status: ProjectStatus;
  agentIds: string[];
  messages: Message[];
  artifact: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface DB {
  agents: Agent[];
  projects: Project[];
}

let cache: DB | null = null;

function load(): DB {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as DB;
  } catch {
    cache = { agents: [], projects: [] };
  }
  return cache;
}

export function read(): DB {
  return load();
}

export function write(db: DB): void {
  cache = db;
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}
