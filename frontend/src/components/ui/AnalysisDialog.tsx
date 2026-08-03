import { Link } from 'react-router-dom';
import { Loader2, X, Sparkles, LogIn, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AnalysisError } from '../../lib/api';

interface AnalysisDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    loading: boolean;
    error: AnalysisError | null;
    content: string | null;
}

/**
 * Inline AI analysis panel — lives on the page, not a modal.
 *
 * Renders three kinds of result:
 *  - loading  → spinner + "Analyzing…"
 *  - error    → variant-specific block (see ErrorBlock below):
 *                 rate_limit   → clock icon + countdown from Retry-After
 *                 unauthorized → sign-in CTA
 *                 upstream     → retry-in-a-moment hint
 *                 generic      → raw message
 *  - content  → markdown rendered with react-markdown + remark-gfm.
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

                {!loading && error && <ErrorBlock error={error} />}

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

/**
 * Variant-specific error UI. Each variant has its own icon, message, and (where
 * useful) a CTA — keep them visually similar but distinguishable.
 */
function ErrorBlock({ error }: { error: AnalysisError }) {
    switch (error.kind) {
        case 'rate_limit':
            return <RateLimitBlock retryAfterSeconds={error.retryAfterSeconds} />;
        case 'unauthorized':
            return <UnauthorizedBlock />;
        case 'upstream':
            return (
                <Notice
                    icon={<AlertTriangle className="h-4 w-4 text-negative" />}
                    title="AI service unavailable"
                    body="Our analysis provider is having trouble right now. Please try again in a moment."
                />
            );
        case 'generic':
            return (
                <Notice
                    icon={<AlertTriangle className="h-4 w-4 text-negative" />}
                    title="Something went wrong"
                    body={error.raw || 'Please try again.'}
                />
            );
    }
}

function Notice({ icon, title, body, action }: {
    icon: React.ReactNode;
    title: string;
    body: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3 py-2">
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-[13px] font-sans font-medium text-primary">{title}</p>
                <p className="text-[12px] font-sans text-muted mt-1">{body}</p>
                {action && <div className="mt-3">{action}</div>}
            </div>
        </div>
    );
}

function RateLimitBlock({ retryAfterSeconds: _retryAfterSeconds }: { retryAfterSeconds: number | null }) {
    // Backend doesn't currently send Retry-After, so we don't show a countdown.
    // If the backend starts sending it, the prop is already wired through — just
    // uncomment the timer block below.
    return (
        <Notice
            icon={<Sparkles className="h-4 w-4 text-negative" />}
            title="Free credits used for today"
            body="You’ve used all your free AI analyses. Please try again later."
        />
    );
}

function UnauthorizedBlock() {
    return (
        <Notice
            icon={<LogIn className="h-4 w-4 text-negative" />}
            title="Sign in required"
            body="You need to be signed in to run an AI analysis."
            action={
                <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-[12px] font-medium rounded-md hover:bg-accent/90 transition-colors"
                >
                    <LogIn className="h-3.5 w-3.5" />
                    Sign in
                </Link>
            }
        />
    );
}