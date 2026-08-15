import { useState, useRef, useEffect, cloneElement, isValidElement } from 'react';

/* ─────────────────────────────────────────────────────────
 * COMING SOON — soft new-feature placeholder.
 *
 * Dashed border box with a small accent "Coming Soon" badge
 * and a one-line message. Used for features that haven't
 * shipped yet but should still be visible so users know
 * they're planned.
 * ───────────────────────────────────────────────────────── */

export interface ComingSoonProps {
  icon: React.ReactNode;
  title: string;
  message?: string;
  className?: string;
  /**
   * `card` — dashed-border card with the "Coming Soon" badge in the corner.
   * `bare` — no background, no border. Just the message + badge centred.
   *          Used inside bento grids where the surrounding card surface is
   *          already implied by the row container.
   * `bare-with-card` — like `bare` (no border around the text) but the DIV
   *          itself uses the standard card background. Caller supplies
   *          `bg-surface border border-border-light` on `className`.
   */
  variant?: 'card' | 'bare' | 'bare-with-card';
}

export function ComingSoon({
  icon,
  title,
  message = 'We are working on this. Stay tuned.',
  className = '',
  variant = 'card',
}: ComingSoonProps) {
  const wrapperClass =
    variant === 'bare'
      ? `relative flex flex-col items-center justify-center text-center py-10 ${className}`
      : variant === 'bare-with-card'
        // Card surface identical to the rest of the page (Index Info, About,
        // Day's Range, etc): bg-surface + 1px border. Text inside stays bare
        // — no border around the centred message or its badge.
        ? `bg-surface border border-border-light rounded-none h-full flex flex-col items-center justify-center text-center py-12 px-5 ${className}`
        : `bg-surface border border-dashed border-border-light p-5 rounded-none h-full flex flex-col ${className}`;

  return (
    <div className={wrapperClass}>
      {variant === 'card' && (
        <div className="flex items-center justify-between mb-3 w-full">
          <div className="flex items-center gap-2">
            <span className="text-muted opacity-70">{icon}</span>
            <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium">
              {title}
            </h3>
          </div>
          <span className="text-[9px] font-mono text-accent uppercase tracking-widest px-1.5 py-0.5 rounded-none">
            Coming Soon
          </span>
        </div>
      )}
      <div className="flex-1 flex items-center justify-center text-center">
        <div className="space-y-3 max-w-[36ch]">
          {variant !== 'card' && (
            <div className="flex items-center justify-center gap-2 text-muted">
              <span className="opacity-70">{icon}</span>
              <h3 className="text-[10px] text-muted uppercase tracking-widest font-medium">
                {title}
              </h3>
            </div>
          )}
          <p className="text-[13px] text-muted font-sans leading-relaxed">
            {message}
          </p>
          {variant !== 'card' && (
            <span className="inline-flex items-center text-[9px] font-mono text-accent uppercase tracking-widest px-1.5 py-0.5 rounded-none">
              Coming Soon
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
 * TOOLTIP — hover-revealed note attached to a trigger.
 *
 * No portal — uses CSS positioning relative to the trigger.
 * 120ms enter / 80ms leave delays so quick mouseovers don't
 * flicker. Renders an arrow pointing back at the trigger.
 * ───────────────────────────────────────────────────────── */

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom';
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  className = '',
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (enterTimer.current) clearTimeout(enterTimer.current);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  const onEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    enterTimer.current = setTimeout(() => setOpen(true), 120);
  };
  const onLeave = () => {
    if (enterTimer.current) clearTimeout(enterTimer.current);
    leaveTimer.current = setTimeout(() => setOpen(false), 80);
  };

  const sideClass = side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';
  const alignClass =
    align === 'left'
      ? 'left-0'
      : align === 'right'
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2';

  const arrowSide =
    side === 'top'
      ? 'bottom-[-4px] border-t-0 border-l-0'
      : 'top-[-4px] border-b-0 border-r-0';
  const arrowAlign =
    align === 'left'
      ? 'left-4'
      : align === 'right'
        ? 'right-4'
        : 'left-1/2 -translate-x-1/2';

  // Attach hover handlers to whatever element the caller passes in.
  // If they pass a non-element (e.g. raw text), wrap in a span.
  const triggerProps = {
    onMouseEnter: onEnter,
    onMouseLeave: onLeave,
    onFocus: onEnter,
    onBlur: onLeave,
  };
  const trigger = isValidElement(children)
    ? cloneElement(children, triggerProps)
    : <span {...triggerProps}>{children}</span>;

  return (
    <span className={`relative inline-flex ${className}`}>
      {trigger}
      {open && (
        <span
          role="tooltip"
          className={`absolute z-50 ${sideClass} ${alignClass} w-max max-w-[280px] pointer-events-none`}
        >
          <span className="block bg-primary text-[11px] font-sans text-base px-3 py-2 shadow-ambient leading-relaxed rounded-none">
            {content}
          </span>
          <span
            className={`absolute h-2 w-2 bg-primary rotate-45 ${arrowSide} ${arrowAlign}`}
          />
        </span>
      )}
    </span>
  );
}