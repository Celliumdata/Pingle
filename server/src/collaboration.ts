import { randomUUID } from 'node:crypto';
import type { Agent, Message, Project } from './store.js';

type RoleKind =
  | 'product'
  | 'engineer'
  | 'design'
  | 'qa'
  | 'devops'
  | 'data'
  | 'writer'
  | 'marketing'
  | 'research'
  | 'autoresearch'
  | 'generic';

function detectRole(title: string): RoleKind {
  const t = title.toLowerCase();
  if (/(product manager|product owner|\bpm\b|program)/.test(t)) return 'product';
  // Autonomous ML/LLM research (karpathy/autoresearch). Checked before the
  // generic engineer/data buckets so "AI Research Agent" maps here.
  if (/(research agent|ai research|ml research|llm research|autoresearch|auto research|research engineer)/.test(t)) {
    return 'autoresearch';
  }
  if (/(engineer|developer|programmer|swe|architect|backend|frontend|full)/.test(t)) return 'engineer';
  if (/(design|ux|ui|creative)/.test(t)) return 'design';
  if (/(qa|quality|test|sdet)/.test(t)) return 'qa';
  if (/(devops|sre|platform|infra|release|ops)/.test(t)) return 'devops';
  if (/(data|analyst|scientist|ml|ai researcher)/.test(t)) return 'data';
  if (/(writer|docs|documentation|content)/.test(t)) return 'writer';
  if (/(market|growth|sales|brand)/.test(t)) return 'marketing';
  if (/(research|user research|ux research)/.test(t)) return 'research';
  return 'generic';
}

function contributionFor(role: RoleKind, goal: string, agent: Agent): string {
  const g = goal.trim() || 'the project';
  switch (role) {
    case 'product':
      return [
        `Here's how I'd frame **${g}**. Target outcome and the "definition of done":`,
        `• Problem: capture the core user pain that ${g} solves.`,
        `• Milestones: 1) discovery, 2) MVP build, 3) polish & launch.`,
        `• Success metrics: activation, time-to-value, and weekly retention.`,
        `I'll keep us scoped to the smallest thing that delivers real value.`,
      ].join('\n');
    case 'engineer':
      return [
        `On the build side for **${g}**, here's a pragmatic architecture:`,
        '```',
        '[client] React UI  ──▶  [api] REST service  ──▶  [store] persistence',
        '```',
        `• Start with a thin vertical slice end-to-end, then iterate.`,
        `• Keep modules small with clear interfaces so we can parallelize.`,
        `I can stand up the API + data model first so others can integrate.`,
      ].join('\n');
    case 'design':
      return [
        `For **${g}**, the experience should feel effortless. Proposed flow:`,
        `• Entry → primary action in one tap, with sensible defaults.`,
        `• A calm, high-contrast layout; progressive disclosure for advanced bits.`,
        `• Reusable components (cards, lists, modals) for a consistent system.`,
        `I'll deliver wireframes and a tokens palette the engineers can reuse.`,
      ].join('\n');
    case 'qa':
      return [
        `Quality plan for **${g}** — the cases we must not ship without:`,
        `• Happy path works end-to-end.`,
        `• Empty states, validation errors, and duplicate input handled.`,
        `• Data persists across reloads; no crashes on rapid actions.`,
        `I'll write a checklist and smoke tests we run before each milestone.`,
      ].join('\n');
    case 'devops':
      return [
        `To ship **${g}** reliably:`,
        `• One-command local dev; reproducible install.`,
        `• Lint + typecheck + build gates before merge.`,
        `• Lightweight logging so we can see what's happening in real time.`,
        `I'll wire the scripts so everyone runs the same setup.`,
      ].join('\n');
    case 'data':
      return [
        `For **${g}**, here's what we should measure from day one:`,
        `• Instrument the key action and funnel drop-off.`,
        `• Define a north-star metric and 2–3 guardrails.`,
        `• Add a simple dashboard so decisions are evidence-based.`,
        `I'll specify the event schema the engineers can emit.`,
      ].join('\n');
    case 'writer':
      return [
        `Docs plan for **${g}** so it's usable by anyone:`,
        `• A 5-minute quickstart with copy-paste commands.`,
        `• Concept overview + reference for each feature.`,
        `• Release notes per milestone.`,
        `I'll draft the README and inline help text.`,
      ].join('\n');
    case 'marketing':
      return [
        `Go-to-market angle for **${g}**:`,
        `• One-line positioning: who it's for and why it's better.`,
        `• A launch checklist (demo, screenshots, announcement).`,
        `• Clear CTA that maps to the product's first action.`,
        `I'll draft the announcement copy once the MVP is demoable.`,
      ].join('\n');
    case 'research':
      return [
        `Research notes for **${g}**:`,
        `• 3 assumptions we should validate before building too much.`,
        `• A quick script for 5 user conversations.`,
        `• Synthesis into "must-have" vs "nice-to-have".`,
        `I'll share findings to keep us building the right thing.`,
      ].join('\n');
    case 'autoresearch':
      return [
        `For **${g}**, I'll run an autonomous research loop (inspired by karpathy/autoresearch):`,
        `• Form a hypothesis, then make **one** small change to \`train.py\` — architecture, optimizer, or hyperparameters.`,
        `• Train for a fixed **5-minute** budget and measure **val_bpb** (validation bits per byte — lower is better).`,
        `• Keep the change if the metric improves, otherwise discard and revert.`,
        `• Repeat (~12 experiments/hour, ~100 overnight) and log every run so progress is reproducible.`,
        '```',
        'uv run prepare.py   # one-time: data + tokenizer',
        'uv run train.py     # one 5-min experiment, reports val_bpb',
        '```',
        `I'll report the best config and the experiment log so we keep the winning model.`,
      ].join('\n');
    default:
      return [
        `As ${agent.title}, here's how I'll contribute to **${g}**:`,
        `• Bring my expertise to the relevant milestone.`,
        `• Coordinate with the team where our work overlaps.`,
        `• Flag risks early and unblock fast.`,
      ].join('\n');
  }
}

