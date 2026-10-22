import { useState } from "react";
import { parseEther } from "ethers";
import NFTCard from "./NFTCard.jsx";

/** NFTs owned by the user, with a "list for sale" action (approve + list) */
export default function MyNFTs({ nfts, contracts, runTx, notify }) {
  const [prices, setPrices] = useState({});

  const list = async (tokenId) => {
    const price = prices[tokenId];
    if (!price || !(Number(price) > 0)) {
      notify(`NFT #${tokenId}: enter a price greater than 0 ETH.`);
      return;
    }
    const { nft, market } = contracts;
    // Step 1: allow the marketplace to move this NFT
    const approved = await runTx("Approve", () => nft.approve(market.target, tokenId));
    if (!approved) return;
    // Step 2: create the listing (NFT goes into escrow)
    await runTx("List", () => market.listItem(nft.target, tokenId, parseEther(price)));
  };

  return (
    <section>
      <h2>My NFTs ({nfts.length})</h2>
      <div className="grid">
        {nfts.map(({ tokenId, meta }) => (
          <NFTCard key={tokenId} meta={meta} tokenId={tokenId}>
            <input
              type="number" step="0.01" min="0" placeholder="Price in ETH"
              value={prices[tokenId] || ""}
              onChange={(e) => setPrices({ ...prices, [tokenId]: e.target.value })}
            />
            <button onClick={() => list(tokenId)}>List for sale</button>
          </NFTCard>
        ))}
        {nfts.length === 0 && <p>You don't own any NFT yet.</p>}
      </div>
    </section>
  );
}
