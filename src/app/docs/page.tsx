'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import CrevasseLogo from '@/components/CrevasseLogo';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Activity,
  Key,
  Snowflake,
  Waves,
  Users,
  Zap,
  BookOpen,
} from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];
const rise = (delay: number) => ({
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: EASE } },
});

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      className={`rounded-2xl border p-8 flex flex-col gap-5 ${className}`}
      style={{ borderColor: 'rgba(159,216,232,0.10)', background: 'rgba(14,36,54,0.55)' }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {children}
    </motion.section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(159,216,232,0.45)' }}>
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-2xl font-bold tracking-wide text-whiteout leading-tight">
      {children}
    </h2>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed font-sans" style={{ color: 'rgba(234,246,250,0.70)' }}>
      {children}
    </p>
  );
}

function LimitationBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl px-5 py-4 text-sm leading-relaxed font-sans flex gap-3"
      style={{
        background: 'rgba(232,178,63,0.06)',
        border: '1px solid rgba(232,178,63,0.20)',
        color: 'rgba(232,178,63,0.85)',
      }}
    >
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-abyss text-whiteout">

      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between border-b border-whiteout/5 bg-abyss/80 backdrop-blur-md px-6 py-4"
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Back to home"
            className="w-9 h-9 rounded-full border flex items-center justify-center transition-all text-frost"
            style={{ borderColor: 'rgba(159,216,232,0.15)', background: 'rgba(14,36,54,0.5)' }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = 'rgba(159,216,232,0.45)';
              el.style.background = 'rgba(159,216,232,0.08)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = 'rgba(159,216,232,0.15)';
              el.style.background = 'rgba(14,36,54,0.5)';
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-whiteout hover:text-frost transition-colors ml-1">
            <CrevasseLogo size={22} />
            <span>CREVASSE</span>
          </Link>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(159,216,232,0.45)' }}>
          <BookOpen className="w-3.5 h-3.5" />
          <span className="font-mono tracking-wider uppercase">Docs</span>
        </div>
      </nav>

      {/* Page header */}
      <div className="max-w-3xl mx-auto px-6 pt-16 pb-8">
        <motion.div
          className="flex flex-col gap-3"
          variants={rise(0.1)}
          initial="hidden"
          animate="visible"
        >
          <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(95,227,192,0.60)' }}>
            Documentation
          </p>
          <h1 className="font-display text-4xl font-bold tracking-wide text-whiteout">
            How Crevasse Works
          </h1>
          <p className="text-base leading-relaxed font-sans mt-1" style={{ color: 'rgba(234,246,250,0.55)' }}>
            Plain-language guide for anyone — no crypto background required.
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 pb-24 flex flex-col gap-6">

        {/* ── 1. What Crevasse is ───────────────────────────────────────────── */}
        <Section>
          <SectionLabel>01 — What it is</SectionLabel>
          <SectionTitle>What is Crevasse?</SectionTitle>
          <Body>
            Crevasse is a token safety checker for the Sui blockchain. You paste a Sui token address
            and Crevasse tells you whether it&apos;s safe to buy — most importantly, whether it&apos;s a{' '}
            <strong className="text-whiteout">honeypot</strong>. A honeypot is a token that lets you buy
            freely but secretly blocks you from ever selling, trapping your money permanently.
            Crevasse finds these traps before you put money in by actually trying to sell the token
            — live, on-chain — and reporting back what happens.
          </Body>
        </Section>

        {/* ── 2. How the sell-test works ───────────────────────────────────── */}
        <Section>
          <SectionLabel>02 — The sell-test</SectionLabel>
          <SectionTitle>How the live sell-test works</SectionTitle>
          <Body>
            Most honeypot detectors on other blockchains read the contract code and guess whether a
            token looks suspicious. Crevasse doesn&apos;t guess — it actually tries to sell.
          </Body>
          <Body>
            When you paste a token, Crevasse finds its liquidity pool on{' '}
            <strong className="text-whiteout">Cetus</strong> (a Sui DEX) and builds a real swap
            transaction: first it buys a tiny amount of the token using synthetic gas, then immediately
            tries to sell it back. This entire sequence runs through Sui&apos;s{' '}
            <strong className="text-whiteout">devInspect</strong> — a built-in Sui feature that executes
            a transaction against the live network state without actually committing it or spending any real
            funds.
          </Body>
          <Body>
            If the sell step succeeds, the token is sellable. If the sell step aborts — meaning the
            contract or pool rejects it — Crevasse flags it as a honeypot and shows you the exact
            on-chain abort error. No funds ever move. The whole check takes a few seconds.
          </Body>
          <div
            className="rounded-xl px-5 py-4 text-sm leading-relaxed font-sans flex gap-3"
            style={{
              background: 'rgba(95,227,192,0.06)',
              border: '1px solid rgba(95,227,192,0.18)',
              color: 'rgba(95,227,192,0.85)',
            }}
          >
            <Zap className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              This works because Sui&apos;s Programmable Transaction Blocks (PTBs) let Crevasse chain a
              buy and a sell into one atomic test. If the sell aborts, the entire block reverts — proving
              the token blocks exits.
            </span>
          </div>
        </Section>

        {/* ── 3. Verdict definitions ───────────────────────────────────────── */}
        <Section>
          <SectionLabel>03 — Verdicts</SectionLabel>
          <SectionTitle>What each verdict means</SectionTitle>

          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-start">
              <div className="shrink-0 flex items-center gap-2 w-28">
                <CheckCircle2 className="w-4 h-4" style={{ color: '#5FE3C0' }} />
                <span className="font-display font-bold text-base" style={{ color: '#5FE3C0' }}>SAFE ICE</span>
              </div>
              <p className="text-sm leading-relaxed font-sans" style={{ color: 'rgba(234,246,250,0.65)' }}>
                The sell simulation passed and no major red flags were found across the other checks.
                The token appears safe to trade. Not a guarantee — always do your own research.
              </p>
            </div>

            <div className="flex gap-4 items-start">
              <div className="shrink-0 flex items-center gap-2 w-28">
                <AlertTriangle className="w-4 h-4" style={{ color: '#E8B23F' }} />
                <span className="font-display font-bold text-base" style={{ color: '#E8B23F' }}>THIN ICE</span>
              </div>
              <p className="text-sm leading-relaxed font-sans" style={{ color: 'rgba(234,246,250,0.65)' }}>
                The sell simulation couldn&apos;t run (no liquidity pool found, or the simulation was
                inconclusive), or one or more checks raised a warning. The token is not confirmed safe.
                Proceed with caution.
              </p>
            </div>

            <div className="flex gap-4 items-start">
              <div className="shrink-0 flex items-center gap-2 w-28">
                <AlertOctagon className="w-4 h-4" style={{ color: '#FF4D5E' }} />
                <span className="font-display font-bold text-base" style={{ color: '#FF4D5E' }}>CREVASSE</span>
              </div>
              <p className="text-sm leading-relaxed font-sans" style={{ color: 'rgba(234,246,250,0.65)' }}>
                The sell transaction was blocked by the contract. This is a confirmed honeypot. The
                on-chain abort error is shown as proof. Do not buy this token.
              </p>
            </div>
          </div>
        </Section>

        {/* ── 4. The five checks ───────────────────────────────────────────── */}
        <Section>
          <SectionLabel>04 — The checks</SectionLabel>
          <SectionTitle>Five safety checks, every token</SectionTitle>

          <div className="flex flex-col gap-5">
            {[
              {
                icon: <Activity className="w-4 h-4" style={{ color: '#5FE3C0' }} />,
                name: 'Live Sell-Test',
                danger: 'Catches honeypots — tokens that block selling at the swap level.',
              },
              {
                icon: <Key className="w-4 h-4" style={{ color: '#9FD8E8' }} />,
                name: 'Mint Authority',
                danger: 'Checks if the creator can still print unlimited new tokens, which would crash the price.',
              },
              {
                icon: <Snowflake className="w-4 h-4" style={{ color: '#9FD8E8' }} />,
                name: 'Freeze Authority',
                danger: 'Checks if the creator can freeze your wallet, blocking you from moving your tokens.',
              },
              {
                icon: <Waves className="w-4 h-4" style={{ color: '#9FD8E8' }} />,
                name: 'Liquidity Depth',
                danger: 'Checks whether there is enough liquidity in the Cetus pool to actually exit — zero liquidity means you are stuck.',
              },
              {
                icon: <Users className="w-4 h-4" style={{ color: '#9FD8E8' }} />,
                name: 'Holder Concentration',
                danger: 'Checks if a small number of wallets hold most of the supply — a signal that a coordinated dump could wipe out the price.',
              },
            ].map(check => (
              <div key={check.name} className="flex gap-4 items-start">
                <div
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(159,216,232,0.06)', border: '1px solid rgba(159,216,232,0.12)' }}
                >
                  {check.icon}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-whiteout">{check.name}</p>
                  <p className="text-xs leading-relaxed font-sans" style={{ color: 'rgba(234,246,250,0.60)' }}>
                    {check.danger}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 5. Telegram Bot ──────────────────────────────────────────────── */}
        <Section>
          <SectionLabel>05 — Telegram Bot</SectionLabel>
          <SectionTitle>Check tokens without leaving Telegram</SectionTitle>

          <Body>
            The Crevasse bot is built and runs the full engine — same five checks, same verdicts —
            directly inside any Telegram chat. No browser tab needed.
          </Body>

          <div className="flex flex-col gap-3">
            {[
              {
                cmd: '/check 0x2::sui::SUI',
                desc: 'Run a full safety check on any Sui coin type.',
              },
              {
                cmd: '0x86d2cfbc...::honeypot_coin::HONEYPOT_COIN',
                desc: 'Or just paste a coin type directly — the bot recognises it automatically.',
              },
              {
                cmd: '/start  /help',
                desc: 'Get an intro and the full command list.',
              },
            ].map(item => (
              <div
                key={item.cmd}
                className="rounded-xl px-5 py-4 flex flex-col gap-1.5"
                style={{ background: 'rgba(159,216,232,0.04)', border: '1px solid rgba(159,216,232,0.08)' }}
              >
                <code
                  className="text-xs font-mono"
                  style={{ color: 'rgba(95,227,192,0.80)' }}
                >
                  {item.cmd}
                </code>
                <p className="text-xs leading-relaxed font-sans" style={{ color: 'rgba(234,246,250,0.55)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <a
            href="https://t.me/CrevasseBot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 self-start rounded-full border px-5 py-2.5 text-xs tracking-wider uppercase font-semibold transition-all duration-300"
            style={{
              borderColor: 'rgba(159,216,232,0.28)',
              color: 'rgba(159,216,232,0.80)',
              background: 'rgba(159,216,232,0.04)',
            }}
          >
            {/* Telegram icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
            </svg>
            Open @CrevasseBot
          </a>

          <p className="text-xs font-sans" style={{ color: 'rgba(159,216,232,0.35)' }}>
            The public handle activates on deployment. The bot code is live; the Telegram handle
            is registered and ready.
          </p>
        </Section>

        {/* ── 6. Share on X ────────────────────────────────────────────────── */}
        <Section>
          <SectionLabel>06 — Share on X</SectionLabel>
          <SectionTitle>Share any verdict to X in one tap</SectionTitle>

          <Body>
            Every result screen has a <strong>Share on X</strong> button. Tap it to post a
            pre-written verdict to X — the text, emoji, and link are filled in automatically
            based on the verdict tier.
          </Body>

          <div className="flex flex-col gap-2.5">
            {[
              { verdict: 'SAFE ICE',  color: '#5FE3C0', text: '✅ CREVASSE checked this Sui token — SAFE ICE. Live on-chain sell-test passed.' },
              { verdict: 'THIN ICE',  color: '#E8B23F', text: '⚠️ CREVASSE: THIN ICE on this Sui token. Sell simulation inconclusive — no confirmed exit.' },
              { verdict: 'CREVASSE',  color: '#FF4D5E', text: '🛑 CREVASSE flagged this Sui token as a HONEYPOT — buy but can\'t sell. Checked live on-chain.' },
            ].map(item => (
              <div
                key={item.verdict}
                className="rounded-xl px-5 py-4 flex gap-3 items-start"
                style={{ background: 'rgba(14,36,54,0.60)', border: '1px solid rgba(159,216,232,0.08)' }}
              >
                <span
                  className="font-display font-bold text-xs shrink-0 mt-0.5"
                  style={{ color: item.color, minWidth: 72 }}
                >
                  {item.verdict}
                </span>
                <p className="text-xs leading-relaxed font-sans" style={{ color: 'rgba(234,246,250,0.55)' }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <Body>
            The shared link unfurls into a branded Deep Ice card on X — verdict colour, score,
            and a direct link back to the full report.
          </Body>
        </Section>

        {/* ── 7. Limitations ───────────────────────────────────────────────── */}
        <Section>
          <SectionLabel>07 — Limitations</SectionLabel>
          <SectionTitle>Read this before you trust any verdict</SectionTitle>

          <div className="flex flex-col gap-3">
            <LimitationBox>
              <span>
                <strong>The sell-test catches swap-level honeypots.</strong> Crevasse tests whether the
                token can be sold through the Cetus AMM pool. Because Cetus uses raw balance operations
                internally, a token that blocks selling only at the coin-transfer level (rather than the
                swap level) may not be caught by the sell-test alone. The mint authority, freeze
                authority, and holder checks cover those patterns separately.
              </span>
            </LimitationBox>

            <LimitationBox>
              <span>
                <strong>&ldquo;Unavailable&rdquo; never means safe.</strong> If a check shows
                &ldquo;unavailable&rdquo;, it means Crevasse couldn&apos;t get the data — not that the
                check passed. Treat unavailable checks as unknowns, not green flags.
              </span>
            </LimitationBox>

            <LimitationBox>
              <span>
                <strong>This is a safety guide, not a guarantee.</strong> A SAFE ICE verdict means the
                token passed our automated checks at the moment of checking. It does not mean the
                project is legitimate, the team is trustworthy, or the price will go up. Always do
                your own research. Never invest more than you can afford to lose.
              </span>
            </LimitationBox>
          </div>
        </Section>

        {/* ── 8. Roadmap ───────────────────────────────────────────────────── */}
        <Section>
          <SectionLabel>08 — Roadmap</SectionLabel>
          <SectionTitle>What&apos;s still coming</SectionTitle>

          <div className="flex flex-col gap-3">
            {[
              {
                label: 'Browser Extension',
                desc:  'Check tokens inline while browsing any Sui swap UI — without opening a new tab.',
              },
              {
                label: 'X Auto-Reply Bot',
                desc:  'Tag @CrevasseBot on any X post containing a Sui coin type and get the verdict as an instant reply.',
              },
            ].map(item => (
              <div
                key={item.label}
                className="flex gap-4 items-start rounded-xl px-5 py-4"
                style={{ background: 'rgba(159,216,232,0.04)', border: '1px solid rgba(159,216,232,0.08)' }}
              >
                <div
                  className="shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                  style={{ background: 'rgba(159,216,232,0.35)' }}
                />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-whiteout">{item.label}</p>
                  <p className="text-xs leading-relaxed font-sans" style={{ color: 'rgba(234,246,250,0.55)' }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Bottom CTA */}
        <motion.div
          className="text-center pt-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/check"
            className="inline-flex items-center gap-2.5 rounded-full border px-8 py-3.5 text-xs tracking-widest uppercase font-semibold transition-all duration-300"
            style={{
              borderColor: 'rgba(95,227,192,0.30)',
              color: '#5FE3C0',
              background: 'rgba(95,227,192,0.05)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = 'rgba(95,227,192,0.65)';
              el.style.background = 'rgba(95,227,192,0.10)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = 'rgba(95,227,192,0.30)';
              el.style.background = 'rgba(95,227,192,0.05)';
            }}
          >
            Test the ice now →
          </Link>
        </motion.div>

      </main>
    </div>
  );
}
