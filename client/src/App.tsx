import { useEffect, useState } from 'react';
import { api } from './api';
import type { Agent, Project, RoleTemplate } from './types';
import { AgentsView } from './components/AgentsView';
import { PokevalleyGame } from './components/PokevalleyGame';
import { ProjectsView } from './components/ProjectsView';

type Tab = 'agents' | 'projects' | 'pokevalley';

export default function App() {
  const [tab, setTab] = useState<Tab>('agents');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [roles, setRoles] = useState<RoleTemplate[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const [a, p, r] = await Promise.all([api.getAgents(), api.getProjects(), api.getRoles()]);
      setAgents(a);
      setProjects(p);
      setRoles(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const wrap = async (fn: () => Promise<void>) => {
    try {
      setError(null);
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  const createAgent = (data: Partial<Agent>) =>
    wrap(async () => {
      const created = await api.createAgent(data);
      setAgents((prev) => [...prev, created]);
    });

  const updateAgent = (id: string, data: Partial<Agent>) =>
    wrap(async () => {
      const updated = await api.updateAgent(id, data);
      setAgents((prev) => prev.map((a) => (a.id === id ? updated : a)));
    });

  const deleteAgent = (id: string) =>
    wrap(async () => {
      await api.deleteAgent(id);
      setAgents((prev) => prev.filter((a) => a.id !== id));
      setProjects((prev) =>
        prev.map((p) => ({ ...p, agentIds: p.agentIds.filter((x) => x !== id) })),
      );
    });

  const createProject = async (data: Partial<Project>): Promise<Project | void> => {
    try {
      setError(null);
      const created = await api.createProject(data);
      setProjects((prev) => [...prev, created]);
      return created;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create project');
    }
  };

  const updateProject = (id: string, data: Partial<Project>) =>
    wrap(async () => {
      const updated = await api.updateProject(id, data);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    });

  const deleteProject = (id: string) =>
    wrap(async () => {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    });

  const runProject = (id: string) =>
    wrap(async () => {
      setRunning(id);
      try {
        const updated = await api.runProject(id);
        setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      } finally {
        setRunning(null);
      }
    });

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-2xl">
            🪿
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Pingle</h1>
            <p className="text-xs text-gray-400">Agent studio — hire, manage, and build together.</p>
          </div>
        </div>
        <nav className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          <NavButton active={tab === 'agents'} onClick={() => setTab('agents')}>
            🤝 Agents <span className="ml-1 opacity-60">({agents.length})</span>
          </NavButton>
          <NavButton active={tab === 'projects'} onClick={() => setTab('projects')}>
            🚀 Projects <span className="ml-1 opacity-60">({projects.length})</span>
          </NavButton>
          <NavButton active={tab === 'pokevalley'} onClick={() => setTab('pokevalley')}>
            🌱 Pokevalley
          </NavButton>
        </nav>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {tab === 'agents' ? (
        <AgentsView
          agents={agents}
          roles={roles}
          onCreate={createAgent}
          onUpdate={updateAgent}
          onDelete={deleteAgent}
        />
      ) : tab === 'projects' ? (
        <ProjectsView
          projects={projects}
          agents={agents}
          onCreate={createProject}
          onUpdate={updateProject}
          onDelete={deleteProject}
          onRun={runProject}
          running={running}
        />
      ) : (
        <PokevalleyGame />
      )}
    </div>
  );
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
        active ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
