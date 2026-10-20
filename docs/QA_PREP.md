# Oral defense — likely questions & answers

## Concepts

**Q: What is an NFT? Difference with a token like ERC-20?**
A: A Non-Fungible Token: each token has a unique `tokenId` and is not interchangeable. ERC-20 tokens are fungible (1 USDT = 1 USDT). Our NFTs follow ERC-721.

**Q: Why use a blockchain here?**
A: Public, verifiable ownership; atomic NFT↔ETH exchange without a trusted third party; transparent fees written in code.

**Q: What is `tokenURI`?**
A: A link to the NFT's JSON metadata (name, description, image). We store it as a `data:` URI so no IPFS is needed; in production we'd use IPFS so the content is immutable.

**Q: What is gas?**
A: The fee paid to execute a transaction. Writes (`mint`, `buyItem`) cost gas; `view` functions (`getActiveListings`) are free when called off-chain.

## Code

**Q: Why does the seller need to call `approve` before `listItem`?**
A: ERC-721 forbids a contract to move someone's token without permission. `approve(marketplace, tokenId)` gives that right; `listItem` then calls `transferFrom` to put the NFT in escrow.

**Q: Why escrow instead of leaving the NFT in the seller's wallet?**
A: Otherwise the seller could transfer the NFT after listing, and the listing would fail at purchase time. Escrow guarantees the NFT is available.

**Q: Why `proceeds` + `withdrawProceeds` instead of paying the seller directly in `buyItem`?**
A: Pull-payment pattern: if the seller is a contract that rejects ETH, a direct transfer would block every purchase. It also limits reentrancy risk inside `buyItem`.

**Q: Explain Checks-Effects-Interactions.**
A: 1) check conditions (`require`), 2) update state (`active = false`, `proceeds[...] +=`), 3) only then call external contracts / send ETH. If an attacker re-enters, the state is already updated.

**Q: What does `nonReentrant` do?**
A: OpenZeppelin lock: a function marked `nonReentrant` cannot be called again while it is executing. Our reentrancy test proves the second `withdrawProceeds` is rejected.

**Q: How is the fee computed?**
A: In basis points: `fee = price * feeBps / 10000`. 250 bps = 2.5%. Max 1000 (10%) enforced by `MAX_FEE_BPS`.

**Q: What does `onlyOwner` protect?**
A: `setFee`. The owner is the deployer (`Ownable(msg.sender)`). A non-owner call reverts with `OwnableUnauthorizedAccount`.

**Q: Why `msg.value == price` and not `>=`?**
A: Simplicity and safety: with `>=`, the excess would need to be refunded (extra code, extra risk). Exact amount avoids lost ETH.

## Tests

**Q: What do your tests cover?**
A: 18 tests: mint, listing (success + 3 failures), buying (success, wrong amount, seller buying own NFT, double purchase), cancel / update (seller vs non-seller), withdraw, admin fee (owner, cap, non-owner), and a **reentrancy attack** with a malicious contract.

**Q: How does the reentrancy test work?**
A: `ReentrancyAttacker` lists an NFT, a buyer purchases it, then the attacker calls `withdrawProceeds`; in its `receive()` it calls `withdrawProceeds` again. `nonReentrant` rejects it → the ETH transfer fails → the whole transaction reverts and the marketplace balance is unchanged.

## Limits & improvements

**Q: Limits of your solution?**
A: `getActiveListings` loops over all listings (gas / RPC cost grows with n); no royalties; no auctions; metadata not on IPFS; only tested on a local chain.

**Q: Improvements?**
A: ERC-2981 royalties, auctions, IPFS (Pinata), indexing with events / The Graph, deploy to Sepolia testnet, a security audit tool like Slither.

**Q: Why Ganache and not a testnet?**
A: Free, instant blocks, 10 funded accounts, reproducible — ideal for development and demo. A testnet (Sepolia) would be the next step.
