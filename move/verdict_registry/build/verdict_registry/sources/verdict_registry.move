/// CREVASSE Phase 3 — Verdict Registry
///
/// Permanent on-chain record of every safety verdict CREVASSE produces.
/// Deployed to Sui mainnet. The Package ID goes in the CLAY submission form.
///
/// Design principles
/// ─────────────────
/// • Minimal. One module, one shared object, one entry function.
///   It is a record-keeper, not a governance system.
/// • Permissionless writes. Anyone with SUI for gas can record a verdict —
///   designed so the CREVASSE oracle (a server keypair) can write automatically
///   after every check, and so the contract can never be locked by a single owner.
/// • Permanent + updatable. The latest verdict for each token is always readable.
///   Re-checking a token updates its record in place (replaces the old entry).
/// • Event-indexable. VerdictWritten events are emitted on every write, so
///   verdicts can be queried off-chain without scanning all dynamic fields.
///
/// Verdict tiers
/// ─────────────
///   0 = SAFE      (sell succeeded, no flags)
///   1 = THIN ICE  (sell unavailable or minor warnings)
///   2 = CREVASSE  (sell blocked — confirmed honeypot)
module verdict_registry::verdict_registry {
    use sui::table::{Self, Table};
    use sui::clock::Clock;
    use sui::event;
    use std::string::String;

    // ── Error codes ───────────────────────────────────────────────────────────

    const E_INVALID_VERDICT: u64 = 0;  // verdict must be 0, 1, or 2
    const E_INVALID_SCORE:   u64 = 1;  // score must be 0–100

    // ── Structs ───────────────────────────────────────────────────────────────

    /// Singleton shared object.  Created once in init(), shared forever.
    /// Holds a Table mapping coin-type string → latest VerdictEntry.
    public struct Registry has key {
        id: UID,
        records: Table<String, VerdictEntry>,
    }

    /// One verdict entry per coin type.  Replaced on every re-check.
    /// `store + drop` required by Table (drop lets us overwrite in place).
    public struct VerdictEntry has store, drop {
        verdict:      u8,    // 0=safe  1=thin  2=crevasse
        score:        u8,    // 0–100  (Phase 1 multi-check composite; sell-only = fixed)
        timestamp_ms: u64,
        checker:      address,
    }

    /// Emitted on every write.  Lets explorers and the web app find verdicts
    /// by querying events rather than scanning all Table entries.
    public struct VerdictWritten has copy, drop {
        token:        String,
        verdict:      u8,
        score:        u8,
        timestamp_ms: u64,
        checker:      address,
    }

    // ── Init ──────────────────────────────────────────────────────────────────

    fun init(ctx: &mut TxContext) {
        transfer::share_object(Registry {
            id: object::new(ctx),
            records: table::new(ctx),
        });
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    /// Record or update a safety verdict for a Sui coin type.
    ///
    /// Arguments:
    ///   registry — the shared Registry object
    ///   token    — fully-qualified coin type string, e.g. "0x2::sui::SUI"
    ///   verdict  — 0 (safe) | 1 (thin ice) | 2 (crevasse)
    ///   score    — 0–100 composite safety score
    ///   clock    — Sui Clock singleton (always 0x6)
    ///
    /// Called by the CREVASSE oracle keypair after every successful check.
    /// Permissionless — the caller just needs gas.
    public entry fun record_verdict(
        registry:  &mut Registry,
        token:     String,
        verdict:   u8,
        score:     u8,
        clock:     &Clock,
        ctx:       &TxContext,
    ) {
        assert!(verdict <= 2, E_INVALID_VERDICT);
        assert!(score  <= 100, E_INVALID_SCORE);

        let ts      = clock.timestamp_ms();
        let checker = ctx.sender();

        let entry = VerdictEntry { verdict, score, timestamp_ms: ts, checker };

        if (table::contains(&registry.records, token)) {
            *table::borrow_mut(&mut registry.records, token) = entry;
        } else {
            table::add(&mut registry.records, token, entry);
        };

        event::emit(VerdictWritten { token, verdict, score, timestamp_ms: ts, checker });
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    /// Returns the latest verdict for a token, or aborts if none recorded yet.
    /// TypeScript callers should check `has_verdict` first.
    public fun get_verdict(
        registry: &Registry,
        token:    String,
    ): (u8, u8, u64, address) {
        let e = table::borrow(&registry.records, token);
        (e.verdict, e.score, e.timestamp_ms, e.checker)
    }

    /// True if any verdict has been recorded for this token.
    public fun has_verdict(registry: &Registry, token: String): bool {
        table::contains(&registry.records, token)
    }
}
