/**
 * CREVASSE Phase 5 — Telegram Bot
 *
 * A thin grammY bot that calls the shared Crevasse safety engine.
 * Supports:
 *   /start, /help  — welcome & instructions
 *   /check <coin>  — run a full safety check
 *   bare coin type pasted in chat (matching *::*::* format)
 *
 * Environment vars required (in .env.local):
 *   TELEGRAM_BOT_TOKEN — from @BotFather
 *
 * Run: npm run bot
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Bot, InlineKeyboard } from 'grammy';
import { runFullCheck } from './engine/index';

/* ── Config ─────────────────────────────────────────────────────────────────── */

const WEB_APP_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://crevasse.vercel.app';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN is not set. Bot features will be disabled at runtime.');
}

export const bot = new Bot(token || 'dummy-token-for-build-pass');

/* ── Verdict formatting ─────────────────────────────────────────────────────── */

function verdictEmoji(verdict: 'safe' | 'thin' | 'crevasse'): string {
  return verdict === 'safe' ? '🟢' : verdict === 'thin' ? '🟡' : '🔴';
}

function verdictLabel(verdict: 'safe' | 'thin' | 'crevasse'): string {
  return verdict === 'safe' ? 'SAFE ICE' : verdict === 'thin' ? 'THIN ICE' : 'CREVASSE';
}

function yetiLine(verdict: 'safe' | 'thin' | 'crevasse'): string {
  return verdict === 'safe'
    ? '🧊 <i>This ice holds. Cross freely.</i>'
    : verdict === 'thin'
    ? '⚠️ <i>Step carefully. This ice is cracking.</i>'
    : '💀 <i>Do not step. There is a crevasse beneath this.</i>';
}

function checkIcon(status: 'pass' | 'fail' | 'warn' | 'unavailable'): string {
  return status === 'pass' ? '✅' : status === 'fail' ? '🛑' : status === 'warn' ? '⚠️' : '⚠️';
}

function formatVerdict(result: Awaited<ReturnType<typeof runFullCheck>>): string {
  const { verdict, score, sellTest, mintAuthority, freezeAuthority, liquidity, holders, onChain, token } = result;

  const lines: string[] = [];

  // Header
  lines.push(`${verdictEmoji(verdict)} <b>${verdictLabel(verdict)}</b>  ·  Score: <b>${score}/100</b>`);
  lines.push(yetiLine(verdict));
  lines.push('');

  // Coin type (monospace, truncated)
  const displayCoin = token.length > 48 ? token.slice(0, 45) + '...' : token;
  lines.push(`<code>${displayCoin}</code>`);
  lines.push('');

  // Sell test — headline
  const sellIcon = sellTest.status === 'pass' ? '✅' : sellTest.status === 'fail' ? '🛑' : '⚠️';
  if (sellTest.status === 'pass') {
    lines.push(`${sellIcon} <b>Sell test</b> — Sellable. We tried to sell, it went through.`);
  } else if (sellTest.status === 'fail') {
    lines.push(`${sellIcon} <b>Sell test</b> — HONEYPOT. Sell was blocked by the contract.`);
    if ('error' in sellTest && sellTest.error) {
      lines.push(`<pre>${String(sellTest.error).slice(0, 120)}</pre>`);
    }
  } else {
    lines.push(`${sellIcon} <b>Sell test</b> — Unavailable. No tradable pool found.`);
  }

  // Supporting checks
  lines.push(`${checkIcon(mintAuthority.status)} <b>Mint authority</b> — ${mintAuthority.explanation}`);
  lines.push(`${checkIcon(freezeAuthority.status)} <b>Freeze authority</b> — ${freezeAuthority.explanation}`);
  lines.push(`${checkIcon(liquidity.status)} <b>Liquidity</b> — ${liquidity.explanation}`);
  lines.push(`${checkIcon(holders.status)} <b>Holders</b> — ${holders.explanation}`);

  // On-chain record
  lines.push('');
  if (onChain) {
    lines.push(`⛓ <a href="${onChain.explorerUrl}">Verdict recorded on Sui</a>`);
  }

  return lines.join('\n');
}

