import { Marked } from 'marked';

/**
 * Markdown-Renderer fuer Skill-Bodies.
 *
 * Der Input stammt ausschliesslich aus diesem Repo und ist damit vertrauenswuerdig;
 * trotzdem bleibt `mangle`/`headerIds` aus, damit die Ausgabe stabil und die
 * Anker vorhersagbar bleiben.
 */
const marked = new Marked({
  gfm: true,
  breaks: false,
});

export function renderMarkdown(source: string): string {
  return marked.parse(source, { async: false }) as string;
}
