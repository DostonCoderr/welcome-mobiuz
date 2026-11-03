// Strapi "Blocks" maydonini matn / xavfsiz HTML ga aylantiradi.

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const safeUrl = (url?: string) =>
  url && /^(https?:|tel:|mailto:)/i.test(url) ? esc(url) : '#';

const inline = (children: any[] = []): string =>
  children
    .map((c: any) => {
      if (c.type === 'link') {
        return `<a href="${safeUrl(c.url)}" target="_blank" rel="noopener noreferrer">${inline(c.children)}</a>`;
      }
      let t = esc(c.text || '').replace(/\n/g, '<br/>');
      if (c.code) t = `<code>${t}</code>`;
      if (c.bold) t = `<strong>${t}</strong>`;
      if (c.italic) t = `<em>${t}</em>`;
      if (c.underline) t = `<u>${t}</u>`;
      if (c.strikethrough) t = `<s>${t}</s>`;
      return t;
    })
    .join('');

export const blocksToText = (blocks: any): string => {
  if (!blocks) return '';
  if (typeof blocks === 'string') return blocks;
  if (!Array.isArray(blocks)) return '';
  const walk = (nodes: any[]): string =>
    nodes
      .map((n: any) => (n.children ? walk(n.children) : n.text || ''))
      .join(' ');
  return walk(blocks).replace(/\s+/g, ' ').trim();
};

export const blocksToHtml = (blocks: any): string => {
  if (!blocks) return '';
  if (typeof blocks === 'string') {
    return `<p>${esc(blocks).replace(/\n/g, '<br/>')}</p>`;
  }
  if (!Array.isArray(blocks)) return '';

  return blocks
    .map((block: any) => {
      switch (block.type) {
        case 'heading': {
          const level = Math.min(Math.max(block.level || 2, 1), 4);
          return `<h${level}>${inline(block.children)}</h${level}>`;
        }
        case 'list': {
          const tag = block.format === 'ordered' ? 'ol' : 'ul';
          const items = (block.children || [])
            .map((li: any) => `<li>${inline(li.children)}</li>`)
            .join('');
          return `<${tag}>${items}</${tag}>`;
        }
        case 'quote':
          return `<blockquote>${inline(block.children)}</blockquote>`;
        case 'code':
          return `<pre><code>${inline(block.children)}</code></pre>`;
        default:
          return `<p>${inline(block.children)}</p>`;
      }
    })
    .join('');
};