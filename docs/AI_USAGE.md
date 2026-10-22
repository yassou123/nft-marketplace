# Utilisation de l'IA générative

> Critère d'évaluation (3 pts) : formuler des demandes pertinentes, **vérifier** les résultats, **détecter et corriger les erreurs**, maîtriser le code produit.

## 1. Outils utilisés

| Outil | Usage |
|---|---|
| Claude (Anthropic) | Génération de la structure du projet, des smart contracts, des tests, du frontend et de la documentation ; assistance pas à pas pour l'installation et le déploiement |
| `<autre outil éventuel>` | `<usage>` |

## 2. Méthode de vérification

- Les contrats ont été **compilés** et **testés** avec Hardhat : `npx hardhat test` → **18 tests réussis** sur notre machine.
- Les **cas d'erreur** ont été testés à la main (champs vides, prix à 0, mauvaise URL d'image) : c'est ainsi que nous avons trouvé le problème n°12.
- Le **scénario complet** a été exécuté manuellement sur Ganache avec 3 comptes MetaMask (Admin, Vendeur, Acheteur) : mint → mise en vente → achat → retrait.
- Les résultats ont été contrôlés à chaque étape : propriétaire du NFT, solde des comptes, montant reversé au vendeur (0,975 ETH = 1 ETH − 2,5 % de commission).
- Chaque fonction des contrats a été relue et expliquée (voir `QA_PREP.md`).
- Les mécanismes de sécurité (`ReentrancyGuard`, `Ownable`) ont été comparés avec la documentation officielle d'OpenZeppelin.

## 3. Problèmes rencontrés et corrigés

| # | Problème | Comment nous l'avons détecté | Correction |
|---|---|---|---|
| 1 | Solidity 0.8.24 utilise par défaut l'EVM `cancun`, dont certaines instructions ne sont pas supportées par Ganache | Risque d'échec au déploiement (opcode invalide) | `evmVersion: "paris"` dans Hardhat, et dans Remix (Advanced configurations) |
| 2 | OpenZeppelin v5 : `ReentrancyGuard` a été déplacé de `security/` vers `utils/`, et `Ownable` exige `Ownable(msg.sender)` | Erreurs de compilation avec des exemples écrits pour la v4 | Imports et constructeur mis à jour |
| 3 | `loadFixture` ne fonctionne que sur le réseau interne Hardhat | Échec des tests avec `--network ganache` | Tests sur le réseau Hardhat, Ganache réservé à la démo |
| 4 | Frontend : si `approve` échouait, la mise en vente était quand même envoyée | Relecture du code | `runTx` renvoie vrai/faux ; la mise en vente n'est lancée que si l'approbation a réussi |
| 5 | Avertissement µWS au lancement de Ganache avec Node 22 | Message dans la console | Analysé : non bloquant (Ganache bascule sur une implémentation Node.js) |
| 6 | `--db ./ganache-db` → erreur « chemin introuvable » | Ganache refusait de démarrer | Création préalable du dossier, et lancement hors de `C:\WINDOWS\system32` |
| 7 | npm 7.20 installé avec Node 22 (versions incompatibles) | `npm -v` | Mise à jour : `npm install -g npm@10` |
| 8 | `npx hardhat test` proposait d'installer Hardhat 3 | Message « Need to install hardhat@3 » | Refusé : nous n'étions pas dans le dossier du projet (dossier imbriqué après décompression) |
| 9 | 372 comptes importés dans MetaMask | Liste des comptes | Compris : la phrase de test Ganache est publique, MetaMask découvre ses comptes actifs. Sélection des bons comptes par leur adresse |
| 10 | Transaction de mint signée par le compte Admin au lieu du Vendeur | Lecture de « Signer avec » dans MetaMask avant validation | Transaction annulée, compte Vendeur connecté au site, puis nouvelle transaction |
| 11 | `npm audit fix --force` suggéré par npm | Messages de vulnérabilités | Non appliqué : cela pouvait installer des versions incompatibles ; les vulnérabilités concernent des outils de développement locaux |
| 12 | Prix à 0, champs vides ou URL d'image invalide : le site ne faisait rien et n'affichait aucun message | **Test manuel** de l'interface (mise en vente avec un prix de 0) | Validation des saisies côté frontend avec un message d'erreur rouge (fonction `notify`) ; les erreurs de transaction s'affichent aussi en rouge. Le contrat garde sa propre protection (`require(price > 0)`) |
| 13 | Les captures d'écran ne s'affichaient pas : le code Markdown avait été mis dans un fichier `docs/screenshots` au lieu du README | Vérification de la page GitHub | Code déplacé dans `README.md` (chemins `docs/xx.png`), fichier inutile supprimé |

