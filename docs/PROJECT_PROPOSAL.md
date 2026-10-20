# Proposition de mini-projet — 3 idées

Binôme : Yasmine Chaouachi & Zina Jellabi — **Projet retenu : Idée 1 (Marketplace de NFT)**

---

## Idée 1 — Marketplace de NFT ✅ (retenue)

**Description :** Une plateforme décentralisée où les utilisateurs créent (mint) des œuvres numériques sous forme de NFT, les mettent en vente en ETH et achètent celles des autres utilisateurs. Le smart contract garantit un échange atomique NFT ↔ ETH sans intermédiaire de confiance ; la plateforme prélève une commission transparente, plafonnée dans le code.

**Smart contracts :**
- `MyNFT.sol` — collection ERC-721 : `mint(tokenURI)`, propriété, métadonnées.
- `NFTMarketplace.sol` — `listItem`, `buyItem`, `cancelListing`, `updatePrice`, `withdrawProceeds`, `setFee` (admin). Sécurité : `ReentrancyGuard`, `Ownable`, paiements en mode « pull » (le vendeur retire lui-même ses gains), séquestre (escrow) du NFT pendant la vente.

---

## Idée 2 — Vote décentralisé (type DAO)

**Description :** Une organisation (classe, association) enregistre les votants autorisés ; l'administrateur ouvre une proposition avec des options et une date limite ; chaque adresse enregistrée vote une seule fois ; les résultats sont publics et non modifiables.

**Smart contracts :**
- `Voting.sol` — `registerVoter`, `createProposal`, `vote`, `closeProposal`, `getResults`. Règles : un seul vote par adresse, vote uniquement pendant la période ouverte, enregistrement des votants réservé à l'administrateur.

---

## Idée 3 — Financement participatif avec remboursement garanti

**Description :** Un porteur de projet crée une campagne avec un objectif et une date limite. Les contributeurs envoient des ETH. Si l'objectif est atteint, le porteur retire les fonds ; sinon, chaque contributeur peut se faire rembourser, ce que le contrat garantit.

**Smart contracts :**
- `Crowdfunding.sol` — `createCampaign`, `contribute`, `withdrawFunds` (porteur, si l'objectif est atteint), `refund` (contributeurs, si l'objectif n'est pas atteint). Sécurité : remboursements en mode « pull », contrôle des dates limites, protection contre la réentrance.
