import { Loader2, X, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AnalysisDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    loading: boolean;
    error: string | null;
    content: string | null;
}

/**
 * Inline AI analysis panel — lives on the page, not a modal.
 *
 * Why inline (not a dialog):
 *   - Avoids the floating-overlay feel that hides the page context.
 *   - The user can scroll back to the chart / info while reading the prose.
 *   - "Close" simply collapses the section; opening it again starts a fresh call.
 *
 * Renders the LLM prose returned by /analyze/{stock,index}.
 * - `loading` → spinner + "Analyzing…" message.
 * - `error`   → error text in red.
 * - `content` → markdown rendered with react-markdown + remark-gfm (tables, lists).
 *   Markdown elements are styled to match the existing palette/tokens.
 */
export function AnalysisDialog({
    open,
    onOpenChange,
    title,
    loading,
    error,
    content,
}: AnalysisDialogProps) {
    if (!open) return null;

    return (
        <section className="bg-surface rounded-xl border border-border-light p-5 shadow-ambient">
            <header className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    <h2 className="text-[9px] text-muted uppercase tracking-[0.12em] font-medium">
                        {title}
                    </h2>
                </div>
                <button
                    onClick={() => onOpenChange(false)}
                    aria-label="Close analysis"
                    className="text-muted hover:text-primary p-1 rounded-md hover:bg-neutral transition-colors"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </header>

            <div className="border-t border-border-light pt-4 analysis-prose">
                {loading && (
                    <div className="flex items-center justify-center gap-2 py-10 text-muted">
                        <Loader2 className="h-4 w-4 animate-spin text-accent" />
                        <span className="text-sm font-sans">Analyzing — this can take up to a minute…</span>
                    </div>
                )}

                {!loading && error && (
                    <div className="py-2 text-[13px] font-sans text-negative">
                        {error}
                    </div>
                )}

                {!loading && !error && content && (
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({ children }) => (
                                <p className="text-[13px] font-sans text-primary leading-relaxed mb-3 last:mb-0">
                                    {children}
                                </p>
                            ),
                            h1: ({ children }) => (
                                <h1 className="text-xl font-heading font-medium text-primary mt-4 mb-2 first:mt-0">
                                    {children}
                                </h1>
                            ),
                            h2: ({ children }) => (
                                <h2 className="text-base font-heading font-medium text-primary mt-4 mb-2 first:mt-0">
                                    {children}
                                </h2>
                            ),
                            h3: ({ children }) => (
                                <h3 className="text-sm font-heading font-medium text-primary mt-3 mb-2 first:mt-0">
                                    {children}
                                </h3>
                            ),
                            h4: ({ children }) => (
                                <h4 className="text-[13px] font-semibold text-primary mt-3 mb-1 first:mt-0">
                                    {children}
                                </h4>
                            ),
                            ul: ({ children }) => (
                                <ul className="list-disc pl-5 mb-3 space-y-1 text-[13px] font-sans text-primary">
                                    {children}
                                </ul>
                            ),
                            ol: ({ children }) => (
                                <ol className="list-decimal pl-5 mb-3 space-y-1 text-[13px] font-sans text-primary">
                                    {children}
                                </ol>
                            ),
                            li: ({ children }) => (
                                <li className="leading-relaxed">{children}</li>
                            ),
                            strong: ({ children }) => (
                                <strong className="font-semibold text-primary">{children}</strong>
                            ),
                            em: ({ children }) => (
                                <em className="italic text-primary">{children}</em>
                            ),
                            a: ({ children, href }) => (
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent underline underline-offset-2 hover:text-accent/80"
                                >
                                    {children}
                                </a>
                            ),
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-2 border-accent/40 pl-3 italic text-muted my-3">
                                    {children}
                                </blockquote>
                            ),
                            code: ({ children }) => (
                                <code className="bg-neutral px-1 py-0.5 rounded text-[12px] font-mono text-primary">
                                    {children}
                                </code>
                            ),
                            hr: () => (
                                <hr className="border-border-light my-4" />
                            ),
                            table: ({ children }) => (
                                <div className="overflow-x-auto my-3">
                                    <table className="w-full text-[12px] font-sans border-collapse">
                                        {children}
                                    </table>
                                </div>
                            ),
                            thead: ({ children }) => (
                                <thead className="border-b border-border-light">
                                    {children}
                                </thead>
                            ),
                            th: ({ children }) => (
                                <th className="text-left text-muted font-medium py-2 px-2 text-[10px] uppercase tracking-widest">
                                    {children}
                                </th>
                            ),
                            td: ({ children }) => (
                                <td className="py-2 px-2 border-b border-border-light text-primary">
                                    {children}
                                </td>
                            ),
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                )}
            </div>
        </section>
    );
}