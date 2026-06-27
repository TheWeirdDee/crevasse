'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';

export type YetiMood = 'safe' | 'thin' | 'crevasse';

const PAL = {
  safe: {
    glow: 'rgba(95,227,192,0.40)',
  },
  thin: {
    glow: 'rgba(232,178,63,0.35)',
  },
  crevasse: {
    glow: 'rgba(255,77,94,0.40)',
  },
};

export default function YetiAvatar({ mood, delay = 0 }: { mood: YetiMood; delay?: number }) {
  const reduced = useReducedMotion() ?? false;
  const p = PAL[mood];

  return (
    /* Layer 1: fade + scale entrance */
    <motion.div
      style={{ filter: `drop-shadow(0 0 20px ${p.glow})` }}
      initial={{ opacity: 0, scale: reduced ? 1 : 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20, delay }}
      className="relative flex items-center justify-center"
    >
      {/* Layer 2: float animation */}
      <motion.div
        animate={reduced ? undefined : { y: [0, -6, 0] }}
        transition={reduced ? undefined : {
          duration: 3.5,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
        className="w-24 h-24 rounded-full border border-white/10 overflow-hidden bg-abyss"
      >
        <Image
          src={`/yeti_${mood === 'safe' ? 'sage' : mood === 'thin' ? 'legend' : 'grave'}.png`}
          alt={`${mood === 'safe' ? 'Sage' : mood === 'thin' ? 'Legend' : 'Grave'} Yeti`}
          width={96}
          height={96}
          className="w-full h-full object-cover select-none"
        />
      </motion.div>
    </motion.div>
  );
}
