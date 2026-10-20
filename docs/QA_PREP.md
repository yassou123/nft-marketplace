# Soutenance — questions probables et réponses

## Concepts

**Q : Qu'est-ce qu'un NFT ? Quelle différence avec un token ERC-20 ?**
R : Un NFT (*Non-Fungible Token*, jeton non fongible) a un identifiant unique (`tokenId`) et n'est pas interchangeable. Les tokens ERC-20 sont fongibles (1 USDT = 1 USDT). Nos NFT suivent le standard ERC-721.

**Q : Pourquoi utiliser une blockchain ici ?**
R : Propriété publique et vérifiable ; échange atomique NFT ↔ ETH sans tiers de confiance ; commission transparente, écrite dans le code.

**Q : Qu'est-ce que `tokenURI` ?**
R : Un lien vers les métadonnées JSON du NFT (nom, description, image). Nous le stockons sous forme d'URI `data:`, ce qui évite d'avoir besoin d'IPFS ; en production, on utiliserait IPFS pour que le contenu soit immuable.

**Q : Qu'est-ce que le gas ?**
R : Les frais payés pour exécuter une transaction. Les écritures (`mint`, `buyItem`) coûtent du gas ; les fonctions `view` (`getActiveListings`) sont gratuites quand elles sont appelées hors chaîne (lecture simple, sans transaction).

## Code

**Q : Pourquoi le vendeur doit-il appeler `approve` avant `listItem` ?**
R : ERC-721 interdit à un contrat de déplacer le NFT de quelqu'un sans son autorisation. `approve(marketplace, tokenId)` donne ce droit ; `listItem`