function buildKeyboard(coinType: string): InlineKeyboard {
  const encoded = encodeURIComponent(coinType);
  return new InlineKeyboard().url(
    '🌐 Full report',
    `${WEB_APP_URL}/check?token=${encoded}`
  );
}

/* ── Coin type validation ───────────────────────────────────────────────────── */

function isCoinType(text: string): boolean {
  // Must be 0x... :: module :: TYPE or at minimum contain two '::'
  return text.trim().split('::').length === 3;
}

/* ── Core check handler ─────────────────────────────────────────────────────── */

async function handleCheck(ctx: any, coinType: string) {
  const coin = coinType.trim();

  if (!isCoinType(coin)) {
    await ctx.reply(
      '❓ That doesn\'t look like a valid Sui coin type.\n\nExpected format: <code>0x&lt;package&gt;::&lt;module&gt;::&lt;TYPE&gt;</code>\n\nExample: <code>0x2::sui::SUI</code>',
      { parse_mode: 'HTML' }
    );
    return;
  }

  // Send a "checking" placeholder
  const msg = await ctx.reply(
    `🔍 Checking <code>${coin.length > 48 ? coin.slice(0, 45) + '...' : coin}</code> …`,
    { parse_mode: 'HTML' }
  );

  try {
    const result = await runFullCheck(coin);
    const text = formatVerdict(result);
    const keyboard = buildKeyboard(coin);

    await ctx.api.editMessageText(
      ctx.chat.id,
      msg.message_id,
      text,
      { parse_mode: 'HTML', reply_markup: keyboard }
    );
  } catch (err) {
    console.error('[bot] runFullCheck failed:', err);
    await ctx.api.editMessageText(
      ctx.chat.id,
      msg.message_id,
      "❌ Couldn't reach Sui right now. Try again in a moment.",
      {}
    );
  }
}

/* ── Commands ───────────────────────────────────────────────────────────────── */

bot.command('start', async (ctx) => {
  await ctx.reply(
    `🧊 <b>Welcome to CREVASSE</b>\n\nThe Yeti-guarded token safety checker for Sui.\n\nI check if you can actually <i>sell</i> a token before you buy — using a live on-chain sell test, not guesswork.\n\n<b>How to use:</b>\nSend <code>/check 0x2::sui::SUI</code> or just paste any Sui coin type directly.\n\n<b>What I check:</b>\n• Sell-test (live dry-run on Sui)\n• Mint authority\n• Freeze authority\n• Liquidity depth\n• Holder concentration`,
    { parse_mode: 'HTML' }
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    `<b>CREVASSE Bot — Commands</b>\n\n/check <code>&lt;coin type&gt;</code> — Run a full safety check\n/start — Introduction\n/help — This message\n\nYou can also paste a coin type directly in chat (format: <code>0xPackage::module::TYPE</code>).\n\nFor the full cinematic report with ice-crack animation, visit the web app.`,
    { parse_mode: 'HTML' }
  );
});

bot.command('check', async (ctx) => {
  const args = ctx.match?.trim();
  if (!args) {
    await ctx.reply(
      'Usage: <code>/check 0x2::sui::SUI</code>',
      { parse_mode: 'HTML' }
    );
    return;
  }
  await handleCheck(ctx, args);
});

/* ── Bare coin type pasted in chat ──────────────────────────────────────────── */

bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim();
  if (isCoinType(text)) {
    await handleCheck(ctx, text);
  }
  // Ignore everything else
});

/* ── Error handling ─────────────────────────────────────────────────────────── */

bot.catch((err) => {
  console.error('[bot] Unhandled error:', err.message);
});

/* ── Start ──────────────────────────────────────────────────────────────────── */

if (typeof require !== 'undefined' && require.main === module) {
  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is required to start the bot.');
    process.exit(1);
  }
  console.log('🧊 CREVASSE bot starting (long-polling)…');
  bot.start();
} else if (process.argv[1] && (process.argv[1].endsWith('bot.ts') || process.argv[1].endsWith('bot.js') || process.argv[1].endsWith('bot'))) {
  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is required to start the bot.');
    process.exit(1);
  }
  console.log('🧊 CREVASSE bot starting (long-polling)…');
  bot.start();
}
