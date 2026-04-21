'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ExternalLink, Linkedin, Twitter, Check, X, ArrowRight } from 'lucide-react';

// ─── Landing Page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="landing-page">
      <style>{landingStyles}</style>
      <Nav />
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <TinyFishSection />
      <TractionSection />
      <PricingSection />
      <TeamSection />
      <WaitlistSection />
      <Footer />
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`}>
      <div className="lp-nav-inner">
        <span className="lp-wordmark">
          Auto<span className="lp-cyan">AP</span>
        </span>
        <div className="lp-nav-links">
          <a href="#how" className="lp-nav-link">How it works</a>
          <a href="#why" className="lp-nav-link">Why TinyFish</a>
          <a href="#pricing" className="lp-nav-link">Pricing</a>
          <Link href="/dashboard" className="lp-nav-link lp-nav-ghost">Sign in</Link>
          <a href="#waitlist" className="lp-btn-primary lp-btn-sm">Get early access</a>
        </div>
      </div>
    </nav>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="lp-hero">
      <div className="lp-hero-grid-bg" />
      <div className="lp-hero-content">
        <div className="lp-badge lp-stagger-1">
          <span>🐟</span>
          <span>Built with TinyFish · Accepted · TinyFish Accelerator 2026</span>
        </div>
        <h1 className="lp-headline lp-stagger-2">
          Your AP agent that<br />
          <span className="lp-cyan">verifies before it pays.</span>
        </h1>
        <p className="lp-subheadline lp-stagger-3">
          AutoAP processes invoices end-to-end — from email in to payment scheduled —
          with dual-source fraud detection that no existing AP tool offers.
        </p>
        <div className="lp-cta-row lp-stagger-4">
          <a href="#waitlist" className="lp-btn-primary">
            Get early access <ArrowRight size={16} />
          </a>
          <a
            href="https://drive.google.com/file/d/18TwVVTC54oNcn9ibqm8kycT9F0FuYoLz/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="lp-btn-ghost"
          >
            Watch the demo <ExternalLink size={14} />
          </a>
        </div>
        <div className="lp-stats-strip lp-stagger-5">
          <div className="lp-stat">
            <span className="lp-stat-number lp-amber">8 hrs/week</span>
            <span className="lp-stat-label">saved per SMB owner</span>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat">
            <span className="lp-stat-number lp-cyan">$300B/yr</span>
            <span className="lp-stat-label">AP fraud in the US</span>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat">
            <span className="lp-stat-number lp-amber">24 sec</span>
            <span className="lp-stat-label">average invoice processed</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── PROBLEM ──────────────────────────────────────────────────────────────────

function ProblemSection() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="problem" ref={ref} className={`lp-section ${visible ? 'lp-visible' : ''}`}>
      <div className="lp-container">
        <h2 className="lp-section-headline">AP is broken for small business.</h2>
        <p className="lp-section-sub">And the tools that exist make it worse.</p>
        <div className="lp-problem-grid">
          <div className="lp-pain-list">
            {[
              '8 hours a week on manual invoice processing',
              'Every vendor portal is different. No API. No connection.',
              'Existing tools read one source — the email. That\'s it.',
              '$300B lost to AP fraud annually. Most goes undetected.',
              'One mistake — a duplicate payment, a fraudulent invoice — costs thousands.',
            ].map((pain, i) => (
              <div key={i} className="lp-pain-item">
                <span className="lp-pain-dot" />
                <span>{pain}</span>
              </div>
            ))}
          </div>
          <div className="lp-terminal-card">
            <div className="lp-terminal-header">
              <span className="lp-terminal-dot lp-terminal-dot--red" />
              <span className="lp-terminal-title">before-autoap.log</span>
            </div>
            <pre className="lp-terminal-body">{`09:14  → Opened invoice email from Acme Corp
