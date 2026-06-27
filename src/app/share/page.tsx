import type { Metadata } from 'next';
import Link from 'next/link';

type Verdict = 'safe' | 'thin' | 'crevasse';

type SP = Promise<{ verdict?: string; token?: string; score?: string }>;

function normalise(raw: string | undefined): Verdict {
  if (raw === 'safe')     return 'safe';
  if (raw === 'crevasse') return 'crevasse';
  return 'thin';
}

const LABEL: Record<Verdict, string> = {
  safe:     'SAFE ICE',
  thin:     'THIN ICE',
  crevasse: 'CREVASSE',
};

const DESC: Record<Verdict, (score: string) => string> = {
  safe:     s => `Score ${s}/100 — Live on-chain sell-test passed. This Sui token appears safe to trade.`,
  thin:     s => `Score ${s}/100 — Sell simulation inconclusive. No confirmed exit route. Proceed with caution.`,
  crevasse: s => `Score ${s}/100 — Sell was blocked on-chain. Confirmed honeypot. Do not buy this token.`,
};

const COLOR: Record<Verdict, string> = {
  safe:     'rgba(95,227,192,0.90)',
  thin:     'rgba(232,178,63,0.90)',
  crevasse: 'rgba(255,77,94,0.90)',
};

const YETI: Record<Verdict, string> = {
  safe:     'This ice holds. Cross freely.',
  thin:     'Step carefully. This ice is cracking.',
  crevasse: 'Do not step. There is a crevasse beneath this.',
};

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://crevasse.vercel.app';

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp  = await searchParams;
  const v   = normalise(sp.verdict);
  const tok = sp.token   ?? '';
  const s   = sp.score   ?? '—';

  const ogImg = `${BASE}/api/og?verdict=${v}`;
  const title = `${LABEL[v]} — CREVASSE Sui Token Safety`;
  const desc  = DESC[v](s);

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url:  `${BASE}/share?verdict=${v}&token=${encodeURIComponent(tok)}&score=${s}`,
      images: [{ url: ogImg, width: 1200, height: 630, alt: `${LABEL[v]} verdict card` }],
      siteName: 'CREVASSE',
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description: desc,
      images:      [ogImg],
    },
  };
}

export default async function SharePage({ searchParams }: { searchParams: SP }) {
  const sp    = await searchParams;
  const v     = normalise(sp.verdict);
  const token = sp.token ?? '';
  const score = sp.score ?? '—';

  const checkUrl = token ? `/check?token=${encodeURIComponent(token)}` : '/check';

  return (
    <div className="min-h-screen bg-abyss flex flex-col items-center justify-center gap-8 px-6 text-center font-sans">

      <p
        className="text-[10px] font-semibold tracking-widest uppercase"
        style={{ color: 'rgba(159,216,232,0.40)' }}
      >
        CREVASSE · Sui Token Safety
      </p>

      <h1
        className="font-display font-bold leading-none"
        style={{ fontSize: 'clamp(3rem, 12vw, 6rem)', color: COLOR[v] }}
      >
        {LABEL[v]}
      </h1>

      <p className="italic text-base max-w-xs" style={{ color: 'rgba(234,246,250,0.55)' }}>
        &ldquo;{YETI[v]}&rdquo;
      </p>

      {score !== '—' && (
        <p className="font-mono text-xs" style={{ color: 'rgba(159,216,232,0.35)' }}>
          Safety score: {score}/100
        </p>
      )}

      <Link
        href={checkUrl}
        className="rounded-full border px-8 py-3.5 text-xs tracking-widest uppercase font-semibold transition-all duration-300"
        style={{
          borderColor: 'rgba(159,216,232,0.30)',
          color: 'rgba(159,216,232,0.80)',
          background: 'rgba(159,216,232,0.04)',
        }}
      >
        View full safety report →
      </Link>

    </div>
  );
}
