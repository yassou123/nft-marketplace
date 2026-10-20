# NFT Marketplace

A simple decentralized marketplace where users **mint** NFTs (ERC-721), **list** them for sale, **buy** them with ETH, **cancel** or **reprice** their listings and **withdraw** their earnings. An **admin** (contract owner) sets a marketplace fee (max 10%).

> Mini-project, Blockchain module. Team: `<Student 1>` & `<Student 2>`.

---

## 1. Why a blockchain?

| Problem in a centralized marketplace | What the blockchain brings |
|---|---|
| The platform can freeze, censor or fake ownership | Ownership is public and verifiable (`ownerOf`) |
| Buyer must trust the platform to deliver | The smart contract swaps NFT ↔ ETH **atomically** (both or nothing) |
| Opaque fees | Fee is public in the contract (`feeBps`) and capped at 10% in code |
| Payment held by a company | Seller withdraws their ETH directly (`withdrawProceeds`) |

**Platform:** Ethereum (EVM) — the reference for NFTs (ERC-721 standard), mature tooling (Solidity, OpenZeppelin, MetaMask). Local **Ganache** blockchain for development: free, instant, 10 pre-funded accounts.

---

## 2. Architecture

```
 React + Vite (frontend)  ──ethers.js──►  MetaMask (signs tx)  ──►  Ganache (local Ethereum)
                                                                       │
                                                         ┌─────────────┴──────────────┐
                                                         │  MyNFT.sol (ERC-721)       │
                                                         │  NFTMarketplace.sol        │
                                                         └────────────────────────────┘
```

### Smart contracts

| Contract | Role | Main functions |
|---|---|---|
| `MyNFT.sol` | ERC-721 collection (OpenZeppelin `ERC721URIStorage`) | `mint(uri)`, `totalMinted()`, + standard ERC-721 (`ownerOf`, `approve`, `tokenURI`…) |
| `NFTMarketplace.sol` | Sales logic (escrow + pull payments) | `listItem`, `buyItem`, `cancelListing`, `updatePrice`, `withdrawProceeds`, `setFee` (admin), `getActiveListings` |
| `test/ReentrancyAttacker.sol` | **Test only** — malicious contract used to prove the reentrancy protection | `attack()` |

### Sale flow

1. Seller `mint` → owns token #N.
2. Seller `approve(marketplace, N)` then `listItem(nft, N, price)` → NFT moves into the marketplace (escrow).
3. Buyer `buyItem(listingId)` sending exactly `price` ETH → NFT goes to buyer; `price − fee` credited to seller, `fee` credited to admin.
4. Seller `withdrawProceeds()` → receives ETH.

### Design choices

- **Escrow**: the NFT is held by the contract while listed → a seller cannot sell or transfer it elsewhere at the same time (no "ghost" listing).
- **Pull payments**: ETH is not pushed to the seller during `buyItem`; it is stored in `proceeds` and withdrawn later. A seller that cannot receive ETH can't block purchases.
- **Metadata**: stored as a `data:` URI (JSON with name / description / image URL) to avoid needing IPFS for the demo. `ipfs://` and `https://` URIs also work.

---

## 3. Security

| Risk | Protection in the code | Proven by test |
|---|---|---|
| Reentrancy (withdraw twice) | `nonReentrant` (OpenZeppelin) + balance set to 0 **before** sending ETH (Checks-Effects-Interactions) | `Security: reentrancy attack` |
| Double sale of the same NFT | `active = false` before transfer + `onlyActive` modifier | `prevents buying the same listing twice` |
| Paying a wrong amount | `require(msg.value == price)` | `reverts with wrong ETH amount` |
| Someone else cancels / reprices | `onlySeller` modifier | `non-seller cannot cancel or update` |
| Listing an NFT you don't own | `ownerOf == msg.sender` check | `reverts if caller is not the owner` |
| Non-admin changes the fee | `onlyOwner` (OpenZeppelin `Ownable`) | `non-owner cannot set fee` |
| Admin sets abusive fee | Hard cap `MAX_FEE_BPS = 1000` (10%) | `owner can set fee up to 10%` |
| Integer overflow | Solidity ≥ 0.8 reverts automatically | — |

**Known limits** (to discuss in the oral): `getActiveListings` and the frontend's `ownerOf` loop are O(n) — fine for a demo, an indexer (The Graph) or events would be needed at scale; no royalties (ERC-2981); no auctions; image URLs are not stored on-chain (only their link).

---

## 4. Tools

| Tool | Usage in this project |
|---|---|
| Solidity 0.8.24 | Smart contracts |
| OpenZeppelin 5.1 | Audited ERC-721, `Ownable`, `ReentrancyGuard` |
| Remix IDE | Write / compile / deploy manually to Ganache |
| Hardhat | Automated tests (18 tests) + deploy script |
| Ganache | Local Ethereum blockchain (chainId 1337) |
| MetaMask | Wallet: switch admin / seller / buyer accounts, sign tx |
| React + Vite | Frontend (dashboard, mint form, marketplace, admin panel) |
| Ethers.js v6 | Frontend ↔ contracts |
| Git / GitHub | Version control, collaboration in pairs |

