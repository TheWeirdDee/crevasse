/// CREVASSE Phase 0 — No-pool test fixture.
///
/// A standard coin with no DEX pool. Used to prove the unavailable path:
/// findPool() returns null → sellTest() returns { status: 'unavailable' }.
/// Nothing special about this coin — it just never gets a Cetus pool created.
module nopool_coin::nopool_coin {
    use sui::coin::{Self, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    /// One-time witness.
    public struct NOPOOL_COIN has drop {}

    fun init(witness: NOPOOL_COIN, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            witness,
            9,
            b"NPOOL",
            b"No Pool (CREVASSE Test)",
            b"CREVASSE Phase 0 test fixture. Standard coin with no DEX pool.",
            option::none(),
            ctx,
        );
        transfer::public_transfer(treasury, tx_context::sender(ctx));
        transfer::public_freeze_object(metadata);
    }

    /// Optional: mint some NPOOL so the coin has real existence on-chain,
    /// though it won't affect the sell-test (findPool will still return null).
    public entry fun mint(
        cap: &mut TreasuryCap<NOPOOL_COIN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        coin::mint_and_transfer(cap, amount, recipient, ctx);
    }
}
