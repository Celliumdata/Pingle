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

export interface RoleTemplate {
  title: string;
  emoji: string;
  color: string;
  skills: string;
}
