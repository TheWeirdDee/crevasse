# CREVASSE — Sui Token Safety Checker

**Live URL:** https://crevasse.vercel.app  
**Telegram:** https://t.me/CrevasseBot  
**Mainnet Package:** `0x963c82cfeaae883221c3c9651cbdb3280df084ad4948823a681f14b62cb1ec68`

---

## What it is

Crevasse is a token safety checker for the Sui blockchain. Paste a coin type and Crevasse tells you whether the token is safe to buy — specifically whether it is a **honeypot**: a token that lets you buy freely but secretly blocks you from selling, trapping your money permanently.

---

## The problem

Most honeypot detectors on EVM chains read contract source code and guess whether it looks suspicious. Sui Move contracts are often not verified on-chain. Guessing from bytecode is unreliable.

Crevasse doesn't guess. It **actually tries to sell the token**, live, against the real network state, using a built-in Sui primitive called `devInspect`. If the sell step is blocked by the contract, you know before you buy.

---

## How the live sell-test works

1. Crevasse finds the token's liquidity pool on **Cetus** (the primary Sui DEX).
2. It builds a two-step Programmable Transaction Block (PTB): **buy a tiny amount of the token → immediately sell it back**.
3. This PTB is submitted via Sui's `devInspectTransactionBlock` — a dry-run that executes against live network state without committing or spending any real funds.
4. If the sell step **succeeds**: the token is sellable. SAFE ICE.
5. If the sell step **aborts**: the contract is blocking exits. The exact on-chain abort error is shown as proof. CREVASSE (honeypot).

No funds move. The check takes a few seconds.

---

## Five safety checks

| Check | What it looks for |
|---|---|
| **Live Sell-Test** | Runs a real devInspect swap — buy then sell — via the Cetus AMM. The only way to confirm a token is actually sellable. |
| **Mint Authority** | Traces the `TreasuryCap` object. If the creator can still mint unlimited supply, the price can be crashed at any time. |
| **Freeze Authority** | Checks for `DenyCap` / `DenyCapV2`. If the creator holds freeze capability, they can lock your balance permanently. |
| **Liquidity Depth** | Reads Cetus pool TVL. Zero liquidity means no exit route regardless of what the contract says. |
| **Holder Concentration** | Checks top wallets (via BlockVision) excluding LP pools. High concentration in creator/insider wallets is a dump risk. |

---

## Verdicts

- **SAFE ICE** — Sell simulation passed, no major red flags found.
- **THIN ICE** — Simulation inconclusive (no pool, or one or more checks raised a warning). Not confirmed safe.
- **CREVASSE** — Sell was blocked on-chain. Confirmed honeypot. The abort error is shown as proof.

Every verdict is recorded on the **Sui mainnet** verdict registry and linked from the result screen.

---

## Features

- **Web app** — paste any Sui coin type at https://crevasse.vercel.app/check
- **Telegram bot** — send `/check <coin>` or paste a coin type directly to [@CrevasseBot](https://t.me/CrevasseBot)
- **X share** — one-tap share any verdict with a pre-written tweet and branded OG card
- **On-chain record** — each verdict written to the mainnet `verdict_registry` contract; result links to SuiScan

---

## Honest limitations

**The sell-test catches swap-level honeypots.** Cetus uses raw balance operations internally, so a token that blocks selling only at the coin-transfer level (not the swap level) may not be caught by the sell-test alone. The mint, freeze, and holder checks cover those patterns separately.

**"Unavailable" never means safe.** If a check shows unavailable, Crevasse couldn't get the data — not that the check passed. Treat it as unknown.

**Only Cetus pools.** Tokens with no Cetus liquidity pool get `unavailable` on the sell-test. If the token trades on another DEX only, Crevasse cannot simulate the sell.

**Not financial advice.** A SAFE ICE verdict means the token passed automated checks at the moment of checking. It does not mean the project is legitimate or the price will go up. Always do your own research.

---

## Mainnet contract

The verdict registry is deployed on Sui mainnet:

```
Package:  0x963c82cfeaae883221c3c9651cbdb3280df084ad4948823a681f14b62cb1ec68
Registry: 0xfab2e0c160f62c5ff128515f6a3d682d4ab50c10dc8da22c2d495fe51ae59f34
```

Entry function: `record_verdict(registry, token, verdict_u8, score_u8, clock, ctx)` — permissionless; the full verdict history is publicly readable on-chain.

---

## Tech stack

- **Next.js 16** (App Router, Edge-compatible API routes)
- **Sui TypeScript SDK** (`@mysten/sui`) — devInspect, object reads, tx submission
- **Cetus CLMM SDK** — pool discovery and PTB construction
- **grammY** — Telegram bot framework
- **Three.js** — glacial hero scene
- **Framer Motion** — ice-crack verdict reveal animation
- **Vercel** — deployment

---

## Local development

```bash
git clone https://github.com/TheWeirdDee/crevasse
cd crevasse
npm install
npm run dev
```

Required env vars (create `.env.local`):

```
SUI_RPC_URL=               # Sui mainnet RPC (e.g. Blockvision or fullnode.mainnet.sui.io)
BLOCKVISION_API_KEY=       # for holder data
DRY_RUN_SENDER=            # any mainnet address (used as devInspect sender)
VERDICT_PACKAGE_ID=        # mainnet verdict_registry package ID
VERDICT_REGISTRY_ID=       # mainnet registry shared object ID
VERDICT_WRITER_PRIVKEY=    # suiprivkey1... private key for on-chain writes
TELEGRAM_BOT_TOKEN=        # from @BotFather
NEXT_PUBLIC_BASE_URL=      # https://your-domain.vercel.app
```