function makeMessage(
  agent: Agent | null,
  content: string,
  overrides?: Partial<Message>,
): Message {
  return {
    id: randomUUID(),
    agentId: agent?.id ?? null,
    agentName: agent?.name ?? 'Pingle Orchestrator',
    title: agent?.title ?? 'Coordinator',
    emoji: agent?.emoji ?? '🪿',
    color: agent?.color ?? '#6366f1',
    content,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export interface CollaborationResult {
  messages: Message[];
  artifact: string;
}

export function runCollaboration(project: Project, agents: Agent[]): CollaborationResult {
  const goal = project.goal.trim() || project.name;
  const messages: Message[] = [];

  messages.push(
    makeMessage(
      null,
      `Kicking off **${project.name}**. Goal: ${goal}\n\nTeam assembled: ${
        agents.map((a) => `${a.emoji} ${a.name} (${a.title})`).join(', ') || 'no agents yet'
      }. Let's each take our part.`,
    ),
  );

  for (const agent of agents) {
    const role = detectRole(agent.title);
    messages.push(makeMessage(agent, contributionFor(role, goal, agent)));
  }

  const artifact = buildArtifact(project, agents, goal);

  messages.push(
    makeMessage(
      null,
      `Synthesis complete ✅ — I combined everyone's input into a shared build plan and deliverable. See the **Deliverable** tab for the compiled artifact.`,
    ),
  );

  return { messages, artifact };
}

function buildArtifact(project: Project, agents: Agent[], goal: string): string {
  const lines: string[] = [];
  lines.push(`# ${project.name} — Build Plan`);
  lines.push('');
  lines.push(`**Goal:** ${goal}`);
  lines.push('');
  lines.push(`**Team:** ${agents.map((a) => `${a.emoji} ${a.name} — ${a.title}`).join(' · ') || 'none'}`);
  lines.push('');
  lines.push('## Milestones');
  lines.push('1. **Discovery** — validate the problem and define scope.');
  lines.push('2. **MVP build** — thin end-to-end slice that delivers core value.');
  lines.push('3. **Polish & launch** — quality pass, docs, and announcement.');
  lines.push('');
  lines.push('## Responsibilities');
  if (agents.length === 0) {
    lines.push('- _Assign agents to populate responsibilities._');
  } else {
    for (const agent of agents) {
      const role = detectRole(agent.title);
      lines.push(`- **${agent.name}** (${agent.title}): owns the ${roleArea(role)} workstream.`);
    }
  }
  lines.push('');
  lines.push('## Next action');
  lines.push(`Ship milestone 1 for "${goal}" and review together.`);
  lines.push('');
  lines.push(`_Generated by Pingle on ${new Date().toLocaleString()}._`);
  return lines.join('\n');
}

function roleArea(role: RoleKind): string {
  const map: Record<RoleKind, string> = {
    product: 'scope & roadmap',
    engineer: 'architecture & implementation',
    design: 'UX & visual design',
    qa: 'quality & testing',
    devops: 'tooling & releases',
    data: 'metrics & analysis',
    writer: 'documentation',
    marketing: 'launch & positioning',
    research: 'user research',
    autoresearch: 'autonomous experimentation',
    generic: 'general delivery',
  };
  return map[role];
}
