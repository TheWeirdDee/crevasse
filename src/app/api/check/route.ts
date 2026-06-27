import { NextRequest, NextResponse } from 'next/server';
import { runFullCheck } from '@/engine';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token?.trim()) {
    return NextResponse.json({ error: 'Missing ?token= parameter.' }, { status: 400 });
  }

  const coinType = token.trim();

  if (!coinType.includes('::')) {
    return NextResponse.json(
      { error: 'Provide a full coin type — e.g. 0x2::sui::SUI' },
      { status: 400 },
    );
  }

  try {
    const refresh = req.nextUrl.searchParams.get('refresh') === 'true' || req.nextUrl.searchParams.get('bypassCache') === 'true';
    const result = await runFullCheck(coinType, refresh);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/check]', err);
    return NextResponse.json(
      { error: "Couldn't reach Sui right now. Try again in a moment." },
      { status: 503 },
    );
  }
}
