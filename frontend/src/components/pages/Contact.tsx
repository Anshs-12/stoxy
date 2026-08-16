import { useState } from 'react';
import {
  Mail, Send, Github, Coffee, ArrowUpRight, Copy, Check,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const CONTACT_EMAIL = 'anshxcookies@gmail.com';

const SUBJECTS = [
  'Bug Report',
  'Feature Request',
  'Data / Chart Issue',
  'Account & Portfolio',
  'AI Analysis',
  'Partnership / Press',
  'Something Else',
];

const Contact = () => {
  const { addToast } = useToast();
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [customSubject, setCustomSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);

  const mailtoHref = () => {
    const subjectLine =
      subject === 'Something Else' && customSubject.trim()
        ? `[Something Else] ${customSubject.trim()} — Stoxy Finance`
        : `[${subject}] Stoxy Finance — `;
    const params = new URLSearchParams({
      subject: subjectLine,
      body,
    });
    return `mailto:${CONTACT_EMAIL}?${params.toString()}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      addToast('Email copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Could not copy email', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-surface border border-border-light rounded-none p-6 md:p-8">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-3.5 w-3.5 text-play" />
          <span className="text-[9px] font-mono text-muted uppercase tracking-widest">
            Contact / Support
          </span>
        </div>
        <h1 className="font-heading text-2xl md:text-3xl font-semibold text-primary tracking-tight mb-2">
          Talk to the humans behind Stoxy <span className="text-play">Finance</span>
        </h1>
        <p className="text-[13px] font-sans text-muted leading-relaxed max-w-[52ch]">
          Stoxy Finance is a solo side project — no support team, just me.
          Found a bug, want a feature, or just have feedback? Drop us a line —
          composing the mail opens your email client with everything prefilled.
          No forms, no tickets, no bots.
        </p>
      </div>

      {/* Composer + aside */}
      <div className="grid grid-cols-12 gap-4">
        {/* Mail composer */}
        <div className="col-span-12 lg:col-span-8 bg-surface border border-border-light p-5 rounded-none flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <Send className="h-3 w-3 text-muted" />
            <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium">
              Compose Mail
            </h3>
          </div>

          <label className="text-[9px] text-muted uppercase tracking-widest block mb-1.5">
            To
          </label>
          <div className="flex items-center justify-between bg-neutral px-3 py-2.5 border border-border-light mb-4">
            <span className="text-[13px] font-mono text-primary">{CONTACT_EMAIL}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[10px] font-mono text-muted hover:text-primary transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-positive" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <label className="text-[9px] text-muted uppercase tracking-widest block mb-1.5">
            Subject
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {SUBJECTS.map(s => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={`px-2 py-1.5 text-[11px] font-mono border text-left transition-colors rounded-none ${
                  subject === s
                    ? 'border-play text-play bg-neutral'
                    : 'border-border-light text-muted hover:text-primary hover:border-border'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {subject === 'Something Else' && (
            <>
              <label className="text-[9px] text-muted uppercase tracking-widest block mb-1.5">
                Your Subject
              </label>
              <input
                value={customSubject}
                onChange={e => setCustomSubject(e.target.value)}
                type="text"
                maxLength={60}
                placeholder="Type your own subject…"
                className="w-full bg-neutral text-[13px] font-sans px-3 py-2.5 outline-none text-primary placeholder:text-muted border border-border-light focus:border-border mb-4"
              />
            </>
          )}

          <label className="text-[9px] text-muted uppercase tracking-widest block mb-1.5">
            Message
          </label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={7}
            placeholder="Describe what happened, what you expected, and any steps to reproduce…"
            className="w-full bg-neutral text-[13px] font-sans px-3 py-2.5 outline-none text-primary placeholder:text-muted resize-none border border-border-light focus:border-border"
          />

          <div className="flex items-center justify-between mt-5">
            <span className="text-[10px] font-mono text-muted">
              {body.length > 0 ? `${body.length} chars` : 'Prefilled subject + body — just hit send'}
            </span>
            <a
              href={mailtoHref()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-play text-white dark:text-black text-[11px] font-mono font-semibold hover:bg-play/90 transition-colors rounded-none"
            >
              <Send className="h-3.5 w-3.5" />
              Open Mail Client
            </a>
          </div>
        </div>

        {/* Aside column */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="bg-surface border border-border-light p-5 rounded-none">
            <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium mb-3">
              Response Time
            </h3>
            <p className="text-[12px] font-sans text-primary/90 leading-relaxed mb-3">
              This is a passion project I maintain alongside everything else, so
              replies may take a bit.
            </p>
            <div className="space-y-2.5 text-[12px] font-mono text-muted">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-positive" />
                Usually within 24–48h
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-play" />
                Weekends slower
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-negative" />
                Bugs get priority
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border-light p-5 rounded-none">
            <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium mb-3">
              What to email about
            </h3>
            <div className="space-y-3.5">
              <div className="text-[12.5px] font-sans text-primary/90 leading-relaxed">
                <strong className="text-primary">Bugs, feedback, or feature requests?</strong>{' '}
                Email{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-play font-semibold underline underline-offset-2"
                >
                  {CONTACT_EMAIL}
                </a>{' '}
                and I'll get back to you when I can.
              </div>
              <div className="text-[12.5px] font-sans text-primary/90 leading-relaxed">
                <strong className="text-primary">Questions about Terms or Privacy?</strong>{' '}
                Same email —{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-play font-semibold underline underline-offset-2"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border-light p-5 rounded-none">
            <h3 className="text-[9px] text-muted uppercase tracking-widest font-medium mb-3">
              Elsewhere
            </h3>
            <div className="space-y-2">
              <a
                href="https://github.com/anshs-12/stoxy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2.5 border border-border-light text-[12px] font-mono text-muted hover:text-primary hover:border-border transition-colors no-underline"
              >
                <span className="flex items-center gap-2">
                  <Github className="h-3.5 w-3.5" />
                  GitHub — report issues
                </span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://buymeacoffee.com/anshx12"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2.5 border border-border-light text-[12px] font-mono text-muted hover:text-primary hover:border-border transition-colors no-underline"
              >
                <span className="flex items-center gap-2">
                  <Coffee className="h-3.5 w-3.5" />
                  Buy me a coffee
                </span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;