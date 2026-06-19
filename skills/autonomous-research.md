# Skill: Autonomous LLM Research

Adapted from [karpathy/autoresearch](https://github.com/karpathy/autoresearch). Use this
skill when an agent (yourself or a Pingle "AI Research Agent") is asked to **improve an LLM
training setup autonomously** by running many small, comparable experiments.

The autoresearch README notes that its `program.md` is "essentially a super lightweight
skill." This file is the Pingle equivalent: a self-contained SOP an agent can follow.

## When to use

- The goal is to find a better model/training config under a fixed compute budget.
- You can run a real (small) training loop and read a single comparable metric.
- You are allowed to iterate unattended (e.g. overnight).

## The loop

1. **Hypothesis** — state one specific change you expect to lower the metric and why.
2. **One small edit** — change a single thing in `train.py` (architecture, optimizer,
   hyperparameters, batch size). Only `train.py` is edited; do not touch `prepare.py`.
3. **Train** — run a fixed **5-minute** wall-clock budget (excludes startup/compile) so every
   run is directly comparable regardless of platform.
4. **Measure** — record **`val_bpb`** (validation bits per byte). Lower is better; it is
   vocab-size independent, so architecture changes compare fairly.
5. **Keep or discard** — if `val_bpb` improved, keep the change; otherwise revert.
6. **Log + repeat** — append the experiment (hypothesis, diff summary, metric, decision) to a
   running log. Expect ~12 experiments/hour, ~100 overnight.

## Setup (reference)

Requires a single NVIDIA GPU (tested on H100), Python 3.10+, and [uv](https://docs.astral.sh/uv/).

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh   # install uv (if missing)
uv sync                                           # dependencies
uv run prepare.py                                 # one-time: data + BPE tokenizer (~2 min)
uv run train.py                                   # one ~5-min experiment, prints val_bpb
```

For small/CPU/MacBook platforms (no H100), see the autoresearch README "Platform support"
section and notable forks (e.g. MLX/MPS/AMD/Windows) — lower `DEPTH`, `MAX_SEQ_LEN`,
`vocab_size`, and `TOTAL_BATCH_SIZE`, and prefer the TinyStories dataset.

## Discipline

- **One change per experiment** so diffs are reviewable and the metric is attributable.
- **Never modify the eval/data prep** (`prepare.py`) — that would break comparability.
- **Always log**, including discarded runs; the log is the deliverable.

> Note: This repository (Pingle) does not ship the training code or a GPU. This skill is the
> reusable methodology; an agent should clone/point at an autoresearch-style repo to execute it.
