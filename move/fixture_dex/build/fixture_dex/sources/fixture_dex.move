/// CREVASSE Phase 0 — FixtureDex: a minimal test-only pool registry.
///
/// Problem it solves
/// ─────────────────
/// We need two properties for the honeypot test fixture:
///   1. findPool(HPOT) returns a pool    → 'unavailable' is ruled out
///   2. dryRun sell → fails with a real on-chain abort → 'fail' path fires
///
/// A real Cetus pool can't satisfy (2) because Cetus uses raw balance ops
/// internally, which bypass any coin-level restrictions. So instead we
/// maintain our own registry of "pools". The registry is the pool — when
/// our TypeScript buildSellTx sees a fixture pool, it calls swap_sell<T>
/// on this module. If the pool was registered with sell_blocked = true,
/// swap_sell aborts with E_SELL_BLOCKED. That abort IS the honeypot signal.
///
/// Production path unaffected
/// ──────────────────────────
/// findPool checks Cetus first for every real token (USDC, SUI, CETUS, etc.).
/// Only if Cetus returns nothing does it fall through to the fixture registry.
/// No production code paths touch this module at runtime.
///
/// How the dry run works
/// ─────────────────────
/// swap_sell<T> takes only the shared Registry object — no coin objects, no
/// holder address, nothing else. The sender only needs SUI for gas. This
/// means we never need to find a real token holder or impersonate anyone.
module fixture_dex::fixture_dex {
    use std::ascii;
    use std::type_name;
    use sui::dynamic_field;
    use sui::event;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    // ── Structs ───────────────────────────────────────────────────────────────

    /// Singleton shared object. Created once in init(), shared forever.
    /// TypeScript needs its object ID to build transactions and check pool existence.
    public struct Registry has key {
        id: UID,
    }

    /// Held by the deployer. Required argument for create_pool — nothing else
    /// can register fixture pools.
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Dynamic field value stored under each registered coin type.
    /// Key:   ascii::String  (the fully-qualified coin type name, from type_name::get<T>)
    /// Value: PoolEntry
    public struct PoolEntry has store, drop {
        sell_blocked: bool,
    }

    /// Emitted when a fixture pool is registered. Lets TypeScript discover all
    /// registered types by querying events instead of scanning dynamic fields.
    public struct PoolRegistered has copy, drop {
        coin_type: ascii::String,
        sell_blocked: bool,
    }

    // ── Error codes ───────────────────────────────────────────────────────────

    /// Sell is blocked for this token. This is the signal sellTest captures:
    /// dryRun aborts → { status: 'fail', error: "MoveAbort(... E_SELL_BLOCKED [0])" }
    const E_SELL_BLOCKED: u64 = 0;

    /// No pool registered for this type. Safety net — findPool should have
    /// returned null before buildSellTx ever calls swap_sell.
    const E_NO_POOL: u64 = 1;

    // ── Init ──────────────────────────────────────────────────────────────────

    fun init(ctx: &mut TxContext) {
        // Registry is shared — anyone can read it, only AdminCap holder can write.
        transfer::share_object(Registry { id: object::new(ctx) });
        // AdminCap goes to the deployer.
        transfer::transfer(AdminCap { id: object::new(ctx) }, tx_context::sender(ctx));
    }

    // ── Admin: register a fixture pool ────────────────────────────────────────

    /// Register coin type T in the fixture registry.
    ///
    ///   sell_blocked = true  → swap_sell<T> always aborts  (honeypot fixture)
    ///   sell_blocked = false → swap_sell<T> succeeds        (safe fixture, if ever needed)
    ///
    /// CLI call (after publish):
    ///   sui client call \
    ///     --package <FIXTURE_DEX_PACKAGE_ID> \
    ///     --module fixture_dex \
    ///     --function create_pool \
    ///     --type-args "<HONEYPOT_PACKAGE_ID>::honeypot_coin::HONEYPOT_COIN" \
    ///     --args <ADMIN_CAP_ID> <REGISTRY_ID> true \
    ///     --gas-budget 10000000
    public entry fun create_pool<T>(
        _cap: &AdminCap,
        registry: &mut Registry,
        sell_blocked: bool,
        _ctx: &mut TxContext,
    ) {
        let key = type_name::get<T>().into_string();
        dynamic_field::add(&mut registry.id, key, PoolEntry { sell_blocked });
        event::emit(PoolRegistered { coin_type: key, sell_blocked });
    }

    // ── Sell hook (called by buildSellTx via dryRunTransactionBlock) ──────────

    /// The transaction that buildSellTx constructs for fixture-pool tokens.
    ///
    /// Execution path:
    ///   • pool entry found AND sell_blocked = true  → abort E_SELL_BLOCKED
    ///     sellTest captures: { status: 'fail', error: "...E_SELL_BLOCKED [0]..." }
    ///
    ///   • pool entry found AND sell_blocked = false → returns normally
    ///     sellTest captures: { status: 'pass' }
    ///
    ///   • pool entry missing → abort E_NO_POOL (safety net only; findPool
    ///     should have returned null, making sellTest return 'unavailable')
    ///
    /// No coins are moved. The sender needs only SUI for gas — they do not
    /// need to hold any HPOT or any other token. This is the key advantage
    /// over the deny-list approach: zero on-chain state needed beyond the
    /// Registry entry.
    public entry fun swap_sell<T>(
        registry: &Registry,
        _ctx: &mut TxContext,
    ) {
        let key = type_name::get<T>().into_string();
        assert!(dynamic_field::exists_(&registry.id, key), E_NO_POOL);
        let entry = dynamic_field::borrow<ascii::String, PoolEntry>(&registry.id, key);
        assert!(!entry.sell_blocked, E_SELL_BLOCKED);
    }

    // ── Read helpers (for TypeScript off-chain queries) ───────────────────────

    /// Returns true if a fixture pool is registered for type T.
    /// TypeScript uses getDynamicFieldObject() instead of calling this on-chain,
    /// but keeping it here documents the query pattern.
    public fun has_pool<T>(registry: &Registry): bool {
        dynamic_field::exists_(&registry.id, type_name::get<T>().into_string())
    }
}
