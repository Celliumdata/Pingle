import React from 'react';

// Minimal markdown renderer: supports **bold**, `code`, ``` fenced blocks ```,
// headings (#, ##), and bullet lines. Enough for agent messages + artifacts.
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(
        <code
          key={`${keyPrefix}-c-${i}`}
          className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[0.85em] text-cyan-300"
        >
          {token.slice(1, -1)}
        </code>,
      );
    }
    lastIndex = regex.lastIndex;
    i += 1;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function MarkdownLite({ content }: { content: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = content.split('\n');
  let inFence = false;
  let fenceBuffer: string[] = [];
  let key = 0;

  const flushFence = () => {
    blocks.push(
      <pre
        key={`fence-${key++}`}
        className="my-2 overflow-x-auto rounded-lg bg-black/50 p-3 font-mono text-xs text-emerald-300"
      >
        {fenceBuffer.join('\n')}
      </pre>,
    );
    fenceBuffer = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inFence) {
        flushFence();
        inFence = false;
      } else {
        inFence = true;
      }
      continue;
    }
    if (inFence) {
      fenceBuffer.push(line);
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push(
        <h3 key={`h-${key++}`} className="mt-3 mb-1 text-sm font-bold uppercase tracking-wide text-indigo-300">
          {renderInline(line.slice(3), `h${key}`)}
        </h3>,
      );
    } else if (line.startsWith('# ')) {
      blocks.push(
        <h2 key={`h-${key++}`} className="mt-2 mb-1 text-lg font-bold text-white">
          {renderInline(line.slice(2), `h${key}`)}
        </h2>,
      );
    } else if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
      blocks.push(
        <div key={`li-${key++}`} className="ml-1 flex gap-2 text-sm leading-relaxed">
          <span className="text-indigo-400">▹</span>
          <span>{renderInline(line.replace(/^\s*[•-]\s?/, ''), `li${key}`)}</span>
        </div>,
      );
    } else if (line.trim() === '') {
      blocks.push(<div key={`sp-${key++}`} className="h-1.5" />);
    } else {
      blocks.push(
        <p key={`p-${key++}`} className="text-sm leading-relaxed">
          {renderInline(line, `p${key}`)}
        </p>,
      );
    }
  }
  if (inFence && fenceBuffer.length) flushFence();

  return <div>{blocks}</div>;
}