---

## 5. Project structure

```
nft-marketplace/
├── contracts/
│   ├── MyNFT.sol
│   ├── NFTMarketplace.sol
│   └── test/ReentrancyAttacker.sol
├── test/NFTMarketplace.test.js      # 18 Hardhat tests
├── scripts/deploy.js                # deploys + writes frontend config
├── hardhat.config.js
├── frontend/
│   └── src/
│       ├── App.jsx                  # state + wallet + refresh
│       ├── web3.js                  # ethers helpers
│       ├── contracts/deployments.json  # addresses + ABIs
│       └── components/  MintForm, MyNFTs, Marketplace, AdminPanel, NFTCard
└── docs/
    ├── PROJECT_PROPOSAL.md          # the 3 ideas requested by the teacher
    ├── AI_USAGE.md                  # generative AI log (grading criterion)
    └── QA_PREP.md                   # oral defense preparation
```

---

## 6. Step-by-step setup

### Prerequisites

- [Node.js](https://nodejs.org) 18+ and Git
- [Ganache](https://archive.trufflesuite.com/ganache/) (GUI) — or CLI: `npm i -g ganache`
- [MetaMask](https://metamask.io) browser extension

### Step 1 — Clone and install

```bash
git clone https://github.com/<your-account>/nft-marketplace.git
cd nft-marketplace
npm install
cd frontend && npm install && cd ..
```

### Step 2 — Run the tests

```bash
npx hardhat test        # runs on Hardhat's in-memory network
npx hardhat coverage    # optional: coverage report
```

Expected: `18 passing`.

### Step 3 — Start Ganache

- **GUI**: *Quickstart Ethereum* → RPC `http://127.0.0.1:7545`, chain ID **1337**.
- **CLI**: `ganache --port 7545 --chain.chainId 1337`

### Step 4 — Configure MetaMask

1. MetaMask → *Add network manually*: name `Ganache`, RPC `http://127.0.0.1:7545`, chain ID `1337`, symbol `ETH`.
2. Import 3 accounts (Ganache → key icon → copy private key → MetaMask *Import account*):
   - **Account 1 = admin** (Ganache account #0, the deployer)
   - **Account 2 = seller**
   - **Account 3 = buyer**

### Step 5 — Deploy the contracts

**Option A — Hardhat (recommended, automatic config):**

```bash
npm run deploy:ganache
```

Addresses and ABIs are written to `frontend/src/contracts/deployments.json`.

**Option B — Remix + MetaMask (manual):**

1. Open [remix.ethereum.org](https://remix.ethereum.org), create `MyNFT.sol` and `NFTMarketplace.sol` (paste the code; OpenZeppelin imports resolve automatically).
2. *Solidity Compiler* → version `0.8.24` → **Advanced configurations → EVM version: `paris`** (⚠ Ganache does not support the newer opcodes of the default EVM version) → Compile.
3. *Deploy & Run* → Environment **Injected Provider – MetaMask** (MetaMask on Ganache, Account 1 = admin).
4. Deploy `MyNFT`, then `NFTMarketplace`.
5. Copy both addresses into `frontend/src/contracts/deployments.json` (`"address": "0x..."`). The ABIs are already in the file.

> ⚠ Restarting Ganache (CLI without `--db`) resets the chain → redeploy. In MetaMask, if a tx is stuck after a reset: *Settings → Advanced → Clear activity tab data*.

### Step 6 — Start the frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 → **Connect MetaMask**.

### Step 7 — Demo scenario (for the presentation)

1. **Seller** account: create an NFT (name + image URL) → *Mint*.
2. Enter a price (e.g. `1`) → *List for sale* → confirm **2** MetaMask tx (approve + list).
3. Switch MetaMask to **Buyer** → the NFT appears in *Marketplace* → *Buy*.
4. Buyer now sees it in *My NFTs*.
5. Switch back to **Seller** → *Your proceeds: 0.975 ETH* → *Withdraw* (check balance in Ganache).
6. Switch to **Admin** → admin panel → proceeds = 0.025 ETH fee; change fee to `5` %.
7. Show a failing case: seller tries to buy own NFT → error message.

---

## 7. GitHub workflow (pair work)

```bash
git init && git add . && git commit -m "Initial commit: contracts, tests, frontend"
git branch -M main
git remote add origin https://github.com/<your-account>/nft-marketplace.git
git push -u origin main
```

- Add your partner: GitHub repo → *Settings → Collaborators*.
- Suggested split: **Student 1** = smart contracts + tests, **Student 2** = frontend + docs.
- One branch per feature (`feature/contracts`, `feature/frontend`) → Pull Request → review by the partner → merge.
- Commit regularly with clear messages (the teacher can see the history).

---

## 8. Possible improvements

Royalties (ERC-2981), auctions, IPFS upload (Pinata), events-based indexing (The Graph), deployment on Sepolia testnet, collection filters / search.
