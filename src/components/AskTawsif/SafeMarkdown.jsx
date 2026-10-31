// Bot text as React elements, never as HTML: React escapes every string, so a reply (or anything a visitor
// talked the model into writing) can't inject a script. A small markdown subset only: paragraphs, bullet and
// numbered lists, headings (shown bold), code blocks, simple tables, `code`, **bold**, *italic*, and links.
// A link is kept ONLY if it is https://; anything else ([x](javascript:...), http://, data:) stays plain text.
import { safeHttpsUrl } from "./links";

export function ExternalLink({ href, children, className }) {
  const safe = safeHttpsUrl(href);
  if (!safe) return children;
  return (
    <a href={safe} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

// `code` | **bold** | [text](https://...) | a bare https:// link (trailing punctuation left out) | *italic*
const INLINE =
  /(`[^`\n]+`)|(\*\*[^*\n]+?\*\*)|(\[[^\]\n]+\]\(https:\/\/[^\s)]+\))|(https:\/\/[^\s<>()[\]]*[^\s<>()[\].,;:!?'"*])|(\*[^*\s][^*\n]*?\*)/g;

function inline(text, key = "i", depth = 0) {
  const out = [];
  let last = 0;
  let n = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const [token, code, bold, link, bare, italic] = match;
    const k = `${key}-${n++}`;
    if (code) out.push(<code key={k}>{code.slice(1, -1)}</code>);
    else if (bold) out.push(<strong key={k}>{depth < 2 ? inline(bold.slice(2, -2), k, depth + 1) : bold.slice(2, -2)}</strong>);
    else if (link) {
      const split = link.indexOf("](");
      out.push(
        <ExternalLink key={k} href={link.slice(split + 2, -1)}>
          {link.slice(1, split)}
        </ExternalLink>,
      );
    } else if (bare) out.push(<ExternalLink key={k} href={bare}>{bare}</ExternalLink>);
    else if (italic) out.push(<em key={k}>{italic.slice(1, -1)}</em>);
    else out.push(token);
    last = match.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const HEADING = /^\s*#{1,6}\s+(.*)$/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_RULE = /^\s*\|?[\s:|-]+\|?\s*$/;

const cells = (row) => row.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());

function blocks(text) {
  const lines = text.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
    } else if (line.trim().startsWith("```")) {
      const code = [];
      for (i++; i < lines.length && !lines[i].trim().startsWith("```"); i++) code.push(lines[i]);
      i++;
      out.push({ kind: "code", text: code.join("\n") });
    } else if (TABLE_ROW.test(line) && TABLE_RULE.test(lines[i + 1] ?? "") && (lines[i + 1] ?? "").includes("-")) {
      const head = cells(line);
      const rows = [];
      for (i += 2; i < lines.length && TABLE_ROW.test(lines[i]); i++) rows.push(cells(lines[i]));
      out.push({ kind: "table", head, rows });
    } else if (BULLET.test(line) || NUMBERED.test(line)) {
      const pattern = BULLET.test(line) ? BULLET : NUMBERED;
      const items = [];
      for (; i < lines.length && pattern.test(lines[i]); i++) items.push(lines[i].match(pattern)[1]);
      out.push({ kind: pattern === BULLET ? "ul" : "ol", items });
    } else if (HEADING.test(line)) {
      out.push({ kind: "heading", text: line.match(HEADING)[1] });
      i++;
    } else {
      const para = [];
      for (; i < lines.length && lines[i].trim() && !BULLET.test(lines[i]) && !NUMBERED.test(lines[i])
        && !HEADING.test(lines[i]) && !lines[i].trim().startsWith("```") && !TABLE_ROW.test(lines[i]); i++) {
        para.push(lines[i]);
      }
      if (!para.length) para.push(lines[i++]);       // a lone "|" line that isn't a table
      out.push({ kind: "p", text: para.join("\n") });
    }
  }
  return out;
}

export default function SafeMarkdown({ text }) {
  return blocks(String(text ?? "")).map((block, b) => {
    const key = `b${b}`;
    switch (block.kind) {
      case "code":
        return <pre key={key}><code>{block.text}</code></pre>;
      case "table":
        return (
          <div key={key} className="ask-md__table">
            <table>
              <thead>
                <tr>{block.head.map((cell, c) => <th key={c}>{inline(cell, `${key}h${c}`)}</th>)}</tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r}>{row.map((cell, c) => <td key={c}>{inline(cell, `${key}r${r}c${c}`)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "ul":
      case "ol": {
        const List = block.kind;
        return <List key={key}>{block.items.map((item, n) => <li key={n}>{inline(item, `${key}-${n}`)}</li>)}</List>;
      }
      case "heading":
        return <p key={key}><strong>{inline(block.text, key)}</strong></p>;
      default:
        return <p key={key}>{inline(block.text, key)}</p>;
    }
  });
}
