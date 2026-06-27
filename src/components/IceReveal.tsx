'use client';

import { motion, useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Client-only — Framer Motion hooks inside YetiAvatar conflict with SSR,
// causing the entire verdict block to stay at opacity:0 if server-rendered.
const YetiAvatar = dynamic(() => import('./YetiAvatar'), { ssr: false });

export type RevealState = 'idle' | 'checking' | 'safe' | 'thin' | 'crevasse';

interface Props {
  state: RevealState;
  errorString?: string;
}

/* ── Jagged crack line through the centre of the pane ─────────────────────────
   Both halves share the same absolute-inset background.  When at x=0 they are
   seamless.  When translated apart the gap reveals the red glow behind.        */
const LEFT_CLIP  = 'polygon(0 0, 52% 0, 54% 11%, 50% 26%, 56% 46%, 48% 66%, 53% 83%, 50% 100%, 0 100%)';
const RIGHT_CLIP = 'polygon(52% 0, 100% 0, 100% 100%, 50% 100%, 53% 83%, 48% 66%, 56% 46%, 50% 26%, 54% 11%)';

/* ── Palette (mirrors globals.css) ─────────────────────────────────────────── */
const C = {
  abyss:    '#06121F',
  glacier:  '#0E2436',
  frost:    '#9FD8E8',
  safeIce:  '#5FE3C0',
  thinIce:  '#E8B23F',
  crevasse: '#FF4D5E',
} as const;

/* ── Ice texture backgrounds ────────────────────────────────────────────────── */
const iceSheen = `radial-gradient(ellipse at 28% 22%, rgba(159,216,232,0.07) 0%, transparent 52%)`;
const iceBase  = `linear-gradient(160deg, #102737 0%, ${C.glacier} 45%, #091c2e 80%, ${C.abyss} 100%)`;

function iceBg(state: RevealState): string {
  if (state === 'safe') {
    return [
      `radial-gradient(ellipse at 50% 48%, rgba(95,227,192,0.22) 0%, rgba(95,227,192,0.06) 38%, transparent 62%)`,
      iceSheen, iceBase,
    ].join(', ');
  }
  if (state === 'thin') {
    return [
      `radial-gradient(ellipse at 50% 48%, rgba(232,178,63,0.16) 0%, transparent 58%)`,
      iceSheen, iceBase,
    ].join(', ');
  }
  return [iceSheen, iceBase].join(', ');
}

/* ── Verdict copy ───────────────────────────────────────────────────────────── */
const LABEL = { safe: 'SAFE ICE', thin: 'THIN ICE', crevasse: 'CREVASSE' } as const;
const YETI  = {
  safe:     'This ice holds. Cross freely.',
  thin:     'Step carefully. This ice is cracking.',
  crevasse: 'Do not step. There is a crevasse beneath this.',
} as const;
const VERDICT_COLOR = { safe: C.safeIce, thin: C.thinIce, crevasse: C.crevasse } as const;
const VERDICT_GLOW  = {
  safe:     `0 0 40px rgba(95,227,192,0.35),  0 0 80px rgba(95,227,192,0.15)`,
  thin:     `0 0 40px rgba(232,178,63,0.30),  0 0 80px rgba(232,178,63,0.10)`,
  crevasse: `0 0 50px rgba(255,77,94,0.45),   0 0 100px rgba(255,77,94,0.20)`,
} as const;

type Verdict = 'safe' | 'thin' | 'crevasse';
function isVerdict(s: RevealState): s is Verdict { return s === 'safe' || s === 'thin' || s === 'crevasse'; }

/* ── Thin-ice SVG crack overlay ─────────────────────────────────────────────── */
function ThinIceCracks() {
  const pathProps = {
    fill: 'none',
    stroke: C.thinIce,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    filter: 'url(#crack-glow)',
  };
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <filter id="crack-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.4" result="blur" />
          <feComponentTransfer in="blur" result="glow">
            <feFuncA type="linear" slope="0.8" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Main crack */}
      <motion.path
        d="M 50,0 L 48,6 L 51,12 L 49,18 L 52,25 L 47,34 L 53,44 L 46,55 L 51,66 L 48,78 L 52,88 L 49,94 L 50,100"
        {...pathProps}
        strokeWidth="0.45"
        strokeOpacity="0.85"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.65, ease: 'easeOut', delay: 0.1 }}
      />
      {/* Left upper branch */}
      <motion.path
        d="M 49,18 L 38,22 L 34,20 L 26,24 L 22,21 L 12,25"
        {...pathProps}
        strokeWidth="0.25"
        strokeOpacity="0.65"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut', delay: 0.4 }}
      />
      {/* Right upper branch */}
      <motion.path
        d="M 52,25 L 62,30 L 66,28 L 74,33 L 78,31 L 88,36"
        {...pathProps}
        strokeWidth="0.25"
        strokeOpacity="0.65"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut', delay: 0.45 }}
      />
      {/* Left mid branch */}
      <motion.path
        d="M 47,34 L 35,40 L 30,37 L 20,43 L 15,41"
        {...pathProps}
        strokeWidth="0.25"
        strokeOpacity="0.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.5 }}
      />
      {/* Right mid-lower branch */}
      <motion.path
        d="M 46,55 L 58,62 L 64,59 L 72,66 L 77,63 L 85,69"
        {...pathProps}
        strokeWidth="0.25"
        strokeOpacity="0.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.55 }}
      />
      {/* Left lower branch */}
      <motion.path
        d="M 51,66 L 40,73 L 36,70 L 28,76 L 24,73 L 14,79"
        {...pathProps}
        strokeWidth="0.2"
        strokeOpacity="0.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.6 }}
      />
      {/* Right lower branch */}
      <motion.path
        d="M 48,78 L 58,84 L 62,81 L 70,87 L 74,85"
        {...pathProps}
        strokeWidth="0.2"
        strokeOpacity="0.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.65 }}
      />
    </svg>
  );
}

