/// CREVASSE Phase 0 — Honeypot test fixture coin.
///
/// A plain coin whose type is registered in FixtureDex with sell_blocked = true.
/// The sell-blocking logic lives entirely in fixture_dex.move — this module is
/// just the coin type. No deny list, no Cetus pool, no minting required.
///
/// Deploy: publish → note PackageID. That's it.
/// Then call fixture_dex::create_pool<HONEYPOT_COIN>(sell_blocked = true).
module honeypot_coin::honeypot_coin {
    use sui::coin::{Self, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    /// One-time witness — name must match module name in ALL_CAPS.
    public struct HONEYPOT_COIN has drop {}

    fun init(witness: HONEYPOT_COIN, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            witness,
            9,
            b"HPOT",
            b"Honeypot (CREVASSE Test)",
            b"CREVASSE Phase 0 test fixture. Sell-blocked via FixtureDex registry.",
            option::none(),
            ctx,
        );
        transfer::public_transfer(treasury, tx_context::sender(ctx));
        transfer::public_freeze_object(metadata);
    }
}
