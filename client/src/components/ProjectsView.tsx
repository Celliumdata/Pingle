import { useEffect, useState } from 'react';
import type { Agent, Project } from '../types';
import { MarkdownLite } from './MarkdownLite';

interface Props {
  projects: Project[];
  agents: Agent[];
  onCreate: (data: Partial<Project>) => Promise<Project | void>;
  onUpdate: (id: string, data: Partial<Project>) => void;
  onDelete: (id: string) => void;
  onRun: (id: string) => Promise<void>;
  running: string | null;
}

export function ProjectsView({
  projects,
  agents,
  onCreate,
  onUpdate,
  onDelete,
  onRun,
  running,
}: Props) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'timeline' | 'deliverable'>('timeline');

  const selected = projects.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId && projects.length > 0) setSelectedId(projects[0].id);
    if (selectedId && !projects.some((p) => p.id === selectedId)) {
      setSelectedId(projects[0]?.id ?? null);
    }
  }, [projects, selectedId]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const created = await onCreate({ name: name.trim(), goal: goal.trim(), agentIds: [] });
    setName('');
    setGoal('');
    if (created) setSelectedId(created.id);
  };

  const toggleAgent = (agentId: string) => {
    if (!selected) return;
    const has = selected.agentIds.includes(agentId);
    const next = has
      ? selected.agentIds.filter((id) => id !== agentId)
      : [...selected.agentIds, agentId];
    onUpdate(selected.id, { agentIds: next });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <p className="text-sm text-gray-400">
          Assemble agents and run a collaboration to build your deliverable.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left: project list + create */}
        <div className="space-y-4">
          <form onSubmit={create} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-2 text-sm font-semibold text-white">New project</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="mb-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
            />
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What should the team build?"
              rows={3}
              className="mb-2 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              + Create project
            </button>
          </form>

          <div className="space-y-2">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                  selectedId === p.id
                    ? 'border-indigo-400/60 bg-indigo-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/25'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">{p.name}</span>
                  <span className="block truncate text-xs text-gray-400">
                    {p.agentIds.length} agent{p.agentIds.length === 1 ? '' : 's'}
                  </span>
                </span>
                <StatusBadge status={p.status} />
              </button>
            ))}
            {projects.length === 0 && (
              <p className="px-1 text-sm text-gray-500">No projects yet — create one above.</p>
            )}
          </div>
        </div>

        {/* Right: project detail */}
        {selected ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                <p className="text-sm text-gray-400">{selected.goal || 'No goal set.'}</p>
              </div>
              <button
                onClick={() => onDelete(selected.id)}
                className="shrink-0 rounded-md bg-red-500/20 px-3 py-1 text-xs text-red-300 hover:bg-red-500/30"
              >
                Delete
              </button>
            </div>

            {/* Assign agents */}
            <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">Assign team</p>
            {agents.length === 0 ? (
              <p className="mb-4 text-sm text-gray-500">Hire agents first to assign them here.</p>
            ) : (
              <div className="mb-4 flex flex-wrap gap-2">
                {agents.map((a) => {
                  const active = selected.agentIds.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleAgent(a.id)}
                      style={active ? { borderColor: a.color, background: `${a.color}22` } : undefined}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${
                        active ? 'text-white' : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'
                      }`}
                    >
                      <span>{a.emoji}</span>
                      <span>{a.name}</span>
                      <span className="text-[10px] opacity-70">· {a.title}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => onRun(selected.id)}
              disabled={selected.agentIds.length === 0 || running === selected.id}
              className="mb-5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {running === selected.id
                ? '⏳ Agents collaborating…'
                : selected.status === 'completed'
                  ? '↻ Re-run collaboration'
                  : '▶ Run collaboration'}
            </button>

            {/* Tabs */}
            {selected.messages.length > 0 && (
              <>
                <div className="mb-3 flex gap-1 border-b border-white/10">
                  <TabButton active={tab === 'timeline'} onClick={() => setTab('timeline')}>
                    Timeline
                  </TabButton>
                  <TabButton active={tab === 'deliverable'} onClick={() => setTab('deliverable')}>
                    Deliverable
                  </TabButton>
                </div>

                {tab === 'timeline' ? (
                  <div className="scroll-thin max-h-[460px] space-y-3 overflow-y-auto pr-1">
                    {selected.messages.map((m) => (
                      <div key={m.id} className="flex gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                          style={{ background: `${m.color}33` }}
                        >
                          {m.emoji}
                        </div>
                        <div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{m.agentName}</span>
                            <span className="text-xs" style={{ color: m.color }}>
                              {m.title}
                            </span>
                          </div>
                          <div className="text-gray-200">
                            <MarkdownLite content={m.content} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="scroll-thin max-h-[460px] overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-4">
                    <MarkdownLite content={selected.artifact ?? '_No deliverable yet._'} />
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 p-12 text-gray-500">
            Select or create a project to get started.
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Project['status'] }) {
  const map: Record<Project['status'], string> = {
    draft: 'bg-gray-500/20 text-gray-300',
    running: 'bg-amber-500/20 text-amber-300',
    completed: 'bg-emerald-500/20 text-emerald-300',
  };
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status]}`}>
      {status}
    </span>
  );
}

function TabButton({
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
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
        active
          ? 'border-indigo-400 text-white'
          : 'border-transparent text-gray-400 hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