/* ── Frost-creep overlay (checking state) ───────────────────────────────────── */
function FrostCreep() {
  return (
    <>
      {/* Corner frosts */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            `radial-gradient(ellipse at 0% 0%,   rgba(159,216,232,0.18) 0%, transparent 42%)`,
            `radial-gradient(ellipse at 100% 0%,  rgba(159,216,232,0.13) 0%, transparent 38%)`,
            `radial-gradient(ellipse at 0% 100%,  rgba(159,216,232,0.12) 0%, transparent 36%)`,
            `radial-gradient(ellipse at 100% 100%,rgba(159,216,232,0.10) 0%, transparent 32%)`,
          ].join(', '),
          animation: 'frost-pulse 2.2s ease-in-out infinite',
        }}
        aria-hidden
      />
      {/* Scan line */}
      <div className="absolute inset-x-0 top-0 overflow-hidden h-full pointer-events-none" aria-hidden>
        <div
          className="h-px w-full"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(159,216,232,0.45), transparent)`,
            animation: 'scan-down 2s linear infinite',
          }}
        />
      </div>
    </>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function IceReveal({ state, errorString }: Props) {
  const reduced = useReducedMotion() ?? false;
  const verdict = isVerdict(state) ? state : null;
  const isCrevasse = state === 'crevasse';

  /* ── Crevasse split timing ────────────────────────────────────────────────
     With motion:   shake (0→380 ms) → split starts (420 ms) → text (950 ms)
     Without motion: everything instant                                        */
  const shakeAnim = isCrevasse && !reduced
    ? { x: [0, -8, 9, -7, 8, -5, 6, -3, 3, 0] }
    : { x: 0 };
  const shakeTx = isCrevasse && !reduced
    ? { duration: 0.38, times: [0, .10, .22, .34, .46, .58, .70, .80, .90, 1], ease: 'linear' as const }
    : { duration: 0.15 };

  const splitDelay = reduced ? 0 : 0.42;
  const splitTx = { type: 'spring' as const, stiffness: 270, damping: 17, delay: isCrevasse ? splitDelay : 0 };

  const leftAnim  = isCrevasse ? { x: -58, rotate: -1.8 } : { x: 0, rotate: 0 };
  const rightAnim = isCrevasse ? { x:  58, rotate:  1.8 } : { x: 0, rotate: 0 };

  /* Content stagger delays */
  const verdictDelay = reduced ? 0 : (isCrevasse ? 0.92 : 0.18);
  const yetiDelay    = reduced ? 0.06 : (isCrevasse ? 1.22 : 0.48);
  const errorDelay   = reduced ? 0.12 : 1.60;

  /* Accessibility: border indicates verdict without relying on colour alone */
  const borderColor =
    state === 'safe'     ? 'rgba(95,227,192,0.45)'  :
    state === 'thin'     ? 'rgba(232,178,63,0.45)'  :
    state === 'crevasse' ? 'rgba(255,77,94,0.45)'   :
    'rgba(159,216,232,0.18)';

  const shadowGlow =
    state === 'safe'     ? '0 30px 60px -15px rgba(0, 0, 0, 0.95), 0 0 30px -5px rgba(95, 227, 192, 0.15), inset 0 0 60px rgba(6, 18, 31, 0.7)' :
    state === 'thin'     ? '0 30px 60px -15px rgba(0, 0, 0, 0.95), 0 0 30px -5px rgba(232, 178, 63, 0.12), inset 0 0 60px rgba(6, 18, 31, 0.7)' :
    state === 'crevasse' ? '0 30px 60px -15px rgba(0, 0, 0, 0.95), 0 0 35px -5px rgba(255, 77, 94, 0.18), inset 0 0 60px rgba(6, 18, 31, 0.7)' :
    state === 'checking' ? '0 25px 50px -15px rgba(0, 0, 0, 0.90), 0 0 25px -5px rgba(159, 216, 232, 0.08), inset 0 0 60px rgba(6, 18, 31, 0.7)' :
    '0 20px 40px -15px rgba(0, 0, 0, 0.85), inset 0 0 60px rgba(6, 18, 31, 0.7)';

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{
        minHeight: 'clamp(360px, 45vw, 480px)',
        border: `1px solid ${borderColor}`,
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
        boxShadow: shadowGlow,
      }}
      role="region"
      aria-label="Safety verdict"
      aria-live="polite"
    >

      {/* ── Ice pane — shakes, then the two halves split ───────────────────── */}
      <motion.div
        className="absolute inset-0"
        animate={shakeAnim}
        transition={shakeTx}
      >
        {/* Red glow that bleeds through the gap — behind both halves */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 75%, rgba(255,77,94,0.50) 0%, rgba(255,77,94,0.22) 28%, transparent 55%)`,
          }}
          animate={{ opacity: isCrevasse ? 1 : 0 }}
          transition={{ duration: 0.30, delay: isCrevasse ? (reduced ? 0 : 0.52) : 0 }}
          aria-hidden
        />

        {/* Left half */}
        <motion.div
          className="absolute inset-0"
          style={{ clipPath: LEFT_CLIP, background: iceBg(state) }}
          animate={leftAnim}
          transition={splitTx}
          aria-hidden
        />

        {/* Right half */}
        <motion.div
          className="absolute inset-0"
          style={{ clipPath: RIGHT_CLIP, background: iceBg(state) }}
          animate={rightAnim}
          transition={splitTx}
          aria-hidden
        />

        {/* Frost-creep (checking state only) */}
        {state === 'checking' && <FrostCreep />}

        {/* Amber stress-cracks (thin state only) */}
        {state === 'thin' && <ThinIceCracks />}

        {/* Safe-ice border pulse */}
        {state === 'safe' && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: 'inset 0 0 60px rgba(95,227,192,0.10)' }}
            animate={{ opacity: [0, 1, 0.6, 1] }}
            transition={{ duration: 0.8, times: [0, 0.3, 0.6, 1] }}
            aria-hidden
          />
        )}
      </motion.div>

      {/* ── Content layer ────────────────────────────────────────────────────── */}
      <div
        className="relative z-10 flex flex-col items-center justify-center gap-4 p-8 text-center"
        style={{ minHeight: 'clamp(280px, 35vw, 360px)' }}
      >

        {/* Idle hint */}
        {state === 'idle' && (
          <p style={{ color: 'rgba(159,216,232,0.28)', fontSize: '0.8rem', letterSpacing: '0.08em' }}>
            Your verdict will appear here.
          </p>
        )}

        {/* Checking */}
        {state === 'checking' && (
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p
              style={{
                color: 'rgba(159,216,232,0.55)',
                fontSize: '0.72rem',
                letterSpacing: '0.20em',
                textTransform: 'uppercase',
              }}
            >
              Testing the ice…
            </p>
            {/* Shimmer bar */}
            <motion.div
              style={{
                height: 1,
                width: 80,
                borderRadius: 1,
                background: `linear-gradient(90deg, transparent, ${C.frost}, transparent)`,
              }}
              animate={{ scaleX: [0.4, 1.3, 0.4], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden
            />
          </motion.div>
        )}

        {/* Verdict */}
        {verdict && (
          <>
            {/* Yeti avatar — the persona that delivers the verdict */}
            <YetiAvatar
              mood={verdict}
              delay={reduced ? 0 : (isCrevasse ? 1.05 : 0.10)}
            />

            {/* The verdict word — the largest type on the site */}
            <motion.h2
              className="font-display font-bold tracking-tight leading-none select-none"
              style={{
                fontSize: 'clamp(3rem, 11vw, 6rem)',
                color: VERDICT_COLOR[verdict],
                textShadow: VERDICT_GLOW[verdict],
              }}
              initial={{ opacity: 0, y: reduced ? 0 : 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: verdictDelay, ease: [0.16, 1, 0.3, 1] }}
            >
              {LABEL[verdict]}
            </motion.h2>

            {/* Yeti persona line — italic, a little mythic */}
            <motion.p
              className="font-sans italic max-w-xs leading-relaxed"
              style={{ color: 'rgba(234,246,250,0.65)', fontSize: '0.95rem' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.38, delay: yetiDelay }}
            >
              "{YETI[verdict]}"
            </motion.p>

            {/* Raw on-chain error string — the "this is real proof" moment */}
            {isCrevasse && errorString && (
              <motion.pre
                className="font-mono w-full max-w-full overflow-x-auto rounded-xl px-4 py-3 text-left"
                style={{
                  fontSize: '0.7rem',
                  lineHeight: 1.6,
                  color: 'rgba(255,77,94,0.80)',
                  background: 'rgba(255,77,94,0.07)',
                  border: '1px solid rgba(255,77,94,0.22)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, delay: errorDelay }}
              >
                {errorString}
              </motion.pre>
            )}
          </>
        )}
      </div>
    </div>
  );
}
