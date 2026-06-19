import { useState } from 'react';
import type { Agent, RoleTemplate } from '../types';
import { AgentForm } from './AgentForm';

interface Props {
  agents: Agent[];
  roles: RoleTemplate[];
  onCreate: (data: Partial<Agent>) => void;
  onUpdate: (id: string, data: Partial<Agent>) => void;
  onDelete: (id: string) => void;
}

export function AgentsView({ agents, roles, onCreate, onUpdate, onDelete }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (agent: Agent) => {
    setEditing(agent);
    setFormOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="text-sm text-gray-400">Build your team — each agent has a job title and skills.</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
        >
          + Hire agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-12 text-center">
          <div className="mb-3 text-4xl">🪿</div>
          <p className="text-gray-300">No agents yet.</p>
          <p className="text-sm text-gray-500">Hire your first agent to start building a team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/25"
            >
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: agent.color }}
              />
              <div className="flex items-start gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ background: `${agent.color}33` }}
                >
                  {agent.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-semibold text-white">{agent.name}</h3>
                  <p className="truncate text-sm" style={{ color: agent.color }}>
                    {agent.title}
                  </p>
                </div>
              </div>
              {agent.skills && (
                <p className="mt-3 text-xs leading-relaxed text-gray-400">{agent.skills}</p>
              )}
              <div className="mt-4 flex gap-2 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => openEdit(agent)}
                  className="rounded-md bg-white/10 px-3 py-1 text-xs text-gray-200 hover:bg-white/20"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(agent.id)}
                  className="rounded-md bg-red-500/20 px-3 py-1 text-xs text-red-300 hover:bg-red-500/30"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <AgentForm
          initial={editing}
          roles={roles}
          onCancel={() => setFormOpen(false)}
          onSubmit={(data) => {
            if (editing) onUpdate(editing.id, data);
            else onCreate(data);
            setFormOpen(false);
          }}
        />
      )}
    </div>
  );
}
