import Link from "next/link";
import { Fragment, type ReactNode } from "react";

// Minimal, safe Markdown renderer for admin-written pages: headings, paragraphs, lists,
// **bold**, *italic* and [links](/path). It builds React elements (never raw HTML),
// so page content can't inject scripts.

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${i++}`;
    if (m[2]) out.push(<strong key={k}>{m[2]}</strong>);
    else if (m[3]) out.push(<em key={k}>{m[3]}</em>);
    else if (m[4] && m[5]) {
      const href = m[5];
      if (href.startsWith("/")) out.push(<Link key={k} href={href}>{m[4]}</Link>);
      else if (/^(https?:|mailto:|tel:)/.test(href)) out.push(<a key={k} href={href} rel="noopener noreferrer" target="_blank">{m[4]}</a>);
      else out.push(m[4]);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "");
        if (lines.length === 0) return null;
        const k = `b${bi}`;
        const first = lines[0]!;
        if (/^###\s/.test(first)) return <h3 key={k}>{inline(first.replace(/^###\s+/, ""), k)}</h3>;
        if (/^##\s/.test(first)) return <h2 key={k}>{inline(first.replace(/^##\s+/, ""), k)}</h2>;
        if (/^#\s/.test(first)) return <h2 key={k}>{inline(first.replace(/^#\s+/, ""), k)}</h2>;
        if (lines.every((l) => /^\s*[-*]\s/.test(l))) {
          return (
            <ul key={k}>
              {lines.map((l, i) => (
                <li key={i}>{inline(l.replace(/^\s*[-*]\s+/, ""), `${k}-${i}`)}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\s*\d+[.)]\s/.test(l))) {
          return (
            <ol key={k}>
              {lines.map((l, i) => (
                <li key={i}>{inline(l.replace(/^\s*\d+[.)]\s+/, ""), `${k}-${i}`)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={k}>
            {lines.map((l, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {inline(l, `${k}-${i}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}
