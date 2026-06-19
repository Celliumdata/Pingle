export interface RoleTemplate {
  title: string;
  emoji: string;
  color: string;
  skills: string;
}

// Quick-add presets surfaced in the UI. `color` values are tailwind-friendly hex tokens.
export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    title: 'Product Manager',
    emoji: '🧭',
    color: '#8b5cf6',
    skills: 'Roadmapping, user stories, prioritization, scope definition',
  },
  {
    title: 'Software Engineer',
    emoji: '🛠️',
    color: '#3b82f6',
    skills: 'Architecture, APIs, implementation, code review',
  },
  {
    title: 'Product Designer',
    emoji: '🎨',
    color: '#ec4899',
    skills: 'UX flows, wireframes, visual design, design systems',
  },
  {
    title: 'QA Engineer',
    emoji: '🔍',
    color: '#10b981',
    skills: 'Test plans, edge cases, regression, automation',
  },
  {
    title: 'DevOps Engineer',
    emoji: '⚙️',
    color: '#f59e0b',
    skills: 'CI/CD, infrastructure, observability, releases',
  },
  {
    title: 'Data Scientist',
    emoji: '📊',
    color: '#06b6d4',
    skills: 'Analysis, metrics, experimentation, modeling',
  },
  {
    title: 'AI Research Agent',
    emoji: '🔬',
    color: '#14b8a6',
    skills:
      'Autonomous LLM research (karpathy/autoresearch): edits train.py, runs fixed 5-min nanochat training experiments, tracks val_bpb (lower is better), keeps/discards changes, iterates ~12 experiments/hour',
  },
  {
    title: 'Technical Writer',
    emoji: '📝',
    color: '#a855f7',
    skills: 'Docs, guides, API references, release notes',
  },
  {
    title: 'Growth Marketer',
    emoji: '📣',
    color: '#ef4444',
    skills: 'Positioning, launch, copy, channels',
  },
];