## 4. Journal des demandes (prompts)

| Prompt (résumé) | Résultat | Accepté / modifié / rejeté, et pourquoi |
|---|---|---|
| « Créer un projet blockchain Marketplace NFT simple, avec Solidity, Remix, Ganache, MetaMask, React, Ethers.js, Vite, GitHub, en respectant la grille de notation » | Projet complet : 2 contrats, 18 tests, frontend, documentation | Accepté après exécution des tests et du scénario complet |
| Choix de l'outil de tests : Hardhat ou Remix seul | Hardhat proposé pour des tests automatisés plus solides | Accepté : Remix et Ganache restent utilisés pour le déploiement et la démo |
| « Comment installer Ganache ? » + erreurs d'installation | Diagnostic µWS, dossier `--db`, version de npm | Appliqué après vérification de chaque message d'erreur |
| « Step by step, je ne comprends rien » (configuration MetaMask) | Guide étape par étape avec vérification des adresses | Suivi, chaque compte vérifié par son adresse et son solde |
| « Donne-moi le contenu de AI_USAGE.md / QA_PREP.md / README en français » | Traductions complètes | Relues ; une imprécision corrigée (le remboursement du crowdfunding n'est pas « automatique » mais à la demande du contributeur) |
| Partage des supports de cours (smart contracts, DApps, consensus, token vs coin, NFT) : « le projet nécessite-t-il une amélioration ? » | Correspondance cours ↔ projet + questions de soutenance liées au cours | Accepté : pas de modification du code, ajout de questions dans `QA_PREP.md` |
| « Aide-moi à comprendre le projet petit à petit avec des mots simples » | Leçons progressives (blockchain, ETH/gas, portefeuille, smart contract, NFT, fonctionnement de la marketplace) avec une question de contrôle à chaque étape | Utilisé pour préparer l'oral ; plusieurs réponses corrigées (ex. le NFT en vente appartient au contrat Marketplace, pas à l'acheteur) |
| « Si je mets 0, la transaction ne se passe pas, je préfère que les messages d'erreur s'affichent » | Validation des formulaires + messages d'erreur | Accepté après test manuel de chaque cas d'erreur sur notre machine |
| `<prompt du binôme>` | | |

## 5. Ce que nous avons appris / limites de l'IA

- L'IA peut proposer du code basé sur des **versions anciennes** des bibliothèques (ex. OpenZeppelin v4) : il faut vérifier la version installée.
- L'IA ne remplace pas l'exécution : **les tests et la démo sont la preuve**, pas l'explication de l'IA.
- Les interfaces des outils (MetaMask) évoluent : les instructions doivent être adaptées à ce qu'on voit réellement à l'écran.
- Il faut toujours lire une transaction avant de la signer (compte, réseau, contrat, montant).
- L'IA ne voit pas tout : le défaut d'affichage des erreurs (n°12) a été trouvé **par nous, en testant**, pas par l'IA.
- La validation côté site améliore l'expérience utilisateur, mais **la sécurité réelle est dans le smart contract** (`require`) : un utilisateur peut contourner le site, pas le contrat.
