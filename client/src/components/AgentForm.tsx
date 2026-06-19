import { useState } from 'react';
import type { Agent, RoleTemplate } from '../types';

const EMOJI_CHOICES = ['🤖', '🧭', '🛠️', '🎨', '🔍', '⚙️', '📊', '📝', '📣', '🧠', '🚀', '🦾'];
const COLOR_CHOICES = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#06b6d4',
  '#ef4444',
];

interface Props {
  initial?: Agent | null;
  roles: RoleTemplate[];
  onCancel: () => void;
  onSubmit: (data: Partial<Agent>) => void;
}

export function AgentForm({ initial, roles, onCancel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🤖');
  const [color, setColor] = useState(initial?.color ?? '#6366f1');
  const [skills, setSkills] = useState(initial?.skills ?? '');

  const applyRole = (role: RoleTemplate) => {
    setTitle(role.title);
    setEmoji(role.emoji);
    setColor(role.color);
    setSkills(role.skills);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !title.trim()) return;
    onSubmit({ name: name.trim(), title: title.trim(), emoji, color, skills: skills.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#11162a] p-6 shadow-2xl"
      >
        <h2 className="mb-4 text-xl font-bold text-white">
          {initial ? 'Edit agent' : 'Hire a new agent'}
        </h2>

        {!initial && roles.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-gray-400">Quick start from a role</p>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <button
                  type="button"
                  key={role.title}
                  onClick={() => applyRole(role)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200 transition hover:border-white/30 hover:bg-white/10"
                >
                  {role.emoji} {role.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-gray-300">Name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ada"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-indigo-400"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-gray-300">Job title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Software Engineer"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-indigo-400"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-gray-300">Skills</span>
          <input
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. APIs, architecture, code review"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-indigo-400"
          />
        </label>

        <div className="mb-4 flex gap-6">
          <div>
            <span className="mb-1 block text-sm text-gray-300">Avatar</span>
            <div className="flex flex-wrap gap-1">
              {EMOJI_CHOICES.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`h-8 w-8 rounded-lg text-lg transition ${
                    emoji === e ? 'bg-white/20 ring-2 ring-indigo-400' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-sm text-gray-300">Color</span>
            <div className="flex flex-wrap gap-1">
              {COLOR_CHOICES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ background: c }}
                  className={`h-8 w-8 rounded-lg transition ${
                    color === c ? 'ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            {initial ? 'Save changes' : 'Add agent'}
          </button>
        </div>
      </form>
    </div>
  );
}
