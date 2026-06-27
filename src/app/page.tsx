'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Snowfall from '@/components/Snowfall';
import CrevasseLogo from '@/components/CrevasseLogo';
import {
  Activity,
  Key,
  Cpu,
  Snowflake,
  Waves,
  Users,
  ClipboardList,
  Zap,
  Eye,
  ExternalLink,
  Skull,
} from 'lucide-react';

// Three.js — browser only
const GlacialScene = dynamic(() => import('@/components/GlacialScene'), { ssr: false });

/* ── Framer Motion variants ──────────────────────────────────────────────── */
const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const rise = (delay: number) => ({
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.9, delay, ease: EASE } },
});

const fadeIn = (delay: number) => ({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7, delay } },
});

/* ── Icon mapping helpers ────────────────────────────────────────────────── */
const getStepIcon = (glyph: string) => {
  switch (glyph) {
    case 'copy': return <ClipboardList className="w-5 h-5 text-frost" />;
    case 'zap': return <Zap className="w-5 h-5 text-frost" />;
    case 'eye': return <Eye className="w-5 h-5 text-frost" />;
    case 'link': return <ExternalLink className="w-5 h-5 text-frost" />;
    default: return null;
  }
};

const getCheckIcon = (iconName: string) => {
  switch (iconName) {
    case 'activity': return <Activity className="w-8 h-8 text-frost" />;
    case 'key': return <Key className="w-8 h-8 text-frost" />;
    case 'cpu': return <Cpu className="w-8 h-8 text-frost" />;
    case 'snowflake': return <Snowflake className="w-8 h-8 text-frost" />;
    case 'waves': return <Waves className="w-8 h-8 text-frost" />;
    case 'users': return <Users className="w-8 h-8 text-frost" />;
    default: return null;
  }
};

/* ── Step-by-step usage guide ────────────────────────────────────────────── */
const USAGE_STEPS = [
  {
    num: '01',
    title: 'Copy Token Type',
    body: 'Copy the full Sui coin type (e.g. 0x2::sui::SUI) from block explorers or swap interfaces.',
    glyph: 'copy',
  },
  {
    num: '02',
    title: 'Paste and Test',
    body: 'Enter the coin type in Crevasse. The engine initiates a live on-chain sell test.',
    glyph: 'zap',
  },
  {
    num: '03',
    title: 'Inspect Yeti Verdict',
    body: 'Read the safety verdict and detailed checks provided by the Sage, Legend, or Grave Yeti mascot.',
    glyph: 'eye',
  },
  {
    num: '04',
    title: 'Verify Explorer Link',
    body: 'View the verified verdict recorded on-chain in the Sui public registry ledger.',
    glyph: 'link',
  },
];

/* ── Six Core Safety Checks ──────────────────────────────────────────────── */
const SAFETY_CHECKS = [
  {
    icon: 'activity',
    title: 'Live Sell-Test',
    desc: 'We execute a dry-run sell transaction back to SUI using live network state. By simulating the transaction block programmatically without committing it to the blockchain ledger, the safety engine determines if the token contract contains exit blocks or honeypot logic that would prevent you from selling.',
  },
  {
    icon: 'key',
    title: 'Upgrade Authority Audit',
    desc: 'We scan package objects to verify if the creator retains the UpgradeCap. If held in an un-multisigged wallet, the developer can upgrade the bytecode at any time to inject malicious code or halt swaps.',
  },
  {
    icon: 'cpu',
    title: 'Mint Authority Audit',
    desc: 'We trace the TreasuryCap origin to verify if the mint authority has been burned or renounced to 0x0. If active, the creator can print infinite supply to instantly dilute holders.',
  },
  {
    icon: 'snowflake',
    title: 'Freeze Status Check',
    desc: 'We check for DenyCap permissions or custom freeze logic. If the developer can blacklist specific addresses, they can lock your balance inside your wallet forever.',
  },
  {
    icon: 'waves',
    title: 'Liquidity Depth Analysis',
    desc: 'We analyze locked reserves across Cetus and Aftermath routing paths to guarantee exit swaps without severe slippage.',
  },
  {
    icon: 'users',
    title: 'Holder Concentration Check',
    desc: 'We scan top wallets via BlockVision, excluding LP pools, to detect dangerous supply concentration among developer insider addresses.',
  },
];

