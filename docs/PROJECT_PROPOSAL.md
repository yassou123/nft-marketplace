# Mini-project proposal — 3 ideas

Team: Yasmine Chaouachi & Zina Jellabi — **Chosen project: Idea 1 (NFT Marketplace)**

---

## Idea 1 — NFT Marketplace ✅ (chosen)

**Description:** A decentralized platform where users create (mint) digital artworks as NFTs, list them for sale in ETH and buy them from other users. The smart contract guarantees an atomic NFT ↔ ETH exchange without a trusted intermediary; the platform takes a transparent fee capped in the code.

**Smart contracts:**
- `MyNFT.sol` — ERC-721 collection: `mint(tokenURI)`, ownership, metadata.
- `NFTMarketplace.sol` — `listItem`, `buyItem`, `cancelListing`, `updatePrice`, `withdrawProceeds`, `setFee` (admin). Security: `ReentrancyGuard`, `Ownable`, pull payments, escrow.

---

## Idea 2 — Decentralized Voting (DAO-style)

**Description:** An organisation (class, association) registers eligible voters; the admin opens a proposal with options and a deadline; each registered address votes once; results are public and cannot be modified.

**Smart contracts:**
- `Voting.sol` — `registerVoter`, `createProposal`, `vote`, `closeProposal`, `getResults`. Rules: one vote per address, voting only during the period, admin-only registration.

---

## Idea 3 — Crowdfunding with refund guarantee

**Description:** A project owner creates a campaign with a goal and deadline. Contributors send ETH. If the goal is reached, the owner withdraws the funds; otherwise every contributor gets a refund automatically guaranteed by the contract.

**Smart contracts:**
- `Crowdfunding.sol` — `createCampaign`, `contribute`, `withdrawFunds` (owner, if goal reached), `refund` (contributors, if goal missed). Security: pull-based refunds, deadline checks, reentrancy guard.
