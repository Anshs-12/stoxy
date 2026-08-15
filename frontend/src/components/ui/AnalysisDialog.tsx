import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  LogIn,
  AlertTriangle,
  RefreshCw,
  Clock,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AnalysisError } from '../../lib/api';
import { LoadingState } from './LoadingState';

interface AnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Hides the entire panel (close-X on the header). */
  onDismiss?: () => void;
  title: string;
  loading: boolean;
  error: AnalysisError | null;
  content: string | null;
  onRetry?: () => void;
  generatedAt?: Date | null;
}

/**
 * Inline AI analysis panel — collapsible header.
 *
 *  - Header chevron + title + timestamp. Click header to expand/collapse content.
 *  - X button on the header dismisses the whole panel (calls onDismiss).
 *  - States: loading (dot loader), error (variant-aware soft notice),
 *            content (markdown rendered normally).
 */
export function AnalysisDialog({
  open,
  onOpenChange,
  onDismiss,
  title,
  loading,
  error,
  content,
  onRetry,
  generatedAt,
}: AnalysisDialogProps) {
  const hasPayload = loading || !!error || !!content;
  const ChevronIcon = open ? ChevronUp : ChevronDown;

  return (
    <section className="bg-surface border border-border-light hover:border-accent rounded-none transition-colors">
      <header
        className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none hover:bg-neutral transition-colors"
        onClick={() => onOpenChange(!open)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenChange(!open);
          }
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-3.5 w-3.5 text-accent flex-shrink-0" />
          <h2 className="text-[9px] text-muted uppercase tracking-[0.12em] font-medium truncate">
            {title}
          </h2>
          {hasPayload && !loading && (
            <span className="text-[9px] font-mono text-muted uppercase tracking-widest flex items-center gap-1 flex-shrink-0">
              <span className="opacity-50">·</span>
              <Clock className="h-2.5 w-2.5" />
              {generatedAt ? formatTimestamp(generatedAt) : 'just now'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasPayload && (
            <span className="text-[9px] font-mono text-muted uppercase tracking-widest">
              {open ? 'Hide' : 'Show'}
            </span>
          )}
          <ChevronIcon
            className={`h-3.5 w-3.5 text-muted transition-transform ${open ? '' : '-rotate-0'}`}
          />
          {onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              aria-label="Close analysis"
              className="ml-1 p-0.5 text-muted hover:text-primary transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      {open && hasPayload && (
        <div className="border-t border-border-light px-5 py-4 analysis-prose">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingState variant="Drive" />
            </div>
          )}

          {!loading && error && <ErrorBlock error={error} onRetry={onRetry} />}

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
      )}
    </section>
  );
}

function formatTimestamp(d: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  });
}

/**
 * Variant-specific error UI. Each variant has its own icon, message, and (where
 * useful) a CTA — soft tint, not harsh red, so it feels like an inline notice.
 */
function ErrorBlock({ error, onRetry }: { error: AnalysisError; onRetry?: () => void }) {
  switch (error.kind) {
    case 'rate_limit':
      return <RateLimitBlock retryAfterSeconds={error.retryAfterSeconds} />;
    case 'unauthorized':
      return <UnauthorizedBlock />;
    case 'upstream':
      return (
        <Notice
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          title="AI service unavailable"
          body="Our analysis provider is having trouble right now. Please try again in a moment."
          action={
            onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border-light hover:border-accent text-[11px] font-mono text-primary transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Try again
              </button>
            )
          }
        />
      );
    case 'generic':
      return (
        <Notice
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          title="Something went wrong"
          body={error.raw || 'Please try again.'}
          action={
            onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border-light hover:border-accent text-[11px] font-mono text-primary transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Try again
              </button>
            )
          }
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
    <div className="flex items-start gap-3 py-3 px-4 bg-amber-500/8 border border-amber-500/20 rounded-none">
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-sans font-medium text-primary">{title}</p>
        <p className="text-[12px] font-sans text-muted mt-1">{body}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

function RateLimitBlock({ retryAfterSeconds: _retryAfterSeconds }: { retryAfterSeconds: number | null }) {
  return (
    <Notice
      icon={<Sparkles className="h-4 w-4 text-amber-500" />}
      title="Free credits used for today"
      body="You've used all your free AI analyses. Please try again later."
    />
  );
}

function UnauthorizedBlock() {
  return (
    <Notice
      icon={<LogIn className="h-4 w-4 text-amber-500" />}
      title="Sign in required"
      body="You need to be signed in to run an AI analysis."
      action={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-[11px] font-mono hover:bg-accent/90 transition-colors"
        >
          <LogIn className="h-3 w-3" />
          Sign in
        </Link>
      }
    />
  );
}