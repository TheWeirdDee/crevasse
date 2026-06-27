'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCurrentAccount, useConnectWallet, useDisconnectWallet, useWallets } from '@mysten/dapp-kit';
import IceReveal, { type RevealState } from '@/components/IceReveal';
import CrevasseLogo from '@/components/CrevasseLogo';
import {
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  Bookmark,
  Loader2,
  ExternalLink,
  Wallet,
  ArrowLeft,
} from 'lucide-react';

interface CheckResult {
  token:    string;
  verdict:  'safe' | 'thin' | 'crevasse';
  score:    number;
  sellTest: { status: 'pass'; simulated: boolean } | { status: 'fail'; error: string } | { status: 'unavailable' };
  mintAuthority:   { status: 'pass' | 'fail' | 'warn' | 'unavailable'; explanation: string };
  freezeAuthority: { status: 'pass' | 'fail' | 'warn' | 'unavailable'; explanation: string };
  liquidity:       { status: 'pass' | 'fail' | 'warn' | 'unavailable'; explanation: string };
  holders:         { status: 'pass' | 'fail' | 'warn' | 'unavailable'; explanation: string };
  onChain:  { txDigest: string; explorerUrl: string } | null;
}

/* ── Check-item row ─────────────────────────────────────────────────────────── */
function CheckRow({
  icon, label, status, delay = 0,
}: {
  icon:   React.ReactNode;
  label:  string;
  status: 'pass' | 'fail' | 'warn' | 'unavailable' | 'pending';
  delay?: number;
}) {
  const color =
    status === 'pass'        ? 'rgba(95,227,192,0.90)'  :
    status === 'fail'        ? 'rgba(255,77,94,0.90)'   :
    status === 'warn'        ? 'rgba(232,178,63,0.90)'  :
    status === 'unavailable' ? 'rgba(232,178,63,0.85)'  :
    'rgba(159,216,232,0.28)';

  return (
    <motion.div
      className="flex items-start gap-3 py-2.5 text-sm"
      style={{
        color,
        borderBottom: '1px solid rgba(159,216,232,0.07)',
      }}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, delay }}
    >
      <span className="shrink-0 mt-0.5 select-none">{icon}</span>
      <span>{label}</span>
    </motion.div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────── */
function CheckContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams ? searchParams.get('token') : null;

  const [input,       setInput]       = useState(tokenParam || '');
  const [revealState, setRevealState] = useState<RevealState>('idle');
  const [result,      setResult]      = useState<CheckResult | null>(null);
  const [apiError,    setApiError]    = useState<string | null>(null);

  const currentAccount = useCurrentAccount();
  const wallets = useWallets();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();

  const [showWalletModal, setShowWalletModal] = useState(false);
  const walletAddress = currentAccount?.address ?? null;
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    const token = input.trim();
    if (!token) return;
    router.push(`/check?token=${encodeURIComponent(token)}`);
  }

  useEffect(() => {
    let active = true;

    async function runCheck() {
      if (!tokenParam) {
        setInput('');
        setResult(null);
        setRevealState('idle');
        setApiError(null);
        return;
      }

      setInput(tokenParam);
      setRevealState('checking');
      setResult(null);
      setApiError(null);

      try {
        const res  = await fetch(`/api/check?token=${encodeURIComponent(tokenParam)}`);
        const data = await res.json();

        if (!active) return;

        if (!res.ok) {
          setApiError(data.error ?? 'Something went wrong. Try again.');
          setRevealState('idle');
          return;
        }

        setResult(data);
        setRevealState(data.verdict);
      } catch {
        if (!active) return;
        setApiError("Couldn't reach Sui right now. Try again.");
        setRevealState('idle');
      }
    }

    runCheck();

    return () => {
      active = false;
    };
  }, [tokenParam]);

  const sellError = result?.sellTest.status === 'fail' ? (result.sellTest as any).error : undefined;
  const checking  = revealState === 'checking';

  function fillDemo(coin: string) {
    setInput(coin);
    router.push(`/check?token=${encodeURIComponent(coin)}`);
    inputRef.current?.focus();
  }

  return (
    <div className="min-h-screen bg-abyss flex flex-col">

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-whiteout/5 bg-abyss/60 backdrop-blur-md px-6 py-4"
      >
        <div className="flex items-center gap-3">
          <Link
            href={tokenParam ? "/check" : "/"}
            aria-label={tokenParam ? "Back to verification engine" : "Back to home"}
            className="w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer text-frost select-none"
            style={{
              borderColor: 'rgba(159, 216, 232, 0.15)',
              background: 'rgba(14, 36, 54, 0.5)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = 'rgba(159, 216, 232, 0.45)';
              el.style.color = '#FFFFFF';
              el.style.background = 'rgba(159, 216, 232, 0.08)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = 'rgba(159, 216, 232, 0.15)';
              el.style.color = '#9FD8E8';
              el.style.background = 'rgba(14, 36, 54, 0.5)';
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-whiteout hover:text-frost transition-colors ml-1"
          >
            <CrevasseLogo size={24} />
            <span>CREVASSE</span>
          </Link>
        </div>

        {/* Wallet connect */}
        {walletAddress ? (
          <button
            onClick={() => disconnect()}
            className="rounded-full border px-4 py-2 text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer"
            style={{
              borderColor: 'rgba(95,227,192,0.30)',
              color: '#5FE3C0',
              background: 'rgba(95,227,192,0.03)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = 'rgba(255,77,94,0.40)';
              el.style.color = '#FF4D5E';
              el.style.background = 'rgba(255,77,94,0.05)';
              el.textContent = 'Disconnect';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = 'rgba(95,227,192,0.30)';
              el.style.color = '#5FE3C0';
              el.style.background = 'rgba(95,227,192,0.03)';
              el.textContent = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
            }}
          >
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </button>
        ) : (
          <button
            onClick={() => setShowWalletModal(true)}
            className="rounded-full border px-5 py-2 text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer"
            style={{
              borderColor: 'rgba(159,216,232,0.22)',
              color: 'rgba(159,216,232,0.65)',
              background: 'transparent',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = 'rgba(159,216,232,0.55)';
              el.style.color = 'rgba(159,216,232,1)';
              el.style.background = 'rgba(159,216,232,0.06)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.borderColor = 'rgba(159,216,232,0.22)';
              el.style.color = 'rgba(159,216,232,0.65)';
              el.style.background = 'transparent';
            }}
          >
            <span className="flex items-center gap-1.5">
              Connect <Wallet className="w-3.5 h-3.5" />
            </span>
          </button>
        )}
      </nav>
 
      <main className="flex-1 flex flex-col items-center gap-8 px-4 sm:px-6 pt-24 pb-10 w-full max-w-2xl mx-auto">
 
        {/* Yeti Verified Badge */}
        <AnimatePresence>
          {walletAddress && (
            <motion.div
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium border"
              style={{
                background: 'rgba(95,227,192,0.06)',
                borderColor: 'rgba(95,227,192,0.22)',
                color: '#5FE3C0',
                textShadow: '0 0 12px rgba(95,227,192,0.25)',
              }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-safe-ice" />
              <span>Yeti Verified Member (NFT Perks Active)</span>
            </motion.div>
          )}
        </AnimatePresence>
 
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-whiteout">
            Test the ice.
          </h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: 'rgba(159,216,232,0.52)' }}>
            Paste a Sui coin type — we&apos;ll run a live on-chain sell test.
          </p>
        </div>
 
        {/* Input form */}
        <form onSubmit={handleCheck} className="w-full flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="0x2::sui::SUI"
            spellCheck={false}
            autoComplete="off"
            disabled={checking}
            className="flex-1 min-w-0 rounded-xl px-4 sm:px-5 py-3.5 text-sm font-mono text-whiteout placeholder:text-frost/25 outline-none transition-all disabled:opacity-50"
            style={{
              background: '#0E2436',
              border: '1px solid rgba(159,216,232,0.18)',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(159,216,232,0.45)')}
            onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(159,216,232,0.18)')}
          />
          <button
            type="submit"
            disabled={checking || !input.trim()}
            className="shrink-0 rounded-xl px-5 sm:px-7 py-3.5 text-xs tracking-widest uppercase font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(159,216,232,0.09)',
              border: '1px solid rgba(159,216,232,0.28)',
              color: '#9FD8E8',
            }}
            onMouseEnter={e => { if (!checking) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(159,216,232,0.18)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(159,216,232,0.09)'; }}
          >
            {checking ? '…' : 'Check'}
          </button>
        </form>
 
        {/* API-level error */}
        <AnimatePresence>
          {apiError && (
            <motion.p
              className="text-sm text-center"
              style={{ color: '#E8B23F' }}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {apiError}
            </motion.p>
          )}
        </AnimatePresence>
 
        {/* ── THE REVEAL ─────────────────────────────────────────────────────── */}
        <div className="w-full">
          <IceReveal state={revealState} errorString={sellError} />
        </div>
 
        {/* ── Check results ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {result && (
            <motion.div
              className="w-full flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.2 }}
            >
              {/* Sell test result — the headline check */}
              <CheckRow
                icon={
                  result.sellTest.status === 'pass'
                    ? <CheckCircle2 className="w-4 h-4 text-safe-ice" />
                    : result.sellTest.status === 'fail'
                    ? <AlertOctagon className="w-4 h-4 text-crevasse" />
                    : <AlertTriangle className="w-4 h-4 text-thin-ice" />
                }
                label={
                  result.sellTest.status === 'pass'
                    ? (result.sellTest.simulated
                        ? 'Sell simulation passed — on-chain devInspect confirmed token is sellable.'
                        : 'Native Sui token — inherently sellable, no simulation required.')
                    : result.sellTest.status === 'fail'
                    ? 'HONEYPOT — sell was blocked by the contract.'
                    : 'Sell simulation unavailable — verdict based on remaining checks.'
                }
                status={result.sellTest.status}
                delay={0.05}
              />
 
              {/* Mint authority check */}
              <CheckRow
                icon={
                  result.mintAuthority.status === 'pass'
                    ? <CheckCircle2 className="w-4 h-4 text-safe-ice" />
                    : result.mintAuthority.status === 'fail'
                    ? <AlertOctagon className="w-4 h-4 text-crevasse" />
                    : <AlertTriangle className="w-4 h-4 text-thin-ice" />
                }
                label={`Mint authority — ${result.mintAuthority.explanation}`}
                status={result.mintAuthority.status}
                delay={0.12}
              />
 
              {/* Freeze authority check */}
              <CheckRow
                icon={
                  result.freezeAuthority.status === 'pass'
                    ? <CheckCircle2 className="w-4 h-4 text-safe-ice" />
                    : result.freezeAuthority.status === 'fail'
                    ? <AlertOctagon className="w-4 h-4 text-crevasse" />
                    : <AlertTriangle className="w-4 h-4 text-thin-ice" />
                }
                label={`Freeze authority — ${result.freezeAuthority.explanation}`}
                status={result.freezeAuthority.status}
                delay={0.17}
              />
 
              {/* Liquidity depth check */}
              <CheckRow
                icon={
                  result.liquidity.status === 'pass'
                    ? <CheckCircle2 className="w-4 h-4 text-safe-ice" />
                    : result.liquidity.status === 'fail'
                    ? <AlertOctagon className="w-4 h-4 text-crevasse" />
                    : <AlertTriangle className="w-4 h-4 text-thin-ice" />
                }
                label={`Liquidity depth — ${result.liquidity.explanation}`}
                status={result.liquidity.status}
                delay={0.22}
              />
 
              {/* Holder concentration check */}
              <CheckRow
                icon={
                  result.holders.status === 'pass'
                    ? <CheckCircle2 className="w-4 h-4 text-safe-ice" />
                    : result.holders.status === 'fail'
                    ? <AlertOctagon className="w-4 h-4 text-crevasse" />
                    : <AlertTriangle className="w-4 h-4 text-thin-ice" />
                }
                label={`Holder concentration — ${result.holders.explanation}`}
                status={result.holders.status}
                delay={0.27}
              />
 
              {/* On-chain record */}
              <motion.div
                className="mt-4 text-xs flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {result.onChain ? (
                  <a
                    href={result.onChain.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 transition-colors"
                    style={{ color: 'rgba(95,227,192,0.70)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(95,227,192,1)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(95,227,192,0.70)')}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-safe-ice" />
                    <span>Recorded on Sui</span>
                    <span style={{ fontSize: '0.65rem' }}>↗</span>
                  </a>
                ) : (
                  <span style={{ color: 'rgba(159,216,232,0.22)' }}>
                    ⛓ On-chain recording active after mainnet deploy
                  </span>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Demo shortcuts — only shown in idle state */}
        <AnimatePresence>
          {revealState === 'idle' && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-xs mb-2" style={{ color: 'rgba(159,216,232,0.30)' }}>
                Try a test token:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { label: 'SUI (safe)',      coin: '0x2::sui::SUI' },
                  { label: 'Honeypot (fail)', coin: `${process.env.NEXT_PUBLIC_HONEYPOT_PACKAGE_ID ?? '0x86d2cfbc27f610d1a2dc9517476dbc480eb0a0540237e21b4dd8db6b1a782947'}::honeypot_coin::HONEYPOT_COIN` },
                  { label: 'No pool',         coin: `${process.env.NEXT_PUBLIC_NOPOOL_PACKAGE_ID   ?? '0xf6ac633ac8ff5615fea6aaa329c519c4b48cf5235925f12fc4c24f97a9d67b5d'}::nopool_coin::NOPOOL_COIN` },
                ].map(({ label, coin }) => (
                  <button
                    key={label}
                    onClick={() => fillDemo(coin)}
                    className="rounded-full px-4 py-1.5 text-xs transition-all"
                    style={{
                      border: '1px solid rgba(159,216,232,0.16)',
                      color: 'rgba(159,216,232,0.45)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.color = 'rgba(159,216,232,0.80)';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(159,216,232,0.35)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.color = 'rgba(159,216,232,0.45)';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(159,216,232,0.16)';
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Yeti Watchlist */}
        <AnimatePresence>
          {walletAddress && (
            <motion.div
              className="w-full rounded-2xl p-5 flex flex-col gap-3 mt-4 border text-left"
              style={{
                background: 'rgba(14,36,54,0.45)',
                borderColor: 'rgba(159,216,232,0.08)',
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-frost/50 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-frost" />
                <span>Yeti Watchlist</span>
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  { name: 'SUI (Safe)', type: '0x2::sui::SUI' },
                  { name: 'USDC (Safe)', type: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC' },
                  { name: 'HPOT (Honeypot)', type: `${process.env.NEXT_PUBLIC_HONEYPOT_PACKAGE_ID ?? '0x86d2cfbc27f610d1a2dc9517476dbc480eb0a0540237e21b4dd8db6b1a782947'}::honeypot_coin::HONEYPOT_COIN` }
                ].map(item => (
                  <div key={item.name} className="flex justify-between items-center text-xs py-1.5 border-b border-whiteout/5 last:border-0">
                    <div className="flex flex-col">
                      <span className="font-semibold text-whiteout">{item.name}</span>
                      <span className="font-mono text-[10px] text-frost/30">{item.type.slice(0, 32)}...</span>
                    </div>
                    <button
                      onClick={() => fillDemo(item.type)}
                      className="px-2.5 py-1 rounded bg-frost/5 border border-frost/15 text-frost hover:bg-frost/15 transition-all text-[10px] uppercase font-bold cursor-pointer"
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Wallet Selector Modal */}
      <AnimatePresence>
        {showWalletModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-abyss/85 backdrop-blur-md px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl p-6 text-center flex flex-col gap-5 border"
              style={{
                background: '#0E2436',
                borderColor: 'rgba(159,216,232,0.18)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-display font-semibold text-lg text-whiteout">Connect Wallet</h3>
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="text-frost/40 hover:text-whiteout transition-colors border-none bg-transparent text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-left leading-relaxed" style={{ color: 'rgba(159,216,232,0.52)' }}>
                Connect a Sui wallet to unlock watchlists and Lofi NFT holder perks.
              </p>
              
              <div className="flex flex-col gap-2">
                {wallets.length === 0 ? (
                  <div className="text-xs text-frost/40 py-4 text-center">
                    No Sui wallets detected.<br />
                    Install Sui Wallet or suiet extension.
                  </div>
                ) : (
                  wallets.map(w => (
                    <button
                      key={w.name}
                      onClick={() => {
                        connect({ wallet: w });
                        setShowWalletModal(false);
                      }}
                      className="flex items-center justify-between rounded-xl px-4 py-3.5 text-xs tracking-wider uppercase font-medium transition-all text-left cursor-pointer"
                      style={{
                        background: 'rgba(159,216,232,0.04)',
                        border: '1px solid rgba(159,216,232,0.08)',
                        color: '#EAF6FA',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(159,216,232,0.09)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(159,216,232,0.22)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(159,216,232,0.04)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(159,216,232,0.08)';
                      }}
                    >
                      <span>{w.name}</span>
                      {w.icon ? (
                        <img src={w.icon} alt={w.name} className="w-5 h-5 object-contain" />
                      ) : (
                        <Wallet className="w-5 h-5 text-frost" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default function CheckPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-abyss flex flex-col items-center justify-center text-frost font-mono text-xs gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-frost" />
        <span>Initializing Safety Engine...</span>
      </div>
    }>
      <CheckContent />
    </Suspense>
  );
}
