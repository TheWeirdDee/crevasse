import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

type Verdict = 'safe' | 'thin' | 'crevasse';

function normalise(raw: string | null): Verdict {
  if (raw === 'safe')     return 'safe';
  if (raw === 'crevasse') return 'crevasse';
  return 'thin';
}

const LABEL:   Record<Verdict, string> = { safe: 'SAFE ICE',  thin: 'THIN ICE',  crevasse: 'CREVASSE' };
const COLOR:   Record<Verdict, string> = { safe: '#5FE3C0',   thin: '#E8B23F',   crevasse: '#FF4D5E'  };
const SUBLINE: Record<Verdict, string> = {
  safe:     'Live on-chain sell-test passed.',
  thin:     'Sell simulation inconclusive. Proceed with caution.',
  crevasse: 'Sell blocked on-chain. Confirmed honeypot.',
};
const EMOJI: Record<Verdict, string> = { safe: '✅', thin: '⚠️', crevasse: '🛑' };

export async function GET(req: NextRequest) {
  const v = normalise(new URL(req.url).searchParams.get('verdict'));

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(160deg, #102737 0%, #0E2436 40%, #06121F 100%)',
          padding: 80,
          position: 'relative',
        }}
      >
        {/* Top-left site label */}
        <div
          style={{
            position: 'absolute',
            top: 52,
            left: 68,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#9FD8E8',
              opacity: 0.50,
            }}
          />
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.20em',
              color: '#9FD8E8',
              opacity: 0.50,
              textTransform: 'uppercase',
            }}
          >
            CREVASSE · Sui Token Safety
          </div>
        </div>

        {/* Subtle border glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: `2px solid ${COLOR[v]}22`,
            borderRadius: 0,
          }}
        />

        {/* Emoji */}
        <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 28 }}>
          {EMOJI[v]}
        </div>

        {/* Verdict word */}
        <div
          style={{
            fontSize: 104,
            fontWeight: 900,
            letterSpacing: '0.05em',
            color: COLOR[v],
            lineHeight: 1,
            marginBottom: 28,
            textShadow: `0 0 80px ${COLOR[v]}55`,
          }}
        >
          {LABEL[v]}
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: 26,
            color: '#EAF6FA',
            opacity: 0.60,
            textAlign: 'center',
            maxWidth: 680,
            lineHeight: 1.45,
          }}
        >
          {SUBLINE[v]}
        </div>

        {/* Bottom-right domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 50,
            right: 68,
            fontSize: 16,
            color: '#9FD8E8',
            opacity: 0.30,
            letterSpacing: '0.12em',
          }}
        >
          crevasse.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
