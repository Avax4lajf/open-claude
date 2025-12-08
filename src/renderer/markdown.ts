export interface Citation {
  url?: string;
  title?: string;
  start_index?: number;
  end_index?: number;
}

export function parseMarkdown(t: string, citations?: Citation[]): string {
  if (!t) return '';

  let text = t;

  // First apply citations if present (before escaping)
  if (citations && citations.length > 0) {
    // Sort citations by start_index descending to avoid index shifting
    const sortedCitations = [...citations].sort((a, b) => (b.start_index || 0) - (a.start_index || 0));
    for (const cit of sortedCitations) {
      if (cit.start_index !== undefined && cit.end_index !== undefined) {
        const before = text.slice(0, cit.start_index);
        const cited = text.slice(cit.start_index, cit.end_index);
        const after = text.slice(cit.end_index);
        const citNumber = citations.indexOf(cit) + 1;
        text = before + `[CITE_START:${cit.url || ''}:${cit.title || ''}]${cited}[CITE_END:${citNumber}]` + after;
      }
    }
  }

  // Escape HTML
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Process citation markers after escaping
  text = text
    .replace(/\[CITE_START:([^:]*):([^\]]*)\]/g, '<a class="citation-link" href="$1" target="_blank" title="$2">')
    .replace(/\[CITE_END:(\d+)\]/g, '</a><sup class="citation-num">[$1]</sup>');

  // Code blocks first (preserve newlines inside)
  text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _l, c) => `<pre><code>${c.trim()}</code></pre>`);

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  text = text
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Bold and italic
  text = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Blockquotes
  text = text.replace(/^&gt; (.*$)/gm, '<blockquote>$1</blockquote>');

  // List items - wrap consecutive items in <ul>
  text = text.replace(/^[\*\-] (.*$)/gm, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match.replace(/\n/g, '')}</ul>`);

  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Horizontal rules
  text = text.replace(/^---$/gm, '<hr>');

  // Paragraphs: double newlines become paragraph breaks
  // Single newlines within text become spaces (more natural reading)
  text = text.replace(/\n\n+/g, '</p><p>');
  text = text.replace(/\n/g, ' ');
  text = '<p>' + text + '</p>';

  // Clean up empty paragraphs and paragraphs around block elements
  text = text.replace(/<p>\s*<\/p>/g, '');
  text = text.replace(/<p>\s*(<(pre|ul|h[1-6]|blockquote|hr)[^>]*>)/g, '$1');
  text = text.replace(/(<\/(pre|ul|h[1-6]|blockquote|hr)>)\s*<\/p>/g, '$1');
  text = text.replace(/<\/p>\s*<p>/g, '</p><p>');

  return text;
}