/* ── Jagged ice divider (SVG) ────────────────────────────────────────────── */
function IceDivider({ color = "rgba(6, 18, 31, 0.70)" }: { color?: string }) {
  return (
    <div className="relative w-full overflow-hidden backdrop-blur-md" style={{ height: 72, marginTop: -2, zIndex: 2 }}>
      <svg
        viewBox="0 0 1440 72"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden
      >
        <path
          d="M0 0 L180 38 L320 12 L480 52 L620 8 L760 44 L900 16 L1060 48 L1200 20 L1440 42 L1440 72 L0 72 Z"
          fill={color}
        />
      </svg>
    </div>
  );
}

/* ── Organic smooth wave divider ─────────────────────────────────────────── */
function WaveDivider({ color = "#0E2436", flip = false }: { color?: string; flip?: boolean }) {
  return (
    <div
      className="relative w-full overflow-hidden pointer-events-none"
      style={{
        height: 80,
        marginTop: flip ? 0 : -2,
        marginBottom: flip ? -2 : 0,
        zIndex: 2,
        transform: flip ? 'rotate(180deg)' : 'none',
      }}
    >
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden
      >
        {/* Background wave for depth */}
        <path
          d="M0,30 C240,70 480,20 720,60 C960,100 1200,60 1440,40 L1440,100 L0,100 Z"
          fill={color}
          opacity="0.35"
        />
        {/* Foreground wave */}
        <path
          d="M0,50 C360,95 720,10 1080,80 C1260,100 1380,75 1440,60 L1440,100 L0,100 Z"
          fill={color}
        />
      </svg>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [heroInput, setHeroInput] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menaceRef = useRef<HTMLElement>(null);
  const auditRef = useRef<HTMLElement>(null);
  const howRef = useRef<HTMLElement>(null);

  function scrollToMenace() {
    menaceRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }

  function scrollToAudit() {
    auditRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }

  function scrollToHow() {
    howRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const val = heroInput.trim();
    if (!val) return;
    router.push(`/check?token=${encodeURIComponent(val)}`);
  };

  return (
    <main className="bg-crevasse-landing text-whiteout min-h-screen relative overflow-x-hidden">
      {/* Dynamic snow overlay */}
      <Snowfall />

      {/* ════════════════════════════════════════════════════════════════════
          HERO — fullscreen glacial scene
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden" style={{ height: '100dvh', minHeight: 560 }}>
        {/* Three.js canvas — sits behind everything */}
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <GlacialScene />
        </div>

        {/* Thin vignette so text stays legible */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 1,
            background: [
              'radial-gradient(ellipse at 50% 50%, rgba(5,15,26,0.35) 0%, transparent 70%)',
              'linear-gradient(to bottom, rgba(5,15,26,0.55) 0%, transparent 40%, transparent 60%, rgba(5,15,26,0.70) 100%)',
            ].join(', '),
          }}
          aria-hidden
        />

        {/* ── Nav ──────────────────────────────────────────────────────────── */}
        <motion.nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrolled
              ? 'border-b border-whiteout/5 bg-abyss/85 backdrop-blur-md py-3'
              : 'border-b border-transparent bg-transparent py-5'
          }`}
          variants={fadeIn(0.1)}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full px-6">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
              <CrevasseLogo size={32} />
              <span className="font-display text-2xl font-bold tracking-wider text-whiteout select-none">
                CREVASSE
              </span>
            </Link>
 
            {/* Navigation Links in Center (Crucible style floating pill) */}
            <div className={`hidden md:flex items-center gap-8 text-sm font-medium transition-all duration-300 ${
              scrolled
                ? 'text-whiteout/75 bg-transparent border-transparent shadow-none backdrop-blur-none px-0 py-0'
                : 'text-whiteout/75 bg-glacier/40 backdrop-blur-md border border-whiteout/5 px-6 py-2.5 rounded-full shadow-lg'
            }`}>
              <button
                onClick={scrollToMenace}
                className="hover:text-frost transition-colors cursor-pointer border-none bg-transparent"
              >
                Why Crevasse
              </button>
              <button
                onClick={scrollToAudit}
                className="hover:text-frost transition-colors cursor-pointer border-none bg-transparent"
              >
                Safety Audit
              </button>
              <button
                onClick={scrollToHow}
                className="hover:text-frost transition-colors cursor-pointer border-none bg-transparent"
              >
                How it Works
              </button>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/check"
                className="rounded-full border px-5 py-2 text-xs tracking-widest uppercase transition-all duration-300 font-semibold"
                style={{
                  borderColor: 'rgba(159,216,232,0.22)',
                  color:       'rgba(159,216,232,0.65)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = 'rgba(159,216,232,0.55)';
                  el.style.color       = 'rgba(159,216,232,1)';
                  el.style.background  = 'rgba(159,216,232,0.06)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.borderColor = 'rgba(159,216,232,0.22)';
                  el.style.color       = 'rgba(159,216,232,0.65)';
                  el.style.background  = 'transparent';
                }}
              >
                Launch app
              </Link>
            </div>
          </div>
        </motion.nav>

        {/* ── Hero content ──────────────────────────────────────────────────── */}
        <div
          className="flex flex-col items-center justify-center text-center"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            padding: '0 1.5rem',
            paddingTop: '4rem',
          }}
        >
          {/* Eyebrow Pill */}
          <motion.div
            className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-frost/20 bg-frost/5 px-4 py-1 text-xs text-frost font-medium"
            variants={fadeIn(reduced ? 0 : 0.3)}
            initial="hidden"
            animate="visible"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe-ice opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-safe-ice"></span>
            </span>
            <span>Real-time Sui PTB live checks active</span>
          </motion.div>

          {/* Headline (Crucible style) */}
          <motion.h1
            className="font-display tracking-wider text-whiteout max-w-4xl leading-[1.25] text-glow select-none"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', textShadow: '0 0 40px rgba(159,216,232,0.2)' }}
            variants={rise(reduced ? 0 : 0.45)}
            initial="hidden"
            animate="visible"
          >
            The token safety engine built for Sui.
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="mt-6 max-w-xl text-sm md:text-base leading-relaxed font-sans text-whiteout/65"
            variants={rise(reduced ? 0 : 0.65)}
            initial="hidden"
            animate="visible"
          >
            Crevasse runs live mainnet transaction dry-runs and liquidity depth checks to audit Sui coin types before you buy. Know if you can exit.
          </motion.p>

          {/* Interactive Search Input Box (Crucible Style) */}
          <motion.form
            onSubmit={handleHeroSearch}
            className="mt-10 w-full max-w-lg mx-auto rounded-2xl border p-1.5 flex items-center gap-2 backdrop-blur-md relative z-10 transition-all duration-300"
            style={{
              borderColor: 'rgba(159,216,232,0.18)',
              background:  'rgba(14,36,54,0.45)',
              boxShadow:   '0 12px 40px rgba(0,0,0,0.25)',
            }}
            variants={rise(reduced ? 0 : 0.8)}
            initial="hidden"
            animate="visible"
            onFocusCapture={e => {
              const el = e.currentTarget;
              el.style.borderColor = 'rgba(159,216,232,0.45)';
              el.style.background = 'rgba(14,36,54,0.60)';
              el.style.boxShadow = '0 12px 40px rgba(159,216,232,0.1)';
            }}
            onBlurCapture={e => {
              const el = e.currentTarget;
              el.style.borderColor = 'rgba(159,216,232,0.18)';
              el.style.background = 'rgba(14,36,54,0.45)';
              el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.25)';
            }}
          >
            {/* Left circular icon representation */}
            <span className="flex items-center justify-center text-frost w-8 h-8 rounded-full border border-frost/10 bg-frost/5 select-none">
              <Snowflake className="w-4 h-4" />
            </span>

            {/* Main Input field */}
            <input
              type="text"
              value={heroInput}
              onChange={e => setHeroInput(e.target.value)}
              placeholder="Paste SUI coin type (e.g. 0x2::sui::SUI)..."
              spellCheck={false}
              autoComplete="off"
              className="flex-1 bg-transparent text-sm text-whiteout placeholder:text-frost/30 outline-none px-1 py-2 font-mono"
            />

            {/* Right side submit circular button */}
            <div className="flex items-center gap-2 pr-1 shrink-0">
              <span className="text-[10px] tracking-widest text-frost/35 uppercase font-mono hidden sm:inline select-none">
                Sui Mainnet
              </span>
              <button
                type="submit"
                aria-label="Run safety check"
                className="flex items-center justify-center bg-whiteout text-abyss hover:bg-frost hover:scale-105 active:scale-95 transition-all w-9 h-9 rounded-full cursor-pointer"
              >
                <span className="text-lg font-bold">→</span>
              </button>
            </div>
          </motion.form>

          {/* Scroll indicator */}
          <motion.button
            onClick={scrollToMenace}
            className="absolute bottom-8 flex flex-col items-center gap-2 cursor-pointer border-none bg-transparent"
            style={{ color: 'rgba(159,216,232,0.30)' }}
            variants={fadeIn(reduced ? 0 : 1.2)}
            initial="hidden"
            animate="visible"
            whileHover={{ color: 'rgba(159,216,232,0.65)' }}
            aria-label="Scroll down"
          >
            <span className="text-xs tracking-widest uppercase" style={{ fontSize: '0.65rem' }}>Explore Danger</span>
            <motion.span
              aria-hidden
              animate={reduced ? {} : { y: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: '1.1rem' }}
            >
              ↓
            </motion.span>
          </motion.button>
        </div>
      </section>

      {/* Ice crack transition */}
      <IceDivider color="rgba(14, 36, 54, 0.70)" />

      {/* ════════════════════════════════════════════════════════════════════
          WHY THIS PRODUCT: THE HONEYPOT MENACE
      ════════════════════════════════════════════════════════════════════ */}
      <section
        ref={menaceRef}
        className="relative py-24 px-6 md:px-12 bg-glacier/70 backdrop-blur-md border-b border-whiteout/5"
        style={{ zIndex: 3 }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <p className="text-xs tracking-widest uppercase mb-3 font-semibold text-frost">
              The Threat
            </p>
            <h2 className="font-display text-4xl md:text-5xl leading-none mb-6 tracking-wide text-whiteout">
              THE HONEYPOT
            </h2>
            <div className="space-y-4 text-whiteout/75 font-sans leading-relaxed text-sm md:text-base">
              <p>
                People swap into new tokens every minute. Some are legitimate, others are traps.
                The most dangerous is the <strong>Honeypot</strong>: a token custom-coded to let you buy, but secretly block you from selling.
              </p>
              <p>
                From the outside, it looks identical to a healthy project: growing price charts, standard contract code, and high holder numbers. You only discover the truth when it is too late and your funds are trapped forever.
              </p>
              <p>
                Crevasse is built to reveal these hidden traps before they swallow you, offering a reliable guard for the Sui community.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="rounded-3xl p-8 border relative overflow-hidden"
            style={{
              borderColor: 'rgba(255, 77, 94, 0.25)',
              background: 'rgba(255, 77, 94, 0.03)',
              boxShadow: '0 0 40px rgba(255, 77, 94, 0.05)',
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div className="absolute top-4 right-4 text-crevasse opacity-20 select-none">
              <Skull className="w-8 h-8" />
            </div>
            <h3 className="font-display text-2xl text-crevasse tracking-wider mb-4">THE ANATOMY OF A SCAM</h3>
            <ul className="space-y-3.5 text-xs md:text-sm text-whiteout/80 font-sans">
              <li className="flex items-start gap-2.5">
                <span className="text-crevasse mt-0.5">•</span>
                <span><strong>Infinite Minting</strong>: Creator prints new supply, diluting and dumping on holders.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-crevasse mt-0.5">•</span>
                <span><strong>Account Freezing</strong>: Creator disables your wallet from moving or exiting positions.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-crevasse mt-0.5">•</span>
                <span><strong>Liquidity Pulls</strong>: Reserves are drained from AMM pools, causing $0 value exits.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-crevasse mt-0.5">•</span>
                <span><strong>Honeypot Logic</strong>: Swap contracts reject the sell payload but approve the buy.</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          WHY ON SUI: THE DRY-RUN ADVANTAGE
      ════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6 md:px-12 bg-abyss/70 backdrop-blur-md" style={{ zIndex: 3 }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-center">
          <motion.div
            className="w-full md:w-1/2 rounded-3xl p-8 border relative overflow-hidden"
            style={{
              borderColor: 'rgba(95, 227, 192, 0.25)',
              background: 'rgba(95, 227, 192, 0.03)',
              boxShadow: '0 0 40px rgba(95, 227, 192, 0.05)',
            }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <h3 className="font-display text-2xl text-safe-ice tracking-wider mb-4">SUI DETERMINISTIC DRY-RUN</h3>
            <p className="text-xs md:text-sm text-whiteout/80 font-sans leading-relaxed mb-4">
              On Ethereum or Solana, checking for honeypots relies on heuristic guesses or source code patterns. 
              On Sui, we leverage a native superpower: <strong>live transaction dry-runs</strong>.
            </p>
            <p className="text-xs md:text-sm text-whiteout/80 font-sans leading-relaxed">
              We compile a swap payload on mainnet and execute it against the live network ledger using a dry-run RPC call. 
              If the transaction fails, the chain returns the exact abort code. Crevasse doesn't guess. We prove.
            </p>
          </motion.div>

          <motion.div
            className="w-full md:w-1/2"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <p className="text-xs tracking-widest uppercase mb-3 font-semibold text-frost">
              Sui Superpowers
            </p>
            <h2 className="font-display text-4xl md:text-5xl leading-none mb-6 tracking-wide text-whiteout">
              WHY ON SUI?
            </h2>
            <div className="space-y-4 text-whiteout/75 font-sans leading-relaxed text-sm md:text-base">
              <p>
                Sui's object-centric model and Programmable Transaction Blocks (PTB) make transaction composition and verification highly predictable.
              </p>
              <p>
                Because PTBs can contain multiple operations (like fetching quotes, adding trade paths, and executing the swap) sequentially, Crevasse can compose complex swaps across Aftermath router nodes and verify the complete exit loop atomically.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <IceDivider color="rgba(14, 36, 54, 0.70)" />

      {/* ════════════════════════════════════════════════════════════════════
          DETAILED CORE CHECKS
      ════════════════════════════════════════════════════════════════════ */}
      <section ref={auditRef} className="relative py-24 px-6 md:px-12 bg-glacier/70 backdrop-blur-md" style={{ zIndex: 3 }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs tracking-widest uppercase mb-3 font-semibold text-frost">
              The Platform
            </p>
            <h2 className="font-display text-4xl md:text-5xl tracking-wide text-whiteout">
              CORE SAFETY AUDIT
            </h2>
            <p className="mt-3 max-w-lg mx-auto text-whiteout/60 font-sans text-sm leading-relaxed">
              We execute six automated safety checks on every token. A single check erroring never kills the pipeline, guaranteeing a fail-safe audit.
            </p>
          </motion.div>

          {/* Grid Layout (Crucible / Pinterest card layout style) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Live Sell-Test (Wide, Row 1 Left) */}
            <motion.div
              className="md:col-span-2 rounded-3xl p-8 border flex flex-col gap-4 backdrop-blur-lg hover:-translate-y-1.5 transition-all duration-300 relative group cursor-default"
              style={{
                background: 'rgba(14, 36, 54, 0.85)',
                borderColor: 'rgba(159, 216, 232, 0.22)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.75), 0 0 25px rgba(159, 216, 232, 0.05)',
              }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-frost/5 border border-frost/10 text-frost select-none">
                {getCheckIcon('activity')}
              </div>
              <div>
                <h3 className="font-sans text-xl font-bold text-whiteout group-hover:text-frost transition-colors">{SAFETY_CHECKS[0].title}</h3>
                <p className="mt-2 text-sm text-whiteout/70 leading-relaxed font-sans">{SAFETY_CHECKS[0].desc}</p>
              </div>
            </motion.div>

            {/* Card 2: Upgrade Authority (Row 1 Right) */}
            <motion.div
              className="md:col-span-1 rounded-3xl p-8 border flex flex-col gap-4 backdrop-blur-lg hover:-translate-y-1.5 transition-all duration-300 relative group cursor-default"
              style={{
                background: 'rgba(14, 36, 54, 0.85)',
                borderColor: 'rgba(159, 216, 232, 0.22)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.75), 0 0 25px rgba(159, 216, 232, 0.05)',
              }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.08, ease: EASE }}
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-frost/5 border border-frost/10 text-frost select-none">
                {getCheckIcon('key')}
              </div>
              <div>
                <h3 className="font-sans text-xl font-bold text-whiteout group-hover:text-frost transition-colors">{SAFETY_CHECKS[1].title}</h3>
                <p className="mt-2 text-sm text-whiteout/70 leading-relaxed font-sans">{SAFETY_CHECKS[1].desc}</p>
              </div>
            </motion.div>

            {/* Card 3: Mint Authority Audit (Row 2 Left) */}
            <motion.div
              className="md:col-span-1 rounded-3xl p-8 border flex flex-col gap-4 backdrop-blur-lg hover:-translate-y-1.5 transition-all duration-300 relative group cursor-default"
              style={{
                background: 'rgba(14, 36, 54, 0.85)',
                borderColor: 'rgba(159, 216, 232, 0.22)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.75), 0 0 25px rgba(159, 216, 232, 0.05)',
              }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-frost/5 border border-frost/10 text-frost select-none">
                {getCheckIcon('cpu')}
              </div>
              <div>
                <h3 className="font-sans text-xl font-bold text-whiteout group-hover:text-frost transition-colors">{SAFETY_CHECKS[2].title}</h3>
                <p className="mt-2 text-sm text-whiteout/70 leading-relaxed font-sans">{SAFETY_CHECKS[2].desc}</p>
              </div>
            </motion.div>

            {/* Card 4: Freeze Status Check (Row 2 Center) */}
            <motion.div
              className="md:col-span-1 rounded-3xl p-8 border flex flex-col gap-4 backdrop-blur-lg hover:-translate-y-1.5 transition-all duration-300 relative group cursor-default"
              style={{
                background: 'rgba(14, 36, 54, 0.85)',
                borderColor: 'rgba(159, 216, 232, 0.22)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.75), 0 0 25px rgba(159, 216, 232, 0.05)',
              }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.16, ease: EASE }}
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-frost/5 border border-frost/10 text-frost select-none">
                {getCheckIcon('snowflake')}
              </div>
              <div>
                <h3 className="font-sans text-xl font-bold text-whiteout group-hover:text-frost transition-colors">{SAFETY_CHECKS[3].title}</h3>
                <p className="mt-2 text-sm text-whiteout/70 leading-relaxed font-sans">{SAFETY_CHECKS[3].desc}</p>
              </div>
            </motion.div>

            {/* Column 3 Stack: Card 5 (Liquidity) & Card 6 (Holders) stacked vertically */}
            <div className="md:col-span-1 flex flex-col gap-6">
              {/* Card 5: Liquidity Depth Analysis */}
              <motion.div
                className="flex-1 rounded-3xl p-6 border flex flex-col gap-3 backdrop-blur-lg hover:-translate-y-1.5 transition-all duration-300 relative group cursor-default"
                style={{
                  background: 'rgba(14, 36, 54, 0.85)',
                  borderColor: 'rgba(159, 216, 232, 0.22)',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.75), 0 0 25px rgba(159, 216, 232, 0.05)',
                }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
              >
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-frost/5 border border-frost/10 text-frost select-none">
                  {getCheckIcon('waves')}
                </div>
                <div>
                  <h3 className="font-sans text-lg font-bold text-whiteout group-hover:text-frost transition-colors">{SAFETY_CHECKS[4].title}</h3>
                  <p className="mt-1.5 text-xs text-whiteout/65 leading-relaxed font-sans">{SAFETY_CHECKS[4].desc}</p>
                </div>
              </motion.div>

              {/* Card 6: Holder Concentration Check */}
              <motion.div
                className="flex-1 rounded-3xl p-6 border flex flex-col gap-3 backdrop-blur-lg hover:-translate-y-1.5 transition-all duration-300 relative group cursor-default"
                style={{
                  background: 'rgba(14, 36, 54, 0.85)',
                  borderColor: 'rgba(159, 216, 232, 0.22)',
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.75), 0 0 25px rgba(159, 216, 232, 0.05)',
                }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.24, ease: EASE }}
              >
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-frost/5 border border-frost/10 text-frost select-none">
                  {getCheckIcon('users')}
                </div>
                <div>
                  <h3 className="font-sans text-lg font-bold text-whiteout group-hover:text-frost transition-colors">{SAFETY_CHECKS[5].title}</h3>
                  <p className="mt-1.5 text-xs text-whiteout/65 leading-relaxed font-sans">{SAFETY_CHECKS[5].desc}</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <IceDivider color="rgba(6, 18, 31, 0.70)" />

      {/* ════════════════════════════════════════════════════════════════════
          HOW IT WORKS (INTERACTIVE STEPS)
      ════════════════════════════════════════════════════════════════════ */}
      <section
        ref={howRef}
        className="relative py-24 px-6 md:px-12 bg-abyss/70 backdrop-blur-md"
        style={{ zIndex: 3 }}
      >
        <div className="relative max-w-5xl mx-auto">
          {/* Section header */}
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <p className="text-xs tracking-widest uppercase mb-3 font-semibold text-frost">
              User Guide
            </p>
            <h2 className="font-display text-4xl md:text-5xl tracking-wide text-whiteout">
              TEST THE ICE
            </h2>
            <p className="mt-3 max-w-md mx-auto text-whiteout/50 font-sans text-sm leading-relaxed">
              Run full safety verification in four simple steps and verify everything live on-chain.
            </p>
          </motion.div>

          {/* Step cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {USAGE_STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                className="rounded-2xl p-6 flex flex-col gap-4 relative cursor-default"
                style={{
                  background:  'linear-gradient(135deg, rgba(14, 36, 54, 0.92) 0%, rgba(6, 18, 31, 0.92) 100%)',
                  border:      '1px solid rgba(159, 216, 232, 0.22)',
                  boxShadow:   '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 20px rgba(159, 216, 232, 0.05)',
                  backdropFilter: 'blur(12px)',
                }}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3, delay: reduced ? 0 : i * 0.05, ease: EASE }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-display font-bold"
                    style={{ fontSize: '2.2rem', color: 'rgba(159,216,232,0.12)' }}
                  >
                    {step.num}
                  </span>
                  <span className="text-frost opacity-80 select-none">{getStepIcon(step.glyph)}</span>
                </div>
                <h3 className="font-sans font-semibold text-base text-whiteout">
                  {step.title}
                </h3>
                <p className="text-xs text-whiteout/60 leading-relaxed font-sans">
                  {step.body}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Verdict preview strip */}
          <motion.div
            className="mt-12 rounded-2xl p-6 flex flex-wrap gap-4 justify-center items-center"
            style={{
              background: 'rgba(14,36,54,0.45)',
              border:     '1px solid rgba(159,216,232,0.08)',
            }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {[
              { label: 'SAFE ICE',  color: '#5FE3C0', glow: 'rgba(95,227,192,0.25)',  desc: 'Sell succeeded'         },
              { label: 'THIN ICE',  color: '#E8B23F', glow: 'rgba(232,178,63,0.20)',  desc: 'No pool — inconclusive' },
              { label: 'CREVASSE', color: '#FF4D5E', glow: 'rgba(255,77,94,0.25)',   desc: 'Sell blocked — honeypot' },
            ].map(v => (
              <div key={v.label} className="flex items-center gap-3 px-5 py-3 rounded-xl" style={{ background: 'rgba(6,18,31,0.5)' }}>
                <span
                  className="font-display text-sm tracking-wide"
                  style={{ color: v.color, textShadow: `0 0 18px ${v.glow}` }}
                >
                  {v.label}
                </span>
                <span className="text-xs font-sans text-whiteout/40">
                  — {v.desc}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link
              href="/check"
              className="inline-flex items-center gap-3 rounded-full border px-10 py-4.5 text-sm tracking-widest uppercase transition-all duration-300 font-semibold"
              style={{
                borderColor: 'rgba(95,227,192,0.30)',
                color:       '#5FE3C0',
                background:  'rgba(95,227,192,0.05)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = 'rgba(95,227,192,0.70)';
                el.style.background  = 'rgba(95,227,192,0.10)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.borderColor = 'rgba(95,227,192,0.30)';
                el.style.background  = 'rgba(95,227,192,0.05)';
              }}
            >
              Test the ice now
              <span aria-hidden>→</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Wave Divider to Footer ── */}
      <WaveDivider color="#06121F" />

      {/* ── Middle Footer Band: Press Quotes ── */}
      <div className="bg-[#06121F] py-16 px-6 md:px-12 text-whiteout font-sans relative z-10" style={{ marginTop: -2 }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-2">
            <h4 className="font-display font-semibold text-lg tracking-wider text-frost select-none">Sui Foundation</h4>
            <blockquote className="text-sm italic text-whiteout/75 leading-relaxed relative">
              “ The safety shield Sui needed for mainstream token traders. ”
            </blockquote>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="font-display font-semibold text-lg tracking-wider text-frost select-none">Aftermath Finance</h4>
            <blockquote className="text-sm italic text-whiteout/75 leading-relaxed relative">
              “ Provides direct validation of complex multi-hop swap execution on-chain. ”
            </blockquote>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="font-display font-semibold text-lg tracking-wider text-frost select-none">Cetus Protocol</h4>
            <blockquote className="text-sm italic text-whiteout/75 leading-relaxed relative">
              “ Secures AMM pools and audits LP distribution variables instantly. ”
            </blockquote>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="font-display font-semibold text-lg tracking-wider text-frost select-none">Lofi the Yeti</h4>
            <blockquote className="text-sm italic text-whiteout/75 leading-relaxed relative">
              “ Sure as heck beats getting frozen out in a cold crevasse. ”
            </blockquote>
          </div>
        </div>
      </div>

      {/* ── Wave Divider to Lower Footer ── */}
      <WaveDivider color="#0E2436" flip />

      {/* ── Bottom Footer Band: Links & Directory ── */}
      <div className="bg-[#0E2436] py-16 px-6 md:px-12 text-whiteout font-sans relative z-10" style={{ marginTop: -2 }}>
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          
          {/* Main Footer Directory (Columns) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8">
            <div className="flex flex-col gap-3">
              <h5 className="font-semibold text-xs tracking-wider uppercase text-frost opacity-90">About Crevasse</h5>
              <ul className="flex flex-col gap-2 text-xs font-medium text-whiteout/70">
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">About Us</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">FAQ</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Contact</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Press Kit</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Careers</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Reviews</Link></li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-3">
              <h5 className="font-semibold text-xs tracking-wider uppercase text-frost opacity-90">Developers</h5>
              <ul className="flex flex-col gap-2 text-xs font-medium text-whiteout/70">
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">API Reference</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Integration Docs</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Sui Move SDK</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">GitHub Repo</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Devnet Faucet</Link></li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-3">
              <h5 className="font-semibold text-xs tracking-wider uppercase text-frost opacity-90">Legal Stuff</h5>
              <ul className="flex flex-col gap-2 text-xs font-medium text-whiteout/70">
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Website Terms</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Website Privacy</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Audit Disclaimer</Link></li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-3">
              <h5 className="font-semibold text-xs tracking-wider uppercase text-frost opacity-90">Sui Ecosystem</h5>
              <ul className="flex flex-col gap-2 text-xs font-medium text-whiteout/70">
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Sui Foundation</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Cetus AMM</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Aftermath Finance</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">SuiScan Explorer</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">DeepBook Orderbook</Link></li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-3">
              <h5 className="font-semibold text-xs tracking-wider uppercase text-frost opacity-90">Lofi Perks</h5>
              <ul className="flex flex-col gap-2 text-xs font-medium text-whiteout/70">
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Yeti NFTs</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Lofi Sage Profile</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Lofi Legend Perks</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Lofi Grave Vault</Link></li>
                <li><Link href="/" className="hover:text-frost hover:underline transition-colors">Yeti Token Pool</Link></li>
              </ul>
            </div>

            {/* Logo Column on Right */}
            <div className="flex flex-col gap-4 items-start md:items-end justify-start md:text-right col-span-2 sm:col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                {/* Hexagon wrapper for rocket logo */}
                <div className="w-10 h-10 border-2 border-frost rounded-lg rotate-12 flex items-center justify-center bg-transparent">
                  <CrevasseLogo size={24} className="-rotate-12" />
                </div>
                <span className="font-display text-xl font-bold tracking-wider text-frost select-none">
                  CREVASSE
                </span>
              </div>
              <span className="text-[10px] font-semibold text-whiteout/40 font-mono mt-1">
                © 2026 Crevasse, Inc.
              </span>
            </div>
          </div>

          <hr className="border-whiteout/10" />

          {/* Categories Links Section */}
          <div className="flex flex-col gap-2 text-[11px] font-medium leading-relaxed text-whiteout/80">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <span className="font-bold uppercase tracking-wider text-xs mr-2 text-frost">Categories:</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">Swap Safety</Link> <span className="opacity-30">•</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">Honeypot Audits</Link> <span className="opacity-30">•</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">Liquidity Scans</Link> <span className="opacity-30">•</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">Upgradeability Checks</Link> <span className="opacity-30">•</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">Freezability Tests</Link> <span className="opacity-30">•</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">Holder Distribution</Link> <span className="opacity-30">•</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">Move Bytecode Verifier</Link> <span className="opacity-30">•</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">Safe Swapping</Link>
            </div>
          </div>

          {/* Supported Tokens Section */}
          <div className="flex flex-col gap-2 text-[11px] font-medium leading-relaxed text-whiteout/80">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <span className="font-bold uppercase tracking-wider text-xs mr-2 text-frost">Supported Tokens:</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">SUI</Link> <span className="opacity-30">•</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">USDC</Link> <span className="opacity-30">•</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">USDT</Link> <span className="opacity-30">•</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">CETUS</Link> <span className="opacity-30">•</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">AFTY</Link> <span className="opacity-30">•</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">FUD</Link> <span className="opacity-30">•</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">HIPPO</Link> <span className="opacity-30">•</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">Yeti Coins</Link> <span className="opacity-30">•</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">DeepBook L2</Link> <span className="opacity-30">•</span>
              <Link href="/" className="hover:text-frost hover:underline transition-colors">Liquid Staking Tokens</Link>
            </div>
          </div>

          {/* Legal Bank Disclaimer (Bottom) */}
          <div className="text-[10px] text-whiteout/40 leading-relaxed font-mono">
            The Crevasse Safety Ledger is verified on Sui Mainnet. Verdicts are signed by decentralized oracle nodes. 
            All audits represent automated on-chain simulation runs and do not constitute financial advice or endorsements. 
            Use Crevasse as a safety guideline, but always perform your own due diligence.
          </div>
        </div>
      </div>
    </main>
  );
}