09:17  → Logged into QuickBooks manually
09:22  → Searched for PO #4521... not found
09:28  → Called vendor to confirm amount
09:41  → Re-entered invoice data by hand
09:44  → Approved. Hoped for the best.
──────────────────────────────────────
Total time: 30 minutes. One invoice.
You have 47 more this month.`}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── SOLUTION ─────────────────────────────────────────────────────────────────

function SolutionSection() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="how" ref={ref} className={`lp-section lp-section--alt ${visible ? 'lp-visible' : ''}`}>
      <div className="lp-container">
        <h2 className="lp-section-headline">Two AI systems. One verified truth.</h2>

        <div className="lp-flow-diagram">
          <div className="lp-flow-step lp-flow-delay-1">
            <div className="lp-flow-box lp-flow-box--top">EMAIL ARRIVES</div>
          </div>
          <div className="lp-flow-arrow lp-flow-delay-2">↓</div>
          <div className="lp-flow-parallel lp-flow-delay-3">
            <div className="lp-flow-branch">
              <div className="lp-flow-label">Fireworks AI</div>
              <div className="lp-flow-sublabel">(reads email)</div>
              <div className="lp-flow-arrow-sm">↓</div>
              <div className="lp-flow-result">&ldquo;Claims $1,240&rdquo;</div>
            </div>
            <div className="lp-flow-branch">
              <div className="lp-flow-label">TinyFish</div>
              <div className="lp-flow-sublabel">(reads portal)</div>
              <div className="lp-flow-arrow-sm">↓</div>
              <div className="lp-flow-result">&ldquo;Shows $1,240&rdquo;</div>
            </div>
          </div>
          <div className="lp-flow-arrow lp-flow-delay-4">↓</div>
          <div className="lp-flow-step lp-flow-delay-5">
            <div className="lp-flow-box lp-flow-box--verify">
              <span className="lp-green">RECONCILIATION ENGINE</span>
              <span className="lp-flow-conf">98% confidence · VERIFIED</span>
            </div>
          </div>
          <div className="lp-flow-arrow lp-flow-delay-6">↓</div>
          <div className="lp-flow-step lp-flow-delay-7">
            <div className="lp-flow-box lp-flow-box--bottom">
              <span>QuickBooks API</span>
              <span className="lp-flow-conf">Bill created · Payment scheduled</span>
            </div>
          </div>
        </div>

        <div className="lp-features-grid">
          <div className="lp-feature-card">
            <h3>Any vendor, no API needed</h3>
            <p>TinyFish navigates any portal — Amazon Business, SaaS tools, utilities — with no pre-built integrations.</p>
          </div>
          <div className="lp-feature-card">
            <h3>Fraud caught before payment</h3>
            <p>Two independent sources must agree before AutoAP approves. A $260 discrepancy is caught in milliseconds.</p>
          </div>
          <div className="lp-feature-card">
            <h3>Full audit trail</h3>
            <p>Every agent step logged to AgentOps and Axiom. Every decision explained. Every exception tracked.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── WHY TINYFISH ─────────────────────────────────────────────────────────────

function TinyFishSection() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="why" ref={ref} className={`lp-section ${visible ? 'lp-visible' : ''}`}>
      <div className="lp-container">
        <blockquote className="lp-big-quote">
          &ldquo;Remove TinyFish.<br />The product stops working.&rdquo;
        </blockquote>
        <div className="lp-tinyfish-grid">
          <div className="lp-tinyfish-text">
            <p>
              TinyFish is the architecture, not a feature. Without it, AutoAP becomes just another
              email parser. The fraud detection disappears. The zero-integration advantage disappears.
            </p>
            <p>
              TinyFish gives AutoAP the ability to navigate any vendor portal — no APIs, no
              pre-built integrations, no vendor cooperation needed. It&apos;s what makes dual-source
              verification possible at all.
            </p>
          </div>
          <div className="lp-comparison-table-wrap">
            <table className="lp-comparison-table">
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>AutoAP</th>
                  <th>Bill.com</th>
                  <th>Tipalti</th>
                </tr>
              </thead>
              <tbody>
                {[
                  'Any vendor, no API',
                  'Portal verification',
                  'Pre-payment fraud detection',
                  'Confidence scoring',
                  'Zero-integration setup',
                ].map((cap) => (
                  <tr key={cap}>
                    <td>{cap}</td>
                    <td><Check size={16} className="lp-check" /></td>
                    <td><X size={16} className="lp-cross" /></td>
                    <td><X size={16} className="lp-cross" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── TRACTION ─────────────────────────────────────────────────────────────────

function TractionSection() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="traction" ref={ref} className={`lp-section lp-section--alt ${visible ? 'lp-visible' : ''}`}>
      <div className="lp-container">
        <h2 className="lp-section-headline">Built and shipped in 9 weeks.</h2>
        <div className="lp-traction-grid">
          <div className="lp-checklist">
            {[
              'Email ingestion → dual extraction pipeline',
              'TinyFish navigating 3 vendor portal archetypes',
              'Reconciliation engine with confidence scoring',
              'QuickBooks OAuth · bill creation · payment scheduling',
              'Exception flagging + Slack alerts via Composio',
              'Real-time dashboard + agent activity log',
              'AgentOps tracing + Axiom pipeline metrics',
              'ElevenLabs daily voice briefing',
            ].map((item) => (
              <div key={item} className="lp-check-item">
                <Check size={16} className="lp-check" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="lp-accelerator-card">
            <div className="lp-accelerator-emoji">🐟</div>
            <div className="lp-accelerator-title">TinyFish Accelerator</div>
            <div className="lp-accelerator-details">
              <span>Cohort 1 · 2026</span>
              <span>Phase 2 Accepted</span>
              <span>Partner: Mango Capital</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── PRICING ──────────────────────────────────────────────────────────────────

function PricingSection() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="pricing" ref={ref} className={`lp-section ${visible ? 'lp-visible' : ''}`}>
      <div className="lp-container">
        <h2 className="lp-section-headline">Simple, usage-based pricing.</h2>
        <p className="lp-section-sub">Pay per invoice processed. No seat fees. No contracts.</p>
        <div className="lp-pricing-card">
          <div className="lp-pricing-amount">
            <span className="lp-cyan">$0.50 – $2.00</span>
            <span className="lp-pricing-per">per invoice processed</span>
          </div>
          <div className="lp-pricing-divider" />
          <div className="lp-pricing-features">
            {[
              'Unlimited vendors',
              'Dual-source verification',
              'QuickBooks integration',
              'Real-time dashboard',
              'Exception alerts (Slack)',
              'Full audit trail',
              'AgentOps observability',
            ].map((f) => (
              <div key={f} className="lp-pricing-feature">
                <Check size={14} className="lp-check" /> {f}
              </div>
            ))}
          </div>
          <div className="lp-pricing-divider" />
          <div className="lp-pricing-estimates">
            <span>200 invoices/month → ~$100–$400/month</span>
            <span>500 invoices/month → contact for volume pricing</span>
          </div>
          <a href="#waitlist" className="lp-btn-primary" style={{ marginTop: '24px' }}>
            Get early access <ArrowRight size={16} />
          </a>
          <p className="lp-pricing-note">
            Currently in early access. Pricing locked for founding customers.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── TEAM ─────────────────────────────────────────────────────────────────────

function TeamSection() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="team" ref={ref} className={`lp-section lp-section--alt ${visible ? 'lp-visible' : ''}`}>
      <div className="lp-container">
        <h2 className="lp-section-headline">Built by someone who&apos;s been on both sides.</h2>
        <div className="lp-team-card">
          <div className="lp-team-info">
            <h3 className="lp-team-name">Olasile Abolade</h3>
            <p className="lp-team-title">Founder & CEO, AutoAP</p>
            <p className="lp-team-bio">
              10+ years product leadership at AWS and Adobe. Built infrastructure
              and developer platform products at scale. Now building the back-office automation
              tool he always wished existed.
            </p>
            <div className="lp-team-links">
              <a href="#" aria-label="LinkedIn"><Linkedin size={18} /></a>
              <a href="#" aria-label="X / Twitter"><Twitter size={18} /></a>
            </div>
          </div>
        </div>
        <blockquote className="lp-team-quote">
          &ldquo;I spent a decade building tools that make complex workflows invisible to the end user.
          AutoAP is the product I would have wanted running my own back office.&rdquo;
        </blockquote>
      </div>
    </section>
  );
}

// ─── WAITLIST ─────────────────────────────────────────────────────────────────

function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <section id="waitlist" className="lp-section lp-waitlist-section">
      <div className="lp-container">
        <h2 className="lp-section-headline">Stop processing invoices by hand.</h2>
        <p className="lp-section-sub">
          Join the early access list. First 10 customers get founding pricing locked forever.
        </p>
        {status === 'success' ? (
          <div className="lp-waitlist-success">
            <Check size={20} className="lp-check" />
            <span>You&apos;re on the list. We&apos;ll be in touch.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="lp-waitlist-form">
            <input
              type="email"
              placeholder="your@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="lp-waitlist-input"
            />
            <button type="submit" className="lp-btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? 'Joining...' : 'Get early access →'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="lp-waitlist-error">Something went wrong. Please try again.</p>
        )}
        <p className="lp-waitlist-fine-print">
          No spam. No pitch. Just early access when we&apos;re ready for you.
        </p>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="lp-footer">
      <span className="lp-wordmark">Auto<span className="lp-cyan">AP</span></span>
      <span className="lp-footer-center">&copy; 2026 AutoAP · Built with TinyFish</span>
      <span className="lp-footer-right">
        <a href="#">Privacy</a> · <a href="#">Terms</a> · <a href="https://getautoap.com">getautoap.com</a>
      </span>
    </footer>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const landingStyles = `
  /* ─── Landing Page Variables ──────────────────────── */
  .landing-page {
    --lp-bg: #07090F;
    --lp-surface: #0D1120;
    --lp-surface2: #111827;
    --lp-border: #1E2D45;
    --lp-cyan: #00D4FF;
    --lp-green: #00E887;
    --lp-amber: #FFB700;
    --lp-red: #FF3D5A;
    --lp-white: #F0F4FF;
    --lp-muted: #4A6080;
    --lp-font-display: 'Syne', sans-serif;
    --lp-font-mono: 'DM Mono', monospace;

    background: var(--lp-bg);
    color: var(--lp-white);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ─── Typography ─────────────────────────────────── */
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@300;400;500&display=swap');

  .lp-cyan { color: var(--lp-cyan); }
  .lp-green { color: var(--lp-green); }
  .lp-amber { color: var(--lp-amber); }

  /* ─── NAV ────────────────────────────────────────── */
  .lp-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    transition: background 0.3s ease, backdrop-filter 0.3s ease;
  }
  .lp-nav--scrolled {
    background: rgba(7, 9, 15, 0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--lp-border);
  }
  .lp-nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }
  .lp-wordmark {
    font-family: var(--lp-font-display);
    font-weight: 800;
    font-size: 20px;
    letter-spacing: -0.02em;
  }
  .lp-nav-links {
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .lp-nav-link {
    font-family: var(--lp-font-mono);
    font-size: 13px;
    color: var(--lp-muted);
    text-decoration: none;
    transition: color 0.2s;
  }
  .lp-nav-link:hover { color: var(--lp-white); }
  .lp-nav-ghost {
    border: 1px solid var(--lp-border);
    padding: 6px 14px;
    border-radius: 6px;
  }

  /* ─── BUTTONS ────────────────────────────────────── */
  .lp-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--lp-cyan);
    color: #07090F;
    font-family: var(--lp-font-mono);
    font-weight: 500;
    font-size: 14px;
    padding: 12px 24px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    text-decoration: none;
    transition: box-shadow 0.3s ease, transform 0.15s ease;
  }
  .lp-btn-primary:hover {
    box-shadow: 0 0 24px rgba(0, 212, 255, 0.4), 0 0 8px rgba(0, 212, 255, 0.6);
    transform: translateY(-1px);
  }
  .lp-btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .lp-btn-sm { padding: 8px 16px; font-size: 12px; }
  .lp-btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--lp-muted);
    font-family: var(--lp-font-mono);
    font-size: 14px;
    text-decoration: none;
    border: 1px solid var(--lp-border);
    padding: 12px 24px;
    border-radius: 8px;
    transition: color 0.2s, border-color 0.2s;
  }
  .lp-btn-ghost:hover {
    color: var(--lp-white);
    border-color: var(--lp-muted);
  }

  /* ─── HERO ───────────────────────────────────────── */
  .lp-hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 120px 24px 80px;
  }
  .lp-hero-grid-bg {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, var(--lp-border) 1px, transparent 1px);
    background-size: 40px 40px;
    opacity: 0.3;
    animation: lp-grid-pulse 8s ease-in-out infinite;
  }
  @keyframes lp-grid-pulse {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.4; }
  }
  .lp-hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  /* Stagger animations */
  .lp-stagger-1, .lp-stagger-2, .lp-stagger-3, .lp-stagger-4, .lp-stagger-5 {
    opacity: 0;
    transform: translateY(16px);
    animation: lp-fade-up 0.6s ease forwards;
  }
  .lp-stagger-1 { animation-delay: 0.1s; }
  .lp-stagger-2 { animation-delay: 0.16s; }
  .lp-stagger-3 { animation-delay: 0.22s; }
  .lp-stagger-4 { animation-delay: 0.28s; }
  .lp-stagger-5 { animation-delay: 0.34s; }
  @keyframes lp-fade-up {
    to { opacity: 1; transform: translateY(0); }
  }

  .lp-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--lp-font-mono);
    font-size: 12px;
    color: var(--lp-cyan);
    border: 1px solid var(--lp-cyan);
    padding: 6px 14px;
    border-radius: 20px;
    background: rgba(0, 212, 255, 0.05);
  }
  .lp-headline {
    font-family: var(--lp-font-display);
    font-weight: 800;
    font-size: 72px;
    line-height: 1.05;
    letter-spacing: -0.03em;
    margin: 0;
  }
  .lp-subheadline {
    font-family: var(--lp-font-mono);
    font-size: 16px;
    color: var(--lp-muted);
    max-width: 600px;
    line-height: 1.6;
    margin: 0;
  }
  .lp-cta-row {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .lp-stats-strip {
    display: flex;
    align-items: center;
    gap: 32px;
    margin-top: 24px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .lp-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .lp-stat-number {
    font-family: var(--lp-font-display);
    font-weight: 700;
    font-size: 28px;
  }
  .lp-stat-label {
    font-family: var(--lp-font-mono);
    font-size: 11px;
    color: var(--lp-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .lp-stat-divider {
    width: 1px;
    height: 40px;
    background: var(--lp-border);
  }

  /* ─── SECTIONS ───────────────────────────────────── */
  .lp-section {
    padding: 100px 24px;
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .lp-section.lp-visible {
    opacity: 1;
    transform: translateY(0);
  }
  .lp-section--alt {
    background: var(--lp-surface);
  }
  .lp-container {
    max-width: 1100px;
    margin: 0 auto;
  }
  .lp-section-headline {
    font-family: var(--lp-font-display);
    font-weight: 800;
    font-size: 42px;
    letter-spacing: -0.02em;
    margin: 0 0 12px;
  }
  .lp-section-sub {
    font-family: var(--lp-font-mono);
    font-size: 16px;
    color: var(--lp-muted);
    margin: 0 0 48px;
  }

  /* ─── PROBLEM ────────────────────────────────────── */
  .lp-problem-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: start;
  }
  .lp-pain-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .lp-pain-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-size: 15px;
    line-height: 1.5;
  }
  .lp-pain-dot {
    width: 8px;
    height: 8px;
    min-width: 8px;
    border-radius: 50%;
    background: var(--lp-red);
    margin-top: 7px;
    box-shadow: 0 0 8px rgba(255, 61, 90, 0.4);
  }
  .lp-terminal-card {
    background: var(--lp-surface);
    border: 1px solid var(--lp-border);
    border-radius: 10px;
    overflow: hidden;
  }
  .lp-terminal-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--lp-border);
    background: var(--lp-surface2);
  }
  .lp-terminal-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .lp-terminal-dot--red {
    background: var(--lp-red);
    animation: lp-pulse-red 2s ease-in-out infinite;
  }
  @keyframes lp-pulse-red {
    0%, 100% { opacity: 1; box-shadow: 0 0 4px rgba(255, 61, 90, 0.4); }
    50% { opacity: 0.5; box-shadow: 0 0 12px rgba(255, 61, 90, 0.8); }
  }
  .lp-terminal-title {
    font-family: var(--lp-font-mono);
    font-size: 11px;
    color: var(--lp-muted);
  }
  .lp-terminal-body {
    font-family: var(--lp-font-mono);
    font-size: 12px;
    line-height: 1.8;
    padding: 16px;
    margin: 0;
    color: var(--lp-muted);
    white-space: pre-wrap;
  }

  /* ─── SOLUTION FLOW ──────────────────────────────── */
  .lp-flow-diagram {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin: 48px 0;
  }
  .lp-flow-step, .lp-flow-arrow, .lp-flow-parallel {
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }
  .lp-visible .lp-flow-delay-1 { opacity: 1; transform: translateY(0); transition-delay: 0.1s; }
  .lp-visible .lp-flow-delay-2 { opacity: 1; transform: translateY(0); transition-delay: 0.25s; }
  .lp-visible .lp-flow-delay-3 { opacity: 1; transform: translateY(0); transition-delay: 0.4s; }
  .lp-visible .lp-flow-delay-4 { opacity: 1; transform: translateY(0); transition-delay: 0.6s; }
  .lp-visible .lp-flow-delay-5 { opacity: 1; transform: translateY(0); transition-delay: 0.75s; }
  .lp-visible .lp-flow-delay-6 { opacity: 1; transform: translateY(0); transition-delay: 0.9s; }
  .lp-visible .lp-flow-delay-7 { opacity: 1; transform: translateY(0); transition-delay: 1.05s; }
  .lp-flow-arrow {
    font-size: 20px;
    color: var(--lp-muted);
  }
  .lp-flow-arrow-sm {
    font-size: 16px;
    color: var(--lp-muted);
    margin: 4px 0;
  }
  .lp-flow-box {
    border: 1px solid var(--lp-border);
    border-radius: 8px;
    padding: 12px 24px;
    font-family: var(--lp-font-mono);
    font-size: 13px;
    background: var(--lp-surface);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .lp-flow-box--top { border-color: var(--lp-cyan); color: var(--lp-cyan); }
  .lp-flow-box--verify { border-color: var(--lp-green); }
  .lp-flow-box--bottom { border-color: var(--lp-border); }
  .lp-flow-conf {
    font-size: 11px;
    color: var(--lp-muted);
  }
  .lp-flow-parallel {
    display: flex;
    gap: 48px;
    border: 1px solid var(--lp-border);
    border-radius: 10px;
    padding: 24px 40px;
    background: var(--lp-surface);
  }
  .lp-flow-branch {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: var(--lp-font-mono);
    font-size: 13px;
  }
  .lp-flow-label { font-weight: 500; color: var(--lp-white); }
  .lp-flow-sublabel { font-size: 11px; color: var(--lp-muted); }
  .lp-flow-result { font-size: 12px; color: var(--lp-green); }

  /* ─── FEATURES GRID ──────────────────────────────── */
  .lp-features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-top: 48px;
  }
  .lp-feature-card {
    background: var(--lp-bg);
    border: 1px solid var(--lp-border);
    border-radius: 10px;
    padding: 24px;
  }
  .lp-feature-card h3 {
    font-family: var(--lp-font-display);
    font-weight: 700;
    font-size: 16px;
    margin: 0 0 8px;
  }
  .lp-feature-card p {
    font-family: var(--lp-font-mono);
    font-size: 13px;
    color: var(--lp-muted);
    line-height: 1.6;
    margin: 0;
  }

  /* ─── TINYFISH SECTION ───────────────────────────── */
  .lp-big-quote {
    font-family: var(--lp-font-display);
    font-weight: 800;
    font-size: 48px;
    line-height: 1.1;
    letter-spacing: -0.02em;
    margin: 0 0 48px;
    border: none;
    padding: 0;
  }
  .lp-tinyfish-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: start;
  }
  .lp-tinyfish-text p {
    font-size: 15px;
    line-height: 1.7;
    color: var(--lp-muted);
    margin: 0 0 16px;
  }
  .lp-comparison-table-wrap {
    overflow-x: auto;
  }
  .lp-comparison-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--lp-font-mono);
    font-size: 12px;
  }
  .lp-comparison-table th,
  .lp-comparison-table td {
    padding: 10px 14px;
    border: 1px solid var(--lp-border);
    text-align: center;
  }
  .lp-comparison-table th {
    background: var(--lp-surface);
    color: var(--lp-muted);
    font-weight: 500;
    text-align: left;
  }
  .lp-comparison-table th:first-child { text-align: left; }
  .lp-comparison-table td:first-child { text-align: left; color: var(--lp-white); }
  .lp-check { color: var(--lp-green); }
  .lp-cross { color: var(--lp-red); }

  /* ─── TRACTION ───────────────────────────────────── */
  .lp-traction-grid {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 48px;
    align-items: start;
  }
  .lp-checklist {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .lp-check-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--lp-font-mono);
    font-size: 13px;
  }
  .lp-accelerator-card {
    border: 1px solid var(--lp-cyan);
    border-radius: 12px;
    padding: 32px;
    background: rgba(0, 212, 255, 0.03);
    box-shadow: 0 0 24px rgba(0, 212, 255, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
  }
  .lp-accelerator-emoji { font-size: 32px; }
  .lp-accelerator-title {
    font-family: var(--lp-font-display);
    font-weight: 700;
    font-size: 18px;
  }
  .lp-accelerator-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-family: var(--lp-font-mono);
    font-size: 13px;
    color: var(--lp-muted);
  }

  /* ─── PRICING ────────────────────────────────────── */
  .lp-pricing-card {
    max-width: 480px;
    margin: 0 auto;
    border: 1px solid var(--lp-border);
    border-radius: 12px;
    padding: 40px;
    background: var(--lp-surface);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .lp-pricing-amount {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .lp-pricing-amount .lp-cyan {
    font-family: var(--lp-font-display);
    font-weight: 800;
    font-size: 36px;
  }
  .lp-pricing-per {
    font-family: var(--lp-font-mono);
    font-size: 13px;
    color: var(--lp-muted);
  }
  .lp-pricing-divider {
    width: 100%;
    height: 1px;
    background: var(--lp-border);
    margin: 24px 0;
  }
  .lp-pricing-features {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
    width: 100%;
  }
  .lp-pricing-feature {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--lp-font-mono);
    font-size: 13px;
  }
  .lp-pricing-estimates {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-family: var(--lp-font-mono);
    font-size: 12px;
    color: var(--lp-muted);
  }
  .lp-pricing-note {
    font-family: var(--lp-font-mono);
    font-size: 11px;
    color: var(--lp-muted);
    margin-top: 16px;
  }

  /* ─── TEAM ───────────────────────────────────────── */
  .lp-team-card {
    border: 1px solid var(--lp-border);
    border-radius: 12px;
    padding: 32px;
    background: var(--lp-bg);
    max-width: 560px;
    margin: 0 auto 32px;
  }
  .lp-team-name {
    font-family: var(--lp-font-display);
    font-weight: 700;
    font-size: 22px;
    margin: 0 0 4px;
  }
  .lp-team-title {
    font-family: var(--lp-font-mono);
    font-size: 13px;
    color: var(--lp-cyan);
    margin: 0 0 16px;
  }
  .lp-team-bio {
    font-size: 14px;
    line-height: 1.7;
    color: var(--lp-muted);
    margin: 0 0 16px;
  }
  .lp-team-links {
    display: flex;
    gap: 12px;
  }
  .lp-team-links a {
    color: var(--lp-muted);
    transition: color 0.2s;
  }
  .lp-team-links a:hover { color: var(--lp-cyan); }
  .lp-team-quote {
    font-family: var(--lp-font-mono);
    font-size: 15px;
    color: var(--lp-muted);
    line-height: 1.7;
    max-width: 600px;
    margin: 0 auto;
    text-align: center;
    font-style: italic;
    border: none;
    padding: 0;
  }

  /* ─── WAITLIST ───────────────────────────────────── */
  .lp-waitlist-section {
    text-align: center;
    opacity: 1 !important;
    transform: none !important;
  }
  .lp-waitlist-form {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .lp-waitlist-input {
    font-family: var(--lp-font-mono);
    font-size: 14px;
    padding: 12px 20px;
    border-radius: 8px;
    border: 1px solid var(--lp-border);
    background: var(--lp-surface);
    color: var(--lp-white);
    width: 300px;
    max-width: 100%;
    outline: none;
    transition: border-color 0.2s;
  }
  .lp-waitlist-input:focus {
    border-color: var(--lp-cyan);
  }
  .lp-waitlist-input::placeholder {
    color: var(--lp-muted);
  }
  .lp-waitlist-success {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: var(--lp-font-mono);
    font-size: 15px;
    color: var(--lp-green);
    margin-bottom: 16px;
  }
  .lp-waitlist-error {
    font-family: var(--lp-font-mono);
    font-size: 13px;
    color: var(--lp-red);
    margin: 8px 0;
  }
  .lp-waitlist-fine-print {
    font-family: var(--lp-font-mono);
    font-size: 11px;
    color: var(--lp-muted);
    margin-top: 8px;
  }

  /* ─── FOOTER ─────────────────────────────────────── */
  .lp-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px;
    border-top: 1px solid var(--lp-border);
    font-family: var(--lp-font-mono);
    font-size: 12px;
    color: var(--lp-muted);
    max-width: 1200px;
    margin: 0 auto;
  }
  .lp-footer-center { text-align: center; }
  .lp-footer-right a {
    color: var(--lp-muted);
    text-decoration: none;
    transition: color 0.2s;
  }
  .lp-footer-right a:hover { color: var(--lp-white); }

  /* ─── RESPONSIVE ─────────────────────────────────── */
  @media (max-width: 768px) {
    .lp-headline { font-size: 44px; }
    .lp-big-quote { font-size: 32px; }
    .lp-section-headline { font-size: 32px; }
    .lp-problem-grid,
    .lp-tinyfish-grid,
    .lp-traction-grid,
    .lp-features-grid {
      grid-template-columns: 1fr;
    }
    .lp-flow-parallel { flex-direction: column; gap: 24px; padding: 20px; }
    .lp-nav-links { gap: 12px; }
    .lp-nav-link { display: none; }
    .lp-nav-ghost { display: none; }
    .lp-btn-sm { display: inline-flex; }
    .lp-stats-strip { gap: 20px; }
    .lp-stat-number { font-size: 22px; }
    .lp-stat-divider { height: 30px; }
    .lp-footer { flex-direction: column; gap: 12px; text-align: center; }
  }
  @media (max-width: 480px) {
    .lp-headline { font-size: 36px; }
    .lp-waitlist-input { width: 100%; }
  }
`;
