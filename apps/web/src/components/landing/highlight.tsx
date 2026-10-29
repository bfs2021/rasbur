import type { ReactNode } from 'react';

const TOKEN_PATTERN =
    /(?<key>"[^"]*"(?=\s*:))|(?<str>'[^']*'|"[^"]*")|(?<kw>\b(?:import|from|const|class|extends|return|new|readonly)\b)|(?<fn>\b[A-Za-z_]+(?=\())/g;

export function highlight(code: string) {
    const parts: ReactNode[] = [];
    let last = 0;
    for (const match of code.matchAll(TOKEN_PATTERN)) {
        const start = match.index ?? 0;
        if (start > last) parts.push(code.slice(last, start));
        const kind = match.groups?.key
            ? 'tk-key'
            : match.groups?.str
              ? 'tk-str'
              : match.groups?.kw
                ? 'tk-kw'
                : 'tk-fn';
        parts.push(
            <span key={start} className={kind}>
                {match[0]}
            </span>
        );
        last = start + match[0].length;
    }
    parts.push(code.slice(last));
    return parts;
}
